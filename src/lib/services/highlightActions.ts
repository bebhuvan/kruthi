/**
 * highlightActions.ts
 *
 * Streams highlight action responses (explain/define) using Anthropic.
 */
import type { HighlightAction, HighlightSelection } from '$lib/types/highlight';
import type { LLMProvider } from '$lib/types/settings';
import type { VocabularyDefinition } from '$lib/types/vocabulary';
import { LLMError } from '$lib/types/errors';
import { buildHighlightPrompt } from '$lib/services/prompts';
import { streamOpenRouter } from '$lib/services/openrouter';
import { streamOpenAi } from '$lib/services/openai';
import { streamGemini } from '$lib/services/gemini';
import { streamSSE, anthropicExtractor } from '$lib/utils/sse';
import { adapter } from '$lib/platform';
import { SECURE_STORAGE_KEYS } from '$lib/config/constants';
import { lookupDictionaryDefinition } from '$lib/services/dictionary';

const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const PROMPT_CACHE_BETA = 'prompt-caching-2024-07-31';
// Use fast model for quick highlight actions (define/explain)
const DEFAULT_MODEL = 'claude-haiku-4-5-20251101';
const DEFAULT_MAX_TOKENS = 512;

interface HighlightParams {
	provider: LLMProvider;
	openRouterModel: string;
	openAiModel: string;
	geminiModel: string;
	systemPrompt?: string;
	action: HighlightAction;
	selection: HighlightSelection;
	onToken?: (delta: string) => void;
}

export interface HighlightActionResult {
	text: string;
	vocabulary?: VocabularyDefinition;
}

function extractJsonPayload(text: string): string | null {
	const fenced = text.match(/```json\s*([\s\S]*?)```/i) ?? text.match(/```([\s\S]*?)```/i);
	if (fenced?.[1]) {
		return fenced[1].trim();
	}
	const brace = text.match(/\{[\s\S]*\}/);
	return brace ? brace[0] : null;
}

function buildDefinitionDisplay(definition: {
	word: string;
	definition: string;
	etymology?: string;
	sourceLabel?: string;
}): string {
	const lines = [`**${definition.word}**`, definition.definition];
	if (definition.etymology) {
		lines.push(`_Etymology:_ ${definition.etymology}`);
	}
	if (definition.sourceLabel) {
		lines.push(`_Source:_ ${definition.sourceLabel}`);
	}
	return lines.join('\n\n');
}

function parseDefinitionResponse(
	responseText: string,
	fallbackWord: string
): VocabularyDefinition | null {
	const payload = extractJsonPayload(responseText);
	if (!payload) {
		return null;
	}
	try {
		const parsed = JSON.parse(payload) as {
			word?: string;
			definition?: string;
			etymology?: string;
		};
		const word = typeof parsed.word === 'string' && parsed.word.trim()
			? parsed.word.trim()
			: fallbackWord;
		const definition = typeof parsed.definition === 'string' ? parsed.definition.trim() : '';
		if (!definition) {
			return null;
		}
		const etymology = typeof parsed.etymology === 'string' ? parsed.etymology.trim() : undefined;
		return {
			word,
			definition,
			etymology,
			display: buildDefinitionDisplay({ word, definition, etymology })
		};
	} catch {
		return null;
	}
}

/**
 * Stream from Anthropic API using shared SSE utility.
 */
async function streamAnthropicHighlight(
	apiKey: string,
	body: Record<string, unknown>,
	onToken?: (delta: string) => void
): Promise<string> {
	return streamSSE(
		{
			url: API_URL,
			provider: 'Anthropic',
			headers: {
				'x-api-key': apiKey,
				'anthropic-version': ANTHROPIC_VERSION,
				'anthropic-beta': PROMPT_CACHE_BETA
			},
			body
		},
		anthropicExtractor,
		{ onText: onToken }
	);
}

export async function streamHighlightAction(params: HighlightParams): Promise<HighlightActionResult> {
	if (params.action === 'define') {
		try {
			const dictionary = await lookupDictionaryDefinition(params.selection.selectedText);
			if (dictionary) {
				const display = buildDefinitionDisplay({
					word: dictionary.word,
					definition: dictionary.definition,
					sourceLabel: "Webster's 1913"
				});
				return {
					text: display,
					vocabulary: {
						word: dictionary.word,
						definition: dictionary.definition,
						display
					}
				};
			}
		} catch {
			// Fall back to AI definitions if dictionary load fails.
		}
	}

	const prompt = buildHighlightPrompt({
		bookTitle: params.selection.bookTitle,
		author: params.selection.author,
		chapterTitle: params.selection.chapterTitle,
		action: params.action,
		selectedText: params.selection.selectedText,
		context: params.selection.context,
		customSystemPrompt: params.systemPrompt
	});
	const promptUser =
		params.action === 'define'
			? `${prompt.user}\n\nReturn JSON only with fields: word, definition, etymology (optional).`
			: prompt.user;

	const [anthropicApiKey, openRouterApiKey, openAiApiKey, geminiApiKey] = await Promise.all([
		adapter.getSecureValue(SECURE_STORAGE_KEYS.anthropicApiKey),
		adapter.getSecureValue(SECURE_STORAGE_KEYS.openRouterApiKey),
		adapter.getSecureValue(SECURE_STORAGE_KEYS.openAiApiKey),
		adapter.getSecureValue(SECURE_STORAGE_KEYS.geminiApiKey)
	]);

	let text = '';
	if (params.provider === 'openrouter') {
		text = await streamOpenRouter({
			apiKey: openRouterApiKey ?? '',
			model: params.openRouterModel,
			system: prompt.system,
			user: promptUser,
			onToken: params.onToken
		});
	} else if (params.provider === 'openai') {
		text = await streamOpenAi({
			apiKey: openAiApiKey ?? '',
			model: params.openAiModel,
			system: prompt.system,
			user: promptUser,
			onToken: params.onToken
		});
	} else if (params.provider === 'gemini') {
		text = await streamGemini({
			apiKey: geminiApiKey ?? '',
			model: params.geminiModel,
			system: prompt.system,
			user: promptUser,
			onToken: params.onToken
		});
	} else {
		if (!anthropicApiKey?.trim()) {
			throw new LLMError('Anthropic API key is required.');
		}
		text = await streamAnthropicHighlight(
			anthropicApiKey,
			{
				model: DEFAULT_MODEL,
				max_tokens: DEFAULT_MAX_TOKENS,
				system: prompt.system,
				messages: [
					{
						role: 'user',
						content: [{ type: 'text', text: promptUser }]
					}
				]
			},
			params.onToken
		);
	}

	const trimmed = text.trim();
	if (params.action === 'define') {
		const definition = parseDefinitionResponse(trimmed, params.selection.selectedText.trim());
		if (definition) {
			return { text: definition.display, vocabulary: definition };
		}
	}
	return { text: trimmed };
}
