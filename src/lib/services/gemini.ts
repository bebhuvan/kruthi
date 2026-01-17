/**
 * gemini.ts
 *
 * Gemini streaming generate content helper.
 */
import { LLMError } from '$lib/types/errors';
import { streamSSE, geminiExtractor } from '$lib/utils/sse';

interface GeminiParams {
	apiKey: string;
	model: string;
	system: string;
	user: string;
	/** Conversation history for multi-turn chat */
	history?: Array<{ role: 'user' | 'assistant'; content: string }>;
	onToken?: (delta: string) => void;
}

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Build Gemini contents array with proper role structure.
 * Gemini uses 'user' and 'model' roles (not 'assistant').
 */
function buildContents(
	system: string,
	history: Array<{ role: 'user' | 'assistant'; content: string }> | undefined,
	user: string
): Array<{ role: string; parts: Array<{ text: string }> }> {
	const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

	// Add system instruction as first user message if present
	// (Gemini doesn't have a dedicated system role in basic API)
	if (system.trim()) {
		contents.push({
			role: 'user',
			parts: [{ text: `[System Instructions]\n${system}\n\n[End Instructions]` }]
		});
		contents.push({
			role: 'model',
			parts: [{ text: 'I understand. I will follow these instructions.' }]
		});
	}

	// Add conversation history with proper role mapping
	if (history) {
		for (const msg of history) {
			contents.push({
				role: msg.role === 'assistant' ? 'model' : 'user',
				parts: [{ text: msg.content }]
			});
		}
	}

	// Add current user message
	contents.push({
		role: 'user',
		parts: [{ text: user }]
	});

	return contents;
}

export async function streamGemini(params: GeminiParams): Promise<string> {
	if (!params.apiKey.trim()) {
		throw new LLMError('Gemini API key is required.');
	}
	if (!params.model.trim()) {
		throw new LLMError('Gemini model is required.');
	}

	const url = `${API_BASE}/${params.model}:streamGenerateContent?alt=sse&key=${params.apiKey}`;
	const contents = buildContents(params.system, params.history, params.user);

	return streamSSE(
		{
			url,
			provider: 'Gemini',
			headers: {},
			body: { contents }
		},
		geminiExtractor,
		{ onText: params.onToken }
	);
}
