/**
 * curatedDownload.ts
 *
 * Service for downloading curated classics from Standard Ebooks and Project Gutenberg.
 * Downloads EPUBs on-demand and stores them via the platform adapter.
 */
import type { CuratedBook } from '$lib/data/curatedBooks';
import { adapter, type BookMeta } from '$lib/platform';
import { parseEpub } from '$lib/services/epub';
import { indexBook } from '$lib/services/retrieval';
import type { Book } from '$lib/types/book';

export type DownloadStatus =
	| { state: 'idle' }
	| { state: 'downloading'; progress: number }
	| { state: 'processing' }
	| { state: 'complete'; bookId: string }
	| { state: 'error'; message: string };

export type DownloadCallback = (status: DownloadStatus) => void;

const INDEXING_IDLE_TIMEOUT_MS = 5000;
const INDEXING_FALLBACK_DELAY_MS = 2000;

function scheduleIndexing(book: Book): void {
	const run = () => {
		void indexBook(book, { generateEmbeddings: false }).catch((error) => {
			console.error('Failed to index curated book for retrieval:', error);
		});
	};
	if (typeof window === 'undefined') {
		setTimeout(run, INDEXING_FALLBACK_DELAY_MS);
		return;
	}
	const idle = (window as Window & {
		requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
	}).requestIdleCallback;
	if (idle) {
		idle(() => run(), { timeout: INDEXING_IDLE_TIMEOUT_MS });
	} else {
		setTimeout(run, INDEXING_FALLBACK_DELAY_MS);
	}
}

// Use a CORS proxy for downloading EPUBs
// Standard Ebooks and Gutenberg have CORS restrictions on direct downloads
const CORS_PROXIES = [
	'https://api.allorigins.win/raw?url=',
	'https://corsproxy.io/?',
	'https://api.codetabs.com/v1/proxy?quest='
];

/**
 * Generate a deterministic book ID from the curated book
 * This ensures the same book always has the same ID
 */
export function getCuratedBookId(book: CuratedBook): string {
	return `curated-${book.id}`;
}

/**
 * Check if a curated book is already downloaded
 */
export async function isCuratedBookDownloaded(book: CuratedBook): Promise<boolean> {
	const bookId = getCuratedBookId(book);
	const stored = await adapter.getBookMeta(bookId);
	return stored !== null;
}

/**
 * Check if running in a native environment (Tauri/Capacitor)
 */
function isNativeEnvironment(): boolean {
	return !!(
		(typeof window !== 'undefined' && (
			(window as unknown as { __TAURI__?: unknown }).__TAURI__ ||
			(window as unknown as { Capacitor?: unknown }).Capacitor
		)) ||
		import.meta.env.TAURI ||
		import.meta.env.CAPACITOR
	);
}

/**
 * Normalize download URL for direct file access
 * Standard Ebooks requires ?source=download to return actual EPUB files
 */
function normalizeDownloadUrl(url: string): string {
	if (url.includes('standardebooks.org') && !url.includes('source=download')) {
		return url + (url.includes('?') ? '&' : '?') + 'source=download';
	}
	return url;
}

/**
 * Try fetching with different CORS proxies (web) or direct fetch (native)
 */
async function fetchWithProxy(url: string, onProgress?: (progress: number) => void): Promise<Blob> {
	let lastError: Error | null = null;

	// Normalize URL for direct file access
	const normalizedUrl = normalizeDownloadUrl(url);

	// Native apps don't need CORS proxies
	if (isNativeEnvironment()) {
		console.log('[Download] Native environment detected, fetching directly...');
		try {
			return await fetchWithProgress(normalizedUrl, onProgress);
		} catch (e) {
			console.error('[Download] Native fetch failed:', e);
			throw e;
		}
	}

	// First try direct fetch (in case server allows CORS)
	try {
		const blob = await fetchWithProgress(normalizedUrl, onProgress);
		return blob;
	} catch (e) {
		console.log('Direct fetch failed, trying proxies...');
	}

	// Try each proxy
	for (const proxy of CORS_PROXIES) {
		try {
			const proxyUrl = proxy + encodeURIComponent(normalizedUrl);
			const blob = await fetchWithProgress(proxyUrl, onProgress);
			return blob;
		} catch (e) {
			lastError = e instanceof Error ? e : new Error('Fetch failed');
			console.log(`Proxy ${proxy} failed, trying next...`);
		}
	}

	throw lastError || new Error('All download methods failed');
}

/**
 * Fetch with progress tracking and timeout
 */
async function fetchWithProgress(url: string, onProgress?: (progress: number) => void): Promise<Blob> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

	console.log('[Download] Fetching:', url);

	try {
		const response = await fetch(url, {
			signal: controller.signal,
			mode: 'cors',
			credentials: 'omit'
		});

		console.log('[Download] Response status:', response.status);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const contentLength = response.headers.get('content-length');
		const total = contentLength ? parseInt(contentLength, 10) : 0;

		if (!response.body) {
			clearTimeout(timeoutId);
			return await response.blob();
		}

		const reader = response.body.getReader();
	const chunks: ArrayBuffer[] = [];
		let received = 0;

		while (true) {
			const { done, value } = await reader.read();

			if (done) break;

		chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
			received += value.length;

			if (total && onProgress) {
				onProgress(Math.round((received / total) * 100));
			}
		}

		clearTimeout(timeoutId);
		return new Blob(chunks, { type: 'application/epub+zip' });
	} finally {
		clearTimeout(timeoutId);
	}
}

/**
 * Download and save a curated book
 */
export async function downloadCuratedBook(
	book: CuratedBook,
	callback?: DownloadCallback
): Promise<string> {
	const bookId = getCuratedBookId(book);

	try {
		// Check if already downloaded
		const existing = await adapter.getBookMeta(bookId);
		if (existing) {
			callback?.({ state: 'complete', bookId });
			return bookId;
		}

		callback?.({ state: 'downloading', progress: 0 });

		// Download the EPUB
		const blob = await fetchWithProxy(book.source.epubUrl, (progress) => {
			callback?.({ state: 'downloading', progress });
		});

		callback?.({ state: 'processing' });

		// Parse to validate it's a valid EPUB
		const parsed = await parseEpub(blob, bookId);

		// Store in IndexedDB
		const meta: BookMeta = {
			id: bookId,
			title: book.title,
			author: book.author,
			addedAt: Date.now()
		};

		const data = new Uint8Array(await blob.arrayBuffer());
		await adapter.saveBook(bookId, data, meta);

		// Defer indexing to idle time to avoid blocking the UI
		scheduleIndexing(parsed);

		callback?.({ state: 'complete', bookId });
		return bookId;
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Download failed';
		callback?.({ state: 'error', message });
		throw error;
	}
}

/**
 * Get download status for multiple books
 */
export async function getDownloadedStatus(books: CuratedBook[]): Promise<Map<string, boolean>> {
	const status = new Map<string, boolean>();

	for (const book of books) {
		const isDownloaded = await isCuratedBookDownloaded(book);
		status.set(book.id, isDownloaded);
	}

	return status;
}
