import { writable } from 'svelte/store';
import type { Book } from '$lib/types/book';
import { parseEpub } from '$lib/services/epub';
import { indexBook } from '$lib/services/retrieval';
import { adapter, type BookMeta } from '$lib/platform';

type LoadingState = {
	status: 'loading';
	book: null;
	error: null;
	progress: number;
	stage: 'reading' | 'toc' | 'rendering' | 'finalizing';
	chapterIndex?: number;
	totalChapters?: number;
};

type BookState =
	| { status: 'idle'; book: null; error: null }
	| LoadingState
	| { status: 'ready'; book: Book; error: null }
	| { status: 'error'; book: null; error: Error };

function isEpubFileName(name: string): boolean {
	return name.toLowerCase().endsWith('.epub');
}

const INDEXING_IDLE_TIMEOUT_MS = 5000;
const INDEXING_FALLBACK_DELAY_MS = 2000;

function scheduleIndexing(book: Book): void {
	const run = () => {
		void indexBook(book, { generateEmbeddings: false }).catch((error) => {
			console.error('Failed to index book for retrieval:', error);
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

function createBookStore() {
	const { subscribe, set, update } = writable<BookState>({
		status: 'idle',
		book: null,
		error: null
	});

	return {
		subscribe,
		async loadFromFile(file: File) {
			if (!isEpubFileName(file.name)) {
				throw new Error('Please select an EPUB file.');
			}
			update(() => ({ status: 'loading', book: null, error: null, progress: 0, stage: 'reading' }));
			try {
				const id = crypto.randomUUID();
				const parsed = await parseEpub(file, id, {
					onProgress: (progress) =>
						update(() => ({
							status: 'loading',
							book: null,
							error: null,
							...progress
						}))
				});
				const meta: BookMeta = {
					id,
					title: parsed.title,
					author: parsed.author,
					addedAt: Date.now()
				};
				const data = new Uint8Array(await file.arrayBuffer());
				await adapter.saveBook(id, data, meta);
				set({ status: 'ready', book: parsed, error: null });
				// Defer indexing to idle time to avoid blocking initial render
				scheduleIndexing(parsed);
				return parsed;
			} catch (error) {
				const err = error instanceof Error ? error : new Error('Failed to load book');
				set({ status: 'error', book: null, error: err });
				throw err;
			}
		},
		async loadFromBytes(data: Uint8Array, filename: string) {
			if (!isEpubFileName(filename)) {
				throw new Error('Please select an EPUB file.');
			}
			update(() => ({ status: 'loading', book: null, error: null, progress: 0, stage: 'reading' }));
			try {
				const id = crypto.randomUUID();
				const blob = new Blob([data.slice().buffer], { type: 'application/epub+zip' });
				const parsed = await parseEpub(blob, id, {
					onProgress: (progress) =>
						update(() => ({
							status: 'loading',
							book: null,
							error: null,
							...progress
						}))
				});
				const meta: BookMeta = {
					id,
					title: parsed.title,
					author: parsed.author,
					addedAt: Date.now()
				};
				await adapter.saveBook(id, data, meta);
				set({ status: 'ready', book: parsed, error: null });
				// Defer indexing to idle time to avoid blocking initial render
				scheduleIndexing(parsed);
				return parsed;
			} catch (error) {
				const err = error instanceof Error ? error : new Error('Failed to load book');
				set({ status: 'error', book: null, error: err });
				throw err;
			}
		},
		async loadFromId(id: string) {
			update(() => ({ status: 'loading', book: null, error: null, progress: 0, stage: 'reading' }));
			try {
				const data = await adapter.loadBookData(id);
				if (!data) {
					throw new Error('Book not found');
				}
				const blob = new Blob([data.slice().buffer], { type: 'application/epub+zip' });
				const parsed = await parseEpub(blob, id, {
					onProgress: (progress) =>
						update(() => ({
							status: 'loading',
							book: null,
							error: null,
							...progress
						}))
				});
				set({ status: 'ready', book: parsed, error: null });
				// Defer indexing to idle time to avoid blocking initial render
				scheduleIndexing(parsed);
				return parsed;
			} catch (error) {
				const err = error instanceof Error ? error : new Error('Failed to load book');
				set({ status: 'error', book: null, error: err });
				throw err;
			}
		}
	};
}

export const bookStore = createBookStore();
