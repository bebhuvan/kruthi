/**
 * analysis.ts
 *
 * Deep analysis helpers: extended analysis, theme tracking, character profiling.
 */
import type { Book, Chapter } from '$lib/types/book';
import type {
	AnalysisRequest,
	AnalysisResult,
	AnalysisScope,
	AnalysisType,
	CharacterProfile,
	ThemeTracker
} from '$lib/types/analysis';
import type { SummaryLlmConfig } from '$lib/services/summarization';
import { LLMError } from '$lib/types/errors';
import { adapter } from '$lib/platform';
import { streamLlmText } from '$lib/services/llmText';
import { searchChunks } from '$lib/services/retrieval';
import { summarizeChapter } from '$lib/services/summarization';
import { estimateTokenCount, splitIntoParagraphs } from '$lib/utils/tokenizer';

const ANALYSIS_MAX_TOKENS = 1400;
const SUMMARY_CONTEXT_TOKENS = 3200;
const MAX_CHAPTER_TOKENS = 5000;
const THEME_MAX_TOKENS = 1200;
const CHARACTER_MAX_TOKENS = 1400;
const LIST_MAX_TOKENS = 500;

export interface AnalysisLlmConfig extends SummaryLlmConfig {
	useExtendedThinking?: boolean;
	thinkingBudget?: number;
}

interface CacheOptions {
	forceRefresh?: boolean;
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

function buildThemeListCacheId(bookId: string): string {
	return `theme-list:${bookId}`;
}

function buildCharacterListCacheId(bookId: string): string {
	return `character-list:${bookId}`;
}

function buildThemeTrackerCacheId(bookId: string, theme: string): string {
	return `theme-tracker:${bookId}:${encodeURIComponent(theme.toLowerCase().trim())}`;
}

function buildCharacterProfileCacheId(bookId: string, name: string): string {
	return `character-profile:${bookId}:${encodeURIComponent(name.toLowerCase().trim())}`;
}

function buildAnalysisCacheId(
	bookId: string,
	scope: AnalysisScope,
	type: AnalysisType,
	chapterId?: string,
	subject?: string
): string {
	const scopeKey = scope === 'chapter' ? chapterId ?? 'chapter' : 'book';
	const subjectKey = subject ? encodeURIComponent(subject.toLowerCase().trim()) : 'none';
	return `analysis:${bookId}:${scopeKey}:${type}:${subjectKey}`;
}

function extractJsonPayload(text: string): string | null {
	const fenced = text.match(/```json\s*([\s\S]*?)```/i) ?? text.match(/```([\s\S]*?)```/i);
	if (fenced?.[1]) {
		return fenced[1].trim();
	}
	const brace = text.match(/\{[\s\S]*\}/);
	return brace ? brace[0] : null;
}

function normalizeStringList(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value
		.map((item) => (typeof item === 'string' ? item : ''))
		.map((item) => item.replace(/^[-*]\s+/, '').trim())
		.filter(Boolean);
}

function toSummaryContextText(summaries: Array<{ title: string; summary: string }>): string {
	return summaries
		.map((chapter, index) => `Chapter ${index + 1}: ${chapter.title}\n${chapter.summary}`)
		.join('\n\n');
}

async function getSummaryContext(
	book: Book,
	llm: AnalysisLlmConfig
): Promise<string> {
	let totalTokens = 0;
	const summaries: Array<{ title: string; summary: string }> = [];

	for (let index = 0; index < book.chapters.length; index += 1) {
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
		const summaryText = summary.brief;
		const tokens = estimateTokenCount(summaryText);
		if (totalTokens + tokens > SUMMARY_CONTEXT_TOKENS) {
			break;
		}
		summaries.push({ title: chapter.title, summary: summaryText });
		totalTokens += tokens;
	}

	return toSummaryContextText(summaries);
}

function buildExcerptBlock(excerpts: Array<{ id: string; chapterId: string; chapterTitle: string; text: string }>): string {
	return excerpts
		.map(
			(chunk) =>
				`[chunk_id: ${chunk.id} | chapter_id: ${chunk.chapterId} | chapter: ${chunk.chapterTitle}]\n${chunk.text}`
		)
		.join('\n\n');
}

function ensureChapter(book: Book, chapterId?: string): Chapter {
	const chapter = chapterId ? book.chapters.find((item) => item.id === chapterId) : book.chapters[0];
	if (!chapter) {
		throw new LLMError('Chapter not found for analysis.');
	}
	return chapter;
}

function resolveScope(request: AnalysisRequest): AnalysisScope {
	if (request.scope) {
		return request.scope;
	}
	return request.chapterId ? 'chapter' : 'book';
}

function buildAnalysisPrompt(params: {
	book: Book;
	type: AnalysisType;
	scope: AnalysisScope;
	subject?: string;
	context: string;
	excerpts: string;
	systemPrompt?: string;
}): { system: string; user: string } {
	const baseSystem = `You are a literary analysis companion. Use the provided context and excerpts.
Avoid spoilers beyond the provided scope. Only quote from the excerpts.
If you add external literary context, label it "Context".`;
	const system = [params.systemPrompt, baseSystem].filter(Boolean).join('\n\n');
	const subjectLine = params.subject ? `Focus: ${params.subject}` : '';
	const user = `Book: "${params.book.title}" by ${params.book.author}
Analysis type: ${params.type}
Scope: ${params.scope}
${subjectLine}

Context:
${params.context}

Excerpts:
${params.excerpts || 'None provided.'}

Write 2-4 short paragraphs. Use clear section breaks when adding Context.`;
	return { system, user };
}

function buildThemePrompt(params: {
	book: Book;
	theme: string;
	summaryContext: string;
	excerpts: string;
	systemPrompt?: string;
}): { system: string; user: string } {
	const baseSystem = `You are a literary analysis companion. Track a theme across the book.
Use only the provided summaries and excerpts. Return valid JSON only.`;
	const system = [params.systemPrompt, baseSystem].filter(Boolean).join('\n\n');
	const user = `Book: "${params.book.title}" by ${params.book.author}
Theme: ${params.theme}

Chapter summaries:
${params.summaryContext}

Excerpts:
${params.excerpts}

Return JSON with this shape:
{
  "theme": "Theme name",
  "description": "1-2 sentence description",
  "occurrences": [
    { "chapterId": "chapter-id", "quote": "short quote", "analysis": "1-2 sentence note" }
  ],
  "evolution": "2-4 sentence evolution across the book"
}`;
	return { system, user };
}

function buildCharacterPrompt(params: {
	book: Book;
	name: string;
	summaryContext: string;
	excerpts: string;
	systemPrompt?: string;
}): { system: string; user: string } {
	const baseSystem = `You are a literary analysis companion. Build a character profile.
Use only the provided summaries and excerpts. Return valid JSON only.`;
	const system = [params.systemPrompt, baseSystem].filter(Boolean).join('\n\n');
	const user = `Book: "${params.book.title}" by ${params.book.author}
Character: ${params.name}

Chapter summaries:
${params.summaryContext}

Excerpts:
${params.excerpts}

Return JSON with this shape:
{
  "name": "Character name",
  "aliases": ["Alias 1"],
  "description": "2-3 sentence description",
  "firstAppearance": { "chapterId": "chapter-id", "quote": "short quote" },
  "relationships": [
    { "character": "Other character", "relationship": "relationship description" }
  ],
  "arc": "2-4 sentence arc summary",
  "keyMoments": [
    { "chapterId": "chapter-id", "quote": "short quote", "significance": "1-2 sentence note" }
  ]
}`;
	return { system, user };
}

function buildThemeListPrompt(params: {
	book: Book;
	summaryContext: string;
	systemPrompt?: string;
}): { system: string; user: string } {
	const baseSystem = `You are a literary analysis companion. Identify major themes.
Use only the provided summaries. Return valid JSON only.`;
	const system = [params.systemPrompt, baseSystem].filter(Boolean).join('\n\n');
	const user = `Book: "${params.book.title}" by ${params.book.author}

Chapter summaries:
${params.summaryContext}

Return JSON with this shape:
{ "themes": ["Theme 1", "Theme 2"] }`;
	return { system, user };
}

function buildCharacterListPrompt(params: {
	book: Book;
	summaryContext: string;
	systemPrompt?: string;
}): { system: string; user: string } {
	const baseSystem = `You are a literary analysis companion. Identify major characters.
Use only the provided summaries. Return valid JSON only.`;
	const system = [params.systemPrompt, baseSystem].filter(Boolean).join('\n\n');
	const user = `Book: "${params.book.title}" by ${params.book.author}

Chapter summaries:
${params.summaryContext}

Return JSON with this shape:
{ "characters": ["Name 1", "Name 2"] }`;
	return { system, user };
}

export async function performAnalysis(
	book: Book,
	request: AnalysisRequest,
	llm: AnalysisLlmConfig,
	options?: CacheOptions
): Promise<AnalysisResult> {
	const scope = resolveScope(request);
	const cacheId = buildAnalysisCacheId(
		book.id,
		scope,
		request.type,
		request.chapterId,
		request.subject
	);
	const cached = await adapter.getAnalysis(cacheId);
	if (cached && cached.kind === 'analysis' && !options?.forceRefresh) {
		return cached.payload;
	}

	let context = '';
	if (scope === 'chapter') {
		const chapter = ensureChapter(book, request.chapterId);
		const paragraphs = extractParagraphsFromHtml(chapter.html);
		const trimmed = trimParagraphsToTokenLimit(paragraphs, MAX_CHAPTER_TOKENS);
		context = trimmed.join('\n\n');
	} else {
		context = await getSummaryContext(book, llm);
	}

	const searchScope = scope === 'chapter' ? 'current_chapter' : 'whole_book';
	const query = request.subject
		? `${request.type} analysis ${request.subject}`
		: `${request.type} analysis`;
	const results = await searchChunks(query, book.id, {
		scope: searchScope,
		chapterId: request.chapterId
	});
	const excerpts = results.slice(0, 6).map((result) => result.chunk);
	const prompt = buildAnalysisPrompt({
		book,
		type: request.type,
		scope,
		subject: request.subject,
		context,
		excerpts: buildExcerptBlock(excerpts),
		systemPrompt: llm.systemPrompt
	});

	const responseText = await streamLlmText({
		provider: llm.provider,
		openRouterModel: llm.openRouterModel,
		openAiModel: llm.openAiModel,
		geminiModel: llm.geminiModel,
		system: prompt.system,
		user: prompt.user,
		maxTokens: ANALYSIS_MAX_TOKENS,
		useExtendedThinking: llm.useExtendedThinking,
		thinkingBudget: llm.thinkingBudget
	});

	const trimmed = responseText.trim();
	if (!trimmed) {
		throw new LLMError('Analysis response was empty.');
	}
	const result: AnalysisResult = {
		id: cacheId,
		bookId: book.id,
		type: request.type,
		chapterId: request.chapterId,
		subject: request.subject,
		response: trimmed,
		generatedAt: Date.now()
	};
	await adapter.saveAnalysis({
		id: cacheId,
		bookId: book.id,
		kind: 'analysis',
		subject: request.subject,
		chapterId: request.chapterId,
		payload: result,
		generatedAt: result.generatedAt
	});
	return result;
}

export async function identifyThemes(
	book: Book,
	llm: AnalysisLlmConfig,
	options?: CacheOptions
): Promise<string[]> {
	const cacheId = buildThemeListCacheId(book.id);
	const cached = await adapter.getAnalysis(cacheId);
	if (cached && cached.kind === 'theme-list' && !options?.forceRefresh) {
		return cached.payload;
	}

	const summaryContext = await getSummaryContext(book, llm);
	const prompt = buildThemeListPrompt({
		book,
		summaryContext,
		systemPrompt: llm.systemPrompt
	});
	const responseText = await streamLlmText({
		provider: llm.provider,
		openRouterModel: llm.openRouterModel,
		openAiModel: llm.openAiModel,
		geminiModel: llm.geminiModel,
		system: prompt.system,
		user: prompt.user,
		maxTokens: LIST_MAX_TOKENS,
		useExtendedThinking: llm.useExtendedThinking,
		thinkingBudget: llm.thinkingBudget
	});
	const payload = extractJsonPayload(responseText);
	let themes: string[] = [];
	if (payload) {
		try {
			const parsed = JSON.parse(payload) as { themes?: unknown };
			themes = normalizeStringList(parsed.themes);
		} catch {
			themes = [];
		}
	}
	if (themes.length === 0) {
		themes = normalizeStringList(responseText.split('\n'));
	}
	if (themes.length === 0) {
		throw new LLMError('Theme list response was empty.');
	}
	await adapter.saveAnalysis({
		id: cacheId,
		bookId: book.id,
		kind: 'theme-list',
		payload: themes,
		generatedAt: Date.now()
	});
	return themes;
}

export async function identifyCharacters(
	book: Book,
	llm: AnalysisLlmConfig,
	options?: CacheOptions
): Promise<string[]> {
	const cacheId = buildCharacterListCacheId(book.id);
	const cached = await adapter.getAnalysis(cacheId);
	if (cached && cached.kind === 'character-list' && !options?.forceRefresh) {
		return cached.payload;
	}

	const summaryContext = await getSummaryContext(book, llm);
	const prompt = buildCharacterListPrompt({
		book,
		summaryContext,
		systemPrompt: llm.systemPrompt
	});
	const responseText = await streamLlmText({
		provider: llm.provider,
		openRouterModel: llm.openRouterModel,
		openAiModel: llm.openAiModel,
		geminiModel: llm.geminiModel,
		system: prompt.system,
		user: prompt.user,
		maxTokens: LIST_MAX_TOKENS,
		useExtendedThinking: llm.useExtendedThinking,
		thinkingBudget: llm.thinkingBudget
	});
	const payload = extractJsonPayload(responseText);
	let characters: string[] = [];
	if (payload) {
		try {
			const parsed = JSON.parse(payload) as { characters?: unknown };
			characters = normalizeStringList(parsed.characters);
		} catch {
			characters = [];
		}
	}
	if (characters.length === 0) {
		characters = normalizeStringList(responseText.split('\n'));
	}
	if (characters.length === 0) {
		throw new LLMError('Character list response was empty.');
	}
	await adapter.saveAnalysis({
		id: cacheId,
		bookId: book.id,
		kind: 'character-list',
		payload: characters,
		generatedAt: Date.now()
	});
	return characters;
}

export async function trackTheme(
	book: Book,
	theme: string,
	llm: AnalysisLlmConfig,
	options?: CacheOptions
): Promise<ThemeTracker> {
	const cacheId = buildThemeTrackerCacheId(book.id, theme);
	const cached = await adapter.getAnalysis(cacheId);
	if (cached && cached.kind === 'theme-tracker' && !options?.forceRefresh) {
		return cached.payload;
	}

	const summaryContext = await getSummaryContext(book, llm);
	const results = await searchChunks(theme, book.id, { scope: 'whole_book' });
	const excerpts = results.slice(0, 8).map((result) => result.chunk);
	const prompt = buildThemePrompt({
		book,
		theme,
		summaryContext,
		excerpts: buildExcerptBlock(excerpts),
		systemPrompt: llm.systemPrompt
	});
	const responseText = await streamLlmText({
		provider: llm.provider,
		openRouterModel: llm.openRouterModel,
		openAiModel: llm.openAiModel,
		geminiModel: llm.geminiModel,
		system: prompt.system,
		user: prompt.user,
		maxTokens: THEME_MAX_TOKENS,
		useExtendedThinking: llm.useExtendedThinking,
		thinkingBudget: llm.thinkingBudget
	});
	const payload = extractJsonPayload(responseText);
	if (!payload) {
		throw new LLMError('Theme tracking response was empty.');
	}
	let parsed: ThemeTracker | null = null;
	try {
		const result = JSON.parse(payload) as {
			theme?: string;
			description?: string;
			occurrences?: Array<{ chapterId?: string; quote?: string; analysis?: string }>;
			evolution?: string;
		};
		if (!result.theme || !result.description) {
			throw new Error('Missing theme fields.');
		}
		parsed = {
			id: cacheId,
			bookId: book.id,
			theme: result.theme,
			description: result.description,
			occurrences:
				result.occurrences
					?.map((item) => ({
						chapterId: item.chapterId ?? '',
						quote: item.quote ?? '',
						analysis: item.analysis ?? ''
					}))
					.filter((item) => item.chapterId && item.quote) ?? [],
			evolution: result.evolution ?? '',
			generatedAt: Date.now()
		};
	} catch {
		parsed = null;
	}
	if (!parsed) {
		throw new LLMError('Theme tracking response was invalid.');
	}
	await adapter.saveAnalysis({
		id: cacheId,
		bookId: book.id,
		kind: 'theme-tracker',
		subject: theme,
		payload: parsed,
		generatedAt: parsed.generatedAt
	});
	return parsed;
}

export async function buildCharacterProfile(
	book: Book,
	name: string,
	llm: AnalysisLlmConfig,
	options?: CacheOptions
): Promise<CharacterProfile> {
	const cacheId = buildCharacterProfileCacheId(book.id, name);
	const cached = await adapter.getAnalysis(cacheId);
	if (cached && cached.kind === 'character-profile' && !options?.forceRefresh) {
		return cached.payload;
	}

	const summaryContext = await getSummaryContext(book, llm);
	const results = await searchChunks(name, book.id, { scope: 'whole_book' });
	const excerpts = results.slice(0, 8).map((result) => result.chunk);
	const prompt = buildCharacterPrompt({
		book,
		name,
		summaryContext,
		excerpts: buildExcerptBlock(excerpts),
		systemPrompt: llm.systemPrompt
	});
	const responseText = await streamLlmText({
		provider: llm.provider,
		openRouterModel: llm.openRouterModel,
		openAiModel: llm.openAiModel,
		geminiModel: llm.geminiModel,
		system: prompt.system,
		user: prompt.user,
		maxTokens: CHARACTER_MAX_TOKENS,
		useExtendedThinking: llm.useExtendedThinking,
		thinkingBudget: llm.thinkingBudget
	});
	const payload = extractJsonPayload(responseText);
	if (!payload) {
		throw new LLMError('Character profile response was empty.');
	}
	let parsed: CharacterProfile | null = null;
	try {
		const result = JSON.parse(payload) as {
			name?: string;
			aliases?: unknown;
			description?: string;
			firstAppearance?: { chapterId?: string; quote?: string };
			relationships?: Array<{ character?: string; relationship?: string }>;
			arc?: string;
			keyMoments?: Array<{ chapterId?: string; quote?: string; significance?: string }>;
		};
		if (!result.name || !result.description || !result.firstAppearance?.chapterId) {
			throw new Error('Missing character fields.');
		}
		parsed = {
			id: cacheId,
			bookId: book.id,
			name: result.name,
			aliases: normalizeStringList(result.aliases),
			description: result.description,
			firstAppearance: {
				chapterId: result.firstAppearance.chapterId,
				quote: result.firstAppearance.quote ?? ''
			},
			relationships:
				result.relationships
					?.map((item) => ({
						character: item.character ?? '',
						relationship: item.relationship ?? ''
					}))
					.filter((item) => item.character && item.relationship) ?? [],
			arc: result.arc ?? '',
			keyMoments:
				result.keyMoments
					?.map((item) => ({
						chapterId: item.chapterId ?? '',
						quote: item.quote ?? '',
						significance: item.significance ?? ''
					}))
					.filter((item) => item.chapterId && item.quote) ?? [],
			generatedAt: Date.now()
		};
	} catch {
		parsed = null;
	}
	if (!parsed) {
		throw new LLMError('Character profile response was invalid.');
	}
	await adapter.saveAnalysis({
		id: cacheId,
		bookId: book.id,
		kind: 'character-profile',
		subject: name,
		payload: parsed,
		generatedAt: parsed.generatedAt
	});
	return parsed;
}
