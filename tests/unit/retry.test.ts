import { describe, expect, it, vi } from 'vitest';
import { fetchWithRetry } from '$lib/utils/retry';

describe('fetchWithRetry', () => {
	it('retries on transient server errors', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response('bad', { status: 500 }))
			.mockResolvedValueOnce(new Response('ok', { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const response = await fetchWithRetry('https://example.com', undefined, {
			maxAttempts: 2,
			initialDelayMs: 1,
			maxDelayMs: 2
		});

		expect(response.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
