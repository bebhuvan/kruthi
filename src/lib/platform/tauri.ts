/**
 * tauri.ts
 *
 * Tauri adapter backed by filesystem + SQLite + Store.
 */
import { BaseDirectory, exists, mkdir, readFile, remove, writeFile } from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';
import Database from '@tauri-apps/plugin-sql';
import { Store } from '@tauri-apps/plugin-store';
import type { Chunk } from '$lib/types/retrieval';
import type { Highlight, HighlightRange } from '$lib/types/highlight';
import type { Settings } from '$lib/types/settings';
import type { ChapterSummary } from '$lib/types/summary';
import type { VocabularyEntry } from '$lib/types/vocabulary';
import type { AnalysisCacheEntry, AnalysisResult, ThemeTracker, CharacterProfile } from '$lib/types/analysis';
import type { ReaderProfile } from '$lib/types/readerProfile';
import type { BookMeta, PickedEpubFile, PlatformAdapter } from '$lib/platform/types';
import { STORAGE_KEYS } from '$lib/config/constants';

const BOOKS_DIR = 'books';
const DB_PATH = 'sqlite:kruthi.db';
const SETTINGS_STORE_PATH = 'settings.json';
const SECURE_STORE_PATH = 'secure.json';

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  cover_path TEXT,
  added_at INTEGER NOT NULL,
  last_opened_at INTEGER
);

CREATE TABLE IF NOT EXISTS positions (
  book_id TEXT PRIMARY KEY REFERENCES books(id) ON DELETE CASCADE,
  chapter_index INTEGER NOT NULL,
  scroll_y REAL NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  chapter_title TEXT,
  book_chapter TEXT,
  text TEXT NOT NULL,
  offset_start INTEGER,
  offset_end INTEGER,
  embedding BLOB,
  embedding_model TEXT
);

CREATE INDEX IF NOT EXISTS idx_chunks_book ON chunks(book_id);
CREATE INDEX IF NOT EXISTS idx_chunks_book_chapter ON chunks(book_id, chapter_id);

CREATE TABLE IF NOT EXISTS highlights (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  book_title TEXT,
  author TEXT,
  chapter_id TEXT NOT NULL,
  chapter_title TEXT,
  book_chapter TEXT,
  selected_text TEXT NOT NULL,
  context TEXT,
  cfi TEXT,
  range_data TEXT,
  note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_highlights_book ON highlights(book_id);
CREATE INDEX IF NOT EXISTS idx_highlights_book_chapter ON highlights(book_id, chapter_id);

CREATE TABLE IF NOT EXISTS summaries (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  brief TEXT NOT NULL,
  detailed TEXT,
  key_points TEXT,
  characters TEXT,
  generated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_summaries_book ON summaries(book_id);

CREATE TABLE IF NOT EXISTS vocabulary (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  definition TEXT NOT NULL,
  etymology TEXT,
  context TEXT,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  book_title TEXT,
  chapter_id TEXT NOT NULL,
  looked_up_at INTEGER NOT NULL,
  review_count INTEGER NOT NULL,
  last_reviewed_at INTEGER,
  mastered INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_book ON vocabulary(book_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_review ON vocabulary(looked_up_at);

CREATE TABLE IF NOT EXISTS analysis_cache (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  subject TEXT,
  chapter_id TEXT,
  payload TEXT NOT NULL,
  generated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analysis_cache_book ON analysis_cache(book_id);

CREATE TABLE IF NOT EXISTS reader_profile (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

interface BookRow {
	id: string;
	title: string;
	author: string | null;
	cover_path?: string | null;
	added_at: number;
	last_opened_at?: number | null;
}

interface PositionRow {
	chapter_index: number;
	scroll_y: number;
}

interface ChunkRow {
	id: string;
	book_id: string;
	chapter_id: string;
	chapter_title: string | null;
	book_chapter: string | null;
	text: string;
	offset_start: number;
	offset_end: number;
	embedding?: Uint8Array | null;
	embedding_model?: string | null;
}

interface HighlightRow {
	id: string;
	book_id: string;
	book_title: string | null;
	author: string | null;
	chapter_id: string;
	chapter_title: string | null;
	book_chapter: string | null;
	selected_text: string;
	context: string | null;
	cfi: string | null;
	range_data: string | null;
	note: string | null;
	created_at: number;
	updated_at: number;
}

interface VocabularyRow {
	id: string;
	word: string;
	definition: string;
	etymology: string | null;
	context: string | null;
	book_id: string;
	book_title: string | null;
	chapter_id: string;
	looked_up_at: number;
	review_count: number;
	last_reviewed_at: number | null;
	mastered: number;
}

interface SummaryRow {
	id: string;
	book_id: string;
	chapter_id: string;
	brief: string;
	detailed: string | null;
	key_points: string | null;
	characters: string | null;
	generated_at: number;
}

interface AnalysisCacheRow {
	id: string;
	book_id: string;
	kind: string;
	subject: string | null;
	chapter_id: string | null;
	payload: string;
	generated_at: number;
}

interface ReaderProfileRow {
	id: string;
	payload: string;
	updated_at: number;
}

function deserializeEmbedding(blob?: Uint8Array | null): number[] | undefined {
	if (!blob) {
		return undefined;
	}
	const slice = blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength);
	return Array.from(new Float32Array(slice));
}

function serializeEmbedding(embedding?: number[]): Uint8Array | null {
	if (!embedding || embedding.length === 0) {
		return null;
	}
	return new Uint8Array(new Float32Array(embedding).buffer);
}

function normalizeBookMeta(row: BookRow): BookMeta {
	return {
		id: row.id,
		title: row.title,
		author: row.author ?? '',
		coverPath: row.cover_path ?? undefined,
		addedAt: row.added_at,
		lastOpenedAt: row.last_opened_at ?? undefined
	};
}

function normalizeHighlightRange(raw?: string | null): HighlightRange | undefined {
	if (!raw) {
		return undefined;
	}
	try {
		return JSON.parse(raw) as HighlightRange;
	} catch {
		return undefined;
	}
}

function normalizeChunk(row: ChunkRow): Chunk {
	return {
		id: row.id,
		bookId: row.book_id,
		chapterId: row.chapter_id,
		chapterTitle: row.chapter_title ?? '',
		bookChapter: row.book_chapter ?? `${row.book_id}:${row.chapter_id}`,
		text: row.text,
		offsetStart: row.offset_start,
		offsetEnd: row.offset_end,
		embedding: deserializeEmbedding(row.embedding),
		embeddingModel: row.embedding_model ?? undefined
	};
}

function normalizeHighlight(row: HighlightRow): Highlight {
	return {
		id: row.id,
		bookId: row.book_id,
		bookTitle: row.book_title ?? '',
		author: row.author ?? '',
		chapterId: row.chapter_id,
		chapterTitle: row.chapter_title ?? '',
		bookChapter: row.book_chapter ?? `${row.book_id}:${row.chapter_id}`,
		selectedText: row.selected_text,
		context: row.context ?? '',
		cfi: row.cfi ?? undefined,
		range: normalizeHighlightRange(row.range_data),
		note: row.note ?? undefined,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

function normalizeSummary(row: SummaryRow): ChapterSummary {
	let keyPoints: string[] = [];
	let characters: string[] = [];
	if (row.key_points) {
		try {
			keyPoints = JSON.parse(row.key_points) as string[];
		} catch {
			keyPoints = [];
		}
	}
	if (row.characters) {
		try {
			characters = JSON.parse(row.characters) as string[];
		} catch {
			characters = [];
		}
	}
	return {
		id: row.id,
		bookId: row.book_id,
		chapterId: row.chapter_id,
		brief: row.brief,
		detailed: row.detailed ?? undefined,
		keyPoints,
		characters,
		generatedAt: row.generated_at
	};
}

function normalizeVocabulary(row: VocabularyRow): VocabularyEntry {
	return {
		id: row.id,
		word: row.word,
		definition: row.definition,
		etymology: row.etymology ?? undefined,
		context: row.context ?? '',
		bookId: row.book_id,
		bookTitle: row.book_title ?? '',
		chapterId: row.chapter_id,
		lookedUpAt: row.looked_up_at,
		reviewCount: row.review_count,
		lastReviewedAt: row.last_reviewed_at ?? undefined,
		mastered: row.mastered === 1
	};
}

type AnalysisKind = AnalysisCacheEntry['kind'];

function isAnalysisKind(value: string): value is AnalysisKind {
	return (
		value === 'analysis' ||
		value === 'theme-tracker' ||
		value === 'character-profile' ||
		value === 'theme-list' ||
		value === 'character-list'
	);
}

function normalizeAnalysis(row: AnalysisCacheRow): AnalysisCacheEntry | null {
	if (!isAnalysisKind(row.kind)) {
		return null;
	}
	let payload: unknown;
	try {
		payload = JSON.parse(row.payload);
	} catch {
		return null;
	}

	const base = {
		id: row.id,
		bookId: row.book_id,
		generatedAt: row.generated_at
	};

	switch (row.kind) {
		case 'analysis':
			return {
				...base,
				kind: 'analysis',
				subject: row.subject ?? undefined,
				chapterId: row.chapter_id ?? undefined,
				payload: payload as AnalysisResult
			};
		case 'theme-tracker':
			return {
				...base,
				kind: 'theme-tracker',
				subject: row.subject ?? '',
				payload: payload as ThemeTracker
			};
		case 'character-profile':
			return {
				...base,
				kind: 'character-profile',
				subject: row.subject ?? '',
				payload: payload as CharacterProfile
			};
		case 'theme-list':
			return {
				...base,
				kind: 'theme-list',
				payload: payload as string[]
			};
		case 'character-list':
			return {
				...base,
				kind: 'character-list',
				payload: payload as string[]
			};
		default:
			return null;
	}
}

function normalizeReaderProfile(row: ReaderProfileRow): ReaderProfile | null {
	try {
		const payload = JSON.parse(row.payload) as ReaderProfile;
		return { ...payload, updatedAt: row.updated_at };
	} catch {
		return null;
	}
}

function getFileName(path: string): string {
	const normalized = path.replace(/\\/g, '/');
	const parts = normalized.split('/');
	return parts[parts.length - 1] || 'book.epub';
}

export class TauriAdapter implements PlatformAdapter {
	private db: Database | null = null;
	private settingsStore: Store | null = null;
	private secureStore: Store | null = null;
	private ready: Promise<void> | null = null;

	async init(): Promise<void> {
		if (this.ready) {
			return this.ready;
		}
		this.ready = this.initInternal();
		return this.ready;
	}

	private async initInternal(): Promise<void> {
		const hasDir = await exists(BOOKS_DIR, { baseDir: BaseDirectory.AppData });
		if (!hasDir) {
			await mkdir(BOOKS_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
		}

		this.db = await Database.load(DB_PATH);
		await this.runMigrations();

		this.settingsStore = await Store.load(SETTINGS_STORE_PATH, { autoSave: true, defaults: {} });
		this.secureStore = await Store.load(SECURE_STORE_PATH, { autoSave: true, defaults: {} });
	}

	private async ensureReady(): Promise<void> {
		if (!this.ready) {
			await this.init();
		} else {
			await this.ready;
		}
	}

	private getDatabase(): Database {
		if (!this.db) {
			throw new Error('Database not initialized');
		}
		return this.db;
	}

	private async runMigrations(): Promise<void> {
		const db = this.getDatabase();
		const statements = MIGRATION_SQL.split(/;\s*\n/)
			.map((statement) => statement.trim())
			.filter(Boolean);
		for (const statement of statements) {
			await db.execute(statement);
		}
	}

	private async ensureStores(): Promise<{ settings: Store; secure: Store }> {
		await this.ensureReady();
		if (!this.settingsStore || !this.secureStore) {
			throw new Error('Stores not initialized');
		}
		return { settings: this.settingsStore, secure: this.secureStore };
	}

	private async saveFile(id: string, epub: Uint8Array): Promise<void> {
		await writeFile(`${BOOKS_DIR}/${id}.epub`, epub, { baseDir: BaseDirectory.AppData });
	}

	private async readFileData(id: string): Promise<Uint8Array | null> {
		const path = `${BOOKS_DIR}/${id}.epub`;
		const hasFile = await exists(path, { baseDir: BaseDirectory.AppData });
		if (!hasFile) {
			return null;
		}
		return await readFile(path, { baseDir: BaseDirectory.AppData });
	}

	async saveBook(id: string, epub: Uint8Array, meta: BookMeta): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await this.saveFile(id, epub);
		await db.execute(
			`INSERT INTO books (id, title, author, cover_path, added_at, last_opened_at)
			 VALUES ($1, $2, $3, $4, $5, $6)
			 ON CONFLICT(id) DO UPDATE SET
			   title = excluded.title,
			   author = excluded.author,
			   cover_path = excluded.cover_path,
			   added_at = excluded.added_at,
			   last_opened_at = excluded.last_opened_at`,
			[
				meta.id,
				meta.title,
				meta.author,
				meta.coverPath ?? null,
				meta.addedAt,
				meta.lastOpenedAt ?? null
			]
		);
	}

	async loadBookData(id: string): Promise<Uint8Array | null> {
		await this.ensureReady();
		return await this.readFileData(id);
	}

	async getBookMeta(id: string): Promise<BookMeta | null> {
		await this.ensureReady();
		const db = this.getDatabase();
		const rows = await db.select<BookRow[]>(
			`SELECT id, title, author, cover_path, added_at, last_opened_at
			 FROM books WHERE id = $1`,
			[id]
		);
		const row = rows[0];
		return row ? normalizeBookMeta(row) : null;
	}

	async listBooks(): Promise<BookMeta[]> {
		await this.ensureReady();
		const db = this.getDatabase();
		const rows = await db.select<BookRow[]>(
			`SELECT id, title, author, cover_path, added_at, last_opened_at
			 FROM books ORDER BY added_at DESC`
		);
		return rows.map(normalizeBookMeta);
	}

	async deleteBook(id: string): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		const path = `${BOOKS_DIR}/${id}.epub`;
		if (await exists(path, { baseDir: BaseDirectory.AppData })) {
			await remove(path, { baseDir: BaseDirectory.AppData });
		}
		await db.execute('DELETE FROM highlights WHERE book_id = $1', [id]);
		await db.execute('DELETE FROM summaries WHERE book_id = $1', [id]);
		await db.execute('DELETE FROM vocabulary WHERE book_id = $1', [id]);
		await db.execute('DELETE FROM analysis_cache WHERE book_id = $1', [id]);
		await db.execute('DELETE FROM chunks WHERE book_id = $1', [id]);
		await db.execute('DELETE FROM positions WHERE book_id = $1', [id]);
		await db.execute('DELETE FROM books WHERE id = $1', [id]);
	}

	async savePosition(bookId: string, chapterIndex: number, scrollY: number): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.execute(
			`INSERT INTO positions (book_id, chapter_index, scroll_y, updated_at)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT(book_id) DO UPDATE SET
			   chapter_index = excluded.chapter_index,
			   scroll_y = excluded.scroll_y,
			   updated_at = excluded.updated_at`,
			[bookId, chapterIndex, scrollY, Date.now()]
		);
	}

	async getPosition(bookId: string): Promise<{ chapterIndex: number; scrollY: number } | null> {
		await this.ensureReady();
		const db = this.getDatabase();
		const rows = await db.select<PositionRow[]>(
			`SELECT chapter_index, scroll_y FROM positions WHERE book_id = $1`,
			[bookId]
		);
		const row = rows[0];
		if (!row) {
			return null;
		}
		return { chapterIndex: row.chapter_index, scrollY: row.scroll_y };
	}

	async saveChunks(_bookId: string, chunks: Chunk[]): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		if (chunks.length === 0) {
			return;
		}
		await db.execute('BEGIN');
		try {
			for (const chunk of chunks) {
				await db.execute(
					`INSERT INTO chunks (
						id, book_id, chapter_id, chapter_title, book_chapter,
						text, offset_start, offset_end, embedding, embedding_model
					)
					VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
					ON CONFLICT(id) DO UPDATE SET
						book_id = excluded.book_id,
						chapter_id = excluded.chapter_id,
						chapter_title = excluded.chapter_title,
						book_chapter = excluded.book_chapter,
						text = excluded.text,
						offset_start = excluded.offset_start,
						offset_end = excluded.offset_end,
						embedding = excluded.embedding,
						embedding_model = excluded.embedding_model`,
					[
						chunk.id,
						chunk.bookId,
						chunk.chapterId,
						chunk.chapterTitle,
						chunk.bookChapter,
						chunk.text,
						chunk.offsetStart,
						chunk.offsetEnd,
						serializeEmbedding(chunk.embedding),
						chunk.embeddingModel ?? null
					]
				);
			}
			await db.execute('COMMIT');
		} catch (error) {
			await db.execute('ROLLBACK');
			throw error;
		}
	}

	async getChunks(bookId: string, chapterId?: string): Promise<Chunk[]> {
		await this.ensureReady();
		const db = this.getDatabase();
		const rows = chapterId
			? await db.select<ChunkRow[]>(
					`SELECT * FROM chunks WHERE book_id = $1 AND chapter_id = $2`,
					[bookId, chapterId]
				)
			: await db.select<ChunkRow[]>(`SELECT * FROM chunks WHERE book_id = $1`, [bookId]);
		return rows.map(normalizeChunk);
	}

	async getChunksByIds(chunkIds: string[]): Promise<Chunk[]> {
		await this.ensureReady();
		if (chunkIds.length === 0) {
			return [];
		}
		const db = this.getDatabase();
		const placeholders = chunkIds.map((_, index) => `$${index + 1}`).join(', ');
		const rows = await db.select<ChunkRow[]>(`SELECT * FROM chunks WHERE id IN (${placeholders})`, chunkIds);
		return rows.map(normalizeChunk);
	}

	async deleteChunks(bookId: string): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.execute('DELETE FROM chunks WHERE book_id = $1', [bookId]);
	}

	async hasChunks(bookId: string): Promise<boolean> {
		await this.ensureReady();
		const db = this.getDatabase();
		const rows = await db.select<{ count: number }[]>(
			`SELECT COUNT(*) as count FROM chunks WHERE book_id = $1`,
			[bookId]
		);
		return (rows[0]?.count ?? 0) > 0;
	}

	async saveHighlight(highlight: Highlight): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.execute(
			`INSERT INTO highlights (
				id, book_id, book_title, author, chapter_id, chapter_title, book_chapter,
				selected_text, context, cfi, range_data, note, created_at, updated_at
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
			ON CONFLICT(id) DO UPDATE SET
				book_id = excluded.book_id,
				book_title = excluded.book_title,
				author = excluded.author,
				chapter_id = excluded.chapter_id,
				chapter_title = excluded.chapter_title,
				book_chapter = excluded.book_chapter,
				selected_text = excluded.selected_text,
				context = excluded.context,
				cfi = excluded.cfi,
				range_data = excluded.range_data,
				note = excluded.note,
				created_at = excluded.created_at,
				updated_at = excluded.updated_at`,
			[
				highlight.id,
				highlight.bookId,
				highlight.bookTitle,
				highlight.author,
				highlight.chapterId,
				highlight.chapterTitle,
				highlight.bookChapter,
				highlight.selectedText,
				highlight.context,
				highlight.cfi ?? null,
				highlight.range ? JSON.stringify(highlight.range) : null,
				highlight.note ?? null,
				highlight.createdAt,
				highlight.updatedAt
			]
		);
	}

	async updateHighlight(id: string, updates: Partial<Highlight>): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		const rows = await db.select<HighlightRow[]>(`SELECT * FROM highlights WHERE id = $1`, [id]);
		const existing = rows[0];
		if (!existing) {
			return;
		}
		const merged = { ...normalizeHighlight(existing), ...updates } as Highlight;
		await this.saveHighlight(merged);
	}

	async getHighlights(bookId: string): Promise<Highlight[]> {
		await this.ensureReady();
		const db = this.getDatabase();
		const rows = await db.select<HighlightRow[]>(
			`SELECT * FROM highlights WHERE book_id = $1 ORDER BY created_at DESC`,
			[bookId]
		);
		return rows.map(normalizeHighlight);
	}

	async getAllHighlights(): Promise<Highlight[]> {
		await this.ensureReady();
		const db = this.getDatabase();
		const rows = await db.select<HighlightRow[]>(`SELECT * FROM highlights ORDER BY created_at DESC`);
		return rows.map(normalizeHighlight);
	}

	async deleteHighlight(id: string): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.execute('DELETE FROM highlights WHERE id = $1', [id]);
	}

	async saveSummary(summary: ChapterSummary): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.execute(
			`INSERT INTO summaries (
				id, book_id, chapter_id, brief, detailed, key_points, characters, generated_at
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT(id) DO UPDATE SET
				book_id = excluded.book_id,
				chapter_id = excluded.chapter_id,
				brief = excluded.brief,
				detailed = excluded.detailed,
				key_points = excluded.key_points,
				characters = excluded.characters,
				generated_at = excluded.generated_at`,
			[
				summary.id,
				summary.bookId,
				summary.chapterId,
				summary.brief,
				summary.detailed ?? null,
				JSON.stringify(summary.keyPoints ?? []),
				JSON.stringify(summary.characters ?? []),
				summary.generatedAt
			]
		);
	}

	async getSummary(bookId: string, chapterId: string): Promise<ChapterSummary | null> {
		await this.ensureReady();
		const db = this.getDatabase();
		const rows = await db.select<SummaryRow[]>(
			`SELECT * FROM summaries WHERE book_id = $1 AND chapter_id = $2 LIMIT 1`,
			[bookId, chapterId]
		);
		const row = rows[0];
		return row ? normalizeSummary(row) : null;
	}

	async saveVocabularyEntry(entry: VocabularyEntry): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.execute(
			`INSERT INTO vocabulary (
				id, word, definition, etymology, context, book_id, book_title, chapter_id,
				looked_up_at, review_count, last_reviewed_at, mastered
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			ON CONFLICT(id) DO UPDATE SET
				word = excluded.word,
				definition = excluded.definition,
				etymology = excluded.etymology,
				context = excluded.context,
				book_id = excluded.book_id,
				book_title = excluded.book_title,
				chapter_id = excluded.chapter_id,
				looked_up_at = excluded.looked_up_at,
				review_count = excluded.review_count,
				last_reviewed_at = excluded.last_reviewed_at,
				mastered = excluded.mastered`,
			[
				entry.id,
				entry.word,
				entry.definition,
				entry.etymology ?? null,
				entry.context ?? null,
				entry.bookId,
				entry.bookTitle,
				entry.chapterId,
				entry.lookedUpAt,
				entry.reviewCount,
				entry.lastReviewedAt ?? null,
				entry.mastered ? 1 : 0
			]
		);
	}

	async getVocabularyForBook(bookId: string): Promise<VocabularyEntry[]> {
		await this.ensureReady();
		const db = this.getDatabase();
		const rows = await db.select<VocabularyRow[]>(
			`SELECT * FROM vocabulary WHERE book_id = $1 ORDER BY looked_up_at DESC`,
			[bookId]
		);
		return rows.map(normalizeVocabulary);
	}

	async getAllVocabulary(): Promise<VocabularyEntry[]> {
		await this.ensureReady();
		const db = this.getDatabase();
		const rows = await db.select<VocabularyRow[]>(
			`SELECT * FROM vocabulary ORDER BY looked_up_at DESC`
		);
		return rows.map(normalizeVocabulary);
	}

	async deleteVocabularyEntry(id: string): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.execute('DELETE FROM vocabulary WHERE id = $1', [id]);
	}

	async saveAnalysis(entry: AnalysisCacheEntry): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.execute(
			`INSERT INTO analysis_cache (
				id, book_id, kind, subject, chapter_id, payload, generated_at
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT(id) DO UPDATE SET
				book_id = excluded.book_id,
				kind = excluded.kind,
				subject = excluded.subject,
				chapter_id = excluded.chapter_id,
				payload = excluded.payload,
				generated_at = excluded.generated_at`,
			[
				entry.id,
				entry.bookId,
				entry.kind,
				'subject' in entry ? entry.subject ?? null : null,
				'chapterId' in entry ? entry.chapterId ?? null : null,
				JSON.stringify(entry.payload),
				entry.generatedAt
			]
		);
	}

	async getAnalysis(id: string): Promise<AnalysisCacheEntry | null> {
		await this.ensureReady();
		const db = this.getDatabase();
		const rows = await db.select<AnalysisCacheRow[]>(
			`SELECT * FROM analysis_cache WHERE id = $1 LIMIT 1`,
			[id]
		);
		const row = rows[0];
		if (!row) {
			return null;
		}
		return normalizeAnalysis(row);
	}

	async getReaderProfile(): Promise<ReaderProfile | null> {
		await this.ensureReady();
		const db = this.getDatabase();
		const rows = await db.select<ReaderProfileRow[]>(
			`SELECT * FROM reader_profile WHERE id = $1 LIMIT 1`,
			['local']
		);
		const row = rows[0];
		if (!row) {
			return null;
		}
		return normalizeReaderProfile(row);
	}

	async saveReaderProfile(profile: ReaderProfile): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.execute(
			`INSERT INTO reader_profile (id, payload, updated_at)
			VALUES ($1, $2, $3)
			ON CONFLICT(id) DO UPDATE SET
				payload = excluded.payload,
				updated_at = excluded.updated_at`,
			[profile.id, JSON.stringify(profile), profile.updatedAt]
		);
	}

	async getSettings(): Promise<Settings | null> {
		const { settings } = await this.ensureStores();
		const stored = await settings.get<Settings>(STORAGE_KEYS.settings);
		return stored ?? null;
	}

	async saveSettings(settings: Settings): Promise<void> {
		const { settings: store } = await this.ensureStores();
		await store.set(STORAGE_KEYS.settings, settings);
		await store.save();
	}

	async getSecureValue(key: string): Promise<string | null> {
		const { secure } = await this.ensureStores();
		const stored = await secure.get<string>(key);
		if (typeof stored === 'string') {
			return stored;
		}
		const settings = await this.getSettings();
		if (settings && key in settings) {
			const candidate = (settings as unknown as Record<string, unknown>)[key];
			return typeof candidate === 'string' ? candidate : null;
		}
		return null;
	}

	async setSecureValue(key: string, value: string): Promise<void> {
		const { secure } = await this.ensureStores();
		await secure.set(key, value);
		await secure.save();
	}

	async deleteSecureValue(key: string): Promise<void> {
		const { secure } = await this.ensureStores();
		await secure.delete(key);
		await secure.save();
	}

	async pickEpubFile(): Promise<PickedEpubFile | null> {
		const selected = await open({
			filters: [{ name: 'EPUB', extensions: ['epub'] }],
			multiple: false
		});

		if (typeof selected !== 'string') {
			return null;
		}

		const bytes = await readFile(selected);
		return {
			name: getFileName(selected),
			path: selected,
			bytes
		};
	}

	async readEpubFile(path: string): Promise<PickedEpubFile | null> {
		const bytes = await readFile(path);
		return {
			name: getFileName(path),
			path,
			bytes
		};
	}
}

export const adapter = new TauriAdapter();
export * from './types';
