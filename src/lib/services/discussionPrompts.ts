/**
 * discussionPrompts.ts
 *
 * Generates discussion prompts for a chapter.
 */
import type { Book } from '$lib/types/book';
import type { DiscussionPrompt, DiscussionPromptType } from '$lib/types/summary';
import type { SummaryLlmConfig } from '$lib/services/summarization';
import { summarizeChapter } from '$lib/services/summarization';
import { streamLlmText } from '$lib/services/llmText';
import { LLMError } from '$lib/types/errors';

const PROMPT_MAX_TOKENS = 600;

function buildPrompt(params: {
	book: Book;
	chapterTitle: string;
	summary: string;
	count: number;
	systemPrompt?: string;
}): { system: string; user: string } {
	const baseSystem = `You are a reading companion. Generate discussion prompts based on the provided summary.
Return valid JSON only. Each prompt should be thoughtful and spoiler-free.`;
	const system = [params.systemPrompt, baseSystem].filter(Boolean).join('\n\n');
	const user = `Book: "${params.book.title}" by ${params.book.author}
Chapter: "${params.chapterTitle}"

Summary:
${params.summary}

Generate ${params.count} prompts. Use these types evenly if possible:
- comprehension
- analysis
- reflection
- prediction

Return JSON with this shape:
{
  "prompts": [
    { "type": "comprehension", "question": "Question text", "hint": "Optional hint" }
  ]
}`;
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

function normalizeType(value: unknown): DiscussionPromptType {
	switch (value) {
		case 'analysis':
		case 'reflection':
		case 'prediction':
		case 'comprehension':
			return value;
		default:
			return 'comprehension';
	}
}

function normalizePrompts(responseText: string): DiscussionPrompt[] {
	const payload = extractJsonPayload(responseText);
	if (!payload) {
		return [];
	}
	try {
		const parsed = JSON.parse(payload) as { prompts?: Array<Record<string, unknown>> };
		const items = parsed.prompts ?? [];
		return items
			.map((item) => ({
				id: crypto.randomUUID(),
				type: normalizeType(item.type),
				question: typeof item.question === 'string' ? item.question.trim() : '',
				hint: typeof item.hint === 'string' ? item.hint.trim() : undefined
			}))
			.filter((item) => Boolean(item.question));
	} catch {
		return [];
	}
}

export async function generateDiscussionPrompts(
	book: Book,
	chapterId: string,
	count: number,
	llm: SummaryLlmConfig
): Promise<DiscussionPrompt[]> {
	const chapter = book.chapters.find((item) => item.id === chapterId);
	if (!chapter) {
		throw new LLMError('Chapter not found for discussion prompts.');
	}

	const summary = await summarizeChapter(
		book,
		chapterId,
		{ type: 'brief' },
		llm
	);

	const prompt = buildPrompt({
		book,
		chapterTitle: chapter.title,
		summary: summary.brief,
		count,
		systemPrompt: llm.systemPrompt
	});

	const responseText = await streamLlmText({
		provider: llm.provider,
		openRouterModel: llm.openRouterModel,
		openAiModel: llm.openAiModel,
		geminiModel: llm.geminiModel,
		system: prompt.system,
		user: prompt.user,
		maxTokens: PROMPT_MAX_TOKENS
	});

	const prompts = normalizePrompts(responseText);
	if (prompts.length === 0) {
		throw new LLMError('Discussion prompts response was empty.');
	}
	return prompts;
}
