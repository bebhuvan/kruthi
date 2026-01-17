/**
 * llmText.ts
 *
 * Shared streaming text generation for non-chat flows (summaries, prompts).
 */
import type { LLMProvider } from '$lib/types/settings';
import { LLMError } from '$lib/types/errors';
import { streamOpenRouter } from '$lib/services/openrouter';
import { streamOpenAi } from '$lib/services/openai';
import { streamGemini } from '$lib/services/gemini';
import { adapter } from '$lib/platform';
import { SECURE_STORAGE_KEYS } from '$lib/config/constants';

const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const PROMPT_CACHE_BETA = 'prompt-caching-2024-07-31';
const DEFAULT_MODEL = 'claude-3-5-sonnet-20240620';
const DEFAULT_THINKING_BUDGET = 8000;

interface StreamHandlers {
	onText?: (delta: string) => void;
}

export interface LlmTextRequest {
	provider: LLMProvider;
	openRouterModel: string;
	openAiModel: string;
	geminiModel: string;
	system: string;
	user: string;
	maxTokens: number;
	useExtendedThinking?: boolean;
	thinkingBudget?: number;
	onToken?: (delta: string) => void;
}

async function streamAnthropic(
	apiKey: string,
	body: Record<string, unknown>,
	handlers: StreamHandlers
): Promise<string> {
	const response = await fetch(API_URL, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': ANTHROPIC_VERSION,
			'anthropic-beta': PROMPT_CACHE_BETA
		},
		body: JSON.stringify({ ...body, stream: true })
	});

	if (!response.ok) {
		const message = await response.text();
		throw new LLMError(`Anthropic API error: ${message}`, response.status);
	}

	if (!response.body) {
		throw new LLMError('Anthropic API response missing body.');
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let fullText = '';

	const handlePayload = (payload: Record<string, unknown>) => {
		if (payload.type === 'content_block_delta') {
			const delta = payload.delta as { type: 'text'; text: string } | undefined;
			if (delta?.type === 'text') {
				fullText += delta.text;
				handlers.onText?.(delta.text);
			}
		}
	};

	while (true) {
		const { value, done } = await reader.read();
		if (done) {
			break;
		}
		buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
		let boundary = buffer.indexOf('\n\n');
		while (boundary !== -1) {
			const chunk = buffer.slice(0, boundary);
			buffer = buffer.slice(boundary + 2);
			const lines = chunk.split('\n');
			const data = lines
				.filter((line) => line.startsWith('data:'))
				.map((line) => line.replace(/^data:\s*/, ''))
				.join('\n');
			if (!data || data === '[DONE]') {
				boundary = buffer.indexOf('\n\n');
				continue;
			}
			try {
				const payload = JSON.parse(data) as Record<string, unknown>;
				handlePayload(payload);
			} catch {
				// Ignore malformed chunks from the stream.
			}
			boundary = buffer.indexOf('\n\n');
		}
	}

	return fullText.trim();
}

export async function streamLlmText(params: LlmTextRequest): Promise<string> {
	const [anthropicApiKey, openRouterApiKey, openAiApiKey, geminiApiKey] = await Promise.all([
		adapter.getSecureValue(SECURE_STORAGE_KEYS.anthropicApiKey),
		adapter.getSecureValue(SECURE_STORAGE_KEYS.openRouterApiKey),
		adapter.getSecureValue(SECURE_STORAGE_KEYS.openAiApiKey),
		adapter.getSecureValue(SECURE_STORAGE_KEYS.geminiApiKey)
	]);

	if (params.provider === 'openrouter') {
		return await streamOpenRouter({
			apiKey: openRouterApiKey ?? '',
			model: params.openRouterModel,
			system: params.system,
			user: params.user,
			onToken: params.onToken
		});
	}

	if (params.provider === 'openai') {
		return await streamOpenAi({
			apiKey: openAiApiKey ?? '',
			model: params.openAiModel,
			system: params.system,
			user: params.user,
			onToken: params.onToken
		});
	}

	if (params.provider === 'gemini') {
		return await streamGemini({
			apiKey: geminiApiKey ?? '',
			model: params.geminiModel,
			system: params.system,
			user: params.user,
			onToken: params.onToken
		});
	}

	if (!anthropicApiKey?.trim()) {
		throw new LLMError('Anthropic API key is required.');
	}

	return await streamAnthropic(
		anthropicApiKey,
		{
			model: DEFAULT_MODEL,
			max_tokens: params.maxTokens,
			system: params.system,
			messages: [
				{
					role: 'user',
					content: [{ type: 'text', text: params.user }]
				}
			],
			...(params.useExtendedThinking
				? {
						thinking: {
							type: 'enabled',
							budget_tokens: Math.max(
								1000,
								params.thinkingBudget ?? DEFAULT_THINKING_BUDGET
							)
						}
				  }
				: {})
		},
		{ onText: params.onToken }
	);
}
