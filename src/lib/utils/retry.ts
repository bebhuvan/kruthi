/**
 * retry.ts
 *
 * Utility for retrying async operations with exponential backoff.
 */

export interface RetryOptions {
	/** Maximum number of attempts (default: 3) */
	maxAttempts?: number;
	/** Initial delay in ms (default: 1000) */
	initialDelayMs?: number;
	/** Maximum delay in ms (default: 10000) */
	maxDelayMs?: number;
	/** Multiplier for exponential backoff (default: 2) */
	backoffMultiplier?: number;
	/** Whether to retry on this error (default: retry on network errors and 5xx) */
	shouldRetry?: (error: unknown) => boolean;
	/** Called before each retry attempt */
	onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'shouldRetry'>> = {
	maxAttempts: 3,
	initialDelayMs: 1000,
	maxDelayMs: 10000,
	backoffMultiplier: 2
};

/**
 * Default retry condition: retry on network errors and 5xx status codes.
 * Don't retry on 4xx (client errors like invalid API key).
 */
function defaultShouldRetry(error: unknown): boolean {
	// Network errors (fetch failed)
	if (error instanceof TypeError && error.message.includes('fetch')) {
		return true;
	}

	// Check for status code in error
	if (error && typeof error === 'object') {
		const statusCode = (error as { status?: number }).status;
		// Retry on 5xx server errors, 429 rate limit
		if (statusCode && (statusCode >= 500 || statusCode === 429)) {
			return true;
		}
	}

	return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async function with retry and exponential backoff.
 *
 * @example
 * const result = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxAttempts: 3 }
 * );
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const {
		maxAttempts = DEFAULT_OPTIONS.maxAttempts,
		initialDelayMs = DEFAULT_OPTIONS.initialDelayMs,
		maxDelayMs = DEFAULT_OPTIONS.maxDelayMs,
		backoffMultiplier = DEFAULT_OPTIONS.backoffMultiplier,
		shouldRetry = defaultShouldRetry,
		onRetry
	} = options;

	let lastError: unknown;
	let delayMs = initialDelayMs;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			// Don't retry if we've exhausted attempts
			if (attempt >= maxAttempts) {
				break;
			}

			// Don't retry if error is not retryable
			if (!shouldRetry(error)) {
				break;
			}

			// Notify about retry
			onRetry?.(attempt, error, delayMs);

			// Wait before retrying
			await sleep(delayMs);

			// Increase delay for next attempt (with jitter)
			const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15
			delayMs = Math.min(delayMs * backoffMultiplier * jitter, maxDelayMs);
		}
	}

	throw lastError;
}

/**
 * Wrap a fetch call with retry logic.
 * Automatically checks response.ok and retries on 5xx errors.
 */
export async function fetchWithRetry(
	input: RequestInfo | URL,
	init?: RequestInit,
	options: RetryOptions = {}
): Promise<Response> {
	return withRetry(async () => {
		const response = await fetch(input, init);

		// Throw on 5xx so we can retry
		if (response.status >= 500) {
			const error = new Error(`Server error: ${response.status}`);
			(error as Error & { status: number }).status = response.status;
			throw error;
		}

		// Throw on rate limit so we can retry
		if (response.status === 429) {
			const error = new Error('Rate limited');
			(error as Error & { status: number }).status = 429;
			throw error;
		}

		return response;
	}, options);
}
