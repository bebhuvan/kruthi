/**
 * summarization.ts
 *
 * Chapter summaries and recap generation with cached storage.
 */
import type { Book, Chapter } from '$lib/types/book';
import type { ChapterSummary, SummaryOptions, SummaryFocus } from '$lib/types/summary';
import type { LLMProvider } from '$lib/types/settings';
import { LLMError } from '$lib/types/errors';
import { estimateTokenCount, splitIntoParagraphs } from '$lib/utils/tokenizer';
import { adapter } from '$lib/platform';
import { streamLlmText } from '$lib/services/llmText';

const SUMMARY_MAX_TOKENS = 1200;
const RECAP_MAX_TOKENS = 900;
const MAX_CHAPTER_TOKENS = 6000;

export interface SummaryLlmConfig {
	provider: LLMProvider;
	openRouterModel: string;
	openAiModel: string;
	geminiModel: string;
	systemPrompt?: string;
}

export interface RecapProgress {
	current: number;
	total: number;
}

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

function trimParagraphsToTokenLimit(paragraphs: string[], maxTokens: number): string[] {
	const trimmed: string[] = [];
	let totalTokens = 0;
	for (const paragraph of paragraphs) {
		const tokens = estimateTokenCount(paragraph);
		if (totalTokens + tokens > maxTokens) {
			break;
		}
		trimmed.push(paragraph);
		totalTokens += tokens;
	}
	return trimmed;
}

function buildSummaryPrompt(params: {
	book: Book;
	chapter: Chapter;
	options: SummaryOptions;
	text: string;
	systemPrompt?: string;
}): { system: string; user: string } {
	const focus = params.options.focus ?? 'plot';
	const baseSystem = `You are a reading companion. Summarize the provided chapter faithfully.
Only use the provided chapter text. Do not invent details. Avoid spoilers beyond this chapter.
Return valid JSON only.`;
	const system = [params.systemPrompt, baseSystem].filter(Boolean).join('\n\n');
	const user = `Book: "${params.book.title}" by ${params.book.author}
Chapter: "${params.chapter.title}"
Focus: ${focus}
Summary type: ${params.options.type}

Chapter text:
${params.text}

Return JSON with this shape:
{
  "brief": "2-3 sentence summary",
  "detailed": "2-3 paragraphs when type is detailed, otherwise empty string",
  "keyPoints": ["bullet 1", "bullet 2", "bullet 3"],
  "characters": ["Character A", "Character B"]
}`;
	return { system, user };
}

function buildRecapPrompt(params: {
	book: Book;
	chapters: Array<{ title: string; summary: string }>;
	systemPrompt?: string;
}): { system: string; user: string } {
	const baseSystem = `You are a reading companion. Produce a cohesive "story so far" recap.
Use only the provided chapter summaries. Avoid spoilers beyond the latest chapter.
Keep it concise: 2-4 short paragraphs, no bullet lists.`;
	const system = [params.systemPrompt, baseSystem].filter(Boolean).join('\n\n');
	const chapterSummaries = params.chapters
		.map((chapter, index) => `Chapter ${index + 1}: ${chapter.title}\n${chapter.summary}`)
		.join('\n\n');
	const user = `Book: "${params.book.title}" by ${params.book.author}

Chapter summaries:
${chapterSummaries}`;
	return { system, user };
}

function extractJsonPayload(text: string): string | null {
	const fenced = text.match(/```json\s*([\s\S]*?)```/i) ?? text.match(/```([\s\S]*?)```/i);
	if (fenced?.[1]) {
		return fenced[1].trim();
	}
	const brace = text.match(/\{[\s\S]*\}/);
	return brace ? brace[0] : null;
}

function normalizeList(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value
		.map((item) => (typeof item === 'string' ? item : ''))
		.map((item) => item.replace(/^[-*]\s+/, '').trim())
		.filter(Boolean);
}

function parseSummaryResponse(responseText: string): {
	brief: string;
	detailed?: string;
	keyPoints: string[];
	characters: string[];
} {
	const payload = extractJsonPayload(responseText);
	if (payload) {
		try {
			const parsed = JSON.parse(payload) as {
				brief?: string;
				detailed?: string;
				keyPoints?: unknown;
				characters?: unknown;
			};
			const brief = typeof parsed.brief === 'string' ? parsed.brief.trim() : '';
			const detailed = typeof parsed.detailed === 'string' ? parsed.detailed.trim() : undefined;
			const keyPoints = normalizeList(parsed.keyPoints);
			const characters = normalizeList(parsed.characters);
			if (brief) {
				return { brief, detailed, keyPoints, characters };
			}
		} catch {
			// Fall through to fallback parsing.
		}
	}

	const fallback = responseText.trim();
	return {
		brief: fallback.split('\n')[0]?.trim() || fallback,
		detailed: fallback,
		keyPoints: [],
		characters: []
	};
}

function resolveFocus(options?: SummaryOptions): SummaryFocus {
	return options?.focus ?? 'plot';
}

function buildSummaryId(bookId: string, chapterId: string): string {
	return `${bookId}:${chapterId}`;
}

async function ensureChapter(book: Book, chapterId: string): Promise<Chapter> {
	const chapter = book.chapters.find((item) => item.id === chapterId);
	if (!chapter) {
		throw new LLMError('Chapter not found for summarization.');
	}
	return chapter;
}

export async function summarizeChapter(
	book: Book,
	chapterId: string,
	options: SummaryOptions,
	llm: SummaryLlmConfig
): Promise<ChapterSummary> {
	const cached = await adapter.getSummary(book.id, chapterId);
	if (cached && !options.forceRefresh) {
		return cached;
	}

	const chapter = await ensureChapter(book, chapterId);
	const paragraphs = extractParagraphsFromHtml(chapter.html);
	const trimmed = trimParagraphsToTokenLimit(paragraphs, MAX_CHAPTER_TOKENS);
	const text = trimmed.join('\n\n');
	const prompt = buildSummaryPrompt({
		book,
		chapter,
		options: {
			type: options.type,
			focus: resolveFocus(options)
		},
		text,
		systemPrompt: llm.systemPrompt
	});

	const responseText = await streamLlmText({
		provider: llm.provider,
		openRouterModel: llm.openRouterModel,
		openAiModel: llm.openAiModel,
		geminiModel: llm.geminiModel,
		system: prompt.system,
		user: prompt.user,
		maxTokens: SUMMARY_MAX_TOKENS
	});

	const parsed = parseSummaryResponse(responseText);
	const summary: ChapterSummary = {
		id: buildSummaryId(book.id, chapterId),
		bookId: book.id,
		chapterId,
		brief: parsed.brief,
		detailed: parsed.detailed,
		keyPoints: parsed.keyPoints,
		characters: parsed.characters,
		generatedAt: Date.now()
	};

	await adapter.saveSummary(summary);
	return summary;
}

export async function generateRecap(
	book: Book,
	upToChapterIndex: number,
	llm: SummaryLlmConfig,
	onProgress?: (progress: RecapProgress) => void
): Promise<string> {
	const chapterCount = Math.min(upToChapterIndex + 1, book.chapters.length);
	const summaries: Array<{ title: string; summary: string }> = [];

	for (let index = 0; index < chapterCount; index += 1) {
		const chapter = book.chapters[index];
		let summary = await adapter.getSummary(book.id, chapter.id);
		if (!summary) {
			summary = await summarizeChapter(
				book,
				chapter.id,
				{ type: 'brief' },
				llm
			);
		}
		summaries.push({
			title: chapter.title,
			summary: summary.brief
		});
		onProgress?.({ current: index + 1, total: chapterCount });
	}

	const prompt = buildRecapPrompt({
		book,
		chapters: summaries,
		systemPrompt: llm.systemPrompt
	});

	const responseText = await streamLlmText({
		provider: llm.provider,
		openRouterModel: llm.openRouterModel,
		openAiModel: llm.openAiModel,
		geminiModel: llm.geminiModel,
		system: prompt.system,
		user: prompt.user,
		maxTokens: RECAP_MAX_TOKENS
	});

	const trimmed = responseText.trim();
	if (!trimmed) {
		throw new LLMError('Recap response was empty.');
	}
	return trimmed;
}
