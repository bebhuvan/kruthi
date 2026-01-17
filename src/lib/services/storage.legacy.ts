/**
 * storage.ts
 *
 * IndexedDB storage for books, reading position, and retrieval chunks.
 * Lazy-initialized to avoid SSR issues.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ReadingPosition, StoredBook } from '$lib/types/book';
import type { Highlight } from '$lib/types/highlight';

interface ReadingCompanionDB extends DBSchema {
	books: {
		key: string;
		value: StoredBook;
	};
	positions: {
		key: string;
		value: ReadingPosition;
	};
	chunks: {
		key: string;
		value: unknown;
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
}

export const STORAGE_DB_NAME = 'reading-companion';
export const STORAGE_DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<ReadingCompanionDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ReadingCompanionDB>> {
	if (typeof indexedDB === 'undefined') {
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
			}
		});
	}

	return dbPromise;
}

export async function saveBook(book: StoredBook): Promise<void> {
	const db = await getDB();
	await db.put('books', book);
}

export async function getBook(id: string): Promise<StoredBook | null> {
	const db = await getDB();
	return (await db.get('books', id)) ?? null;
}

export async function getAllBooks(): Promise<StoredBook[]> {
	if (typeof indexedDB === 'undefined') {
		return [];
	}
	const db = await getDB();
	return await db.getAll('books');
}

export async function savePosition(position: ReadingPosition): Promise<void> {
	const db = await getDB();
	await db.put('positions', position);
}

export async function getPosition(bookId: string): Promise<ReadingPosition | null> {
	if (typeof indexedDB === 'undefined') {
		return null;
	}
	const db = await getDB();
	return (await db.get('positions', bookId)) ?? null;
}

export async function deleteBook(bookId: string): Promise<void> {
	const db = await getDB();
	await db.delete('books', bookId);
	await db.delete('positions', bookId);
	const highlightIndex = db.transaction('highlights', 'readwrite').store.index('by-book');
	for await (const cursor of highlightIndex.iterate(bookId)) {
		cursor.delete();
	}
}

export async function saveHighlight(highlight: Highlight): Promise<void> {
	const db = await getDB();
	await db.put('highlights', highlight);
}

export async function deleteHighlight(id: string): Promise<void> {
	const db = await getDB();
	await db.delete('highlights', id);
}

export async function getHighlightsByBook(bookId: string): Promise<Highlight[]> {
	if (typeof indexedDB === 'undefined') {
		return [];
	}
	const db = await getDB();
	return await db.getAllFromIndex('highlights', 'by-book', bookId);
}

export async function getHighlightsByBookChapter(bookId: string, chapterId: string): Promise<Highlight[]> {
	if (typeof indexedDB === 'undefined') {
		return [];
	}
	const db = await getDB();
	const key = `${bookId}:${chapterId}`;
	return await db.getAllFromIndex('highlights', 'by-book-chapter', key);
}

export async function getAllHighlights(): Promise<Highlight[]> {
	if (typeof indexedDB === 'undefined') {
		return [];
	}
	const db = await getDB();
	return await db.getAll('highlights');
}
