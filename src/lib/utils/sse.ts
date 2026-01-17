/**
 * sse.ts
 *
 * Shared Server-Sent Events (SSE) streaming utilities.
 * Eliminates code duplication across LLM provider implementations.
 */

import { fetchWithRetry, type RetryOptions } from './retry';
import { LLMError } from '$lib/types/errors';

export interface SSEStreamOptions {
	/** Called for each text delta received */
	onText?: (delta: string) => void;
	/** Retry options for the fetch request */
	retry?: RetryOptions;
}

export interface SSERequestConfig {
	url: string;
	headers: Record<string, string>;
	body: Record<string, unknown>;
	/** Provider name for error messages */
	provider: string;
}

/**
 * Extract text content from an SSE payload based on provider format.
 */
export type PayloadExtractor = (payload: Record<string, unknown>) => string | null;

/**
 * OpenAI/OpenRouter format extractor
 * Payload: { choices: [{ delta: { content: "text" } }] }
 */
export const openAiExtractor: PayloadExtractor = (payload) => {
	const choices = payload.choices as Array<{ delta?: { content?: string } }> | undefined;
	return choices?.[0]?.delta?.content ?? null;
};

/**
 * Gemini format extractor
 * Payload: { candidates: [{ content: { parts: [{ text: "text" }] } }] }
 */
export const geminiExtractor: PayloadExtractor = (payload) => {
	const candidates = payload.candidates as Array<{
		content?: { parts?: Array<{ text?: string }> };
	}> | undefined;
	const parts = candidates?.[0]?.content?.parts ?? [];
	const text = parts.map((part) => part.text ?? '').join('');
	return text || null;
};

/**
 * Anthropic format extractor
 * Payload: { type: "content_block_delta", delta: { type: "text", text: "text" } }
 */
export const anthropicExtractor: PayloadExtractor = (payload) => {
	if (payload.type !== 'content_block_delta') {
		return null;
	}
	const delta = payload.delta as { type: string; text?: string } | undefined;
	if (delta?.type === 'text') {
		return delta.text ?? null;
	}
	return null;
};

/**
 * Parse SSE data lines from a chunk of text.
 * Handles both "data: {...}" format and raw JSON lines.
 */
function parseSSELines(chunk: string): string[] {
	const lines = chunk.split('\n');
	const dataLines: string[] = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		if (trimmed.startsWith('data:')) {
			const data = trimmed.replace(/^data:\s*/, '');
			if (data && data !== '[DONE]') {
				dataLines.push(data);
			}
		} else if (trimmed.startsWith('{')) {
			// Some providers send raw JSON without "data:" prefix
			dataLines.push(trimmed);
		}
	}

	return dataLines;
}

/**
 * Stream SSE responses from an LLM provider.
 * Handles buffering, parsing, and text extraction.
 *
 * @returns The complete accumulated text
 */
export async function streamSSE(
	config: SSERequestConfig,
	extractor: PayloadExtractor,
	options: SSEStreamOptions = {}
): Promise<string> {
	const response = await fetchWithRetry(
		config.url,
		{
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				...config.headers
			},
			body: JSON.stringify({ ...config.body, stream: true })
		},
		options.retry
	);

	if (!response.ok) {
		const message = await response.text();
		throw new LLMError(`${config.provider} API error: ${message}`, response.status);
	}

	if (!response.body) {
		throw new LLMError(`${config.provider} API response missing body.`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let fullText = '';

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

		// Process complete SSE events (separated by double newlines)
		let boundary = buffer.indexOf('\n\n');
		while (boundary !== -1) {
			const chunk = buffer.slice(0, boundary);
			buffer = buffer.slice(boundary + 2);

			const dataLines = parseSSELines(chunk);
			for (const data of dataLines) {
				try {
					const payload = JSON.parse(data) as Record<string, unknown>;
					const text = extractor(payload);
					if (text) {
						fullText += text;
						options.onText?.(text);
					}
				} catch {
					// Ignore malformed JSON chunks
				}
			}

			boundary = buffer.indexOf('\n\n');
		}
	}

	return fullText.trim();
}
