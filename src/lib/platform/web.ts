/**
 * web.ts
 *
 * Web adapter backed by IndexedDB + localStorage.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Chunk } from '$lib/types/retrieval';
import type { Highlight } from '$lib/types/highlight';
import type { Settings } from '$lib/types/settings';
import type { ChapterSummary } from '$lib/types/summary';
import type { VocabularyEntry } from '$lib/types/vocabulary';
import type { AnalysisCacheEntry } from '$lib/types/analysis';
import type { ReaderProfile } from '$lib/types/readerProfile';
import { STORAGE_KEYS } from '$lib/config/constants';
import type { BookMeta, PlatformAdapter } from '$lib/platform/types';

const STORAGE_DB_NAME = 'reading-companion';
const STORAGE_DB_VERSION = 7;
const SECURE_STORAGE_PREFIX = 'reading-companion-secure';

interface StoredBookRecord {
	id: string;
	title: string;
	author: string;
	file: Blob | Uint8Array | ArrayBuffer;
	addedAt: number;
	lastOpenedAt?: number;
}

interface ReadingPositionRecord {
	bookId: string;
	scrollY: number;
	chapterIndex: number;
	updatedAt: number;
}

interface SummaryRecord extends ChapterSummary {
	bookId: string;
	chapterId: string;
}

interface VocabularyRecord extends VocabularyEntry {
	bookId: string;
}

type AnalysisRecord = AnalysisCacheEntry;

interface ReaderProfileRecord extends ReaderProfile {
	id: string;
}

interface ReadingCompanionDB extends DBSchema {
	books: {
		key: string;
		value: StoredBookRecord;
	};
	positions: {
		key: string;
		value: ReadingPositionRecord;
	};
	chunks: {
		key: string;
		value: Chunk;
		indexes: {
			'by-book': string;
			'by-book-chapter': string;
		};
	};
	highlights: {
		key: string;
		value: Highlight;
		indexes: {
			'by-book': string;
			'by-book-chapter': string;
		};
	};
	summaries: {
		key: string;
		value: SummaryRecord;
		indexes: {
			'by-book': string;
		};
	};
	vocabulary: {
		key: string;
		value: VocabularyRecord;
		indexes: {
			'by-book': string;
		};
	};
	analysis_cache: {
		key: string;
		value: AnalysisRecord;
		indexes: {
			'by-book': string;
		};
	};
	reader_profile: {
		key: string;
		value: ReaderProfileRecord;
	};
}

let dbPromise: Promise<IDBPDatabase<ReadingCompanionDB>> | null = null;

function isIndexedDbAvailable(): boolean {
	return typeof indexedDB !== 'undefined';
}

function getDB(): Promise<IDBPDatabase<ReadingCompanionDB>> {
	if (!isIndexedDbAvailable()) {
		return Promise.reject(new Error('IndexedDB is not available'));
	}

	if (!dbPromise) {
		dbPromise = openDB<ReadingCompanionDB>(STORAGE_DB_NAME, STORAGE_DB_VERSION, {
			upgrade(db) {
				if (!db.objectStoreNames.contains('books')) {
					db.createObjectStore('books', { keyPath: 'id' });
				}
				if (!db.objectStoreNames.contains('positions')) {
					db.createObjectStore('positions', { keyPath: 'bookId' });
				}
				if (!db.objectStoreNames.contains('chunks')) {
					const store = db.createObjectStore('chunks', { keyPath: 'id' });
					store.createIndex('by-book', 'bookId');
					store.createIndex('by-book-chapter', 'bookChapter');
				}
				if (!db.objectStoreNames.contains('highlights')) {
					const store = db.createObjectStore('highlights', { keyPath: 'id' });
					store.createIndex('by-book', 'bookId');
					store.createIndex('by-book-chapter', 'bookChapter');
				}
				if (!db.objectStoreNames.contains('summaries')) {
					const store = db.createObjectStore('summaries', { keyPath: 'id' });
					store.createIndex('by-book', 'bookId');
				}
				if (!db.objectStoreNames.contains('vocabulary')) {
					const store = db.createObjectStore('vocabulary', { keyPath: 'id' });
					store.createIndex('by-book', 'bookId');
				}
				if (!db.objectStoreNames.contains('analysis_cache')) {
					const store = db.createObjectStore('analysis_cache', { keyPath: 'id' });
					store.createIndex('by-book', 'bookId');
				}
				if (!db.objectStoreNames.contains('reader_profile')) {
					db.createObjectStore('reader_profile', { keyPath: 'id' });
				}
			}
		});
	}

	return dbPromise;
}

function normalizeBookMeta(record: StoredBookRecord): BookMeta {
	return {
		id: record.id,
		title: record.title,
		author: record.author,
		addedAt: record.addedAt,
		lastOpenedAt: record.lastOpenedAt
	};
}

function toUint8Array(data: Blob | Uint8Array | ArrayBuffer): Promise<Uint8Array> {
	if (data instanceof Uint8Array) {
		return Promise.resolve(data);
	}
	if (data instanceof ArrayBuffer) {
		return Promise.resolve(new Uint8Array(data));
	}
	return data.arrayBuffer().then((buffer) => new Uint8Array(buffer));
}

async function deleteByIndex(
	db: IDBPDatabase<ReadingCompanionDB>,
	storeName: 'chunks' | 'highlights' | 'summaries' | 'vocabulary' | 'analysis_cache',
	indexName: 'by-book',
	key: string
): Promise<void> {
	const tx = db.transaction(storeName, 'readwrite');
	const index = tx.store.index(indexName);
	for await (const cursor of index.iterate(key)) {
		cursor.delete();
	}
	await tx.done;
}

function readLocalStorage(key: string): string | null {
	if (typeof window === 'undefined') {
		return null;
	}
	return window.localStorage.getItem(key);
}

function writeLocalStorage(key: string, value: string): void {
	if (typeof window === 'undefined') {
		return;
	}
	window.localStorage.setItem(key, value);
}

function deleteLocalStorage(key: string): void {
	if (typeof window === 'undefined') {
		return;
	}
	window.localStorage.removeItem(key);
}

export class WebAdapter implements PlatformAdapter {
	async init(): Promise<void> {
		if (!isIndexedDbAvailable()) {
			return;
		}
		await getDB();
	}

	async saveBook(id: string, epub: Uint8Array, meta: BookMeta): Promise<void> {
		if (!isIndexedDbAvailable()) {
			throw new Error('IndexedDB is not available');
		}
		const db = await getDB();
		const record: StoredBookRecord = {
			id,
			title: meta.title,
			author: meta.author,
			file: epub,
			addedAt: meta.addedAt,
			lastOpenedAt: meta.lastOpenedAt
		};
		await db.put('books', record);
	}

	async loadBookData(id: string): Promise<Uint8Array | null> {
		if (!isIndexedDbAvailable()) {
			return null;
		}
		const db = await getDB();
		const record = await db.get('books', id);
		if (!record) {
			return null;
		}
		return toUint8Array(record.file);
	}

	async getBookMeta(id: string): Promise<BookMeta | null> {
		if (!isIndexedDbAvailable()) {
			return null;
		}
		const db = await getDB();
		const record = await db.get('books', id);
		return record ? normalizeBookMeta(record) : null;
	}

	async listBooks(): Promise<BookMeta[]> {
		if (!isIndexedDbAvailable()) {
			return [];
		}
		const db = await getDB();
		const records = await db.getAll('books');
		return records.map(normalizeBookMeta);
	}

	async deleteBook(id: string): Promise<void> {
		if (!isIndexedDbAvailable()) {
			throw new Error('IndexedDB is not available');
		}
		const db = await getDB();
		await db.delete('books', id);
		await db.delete('positions', id);
		await deleteByIndex(db, 'highlights', 'by-book', id);
		await deleteByIndex(db, 'chunks', 'by-book', id);
		await deleteByIndex(db, 'summaries', 'by-book', id);
		await deleteByIndex(db, 'vocabulary', 'by-book', id);
		await deleteByIndex(db, 'analysis_cache', 'by-book', id);
	}

	async savePosition(bookId: string, chapterIndex: number, scrollY: number): Promise<void> {
		if (!isIndexedDbAvailable()) {
			throw new Error('IndexedDB is not available');
		}
		const db = await getDB();
		await db.put('positions', {
			bookId,
			chapterIndex,
			scrollY,
			updatedAt: Date.now()
		});
	}

	async getPosition(bookId: string): Promise<{ chapterIndex: number; scrollY: number } | null> {
		if (!isIndexedDbAvailable()) {
			return null;
		}
		const db = await getDB();
		const record = await db.get('positions', bookId);
		if (!record) {
			return null;
		}
		return { chapterIndex: record.chapterIndex, scrollY: record.scrollY };
	}

	async saveChunks(_bookId: string, chunks: Chunk[]): Promise<void> {
		if (!isIndexedDbAvailable()) {
			throw new Error('IndexedDB is not available');
		}
		const db = await getDB();
		const BATCH_SIZE = 50;
		// Write chunks in batches to avoid blocking the main thread
		for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
			const batch = chunks.slice(i, i + BATCH_SIZE);
			const tx = db.transaction('chunks', 'readwrite');
			for (const chunk of batch) {
				await tx.store.put(chunk);
			}
			await tx.done;
			// Yield between batches to let the UI breathe
			if (i + BATCH_SIZE < chunks.length) {
				await new Promise((resolve) => setTimeout(resolve, 0));
			}
		}
	}

	async getChunks(bookId: string, chapterId?: string): Promise<Chunk[]> {
		if (!isIndexedDbAvailable()) {
			return [];
		}
		const db = await getDB();
		if (chapterId) {
			return await db.getAllFromIndex('chunks', 'by-book-chapter', `${bookId}:${chapterId}`);
		}
		return await db.getAllFromIndex('chunks', 'by-book', bookId);
	}

	async getChunksByIds(chunkIds: string[]): Promise<Chunk[]> {
		if (!isIndexedDbAvailable()) {
			return [];
		}
		const db = await getDB();
		const chunks = await Promise.all(chunkIds.map((id) => db.get('chunks', id)));
		return chunks.filter((chunk): chunk is Chunk => Boolean(chunk));
	}

	async deleteChunks(bookId: string): Promise<void> {
		if (!isIndexedDbAvailable()) {
			throw new Error('IndexedDB is not available');
		}
		const db = await getDB();
		await deleteByIndex(db, 'chunks', 'by-book', bookId);
	}

	async hasChunks(bookId: string): Promise<boolean> {
		if (!isIndexedDbAvailable()) {
			return false;
		}
		const db = await getDB();
		const count = await db.countFromIndex('chunks', 'by-book', bookId);
		return count > 0;
	}

	async saveHighlight(highlight: Highlight): Promise<void> {
		if (!isIndexedDbAvailable()) {
			throw new Error('IndexedDB is not available');
		}
		const db = await getDB();
		await db.put('highlights', highlight);
	}

	async updateHighlight(id: string, updates: Partial<Highlight>): Promise<void> {
		if (!isIndexedDbAvailable()) {
			throw new Error('IndexedDB is not available');
		}
		const db = await getDB();
		const existing = await db.get('highlights', id);
		if (!existing) {
			return;
		}
		await db.put('highlights', { ...existing, ...updates });
	}

	async getHighlights(bookId: string): Promise<Highlight[]> {
		if (!isIndexedDbAvailable()) {
			return [];
		}
		const db = await getDB();
		return await db.getAllFromIndex('highlights', 'by-book', bookId);
	}

	async getAllHighlights(): Promise<Highlight[]> {
		if (!isIndexedDbAvailable()) {
			return [];
		}
		const db = await getDB();
		return await db.getAll('highlights');
	}

	async deleteHighlight(id: string): Promise<void> {
		if (!isIndexedDbAvailable()) {
			throw new Error('IndexedDB is not available');
		}
		const db = await getDB();
		await db.delete('highlights', id);
	}

	async saveSummary(summary: ChapterSummary): Promise<void> {
		if (!isIndexedDbAvailable()) {
			throw new Error('IndexedDB is not available');
		}
		const db = await getDB();
		await db.put('summaries', summary);
	}

	async getSummary(bookId: string, chapterId: string): Promise<ChapterSummary | null> {
		if (!isIndexedDbAvailable()) {
			return null;
		}
		const db = await getDB();
		const id = `${bookId}:${chapterId}`;
		const record = await db.get('summaries', id);
		return record ?? null;
	}

	async saveVocabularyEntry(entry: VocabularyEntry): Promise<void> {
		if (!isIndexedDbAvailable()) {
			throw new Error('IndexedDB is not available');
		}
		const db = await getDB();
		await db.put('vocabulary', entry);
	}

	async getVocabularyForBook(bookId: string): Promise<VocabularyEntry[]> {
		if (!isIndexedDbAvailable()) {
			return [];
		}
		const db = await getDB();
		return await db.getAllFromIndex('vocabulary', 'by-book', bookId);
	}

	async getAllVocabulary(): Promise<VocabularyEntry[]> {
		if (!isIndexedDbAvailable()) {
			return [];
		}
		const db = await getDB();
		return await db.getAll('vocabulary');
	}

	async deleteVocabularyEntry(id: string): Promise<void> {
		if (!isIndexedDbAvailable()) {
			throw new Error('IndexedDB is not available');
		}
		const db = await getDB();
		await db.delete('vocabulary', id);
	}

	async saveAnalysis(entry: AnalysisCacheEntry): Promise<void> {
		if (!isIndexedDbAvailable()) {
			throw new Error('IndexedDB is not available');
		}
		const db = await getDB();
		await db.put('analysis_cache', entry);
	}

	async getAnalysis(id: string): Promise<AnalysisCacheEntry | null> {
		if (!isIndexedDbAvailable()) {
			return null;
		}
		const db = await getDB();
		const record = await db.get('analysis_cache', id);
		return record ?? null;
	}

	async getReaderProfile(): Promise<ReaderProfile | null> {
		if (!isIndexedDbAvailable()) {
			return null;
		}
		const db = await getDB();
		const record = await db.get('reader_profile', 'local');
		return record ?? null;
	}

	async saveReaderProfile(profile: ReaderProfile): Promise<void> {
		if (!isIndexedDbAvailable()) {
			throw new Error('IndexedDB is not available');
		}
		const db = await getDB();
		await db.put('reader_profile', profile);
	}

	async getSettings(): Promise<Settings | null> {
		const raw = readLocalStorage(STORAGE_KEYS.settings);
		if (!raw) {
			return null;
		}
		try {
			return JSON.parse(raw) as Settings;
		} catch {
			return null;
		}
	}

	async saveSettings(settings: Settings): Promise<void> {
		writeLocalStorage(STORAGE_KEYS.settings, JSON.stringify(settings));
	}

	async getSecureValue(key: string): Promise<string | null> {
		const secureKey = `${SECURE_STORAGE_PREFIX}:${key}`;
		const value = readLocalStorage(secureKey);
		if (value !== null) {
			return value;
		}
		const settings = await this.getSettings();
		if (settings && key in settings) {
			const candidate = (settings as unknown as Record<string, unknown>)[key];
			return typeof candidate === 'string' ? candidate : null;
		}
		return null;
	}

	async setSecureValue(key: string, value: string): Promise<void> {
		const secureKey = `${SECURE_STORAGE_PREFIX}:${key}`;
		writeLocalStorage(secureKey, value);
	}

	async deleteSecureValue(key: string): Promise<void> {
		const secureKey = `${SECURE_STORAGE_PREFIX}:${key}`;
		deleteLocalStorage(secureKey);
	}

	async pickEpubFile(): Promise<null> {
		return null;
	}

	async readEpubFile(_path: string): Promise<null> {
		return null;
	}
}
