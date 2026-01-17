/**
 * openrouter.ts
 *
 * OpenRouter streaming chat completions helper.
 */
import { LLMError } from '$lib/types/errors';
import { streamSSE, openAiExtractor } from '$lib/utils/sse';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterParams {
	apiKey: string;
	model: string;
	system: string;
	history?: Array<{ role: 'user' | 'assistant'; content: string }>;
	user: string;
	onToken?: (delta: string) => void;
}

function getReferer(): string | undefined {
	if (typeof window === 'undefined') {
		return undefined;
	}
	return window.location.origin;
}

export async function streamOpenRouter(params: OpenRouterParams): Promise<string> {
	if (!params.apiKey.trim()) {
		throw new LLMError('OpenRouter API key is required.');
	}
	if (!params.model.trim()) {
		throw new LLMError('OpenRouter model is required.');
	}

	const referer = getReferer();

	return streamSSE(
		{
			url: API_URL,
			provider: 'OpenRouter',
			headers: {
				authorization: `Bearer ${params.apiKey}`,
				...(referer ? { 'HTTP-Referer': referer } : {}),
				'X-Title': 'Kruthi'
			},
			body: {
				model: params.model,
				messages: [
					{ role: 'system', content: params.system },
					...(params.history ?? []),
					{ role: 'user', content: params.user }
				]
			}
		},
		openAiExtractor,
		{ onText: params.onToken }
	);
}
