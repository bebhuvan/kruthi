/**
 * openai.ts
 *
 * OpenAI streaming chat completions helper.
 */
import { LLMError } from '$lib/types/errors';
import { streamSSE, openAiExtractor } from '$lib/utils/sse';

const API_URL = 'https://api.openai.com/v1/chat/completions';

interface OpenAiParams {
	apiKey: string;
	model: string;
	system: string;
	history?: Array<{ role: 'user' | 'assistant'; content: string }>;
	user: string;
	onToken?: (delta: string) => void;
}

export async function streamOpenAi(params: OpenAiParams): Promise<string> {
	if (!params.apiKey.trim()) {
		throw new LLMError('OpenAI API key is required.');
	}
	if (!params.model.trim()) {
		throw new LLMError('OpenAI model is required.');
	}

	return streamSSE(
		{
			url: API_URL,
			provider: 'OpenAI',
			headers: {
				authorization: `Bearer ${params.apiKey}`
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
