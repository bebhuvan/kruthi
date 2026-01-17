-- Books metadata (EPUB files stored on filesystem)
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  cover_path TEXT,
  added_at INTEGER NOT NULL,
  last_opened_at INTEGER
);

-- Reading positions
CREATE TABLE IF NOT EXISTS positions (
  book_id TEXT PRIMARY KEY REFERENCES books(id) ON DELETE CASCADE,
  chapter_index INTEGER NOT NULL,
  scroll_y REAL NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Chunks for retrieval
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

-- Highlights
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

-- Chapter summaries
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

-- Vocabulary
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

-- Analysis cache
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

-- Reader profile
CREATE TABLE IF NOT EXISTS reader_profile (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
