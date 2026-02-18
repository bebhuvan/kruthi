import { describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import type { Book } from '$lib/types/book';

const streamAnswerMock = vi.fn(
	(params: { signal?: AbortSignal }) =>
		new Promise((_, reject) => {
			params.signal?.addEventListener('abort', () => {
				reject(new DOMException('Aborted', 'AbortError'));
			});
		})
);

vi.mock('$lib/services/llm', () => ({
	streamAnswer: (params: { signal?: AbortSignal }) => streamAnswerMock(params)
}));

import { chatStore } from '$lib/stores/chatStore';
import { settingsStore } from '$lib/stores/settingsStore';

const TEST_BOOK: Book = {
	id: 'book-cancel',
	title: 'Cancel Test',
	author: 'Test',
	toc: [],
	chapters: [{ id: 'ch-1', title: 'One', href: 'one', html: 'Hello world' }]
};

describe('chatStore cancel', () => {
	it('aborts active stream and resets streaming state', async () => {
		settingsStore.setLlmProvider('anthropic');
		settingsStore.setAnthropicApiKey('test-key');

		const pending = chatStore.sendQuestion({
			book: TEST_BOOK,
			question: 'What is happening?',
			chapterId: 'ch-1'
		});

		await Promise.resolve();
		expect(get(chatStore).isStreaming).toBe(true);
		expect(streamAnswerMock).toHaveBeenCalledTimes(1);

		const [{ signal }] = streamAnswerMock.mock.calls[0] as Array<{ signal?: AbortSignal }>;
		expect(signal?.aborted).toBe(false);

		chatStore.cancel();
		await Promise.resolve();
		await pending;

		expect(signal?.aborted).toBe(true);
		expect(get(chatStore).isStreaming).toBe(false);
	});
});
