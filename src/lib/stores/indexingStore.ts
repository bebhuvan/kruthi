/**
 * indexingStore.ts
 *
 * Tracks background indexing state to show progress to users.
 */
import { writable } from 'svelte/store';

export type IndexingState = {
	isIndexing: boolean;
	bookId: string | null;
	bookTitle: string | null;
	progress: number; // 0-100
	stage: 'chunking' | 'embedding' | 'complete' | 'idle';
};

const initialState: IndexingState = {
	isIndexing: false,
	bookId: null,
	bookTitle: null,
	progress: 0,
	stage: 'idle'
};

function createIndexingStore() {
	const { subscribe, set, update } = writable<IndexingState>(initialState);

	return {
		subscribe,
		startIndexing(bookId: string, bookTitle: string) {
			set({
				isIndexing: true,
				bookId,
				bookTitle,
				progress: 0,
				stage: 'chunking'
			});
		},
		setStage(stage: IndexingState['stage'], progress: number = 0) {
			update((state) => ({
				...state,
				stage,
				progress
			}));
		},
		updateProgress(progress: number) {
			update((state) => ({
				...state,
				progress: Math.min(100, Math.max(0, progress))
			}));
		},
		finishIndexing() {
			set({
				isIndexing: false,
				bookId: null,
				bookTitle: null,
				progress: 100,
				stage: 'complete'
			});
			// Reset to idle after a short delay
			setTimeout(() => {
				set(initialState);
			}, 2000);
		},
		reset() {
			set(initialState);
		}
	};
}

export const indexingStore = createIndexingStore();
