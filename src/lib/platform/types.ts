import type { Chunk } from '$lib/types/retrieval';
import type { Highlight } from '$lib/types/highlight';
import type { Settings } from '$lib/types/settings';
import type { ChapterSummary } from '$lib/types/summary';
import type { VocabularyEntry } from '$lib/types/vocabulary';
import type { AnalysisCacheEntry } from '$lib/types/analysis';
import type { ReaderProfile } from '$lib/types/readerProfile';

export interface BookMeta {
	id: string;
	title: string;
	author: string;
	coverPath?: string;
	addedAt: number;
	lastOpenedAt?: number;
}

export interface PickedEpubFile {
	name: string;
	bytes: Uint8Array;
	path?: string;
}

export interface PlatformAdapter {
	// Lifecycle
	init(): Promise<void>;

	// Books
	saveBook(id: string, epub: Uint8Array, meta: BookMeta): Promise<void>;
	loadBookData(id: string): Promise<Uint8Array | null>;
	getBookMeta(id: string): Promise<BookMeta | null>;
	listBooks(): Promise<BookMeta[]>;
	deleteBook(id: string): Promise<void>;

	// Reading positions
	savePosition(bookId: string, chapterIndex: number, scrollY: number): Promise<void>;
	getPosition(bookId: string): Promise<{ chapterIndex: number; scrollY: number } | null>;

	// Chunks (for RAG)
	saveChunks(bookId: string, chunks: Chunk[]): Promise<void>;
	getChunks(bookId: string, chapterId?: string): Promise<Chunk[]>;
	getChunksByIds(chunkIds: string[]): Promise<Chunk[]>;
	deleteChunks(bookId: string): Promise<void>;
	hasChunks(bookId: string): Promise<boolean>;

	// Highlights
	saveHighlight(highlight: Highlight): Promise<void>;
	updateHighlight(id: string, updates: Partial<Highlight>): Promise<void>;
	getHighlights(bookId: string): Promise<Highlight[]>;
	getAllHighlights(): Promise<Highlight[]>;
	deleteHighlight(id: string): Promise<void>;

	// Summaries
	saveSummary(summary: ChapterSummary): Promise<void>;
	getSummary(bookId: string, chapterId: string): Promise<ChapterSummary | null>;

	// Vocabulary
	saveVocabularyEntry(entry: VocabularyEntry): Promise<void>;
	getVocabularyForBook(bookId: string): Promise<VocabularyEntry[]>;
	getAllVocabulary(): Promise<VocabularyEntry[]>;
	deleteVocabularyEntry(id: string): Promise<void>;

	// Analysis cache
	saveAnalysis(entry: AnalysisCacheEntry): Promise<void>;
	getAnalysis(id: string): Promise<AnalysisCacheEntry | null>;

	// Reader profile
	getReaderProfile(): Promise<ReaderProfile | null>;
	saveReaderProfile(profile: ReaderProfile): Promise<void>;

	// Settings
	getSettings(): Promise<Settings | null>;
	saveSettings(settings: Settings): Promise<void>;

	// Secure storage (API keys)
	getSecureValue(key: string): Promise<string | null>;
	setSecureValue(key: string, value: string): Promise<void>;
	deleteSecureValue(key: string): Promise<void>;

	// Desktop helpers (optional on web)
	pickEpubFile(): Promise<PickedEpubFile | null>;
	readEpubFile(path: string): Promise<PickedEpubFile | null>;
}
