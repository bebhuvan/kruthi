/**
 * indexing.worker.ts
 *
 * Web Worker for CPU-intensive book indexing operations.
 * Runs off the main thread to keep UI responsive.
 */

import type { Chunk } from '../types/retrieval';

interface Chapter {
	id: string;
	title: string;
	html: string;
}

interface Book {
	id: string;
	chapters: Chapter[];
}

interface ChunkingOptions {
	targetTokens: number;
	maxTokens: number;
	overlapTokens: number;
}

type RawChunk = { text: string; offsetStart: number; offsetEnd: number };

interface IndexRequest {
	type: 'index';
	jobId: string;
	book: Book;
	options: ChunkingOptions;
	chunkBatchSize?: number;
}

interface ProgressResponse {
	type: 'progress';
	jobId: string;
	current: number;
	total: number;
}

interface ChunkBatchResponse {
	type: 'chunk_batch';
	jobId: string;
	chunks: Chunk[];
	chapterIndex: number;
	totalChapters: number;
}

interface CompleteResponse {
	type: 'complete';
	jobId: string;
	chunkCount: number;
}

type WorkerRequest = IndexRequest;
type WorkerResponse = ChunkBatchResponse | ProgressResponse | CompleteResponse;

// Tokenization helpers (duplicated to avoid import issues in worker)
const WORD_REGEX = /[a-z0-9]+(?:'[a-z0-9]+)?/gi;

function tokenize(text: string): string[] {
	const normalized = text.toLowerCase();
	return normalized.match(WORD_REGEX) ?? [];
}

function estimateTokenCount(text: string): number {
	return tokenize(text).length;
}

function splitIntoParagraphs(text: string): string[] {
	return text
		.split(/\n\s*\n/g)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean);
}

function normalizeWhitespace(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

/**
 * Extract paragraphs from HTML using regex (no DOM access in worker)
 */
function extractParagraphsFromHtml(html: string): string[] {
	// Extract text from paragraph-like elements
	const blockPattern = /<(p|h[1-6]|blockquote|li)[^>]*>([\s\S]*?)<\/\1>/gi;
	const paragraphs: string[] = [];
	let match: RegExpExecArray | null;

	while ((match = blockPattern.exec(html)) !== null) {
		// Strip nested tags and normalize
		const text = normalizeWhitespace(match[2].replace(/<[^>]+>/g, ' '));
		if (text) {
			paragraphs.push(text);
		}
	}

	if (paragraphs.length > 0) {
		return paragraphs;
	}

	// Fallback: strip all tags and split into paragraphs
	const stripped = html.replace(/<[^>]+>/g, ' ');
	return splitIntoParagraphs(normalizeWhitespace(stripped));
}

function splitParagraphByWordCount(
	paragraph: string,
	targetTokens: number,
	overlapTokens: number,
	paragraphOffset: number
): RawChunk[] {
	const words = paragraph.match(/\S+\s*/g) ?? [];
	if (words.length === 0) {
		return [];
	}

	const chunks: RawChunk[] = [];
	let start = 0;
	while (start < words.length) {
		const end = Math.min(start + targetTokens, words.length);
		const text = words.slice(start, end).join('').trim();
		if (text) {
			chunks.push({
				text,
				offsetStart: paragraphOffset + start,
				offsetEnd: paragraphOffset + end
			});
		}
		if (end === words.length) {
			break;
		}
		start = Math.max(0, end - overlapTokens);
	}
	return chunks;
}

function splitLongParagraph(
	paragraph: string,
	options: ChunkingOptions,
	paragraphOffset: number
): RawChunk[] {
	const sentenceMatches = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [paragraph];
	const pieces: RawChunk[] = [];
	let buffer = '';
	let bufferTokens = 0;

	for (const sentence of sentenceMatches) {
		const sentenceTokens = estimateTokenCount(sentence);
		if (sentenceTokens > options.maxTokens) {
			if (buffer) {
				const bufferTokensFinal = estimateTokenCount(buffer);
				pieces.push({
					text: buffer.trim(),
					offsetStart: paragraphOffset,
					offsetEnd: paragraphOffset + bufferTokensFinal
				});
				paragraphOffset += bufferTokensFinal;
				buffer = '';
				bufferTokens = 0;
			}
			const splitPieces = splitParagraphByWordCount(
				sentence,
				options.targetTokens,
				options.overlapTokens,
				paragraphOffset
			);
			if (splitPieces.length > 0) {
				const last = splitPieces[splitPieces.length - 1];
				paragraphOffset = last.offsetEnd;
			}
			pieces.push(...splitPieces);
			continue;
		}

		if (bufferTokens + sentenceTokens > options.targetTokens && bufferTokens > 0) {
			pieces.push({
				text: buffer.trim(),
				offsetStart: paragraphOffset,
				offsetEnd: paragraphOffset + bufferTokens
			});
			paragraphOffset += bufferTokens;
			buffer = sentence.trim();
			bufferTokens = sentenceTokens;
			continue;
		}

		buffer = buffer ? `${buffer.trim()} ${sentence.trim()}` : sentence.trim();
		bufferTokens += sentenceTokens;
	}

	if (buffer) {
		pieces.push({
			text: buffer.trim(),
			offsetStart: paragraphOffset,
			offsetEnd: paragraphOffset + bufferTokens
		});
	}

	return pieces;
}

function takeOverlapParagraphs(
	paragraphs: string[],
	tokenCounts: number[],
	overlapTokens: number
): { paragraphs: string[]; tokenCounts: number[] } {
	if (overlapTokens <= 0) {
		return { paragraphs: [], tokenCounts: [] };
	}
	const overlapParagraphs: string[] = [];
	const overlapTokenCounts: number[] = [];
	let tokenCount = 0;
	for (let i = paragraphs.length - 1; i >= 0; i -= 1) {
		const paragraphTokens = tokenCounts[i];
		overlapParagraphs.unshift(paragraphs[i]);
		overlapTokenCounts.unshift(paragraphTokens);
		tokenCount += paragraphTokens;
		if (tokenCount >= overlapTokens) {
			break;
		}
	}
	return { paragraphs: overlapParagraphs, tokenCounts: overlapTokenCounts };
}

function chunkParagraphs(paragraphs: string[], options: ChunkingOptions): RawChunk[] {
	const chunks: RawChunk[] = [];
	let current: string[] = [];
	let currentTokenCounts: number[] = [];
	let currentTokens = 0;
	let offset = 0;
	let chunkStartOffset = 0;

	for (const paragraph of paragraphs) {
		const paragraphTokens = estimateTokenCount(paragraph);

		if (paragraphTokens > options.maxTokens) {
			if (current.length > 0) {
				chunks.push({
					text: current.join('\n\n'),
					offsetStart: chunkStartOffset,
					offsetEnd: offset
				});
				current = [];
				currentTokenCounts = [];
				currentTokens = 0;
			}

			const longChunks = splitLongParagraph(paragraph, options, offset);
			for (const longChunk of longChunks) {
				chunks.push(longChunk);
				offset = longChunk.offsetEnd;
			}
			chunkStartOffset = offset;
			continue;
		}

		if (currentTokens + paragraphTokens > options.targetTokens && current.length > 0) {
			chunks.push({
				text: current.join('\n\n'),
				offsetStart: chunkStartOffset,
				offsetEnd: offset
			});

			const overlap = takeOverlapParagraphs(current, currentTokenCounts, options.overlapTokens);
			current = overlap.paragraphs;
			currentTokenCounts = overlap.tokenCounts;
			currentTokens = currentTokenCounts.reduce((sum, count) => sum + count, 0);
			chunkStartOffset = Math.max(0, offset - currentTokens);
		}

		current.push(paragraph);
		currentTokenCounts.push(paragraphTokens);
		currentTokens += paragraphTokens;
		offset += paragraphTokens;
	}

	if (current.length > 0) {
		chunks.push({
			text: current.join('\n\n'),
			offsetStart: chunkStartOffset,
			offsetEnd: offset
		});
	}

	return chunks;
}

function chunkChapter(chapter: Chapter, options: ChunkingOptions): RawChunk[] {
	const paragraphs = extractParagraphsFromHtml(chapter.html);
	return chunkParagraphs(paragraphs, options);
}

function buildChunkId(bookId: string, chapterId: string, index: number): string {
	return `${bookId}-${chapterId}-chunk-${index}`;
}

function buildChunksAndStream(
	book: Book,
	options: ChunkingOptions,
	jobId: string,
	chunkBatchSize: number
): void {
	let chunkIndex = 0;
	let chunkCount = 0;
	let batch: Chunk[] = [];

	for (let i = 0; i < book.chapters.length; i++) {
		const chapter = book.chapters[i];
		const rawChunks = chunkChapter(chapter, options);
		for (const rawChunk of rawChunks) {
			batch.push({
				id: buildChunkId(book.id, chapter.id, chunkIndex++),
				bookId: book.id,
				chapterId: chapter.id,
				chapterTitle: chapter.title,
				bookChapter: `${book.id}:${chapter.id}`,
				text: rawChunk.text,
				offsetStart: rawChunk.offsetStart,
				offsetEnd: rawChunk.offsetEnd
			});
			chunkCount += 1;
			if (batch.length >= chunkBatchSize) {
				self.postMessage({
					type: 'chunk_batch',
					jobId,
					chunks: batch,
					chapterIndex: i + 1,
					totalChapters: book.chapters.length
				} satisfies ChunkBatchResponse);
				batch = [];
			}
		}

		// Report progress every chapter
		self.postMessage({
			type: 'progress',
			jobId,
			current: i + 1,
			total: book.chapters.length
		} satisfies ProgressResponse);
	}

	if (batch.length > 0) {
		self.postMessage({
			type: 'chunk_batch',
			jobId,
			chunks: batch,
			chapterIndex: book.chapters.length,
			totalChapters: book.chapters.length
		} satisfies ChunkBatchResponse);
	}

	self.postMessage({
		type: 'complete',
		jobId,
		chunkCount
	} satisfies CompleteResponse);
}

// Worker message handler
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
	const { data } = event;

	if (data.type === 'index') {
		const batchSize = data.chunkBatchSize && data.chunkBatchSize > 0 ? data.chunkBatchSize : 50;
		buildChunksAndStream(data.book, data.options, data.jobId, batchSize);
	}
};

export type {
	WorkerRequest,
	WorkerResponse,
	IndexRequest,
	ProgressResponse,
	ChunkBatchResponse,
	CompleteResponse
};
