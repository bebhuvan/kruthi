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
import { resolveAnthropicModels, resolveOpenRouterModel } from '$lib/services/modelResolver';
import { adapter } from '$lib/platform';
import { SECURE_STORAGE_KEYS } from '$lib/config/constants';
import { streamSSE, anthropicExtractor } from '$lib/utils/sse';

const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const PROMPT_CACHE_BETA = 'prompt-caching-2024-07-31';
const DEFAULT_THINKING_BUDGET = 8000;

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
	signal?: AbortSignal;
}

export async function streamLlmText(params: LlmTextRequest): Promise<string> {
	const [anthropicApiKey, openRouterApiKey, openAiApiKey, geminiApiKey] = await Promise.all([
		adapter.getSecureValue(SECURE_STORAGE_KEYS.anthropicApiKey),
		adapter.getSecureValue(SECURE_STORAGE_KEYS.openRouterApiKey),
		adapter.getSecureValue(SECURE_STORAGE_KEYS.openAiApiKey),
		adapter.getSecureValue(SECURE_STORAGE_KEYS.geminiApiKey)
	]);

	const resolvedOpenRouterModel = await resolveOpenRouterModel(params.openRouterModel);
	const resolvedAnthropicModels = await resolveAnthropicModels(anthropicApiKey ?? '');

	if (params.provider === 'openrouter') {
		return await streamOpenRouter({
			apiKey: openRouterApiKey ?? '',
			model: resolvedOpenRouterModel,
			system: params.system,
			user: params.user,
			onToken: params.onToken,
			signal: params.signal
		});
	}

	if (params.provider === 'openai') {
		return await streamOpenAi({
			apiKey: openAiApiKey ?? '',
			model: params.openAiModel,
			system: params.system,
			user: params.user,
			onToken: params.onToken,
			signal: params.signal
		});
	}

	if (params.provider === 'gemini') {
		return await streamGemini({
			apiKey: geminiApiKey ?? '',
			model: params.geminiModel,
			system: params.system,
			user: params.user,
			onToken: params.onToken,
			signal: params.signal
		});
	}

	if (!anthropicApiKey?.trim()) {
		throw new LLMError('Anthropic API key is required.');
	}

	return await streamSSE(
		{
			url: API_URL,
			provider: 'Anthropic',
			headers: {
				'x-api-key': anthropicApiKey,
				'anthropic-version': ANTHROPIC_VERSION,
				'anthropic-beta': PROMPT_CACHE_BETA
			},
			body: {
				model: params.useExtendedThinking
					? resolvedAnthropicModels.thinking
					: resolvedAnthropicModels.flagship,
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
			}
		},
		anthropicExtractor,
		{ onText: params.onToken, signal: params.signal }
	);
}
