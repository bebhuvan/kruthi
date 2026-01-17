/**
 * retrieval.ts
 *
 * Handles text chunking, embedding generation, and hybrid retrieval.
 *
 * Key functions:
 * - indexBook(book): Split book into indexed chunks and store them
 * - searchChunks(query, bookId, options): Find relevant chunks (BM25 + embeddings)
 *
 * Dependencies:
 * - @xenova/transformers for in-browser embeddings (optional)
 * - Platform adapter for chunk storage
 */
import type { Book, Chapter } from '$lib/types/book';
import type { Chunk, ChunkingOptions, IndexOptions, SearchOptions, SearchResult } from '$lib/types/retrieval';
import { RetrievalError } from '$lib/types/errors';
import { estimateTokenCount, splitIntoParagraphs } from '$lib/utils/tokenizer';
import { adapter } from '$lib/platform';
import { buildBM25Index, scoreBM25Batch } from '$lib/services/bm25';
import { indexingStore } from '$lib/stores/indexingStore';

const DEFAULT_TARGET_TOKENS = 400;
const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_OVERLAP_TOKENS = 100;
const DEFAULT_TOP_K = 12;
const DEFAULT_EMBEDDING_BATCH = 8;
const DEFAULT_CHUNK_MESSAGE_SIZE = 50;
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const DEFAULT_RRF_K = 60;

type RawChunk = { text: string; offsetStart: number; offsetEnd: number };

function normalizeWhitespace(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

function extractParagraphsFromHtml(html: string): string[] {
	if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
		const stripped = html.replace(/<[^>]+>/g, ' ');
		return splitIntoParagraphs(normalizeWhitespace(stripped));
	}

	const doc = new DOMParser().parseFromString(html, 'text/html');
	const nodes = doc.body.querySelectorAll(
		'p, h1, h2, h3, h4, h5, h6, blockquote, li'
	);
	const paragraphs = Array.from(nodes)
		.map((node) => normalizeWhitespace(node.textContent ?? ''))
		.filter(Boolean);

	if (paragraphs.length > 0) {
		return paragraphs;
	}

	return splitIntoParagraphs(normalizeWhitespace(doc.body.textContent ?? ''));
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
	options: Required<ChunkingOptions>,
	paragraphOffset: number
): RawChunk[] {
	const sentenceMatches =
		paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [paragraph];
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

function chunkParagraphs(paragraphs: string[], options: Required<ChunkingOptions>): RawChunk[] {
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

			// Use cached token counts instead of re-tokenizing
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

export function chunkText(text: string, options: ChunkingOptions = {}): RawChunk[] {
	const resolved: Required<ChunkingOptions> = {
		targetTokens: options.targetTokens ?? DEFAULT_TARGET_TOKENS,
		overlapTokens: options.overlapTokens ?? DEFAULT_OVERLAP_TOKENS,
		maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS
	};

	const paragraphs = splitIntoParagraphs(text);
	return chunkParagraphs(paragraphs, resolved);
}

function chunkChapter(chapter: Chapter, options: Required<ChunkingOptions>): RawChunk[] {
	const paragraphs = extractParagraphsFromHtml(chapter.html);
	return chunkParagraphs(paragraphs, options);
}

function buildChunkId(bookId: string, chapterId: string, index: number): string {
	return `${bookId}-${chapterId}-chunk-${index}`;
}

async function saveChunks(chunks: Chunk[]): Promise<void> {
	if (chunks.length === 0) {
		return;
	}
	await adapter.saveChunks(chunks[0].bookId, chunks);
}

async function getChunksByBook(bookId: string): Promise<Chunk[]> {
	return await adapter.getChunks(bookId);
}

async function getChunksByBookChapter(bookId: string, chapterId: string): Promise<Chunk[]> {
	return await adapter.getChunks(bookId, chapterId);
}

export async function getChunkById(chunkId: string): Promise<Chunk | null> {
	const chunks = await adapter.getChunksByIds([chunkId]);
	return chunks[0] ?? null;
}

async function isBookIndexed(bookId: string): Promise<boolean> {
	return await adapter.hasChunks(bookId);
}

let embeddingProviderPromise: Promise<EmbeddingProvider | null> | null = null;

interface EmbeddingProvider {
	embed(texts: string[]): Promise<number[][]>;
	model: string;
}

async function getEmbeddingProvider(): Promise<EmbeddingProvider | null> {
	if (embeddingProviderPromise) {
		return embeddingProviderPromise;
	}

	embeddingProviderPromise = (async () => {
		if (typeof window === 'undefined') {
			return null;
		}
		try {
			const { pipeline } = await import('@xenova/transformers');
			const extractor = await pipeline('feature-extraction', EMBEDDING_MODEL, {
				quantized: true
			});
			return {
				model: EMBEDDING_MODEL,
				embed: async (texts: string[]) => {
					const output = await extractor(texts, { pooling: 'mean', normalize: true });
					return output.tolist();
				}
			};
		} catch {
			return null;
		}
	})();

	return embeddingProviderPromise;
}

/**
 * Schedule work to run when browser is idle
 */
function scheduleIdleWork(callback: () => void): void {
	if (typeof requestIdleCallback !== 'undefined') {
		requestIdleCallback(() => callback(), { timeout: 5000 });
	} else {
		setTimeout(callback, 100);
	}
}

/**
 * Yield to allow UI updates - uses requestAnimationFrame followed by setTimeout
 * to ensure the browser has time to paint
 */
function yieldToUI(ms: number = 4): Promise<void> {
	return new Promise((resolve) => {
		if (typeof requestAnimationFrame !== 'undefined') {
			requestAnimationFrame(() => setTimeout(resolve, ms));
		} else {
			setTimeout(resolve, ms);
		}
	});
}

/**
 * Yield to the main thread using the best available API:
 * - scheduler.postTask() for Chrome 94+ (respects task priorities)
 * - requestIdleCallback for background priority (runs during idle periods)
 * - requestAnimationFrame + setTimeout as fallback
 */
function yieldToMainThread(priority: 'background' | 'user-visible' = 'background'): Promise<void> {
	// Use scheduler.postTask() if available (Chrome 94+)
	if (typeof window !== 'undefined' && 'scheduler' in window) {
		const scheduler = (window as unknown as { scheduler: { postTask: (cb: () => void, opts: { priority: string }) => Promise<void> } }).scheduler;
		if (scheduler?.postTask) {
			return scheduler.postTask(() => {}, { priority });
		}
	}
	// For background priority, prefer requestIdleCallback
	if (priority === 'background' && typeof requestIdleCallback !== 'undefined') {
		return new Promise((resolve) => requestIdleCallback(() => resolve(), { timeout: 100 }));
	}
	// Fallback to rAF + setTimeout
	return new Promise((resolve) => {
		if (typeof requestAnimationFrame !== 'undefined') {
			requestAnimationFrame(() => setTimeout(resolve, 0));
		} else {
			setTimeout(resolve, 0);
		}
	});
}

// Track books that need embedding generation
const pendingEmbeddings = new Set<string>();
let embeddingInProgress = false;

/**
 * Generate embeddings for a book in the background when idle
 */
async function generateEmbeddingsInBackground(bookId: string, batchSize: number): Promise<void> {
	const provider = await getEmbeddingProvider();
	if (!provider) {
		pendingEmbeddings.delete(bookId);
		return;
	}

	const chunks = await getChunksByBook(bookId);
	const pending = chunks.filter((chunk) => !chunk.embedding);
	if (pending.length === 0) {
		pendingEmbeddings.delete(bookId);
		return;
	}

	indexingStore.startIndexing(bookId, 'Generating embeddings...');
	indexingStore.setStage('embedding', 0);

	for (let i = 0; i < pending.length; i += batchSize) {
		// Check if this book was removed from pending (e.g., user closed book)
		if (!pendingEmbeddings.has(bookId)) {
			indexingStore.finishIndexing();
			return;
		}

		const batch = pending.slice(i, i + batchSize);
		const embeddings = await provider.embed(batch.map((chunk) => chunk.text));
		const updated = batch.map((chunk, index) => ({
			...chunk,
			embedding: embeddings[index],
			embeddingModel: provider.model
		}));
		await saveChunks(updated);

		const progress = Math.round(((i + batch.length) / pending.length) * 100);
		indexingStore.updateProgress(progress);

		// Yield more frequently for better UI responsiveness
		await yieldToUI();
	}

	pendingEmbeddings.delete(bookId);
	indexingStore.finishIndexing();
}

/**
 * Process pending embedding queue when idle
 */
function processEmbeddingQueue(batchSize: number): void {
	if (embeddingInProgress || pendingEmbeddings.size === 0) {
		return;
	}

	const bookId = pendingEmbeddings.values().next().value;
	if (!bookId) {
		return;
	}

	embeddingInProgress = true;
	generateEmbeddingsInBackground(bookId, batchSize)
		.catch((error) => {
			console.error('Background embedding generation failed:', error);
			pendingEmbeddings.delete(bookId);
		})
		.finally(() => {
			embeddingInProgress = false;
			// Schedule next book if there are more pending
			if (pendingEmbeddings.size > 0) {
				scheduleIdleWork(() => processEmbeddingQueue(batchSize));
			}
		});
}

/**
 * Queue a book for background embedding generation
 */
function queueEmbeddingGeneration(bookId: string, batchSize: number): void {
	pendingEmbeddings.add(bookId);
	// Start processing after a delay to let the UI settle
	scheduleIdleWork(() => processEmbeddingQueue(batchSize));
}

function cosineSimilarity(a: number[], b: number[]): number {
	if (a.length !== b.length) {
		return 0;
	}
	let dot = 0;
	let normA = 0;
	let normB = 0;
	for (let i = 0; i < a.length; i += 1) {
		const valueA = a[i];
		const valueB = b[i];
		dot += valueA * valueB;
		normA += valueA * valueA;
		normB += valueB * valueB;
	}
	if (normA === 0 || normB === 0) {
		return 0;
	}
	return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function rankByEmbeddings(queryEmbedding: number[], chunks: Chunk[]): SearchResult[] {
	return chunks
		.map((chunk) => ({
			chunk,
			score: chunk.embedding ? cosineSimilarity(queryEmbedding, chunk.embedding) : 0
		}))
		.sort((a, b) => b.score - a.score);
}

function rankByBm25(query: string, chunks: Chunk[]): SearchResult[] {
	const index = buildBM25Index(chunks);
	const scores = scoreBM25Batch(query, chunks, index);
	return chunks
		.map((chunk, index) => ({
			chunk,
			score: scores[index] ?? 0
		}))
		.sort((a, b) => b.score - a.score);
}

function reciprocalRankFusion(
	rankings: SearchResult[][],
	k: number = DEFAULT_RRF_K
): SearchResult[] {
	const combined = new Map<string, { chunk: Chunk; score: number }>();

	for (const ranking of rankings) {
		for (let i = 0; i < ranking.length; i += 1) {
			const result = ranking[i];
			const existing = combined.get(result.chunk.id);
			const contribution = 1 / (k + i + 1);
			if (existing) {
				existing.score += contribution;
			} else {
				combined.set(result.chunk.id, { chunk: result.chunk, score: contribution });
			}
		}
	}

	return Array.from(combined.values())
		.sort((a, b) => b.score - a.score)
		.map((entry) => ({
			chunk: entry.chunk,
			score: entry.score
		}));
}

async function buildChunks(book: Book, options: Required<ChunkingOptions>): Promise<Chunk[]> {
	const chunks: Chunk[] = [];
	let chunkIndex = 0;

	for (let i = 0; i < book.chapters.length; i++) {
		const chapter = book.chapters[i];
		const rawChunks = chunkChapter(chapter, options);
		for (const rawChunk of rawChunks) {
			chunks.push({
				id: buildChunkId(book.id, chapter.id, chunkIndex++),
				bookId: book.id,
				chapterId: chapter.id,
				chapterTitle: chapter.title,
				bookChapter: `${book.id}:${chapter.id}`,
				text: rawChunk.text,
				offsetStart: rawChunk.offsetStart,
				offsetEnd: rawChunk.offsetEnd
			});
		}
		// Yield every chapter to keep UI responsive
		await yieldToMainThread();
	}

	return chunks;
}

// Cached worker instance
let indexingWorker: Worker | null = null;
let workerSupported: boolean | null = null;

/**
 * Check if Web Workers are supported and the indexing worker can be loaded
 */
function isWorkerSupported(): boolean {
	if (workerSupported !== null) {
		return workerSupported;
	}
	workerSupported = typeof Worker !== 'undefined' && typeof window !== 'undefined';
	return workerSupported;
}

/**
 * Get or create the indexing worker
 */
async function getIndexingWorker(): Promise<Worker | null> {
	if (!isWorkerSupported()) {
		return null;
	}
	if (indexingWorker) {
		return indexingWorker;
	}
	try {
		// Vite worker import syntax
		const WorkerModule = await import('$lib/workers/indexing.worker?worker');
		indexingWorker = new WorkerModule.default();
		return indexingWorker;
	} catch {
		workerSupported = false;
		return null;
	}
}

/**
 * Index chunks using the Web Worker (off main thread) and stream-save batches.
 */
async function indexBookWithWorker(
	book: Book,
	options: Required<ChunkingOptions>,
	chunkBatchSize: number
): Promise<number | null> {
	const worker = await getIndexingWorker();
	if (!worker) {
		return null;
	}

	return new Promise((resolve) => {
		const jobId = crypto.randomUUID();
		let chunkCount = 0;
		let completed = false;
		let saving = false;
		const queue: Chunk[][] = [];

		const cleanup = () => {
			worker.removeEventListener('message', handleMessage);
			worker.removeEventListener('error', handleError);
		};

		const finalizeIfReady = () => {
			if (completed && !saving && queue.length === 0) {
				cleanup();
				resolve(chunkCount);
			}
		};

		const processQueue = async () => {
			if (saving) return;
			saving = true;
			try {
				while (queue.length > 0) {
					const batch = queue.shift();
					if (batch && batch.length > 0) {
						await saveChunks(batch);
						await yieldToUI();
					}
				}
			} catch {
				cleanup();
				resolve(null);
				return;
			} finally {
				saving = false;
			}
			finalizeIfReady();
		};

		const handleMessage = (event: MessageEvent) => {
			const { data } = event;
			if (!data || data.jobId !== jobId) return;

			if (data.type === 'chunk_batch') {
				if (Array.isArray(data.chunks) && data.chunks.length > 0) {
					queue.push(data.chunks);
					chunkCount += data.chunks.length;
					if (typeof data.chapterIndex === 'number' && typeof data.totalChapters === 'number') {
						const progress = Math.round((data.chapterIndex / data.totalChapters) * 100);
						indexingStore.setStage('chunking', progress);
					}
					void processQueue();
				}
			} else if (data.type === 'progress') {
				if (typeof data.current === 'number' && typeof data.total === 'number') {
					const progress = Math.round((data.current / data.total) * 100);
					indexingStore.setStage('chunking', progress);
				}
			} else if (data.type === 'complete') {
				completed = true;
				finalizeIfReady();
			}
		};

		const handleError = () => {
			cleanup();
			resolve(null);
		};

		worker.addEventListener('message', handleMessage);
		worker.addEventListener('error', handleError);

		worker.postMessage({
			type: 'index',
			jobId,
			book: {
				id: book.id,
				chapters: book.chapters.map((ch) => ({
					id: ch.id,
					title: ch.title,
					html: ch.html
				}))
			},
			options,
			chunkBatchSize: chunkBatchSize > 0 ? chunkBatchSize : DEFAULT_CHUNK_MESSAGE_SIZE
		});
	});
}

export async function indexBook(book: Book, options: IndexOptions = {}): Promise<void> {
	// Yield immediately to let UI render
	await yieldToUI();

	const resolvedChunking: Required<ChunkingOptions> = {
		targetTokens: options.targetTokens ?? DEFAULT_TARGET_TOKENS,
		overlapTokens: options.overlapTokens ?? DEFAULT_OVERLAP_TOKENS,
		maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS
	};
	const batchSize = options.embeddingBatchSize ?? DEFAULT_EMBEDDING_BATCH;
	const shouldGenerateEmbeddings = options.generateEmbeddings ?? true;

	if (await isBookIndexed(book.id)) {
		// Book already chunked, but maybe embeddings are missing - queue for background
		if (shouldGenerateEmbeddings) {
			queueEmbeddingGeneration(book.id, batchSize);
		}
		return;
	}

	// Start indexing notification
	indexingStore.startIndexing(book.id, book.title);
	indexingStore.setStage('chunking', 0);

	// Try Web Worker first for off-main-thread processing, fall back to main thread
	const workerChunkCount = await indexBookWithWorker(book, resolvedChunking, DEFAULT_CHUNK_MESSAGE_SIZE);
	if (typeof workerChunkCount === 'number') {
		if (workerChunkCount === 0) {
			indexingStore.finishIndexing();
			throw new RetrievalError('No chunks generated for book.', book.id);
		}
		indexingStore.setStage('chunking', 100);
		indexingStore.finishIndexing();
		if (shouldGenerateEmbeddings) {
			queueEmbeddingGeneration(book.id, batchSize);
		}
		return;
	}

	const chunks = await buildChunks(book, resolvedChunking);

	if (chunks.length === 0) {
		indexingStore.finishIndexing();
		throw new RetrievalError('No chunks generated for book.', book.id);
	}

	indexingStore.setStage('chunking', 100);
	await saveChunks(chunks);

	// Chunking complete - finish the "blocking" part
	indexingStore.finishIndexing();

	// Queue embedding generation for background processing when idle
	// BM25 search works without embeddings, so the book is usable immediately
	if (shouldGenerateEmbeddings) {
		queueEmbeddingGeneration(book.id, batchSize);
	}
}

export async function reindexBook(book: Book, options: IndexOptions = {}): Promise<void> {
	await adapter.deleteChunks(book.id);
	await indexBook(book, options);
}

/**
 * Retrieves the most relevant chunks for a query.
 *
 * @param query - The user's question
 * @param bookId - The book to search within
 * @param options - Search options
 * @param options.scope - 'current_chapter' or 'whole_book'
 * @param options.chapterId - Required if scope is 'current_chapter'
 * @param options.topK - Number of results (default: 6)
 *
 * @returns Ranked chunks with similarity scores
 *
 * @throws {RetrievalError} If book is not indexed
 *
 * @example
 * const chunks = await searchChunks(
 *   'What does Pierre think about war?',
 *   'war-and-peace',
 *   { scope: 'whole_book', topK: 8 }
 * );
 */
export async function searchChunks(
	query: string,
	bookId: string,
	options: SearchOptions
): Promise<SearchResult[]> {
	const topK = options.topK ?? DEFAULT_TOP_K;
	const chunks =
		options.scope === 'current_chapter'
			? options.chapterId
				? await getChunksByBookChapter(bookId, options.chapterId)
				: []
			: await getChunksByBook(bookId);

	if (chunks.length === 0) {
		throw new RetrievalError('Book is not indexed for retrieval.', bookId);
	}

	const provider = await getEmbeddingProvider();
	const bm25Ranking = rankByBm25(query, chunks);
	const hasEmbeddings = chunks.every((chunk) => Array.isArray(chunk.embedding));

	if (provider && !hasEmbeddings) {
		queueEmbeddingGeneration(bookId, DEFAULT_EMBEDDING_BATCH);
	}

	if (provider && hasEmbeddings) {
		const [queryEmbedding] = await provider.embed([query]);
		const embeddingRanking = rankByEmbeddings(queryEmbedding, chunks);
		return reciprocalRankFusion([embeddingRanking, bm25Ranking]).slice(0, topK);
	}

	return bm25Ranking.slice(0, topK);
}
