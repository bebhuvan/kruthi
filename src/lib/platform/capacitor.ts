/**
 * capacitor.ts
 *
 * Capacitor adapter backed by filesystem + SQLite + Preferences.
 * For iOS and Android mobile platforms.
 */
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import type { Chunk } from '$lib/types/retrieval';
import type { Highlight, HighlightRange } from '$lib/types/highlight';
import type { Settings } from '$lib/types/settings';
import type { ChapterSummary } from '$lib/types/summary';
import type { VocabularyEntry } from '$lib/types/vocabulary';
import type { AnalysisCacheEntry, AnalysisResult, ThemeTracker, CharacterProfile } from '$lib/types/analysis';
import type { ReaderProfile } from '$lib/types/readerProfile';
import type { BookMeta, PickedEpubFile, PlatformAdapter } from '$lib/platform/types';
import { STORAGE_KEYS } from '$lib/config/constants';

const DB_NAME = 'kruthi';
const BOOKS_DIR = 'books';
const SECURE_PREFIX = 'secure:';

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
  book_id TEXT PRIMARY KEY,
  chapter_index INTEGER NOT NULL,
  scroll_y REAL NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  chapter_title TEXT,
  book_chapter TEXT,
  text TEXT NOT NULL,
  offset_start INTEGER,
  offset_end INTEGER,
  embedding TEXT,
  embedding_model TEXT
);

CREATE INDEX IF NOT EXISTS idx_chunks_book ON chunks(book_id);
CREATE INDEX IF NOT EXISTS idx_chunks_book_chapter ON chunks(book_id, chapter_id);

CREATE TABLE IF NOT EXISTS highlights (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
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
  book_id TEXT NOT NULL,
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
  book_id TEXT NOT NULL,
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
  book_id TEXT NOT NULL,
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
	embedding?: string | null;
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

function serializeEmbedding(embedding?: number[]): string | null {
	if (!embedding || embedding.length === 0) {
		return null;
	}
	return JSON.stringify(embedding);
}

function deserializeEmbedding(json?: string | null): number[] | undefined {
	if (!json) {
		return undefined;
	}
	try {
		return JSON.parse(json) as number[];
	} catch {
		return undefined;
	}
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

function uint8ArrayToBase64(bytes: Uint8Array): string {
	let binary = '';
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
	const binary = atob(base64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

export class CapacitorAdapter implements PlatformAdapter {
	private sqlite: SQLiteConnection | null = null;
	private db: SQLiteDBConnection | null = null;
	private ready: Promise<void> | null = null;

	async init(): Promise<void> {
		if (this.ready) {
			return this.ready;
		}
		this.ready = this.initInternal();
		return this.ready;
	}

	private async initInternal(): Promise<void> {
		// Ensure books directory exists
		try {
			await Filesystem.mkdir({
				path: BOOKS_DIR,
				directory: Directory.Data,
				recursive: true
			});
		} catch {
			// Directory may already exist
		}

		// Initialize SQLite
		this.sqlite = new SQLiteConnection(CapacitorSQLite);

		// Check connection consistency (required for iOS)
		const retCC = await this.sqlite.checkConnectionsConsistency();
		const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;

		if (retCC.result && isConn) {
			this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
		} else {
			this.db = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
		}

		await this.db.open();
		await this.runMigrations();
	}

	private async ensureReady(): Promise<void> {
		if (!this.ready) {
			await this.init();
		} else {
			await this.ready;
		}
	}

	private getDatabase(): SQLiteDBConnection {
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

	private getBookPath(id: string): string {
		return `${BOOKS_DIR}/${id}.epub`;
	}

	async saveBook(id: string, epub: Uint8Array, meta: BookMeta): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();

		// Save file to filesystem as base64
		await Filesystem.writeFile({
			path: this.getBookPath(id),
			data: uint8ArrayToBase64(epub),
			directory: Directory.Data
		});

		// Save metadata to database
		await db.run(
			`INSERT INTO books (id, title, author, cover_path, added_at, last_opened_at)
			 VALUES (?, ?, ?, ?, ?, ?)
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
		try {
			const result = await Filesystem.readFile({
				path: this.getBookPath(id),
				directory: Directory.Data
			});
			if (typeof result.data === 'string') {
				return base64ToUint8Array(result.data);
			}
			// Handle Blob if returned
			if (result.data instanceof Blob) {
				const buffer = await result.data.arrayBuffer();
				return new Uint8Array(buffer);
			}
			return null;
		} catch {
			return null;
		}
	}

	async getBookMeta(id: string): Promise<BookMeta | null> {
		await this.ensureReady();
		const db = this.getDatabase();
		const result = await db.query(
			`SELECT id, title, author, cover_path, added_at, last_opened_at
			 FROM books WHERE id = ?`,
			[id]
		);
		const row = result.values?.[0] as BookRow | undefined;
		return row ? normalizeBookMeta(row) : null;
	}

	async listBooks(): Promise<BookMeta[]> {
		await this.ensureReady();
		const db = this.getDatabase();
		const result = await db.query(
			`SELECT id, title, author, cover_path, added_at, last_opened_at
			 FROM books ORDER BY added_at DESC`
		);
		return (result.values as BookRow[] ?? []).map(normalizeBookMeta);
	}

	async deleteBook(id: string): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();

		// Delete file
		try {
			await Filesystem.deleteFile({
				path: this.getBookPath(id),
				directory: Directory.Data
			});
		} catch {
			// File may not exist
		}

		// Delete related data
		await db.run('DELETE FROM highlights WHERE book_id = ?', [id]);
		await db.run('DELETE FROM summaries WHERE book_id = ?', [id]);
		await db.run('DELETE FROM vocabulary WHERE book_id = ?', [id]);
		await db.run('DELETE FROM analysis_cache WHERE book_id = ?', [id]);
		await db.run('DELETE FROM chunks WHERE book_id = ?', [id]);
		await db.run('DELETE FROM positions WHERE book_id = ?', [id]);
		await db.run('DELETE FROM books WHERE id = ?', [id]);
	}

	async savePosition(bookId: string, chapterIndex: number, scrollY: number): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.run(
			`INSERT INTO positions (book_id, chapter_index, scroll_y, updated_at)
			 VALUES (?, ?, ?, ?)
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
		const result = await db.query(
			`SELECT chapter_index, scroll_y FROM positions WHERE book_id = ?`,
			[bookId]
		);
		const row = result.values?.[0] as PositionRow | undefined;
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

		// Use a transaction for better performance
		await db.execute('BEGIN TRANSACTION');
		try {
			for (const chunk of chunks) {
				await db.run(
					`INSERT INTO chunks (
						id, book_id, chapter_id, chapter_title, book_chapter,
						text, offset_start, offset_end, embedding, embedding_model
					)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
		const result = chapterId
			? await db.query(`SELECT * FROM chunks WHERE book_id = ? AND chapter_id = ?`, [bookId, chapterId])
			: await db.query(`SELECT * FROM chunks WHERE book_id = ?`, [bookId]);
		return (result.values as ChunkRow[] ?? []).map(normalizeChunk);
	}

	async getChunksByIds(chunkIds: string[]): Promise<Chunk[]> {
		await this.ensureReady();
		if (chunkIds.length === 0) {
			return [];
		}
		const db = this.getDatabase();
		const placeholders = chunkIds.map(() => '?').join(', ');
		const result = await db.query(`SELECT * FROM chunks WHERE id IN (${placeholders})`, chunkIds);
		return (result.values as ChunkRow[] ?? []).map(normalizeChunk);
	}

	async deleteChunks(bookId: string): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.run('DELETE FROM chunks WHERE book_id = ?', [bookId]);
	}

	async hasChunks(bookId: string): Promise<boolean> {
		await this.ensureReady();
		const db = this.getDatabase();
		const result = await db.query(
			`SELECT COUNT(*) as count FROM chunks WHERE book_id = ?`,
			[bookId]
		);
		const row = result.values?.[0] as { count: number } | undefined;
		return (row?.count ?? 0) > 0;
	}

	async saveHighlight(highlight: Highlight): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.run(
			`INSERT INTO highlights (
				id, book_id, book_title, author, chapter_id, chapter_title, book_chapter,
				selected_text, context, cfi, range_data, note, created_at, updated_at
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
		const result = await db.query(`SELECT * FROM highlights WHERE id = ?`, [id]);
		const existing = result.values?.[0] as HighlightRow | undefined;
		if (!existing) {
			return;
		}
		const merged = { ...normalizeHighlight(existing), ...updates } as Highlight;
		await this.saveHighlight(merged);
	}

	async getHighlights(bookId: string): Promise<Highlight[]> {
		await this.ensureReady();
		const db = this.getDatabase();
		const result = await db.query(
			`SELECT * FROM highlights WHERE book_id = ? ORDER BY created_at DESC`,
			[bookId]
		);
		return (result.values as HighlightRow[] ?? []).map(normalizeHighlight);
	}

	async getAllHighlights(): Promise<Highlight[]> {
		await this.ensureReady();
		const db = this.getDatabase();
		const result = await db.query(`SELECT * FROM highlights ORDER BY created_at DESC`);
		return (result.values as HighlightRow[] ?? []).map(normalizeHighlight);
	}

	async deleteHighlight(id: string): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.run('DELETE FROM highlights WHERE id = ?', [id]);
	}

	async saveSummary(summary: ChapterSummary): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.run(
			`INSERT INTO summaries (
				id, book_id, chapter_id, brief, detailed, key_points, characters, generated_at
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
		const result = await db.query(
			`SELECT * FROM summaries WHERE book_id = ? AND chapter_id = ? LIMIT 1`,
			[bookId, chapterId]
		);
		const row = result.values?.[0] as SummaryRow | undefined;
		return row ? normalizeSummary(row) : null;
	}

	async saveVocabularyEntry(entry: VocabularyEntry): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.run(
			`INSERT INTO vocabulary (
				id, word, definition, etymology, context, book_id, book_title, chapter_id,
				looked_up_at, review_count, last_reviewed_at, mastered
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
		const result = await db.query(
			`SELECT * FROM vocabulary WHERE book_id = ? ORDER BY looked_up_at DESC`,
			[bookId]
		);
		return (result.values as VocabularyRow[] ?? []).map(normalizeVocabulary);
	}

	async getAllVocabulary(): Promise<VocabularyEntry[]> {
		await this.ensureReady();
		const db = this.getDatabase();
		const result = await db.query(`SELECT * FROM vocabulary ORDER BY looked_up_at DESC`);
		return (result.values as VocabularyRow[] ?? []).map(normalizeVocabulary);
	}

	async deleteVocabularyEntry(id: string): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.run('DELETE FROM vocabulary WHERE id = ?', [id]);
	}

	async saveAnalysis(entry: AnalysisCacheEntry): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.run(
			`INSERT INTO analysis_cache (
				id, book_id, kind, subject, chapter_id, payload, generated_at
			)
			VALUES (?, ?, ?, ?, ?, ?, ?)
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
		const result = await db.query(`SELECT * FROM analysis_cache WHERE id = ? LIMIT 1`, [id]);
		const row = result.values?.[0] as AnalysisCacheRow | undefined;
		if (!row) {
			return null;
		}
		return normalizeAnalysis(row);
	}

	async getReaderProfile(): Promise<ReaderProfile | null> {
		await this.ensureReady();
		const db = this.getDatabase();
		const result = await db.query(`SELECT * FROM reader_profile WHERE id = ? LIMIT 1`, ['local']);
		const row = result.values?.[0] as ReaderProfileRow | undefined;
		if (!row) {
			return null;
		}
		return normalizeReaderProfile(row);
	}

	async saveReaderProfile(profile: ReaderProfile): Promise<void> {
		await this.ensureReady();
		const db = this.getDatabase();
		await db.run(
			`INSERT INTO reader_profile (id, payload, updated_at)
			VALUES (?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				payload = excluded.payload,
				updated_at = excluded.updated_at`,
			[profile.id, JSON.stringify(profile), profile.updatedAt]
		);
	}

	async getSettings(): Promise<Settings | null> {
		const result = await Preferences.get({ key: STORAGE_KEYS.settings });
		if (!result.value) {
			return null;
		}
		try {
			return JSON.parse(result.value) as Settings;
		} catch {
			return null;
		}
	}

	async saveSettings(settings: Settings): Promise<void> {
		await Preferences.set({
			key: STORAGE_KEYS.settings,
			value: JSON.stringify(settings)
		});
	}

	async getSecureValue(key: string): Promise<string | null> {
		const result = await Preferences.get({ key: `${SECURE_PREFIX}${key}` });
		if (result.value) {
			return result.value;
		}
		// Fallback: check settings
		const settings = await this.getSettings();
		if (settings && key in settings) {
			const candidate = (settings as unknown as Record<string, unknown>)[key];
			return typeof candidate === 'string' ? candidate : null;
		}
		return null;
	}

	async setSecureValue(key: string, value: string): Promise<void> {
		await Preferences.set({
			key: `${SECURE_PREFIX}${key}`,
			value
		});
	}

	async deleteSecureValue(key: string): Promise<void> {
		await Preferences.remove({ key: `${SECURE_PREFIX}${key}` });
	}

	async pickEpubFile(): Promise<PickedEpubFile | null> {
		// Mobile doesn't support native file picker in the same way
		// Users will use the standard file input or share sheet
		return null;
	}

	async readEpubFile(_path: string): Promise<PickedEpubFile | null> {
		// Not directly supported on mobile
		return null;
	}
}

export const adapter = new CapacitorAdapter();
export * from './types';
