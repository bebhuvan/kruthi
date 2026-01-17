# Cross-Platform Implementation Plan

> One Svelte codebase → Web + Desktop + Mobile

## Overview

Transform Kruthi into a cross-platform app with:
- **Web**: Current SvelteKit app (Cloudflare Pages) - full features including AI
- **Desktop**: Tauri app with native file system and SQLite
- **Mobile**: Capacitor app (future phase)

---

## Phase 1: Platform Adapter Abstraction

**Goal**: Decouple storage/file operations from platform-specific implementations without breaking the current web app.

### 1.1 Create Adapter Interface

Create `src/lib/platform/types.ts`:

```typescript
export interface BookMeta {
  id: string;
  title: string;
  author: string;
  coverPath?: string;
  addedAt: Date;
  lastOpenedAt?: Date;
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
  getChunks(bookId: string, chapterIndex?: number): Promise<Chunk[]>;
  getChunksByIds(chunkIds: string[]): Promise<Chunk[]>;
  deleteChunks(bookId: string): Promise<void>;
  hasChunks(bookId: string): Promise<boolean>;

  // Highlights
  saveHighlight(highlight: Highlight): Promise<void>;
  updateHighlight(id: string, updates: Partial<Highlight>): Promise<void>;
  getHighlights(bookId: string): Promise<Highlight[]>;
  getAllHighlights(): Promise<Highlight[]>;
  deleteHighlight(id: string): Promise<void>;

  // Settings
  getSettings(): Promise<Settings | null>;
  saveSettings(settings: Settings): Promise<void>;

  // Secure storage (API keys)
  getSecureValue(key: string): Promise<string | null>;
  setSecureValue(key: string, value: string): Promise<void>;
  deleteSecureValue(key: string): Promise<void>;
}
```

### 1.2 Implement Web Adapter

Create `src/lib/platform/web.ts`:

- Wrap existing `storage.ts` IndexedDB logic
- Settings from localStorage (web adapter)
- API keys from adapter secure storage (localStorage on web)
- Implement the full `PlatformAdapter` interface

### 1.3 Create Adapter Entry Point

Create `src/lib/platform/index.ts`:

```typescript
import type { PlatformAdapter } from './types';
import { WebAdapter } from './web';

// Will be swapped at build time for other platforms
export const adapter: PlatformAdapter = new WebAdapter();

// Re-export types
export * from './types';
```

### 1.4 Refactor Services to Use Adapter

Update these files to import from `$lib/platform` instead of `$lib/services/storage`:

| File | Changes |
|------|---------|
| `bookStore.ts` | Use `adapter.saveBook()`, `adapter.loadBookData()` |
| `retrieval.ts` | Use `adapter.saveChunks()`, `adapter.getChunks()` |
| `settingsStore.ts` | Use `adapter.getSettings()`, `adapter.saveSettings()` |
| `llm.ts` | Use `adapter.getSecureValue()` for API keys |
| Highlight operations | Use `adapter.saveHighlight()`, etc. |

### 1.5 Deprecate Old Storage Module

- Keep `storage.ts` temporarily as `storage.legacy.ts`
- Ensure all imports use the new adapter
- Remove legacy file once verified

### Deliverables
- [ ] `src/lib/platform/types.ts` - Interface definition
- [ ] `src/lib/platform/web.ts` - Web implementation
- [ ] `src/lib/platform/index.ts` - Entry point
- [ ] All services refactored to use adapter
- [ ] Web app works exactly as before (regression test)

### Testing Checklist
- [ ] Upload a book → saves correctly
- [ ] Reload page → book persists
- [ ] Highlights save and restore
- [ ] Reading position persists
- [ ] Settings persist across reload
- [ ] AI chat works with API key
- [ ] Book indexing and search work

---

## Phase 2: Tauri Desktop Setup

**Goal**: Get the Svelte app running in Tauri with the web adapter (no native features yet).

### 2.1 Initialize Tauri Project

```bash
npm install -D @tauri-apps/cli
npm run tauri init
```

Configuration:
- App name: `Kruthi`
- Window title: `Kruthi`
- Dev server: `http://localhost:5173`
- Dev command: `npm run dev`
- Build command: `npm run build`

### 2.2 Create Tauri Build Config

Create `vite.config.tauri.ts`:

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    'import.meta.env.TAURI': true
  }
});
```

Create `svelte.config.tauri.js`:

```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: 'index.html'
    })
  }
};
```

### 2.3 Add Tauri Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "vite dev",
    "dev:tauri": "tauri dev",
    "build": "vite build",
    "build:tauri": "tauri build",
    "tauri": "tauri"
  }
}
```

### 2.4 Configure SvelteKit for Static

Add to `src/routes/+layout.ts`:

```typescript
export const ssr = false;
export const prerender = true;
```

### 2.5 Test Tauri Shell

```bash
npm run dev:tauri
```

At this point: App runs in Tauri window, still using IndexedDB (web adapter).

### Deliverables
- [ ] `src-tauri/` directory with Tauri config
- [ ] `tauri.conf.json` configured
- [ ] `svelte.config.tauri.js` for static builds
- [ ] `vite.config.tauri.ts` with Tauri flag
- [ ] App runs in Tauri window
- [ ] All features work (using web adapter)

### Testing Checklist
- [ ] `npm run dev:tauri` opens desktop window
- [ ] Can upload and read a book
- [ ] Highlights work
- [ ] AI chat works
- [ ] Settings persist

---

## Phase 3: Tauri Native Storage

**Goal**: Implement native file system + SQLite storage for desktop.

### 3.1 Add Tauri Plugins

```bash
npm install @tauri-apps/api
npm install @tauri-apps/plugin-fs
npm install @tauri-apps/plugin-sql
npm install @tauri-apps/plugin-store
```

Update `src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri-plugin-fs = "2"
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
tauri-plugin-store = "2"
```

### 3.2 Create SQLite Schema

Create `src-tauri/migrations/001_init.sql`:

```sql
-- Books metadata (EPUB files stored on filesystem)
CREATE TABLE books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  cover_path TEXT,
  added_at INTEGER NOT NULL,
  last_opened_at INTEGER
);

-- Reading positions
CREATE TABLE positions (
  book_id TEXT PRIMARY KEY REFERENCES books(id) ON DELETE CASCADE,
  chapter_index INTEGER NOT NULL,
  scroll_y REAL NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Chunks for RAG
CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  chapter_title TEXT,
  chapter_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  offset_start INTEGER,
  offset_end INTEGER,
  embedding BLOB,
  embedding_model TEXT
);

CREATE INDEX idx_chunks_book ON chunks(book_id);
CREATE INDEX idx_chunks_book_chapter ON chunks(book_id, chapter_index);

-- Highlights
CREATE TABLE highlights (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  book_title TEXT,
  author TEXT,
  chapter_id TEXT NOT NULL,
  chapter_title TEXT,
  chapter_index INTEGER,
  selected_text TEXT NOT NULL,
  context TEXT,
  cfi TEXT,
  range_data TEXT,
  note TEXT,
  color TEXT DEFAULT 'yellow',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_highlights_book ON highlights(book_id);
```

### 3.3 Implement Tauri Adapter

Create `src/lib/platform/tauri.ts`:

```typescript
import type { PlatformAdapter, BookMeta, Chunk, Highlight, Settings } from './types';
import {
  readFile, writeFile, remove, mkdir, exists,
  BaseDirectory
} from '@tauri-apps/plugin-fs';
import Database from '@tauri-apps/plugin-sql';
import { Store } from '@tauri-apps/plugin-store';

export class TauriAdapter implements PlatformAdapter {
  private db: Database | null = null;
  private store: Store | null = null;

  async init(): Promise<void> {
    // Ensure app data directory exists
    const booksDir = 'books';
    if (!await exists(booksDir, { baseDir: BaseDirectory.AppData })) {
      await mkdir(booksDir, { baseDir: BaseDirectory.AppData, recursive: true });
    }

    // Initialize SQLite
    this.db = await Database.load('sqlite:kruthi.db');

    // Run migrations (in production, use proper migration system)
    await this.runMigrations();

    // Initialize secure store
    this.store = new Store('settings.json');
  }

  // ... implement all interface methods
}
```

### 3.4 File System Layout

```
~/.local/share/kruthi/     (Linux)
~/Library/Application Support/kruthi/  (macOS)
%APPDATA%/kruthi/          (Windows)
├── kruthi.db              # SQLite database
├── settings.json               # Secure store (encrypted)
└── books/
    ├── {book-id-1}.epub
    ├── {book-id-2}.epub
    └── ...
```

### 3.5 Build-Time Adapter Swap

Update `vite.config.tauri.ts`:

```typescript
export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      '$lib/platform/index': './src/lib/platform/tauri'
    }
  },
  define: {
    'import.meta.env.TAURI': true
  }
});
```

### 3.6 Embedding Storage

SQLite stores embeddings as BLOB:

```typescript
// Serialize Float32Array to bytes
function serializeEmbedding(embedding: number[]): Uint8Array {
  return new Uint8Array(new Float32Array(embedding).buffer);
}

// Deserialize bytes to number[]
function deserializeEmbedding(blob: Uint8Array): number[] {
  return Array.from(new Float32Array(blob.buffer));
}
```

### Deliverables
- [ ] Tauri plugins installed and configured
- [ ] SQLite schema created
- [ ] `src/lib/platform/tauri.ts` - Full implementation
- [ ] Build config swaps adapter for Tauri builds
- [ ] Books stored as files on disk
- [ ] Metadata and chunks in SQLite
- [ ] Settings in secure store

### Testing Checklist
- [ ] Upload book → file saved to disk
- [ ] Book metadata in SQLite
- [ ] Reload app → book loads from file system
- [ ] Indexing works → chunks saved to SQLite
- [ ] Search works with SQLite-stored embeddings
- [ ] Highlights persist in SQLite
- [ ] API keys stored securely
- [ ] Delete book → file and DB records removed

---

## Phase 4: Desktop Polish

**Goal**: Native desktop experience enhancements.

### 4.1 File Associations

Register `.epub` file association in `tauri.conf.json`:

```json
{
  "bundle": {
    "fileAssociations": [
      {
        "ext": ["epub"],
        "mimeType": "application/epub+zip",
        "description": "EPUB Document"
      }
    ]
  }
}
```

Handle file open in Rust:

```rust
// src-tauri/src/main.rs
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Handle file opened via association
            if let Some(path) = std::env::args().nth(1) {
                // Emit event to frontend
                app.emit_all("open-file", path)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 4.2 Native File Picker

```typescript
// In Tauri adapter
import { open } from '@tauri-apps/plugin-dialog';

async pickEpubFile(): Promise<{ path: string; bytes: Uint8Array } | null> {
  const selected = await open({
    filters: [{ name: 'EPUB', extensions: ['epub'] }],
    multiple: false
  });

  if (!selected) return null;

  const bytes = await readFile(selected.path);
  return { path: selected.path, bytes };
}
```

### 4.3 Window Controls

```json
// tauri.conf.json
{
  "windows": [
    {
      "title": "Kruthi",
      "width": 1200,
      "height": 800,
      "minWidth": 600,
      "minHeight": 400,
      "decorations": true,
      "resizable": true,
      "fullscreen": false
    }
  ]
}
```

### 4.4 Native Menu

```rust
use tauri::Menu;

fn main() {
    let menu = Menu::new()
        .add_submenu(Submenu::new("File", Menu::new()
            .add_item(CustomMenuItem::new("open", "Open Book...").accelerator("CmdOrCtrl+O"))
            .add_separator()
            .add_item(CustomMenuItem::new("quit", "Quit").accelerator("CmdOrCtrl+Q"))
        ))
        .add_submenu(Submenu::new("View", Menu::new()
            .add_item(CustomMenuItem::new("fullscreen", "Toggle Fullscreen").accelerator("F11"))
            .add_item(CustomMenuItem::new("zoom-in", "Zoom In").accelerator("CmdOrCtrl+="))
            .add_item(CustomMenuItem::new("zoom-out", "Zoom Out").accelerator("CmdOrCtrl+-"))
        ));

    tauri::Builder::default()
        .menu(menu)
        .on_menu_event(|event| {
            match event.menu_item_id() {
                "open" => { /* emit event */ }
                "quit" => std::process::exit(0),
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error");
}
```

### 4.5 Auto Updates

```toml
# Cargo.toml
[dependencies]
tauri-plugin-updater = "2"
```

```json
// tauri.conf.json
{
  "plugins": {
    "updater": {
      "endpoints": ["https://releases.kruthi.app/{{target}}/{{current_version}}"],
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

### 4.6 App Icon & Branding

- Create icons: `src-tauri/icons/` (various sizes)
- Use `tauri icon` command to generate from source image
- Configure in `tauri.conf.json`

### Deliverables
- [ ] .epub file association works
- [ ] Native file picker for opening books
- [ ] Application menu with keyboard shortcuts
- [ ] Window remembers size/position
- [ ] Auto-update mechanism
- [ ] Proper app icons

### Testing Checklist
- [ ] Double-click .epub file → opens in Kruthi
- [ ] Cmd/Ctrl+O → native file picker
- [ ] Menu items work
- [ ] F11 → fullscreen toggle
- [ ] App updates when new version available

---

## Phase 5: Mobile (Capacitor) - Future

**Goal**: Mobile app for iOS and Android.

### 5.1 Initialize Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init Kruthi com.kruthi.app
npm install @capacitor/ios @capacitor/android
```

### 5.2 Add Required Plugins

```bash
npm install @capacitor/filesystem
npm install @capacitor-community/sqlite
npm install @capacitor/preferences
```

### 5.3 Implement Capacitor Adapter

Create `src/lib/platform/capacitor.ts`:
- Similar to Tauri adapter
- Use Capacitor Filesystem for EPUBs
- Use SQLite plugin for metadata/chunks
- Use Preferences for settings

### 5.4 Build Configuration

```typescript
// capacitor.config.ts
export default {
  appId: 'com.kruthi.app',
  appName: 'Kruthi',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};
```

### 5.5 Platform-Specific Considerations

| Concern | Solution |
|---------|----------|
| Smaller screens | Responsive typography, simplified UI |
| Touch gestures | Swipe navigation (already exists) |
| Battery | Defer/disable background indexing |
| Storage | Prompt before downloading large books |
| Keyboard | Virtual keyboard handling for notes |

### Deliverables
- [ ] Capacitor project setup
- [ ] `src/lib/platform/capacitor.ts` implementation
- [ ] iOS build working
- [ ] Android build working
- [ ] App store assets (icons, screenshots)

---

## Summary: Phase Dependency Graph

```
Phase 1: Platform Adapter ──────┐
(Foundation - must complete     │
 before any other phase)        │
                                ▼
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
        Phase 2: Tauri Setup      (Web app continues
        (Desktop shell)            working unchanged)
                    │
                    ▼
        Phase 3: Native Storage
        (SQLite + filesystem)
                    │
                    ▼
        Phase 4: Desktop Polish
        (File assoc, menus, updates)
                    │
                    ▼
        Phase 5: Mobile (Future)
        (Capacitor, iOS, Android)
```

## Quick Reference for Each Chat Session

### Starting Phase 1
> "I'm implementing Phase 1 of the cross-platform plan: Platform Adapter Abstraction. The goal is to create a PlatformAdapter interface and refactor the web app to use it. See docs/cross-platform-plan.md for details."

### Starting Phase 2
> "I'm implementing Phase 2: Tauri Desktop Setup. Phase 1 (adapter abstraction) is complete. The goal is to get the Svelte app running in a Tauri window. See docs/cross-platform-plan.md for details."

### Starting Phase 3
> "I'm implementing Phase 3: Tauri Native Storage. Phases 1-2 are complete. The goal is to implement SQLite + filesystem storage for the desktop app. See docs/cross-platform-plan.md for details."

### Starting Phase 4
> "I'm implementing Phase 4: Desktop Polish. Phases 1-3 are complete. The goal is to add native desktop features (file associations, menus, auto-update). See docs/cross-platform-plan.md for details."

---

## Estimated Effort

| Phase | Scope |
|-------|-------|
| Phase 1 | Interface + refactor existing code |
| Phase 2 | Tauri init + static build config |
| Phase 3 | SQLite schema + Tauri adapter implementation |
| Phase 4 | Native features + polish |
| Phase 5 | Capacitor setup + mobile adapter |

---

# Part 2: AI Reading Companion Evolution

> From "Quote Search Engine" → "Reading Buddy"

The following phases evolve the AI from basic Q&A into a true reading companion. These can be worked on in parallel with the platform phases above.

---

## Phase 6: Conversation Memory

**Goal**: The companion remembers what you discussed within a reading session.

### 6.1 Extend Chat Types

Update `src/lib/types/chat.ts`:

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt: number;
  // New fields
  chapterId?: string;        // Which chapter was active
  toolCalls?: ToolCall[];    // For transparency/debugging
}

interface ChatState {
  // ... existing fields
  messages: ChatMessage[];   // Now treated as conversation history
  maxHistoryTokens: number;  // Limit context usage (default: 8000)
}
```

### 6.2 Build Conversation Context

Create `src/lib/services/conversationContext.ts`:

```typescript
interface ConversationContext {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  tokenCount: number;
}

export function buildConversationContext(
  messages: ChatMessage[],
  maxTokens: number
): ConversationContext {
  // Take recent messages that fit within token budget
  // Prioritize: always include last exchange, then work backwards
  // Summarize older messages if needed
}

export function formatForPrompt(context: ConversationContext): string {
  // Format as conversation history for the LLM
}
```

### 6.3 Update LLM Service

Modify `streamAnswer` in `llm.ts`:

```typescript
interface AnswerParams {
  // ... existing
  conversationHistory?: ChatMessage[];  // New
}

// In the prompt building:
const messages = [
  // Previous conversation (trimmed to fit)
  ...conversationHistory.map(m => ({
    role: m.role,
    content: m.content
  })),
  // Current question with excerpts
  { role: 'user', content: prompt.user }
];
```

### 6.4 Update Chat Store

```typescript
// In sendQuestion:
const response = await streamAnswer({
  // ... existing params
  conversationHistory: stateSnapshot.messages.slice(-10) // Last 10 messages
});
```

### 6.5 Conversation-Aware Prompts

Update `prompts.ts`:

```typescript
const COMPANION_SYSTEM_INSTRUCTIONS = `You are a reading companion...

When the reader refers to previous discussion ("what you said", "earlier",
"that character"), use the conversation history to understand context.

If asked to clarify or expand on a previous answer, do so without
re-quoting the same passages unless specifically asked.`;
```

### Deliverables
- [ ] Extended chat types with conversation support
- [ ] `conversationContext.ts` for managing history
- [ ] LLM service accepts conversation history
- [ ] Chat store passes history to LLM
- [ ] Prompts updated for conversation awareness

### Testing Checklist
- [ ] Ask "What is this chapter about?" → get answer
- [ ] Follow up with "Tell me more about that" → uses context
- [ ] Ask "What did you mean by X?" → references previous answer
- [ ] Long conversations don't exceed token limits

---

## Phase 7: Better Retrieval

**Goal**: More precise citations, better relevance ranking.

### 7.1 Smaller Chunks

Update defaults in `retrieval.ts`:

```typescript
// Before
const DEFAULT_TARGET_TOKENS = 1000;
const DEFAULT_MAX_TOKENS = 1200;
const DEFAULT_OVERLAP_TOKENS = 150;

// After
const DEFAULT_TARGET_TOKENS = 400;
const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_OVERLAP_TOKENS = 100;
```

**Migration**: Add a re-indexing function for existing books.

### 7.2 Hybrid Search (BM25 + Embeddings)

Create `src/lib/services/bm25.ts`:

```typescript
export interface BM25Index {
  k1: number;      // Term frequency saturation (1.2-2.0)
  b: number;       // Length normalization (0.75)
  avgDocLength: number;
  docCount: number;
  termDocFreq: Map<string, number>;
}

export function buildBM25Index(chunks: Chunk[]): BM25Index;

export function scoreBM25(
  query: string,
  chunk: Chunk,
  index: BM25Index
): number;
```

Update `searchChunks`:

```typescript
export async function searchChunks(
  query: string,
  bookId: string,
  options: SearchOptions
): Promise<SearchResult[]> {
  const chunks = await getChunks(bookId, options);

  // Score with both methods
  const embeddingScores = await scoreByEmbeddings(query, chunks);
  const bm25Scores = scoreBM25Batch(query, chunks);

  // Reciprocal Rank Fusion
  const combined = reciprocalRankFusion([embeddingScores, bm25Scores]);

  return combined.slice(0, options.topK ?? 10);
}

function reciprocalRankFusion(
  rankings: SearchResult[][],
  k: number = 60
): SearchResult[] {
  // RRF: score = sum(1 / (k + rank_i))
  // Proven to work well for hybrid search
}
```

### 7.3 Reranking with Cross-Encoder (Optional - Desktop Only)

```typescript
// Only for desktop where we can afford extra model
import { pipeline } from '@xenova/transformers';

const reranker = await pipeline(
  'text-classification',
  'Xenova/ms-marco-MiniLM-L-6-v2'  // Cross-encoder reranker
);

async function rerank(
  query: string,
  chunks: Chunk[],
  topK: number
): Promise<Chunk[]> {
  const pairs = chunks.map(c => ({ text: `${query} [SEP] ${c.text}` }));
  const scores = await reranker(pairs);
  // Sort by score, return top K
}
```

### 7.4 More Context to LLM

```typescript
// Before
const DEFAULT_TOP_K = 6;

// After
const DEFAULT_TOP_K = 12;  // More context, still under Claude's limit
```

### Deliverables
- [ ] Reduced chunk size defaults
- [ ] Book re-indexing migration
- [ ] BM25 implementation
- [ ] Hybrid search with RRF
- [ ] Increased top-K results
- [ ] (Optional) Cross-encoder reranking for desktop

### Testing Checklist
- [ ] Search for specific phrase → finds exact match
- [ ] Search for concept → finds semantically related passages
- [ ] Citations point to precise locations, not whole pages
- [ ] Re-index existing book → smaller chunks created

---

## Phase 8: Summarization & Comprehension

**Goal**: Help readers understand, not just answer questions.

### 8.1 Chapter Summarization

Create `src/lib/services/summarization.ts`:

```typescript
interface SummaryOptions {
  type: 'brief' | 'detailed';
  focus?: 'plot' | 'themes' | 'characters';
}

interface ChapterSummary {
  id: string;
  bookId: string;
  chapterId: string;
  brief: string;           // 2-3 sentences
  detailed?: string;       // 2-3 paragraphs
  keyPoints: string[];     // Bullet points
  characters: string[];    // Characters appearing
  generatedAt: number;
}

export async function summarizeChapter(
  book: Book,
  chapterId: string,
  options: SummaryOptions
): Promise<ChapterSummary>;
```

### 8.2 "What happened so far" Recap

```typescript
export async function generateRecap(
  book: Book,
  upToChapter: number
): Promise<string> {
  // Aggregate summaries of chapters 1 to N
  // Generate cohesive "story so far" recap
}
```

### 8.3 Discussion Prompts

Create `src/lib/services/discussionPrompts.ts`:

```typescript
interface DiscussionPrompt {
  id: string;
  type: 'comprehension' | 'analysis' | 'reflection' | 'prediction';
  question: string;
  hint?: string;
  relatedChunkIds?: string[];
}

export async function generateDiscussionPrompts(
  book: Book,
  chapterId: string,
  count: number = 3
): Promise<DiscussionPrompt[]>;
```

**Prompt types**:
- **Comprehension**: "What motivated Character X to do Y?"
- **Analysis**: "How does the author use imagery in this chapter?"
- **Reflection**: "Have you ever felt like Character X in this situation?"
- **Prediction**: "What do you think will happen next? Why?"

### 8.4 UI Integration

Add to Reader component:
- "Summarize this chapter" button
- End-of-chapter prompt: "Would you like discussion questions?"
- "Recap" button when returning to a book

### 8.5 Storage for Summaries

Extend platform adapter:

```typescript
interface PlatformAdapter {
  // ... existing methods

  // Summaries
  saveSummary(summary: ChapterSummary): Promise<void>;
  getSummary(bookId: string, chapterId: string): Promise<ChapterSummary | null>;
}
```

### Deliverables
- [ ] `summarization.ts` service
- [ ] `discussionPrompts.ts` service
- [ ] Storage for cached summaries
- [ ] UI for summaries and discussion prompts
- [ ] "Recap" feature for returning readers

### Testing Checklist
- [ ] Summarize chapter → coherent, spoiler-free summary
- [ ] Generate discussion prompts → varied, thought-provoking
- [ ] Summaries cache and don't regenerate unnecessarily
- [ ] Recap covers multiple chapters coherently

---

## Phase 9: Vocabulary & Learning

**Goal**: Track words looked up, build vocabulary over time.

### 9.1 Vocabulary Types

Create `src/lib/types/vocabulary.ts`:

```typescript
interface VocabularyEntry {
  id: string;
  word: string;
  definition: string;
  etymology?: string;
  context: string;           // Sentence where it appeared
  bookId: string;
  bookTitle: string;
  chapterId: string;
  lookedUpAt: number;
  reviewCount: number;
  lastReviewedAt?: number;
  mastered: boolean;
}
```

### 9.2 Vocabulary Service

Create `src/lib/services/vocabulary.ts`:

```typescript
export async function addVocabularyEntry(
  word: string,
  definition: string,
  context: VocabularyContext
): Promise<VocabularyEntry>;

export async function getVocabularyForBook(bookId: string): Promise<VocabularyEntry[]>;
export async function getAllVocabulary(): Promise<VocabularyEntry[]>;
export async function getWordsForReview(count: number): Promise<VocabularyEntry[]>;
```

### 9.3 Auto-Capture from "Define" Action

Update `highlightActions.ts` to return structured vocabulary data when action is "define".

### 9.4 Vocabulary UI

Create `src/lib/components/vocabulary/`:
- `VocabularyPanel.svelte` - Sidebar showing words
- `VocabularyCard.svelte` - Individual word card
- `VocabularyReview.svelte` - Flashcard-style review

### 9.5 Spaced Repetition

Simple SM-2 inspired algorithm for scheduling reviews.

### 9.6 Vocabulary Page

Add `/vocabulary` route:
- List all vocabulary words
- Filter by book
- Review mode (flashcards)
- Export to Anki format

### Deliverables
- [ ] Vocabulary types and storage
- [ ] Vocabulary service
- [ ] Auto-capture from Define action
- [ ] Vocabulary UI components
- [ ] Spaced repetition logic
- [ ] `/vocabulary` page
- [ ] Export to Anki

### Testing Checklist
- [ ] Define a word → automatically saved to vocabulary
- [ ] View vocabulary for current book
- [ ] Flashcard review works
- [ ] Spaced repetition schedules appropriately

---

## Phase 10: Deep Analysis

**Goal**: Sophisticated literary analysis using Claude's full capabilities.

### 10.1 Extended Thinking

Update `llm.ts` to support extended thinking:

```typescript
interface AnswerParams {
  // ... existing
  useExtendedThinking?: boolean;
  thinkingBudget?: number;  // tokens for thinking (default: 8000)
}
```

### 10.2 Analysis Types

Create `src/lib/services/analysis.ts`:

```typescript
type AnalysisType =
  | 'theme'           // Identify and explore themes
  | 'character'       // Character analysis
  | 'style'           // Writing style, literary devices
  | 'historical'      // Historical context
  | 'comparison';     // Compare to other works

export async function performAnalysis(
  request: AnalysisRequest,
  onToken?: (delta: string) => void
): Promise<AnalysisResult>;
```

### 10.3 Theme Tracking

```typescript
interface ThemeTracker {
  bookId: string;
  themes: Array<{
    name: string;
    description: string;
    occurrences: Array<{ chapterId: string; quote: string; analysis: string }>;
    evolution: string;
  }>;
}

export async function trackTheme(book: Book, themeName: string): Promise<ThemeTracker>;
export async function identifyThemes(book: Book): Promise<string[]>;
```

### 10.4 Character Tracking

```typescript
interface CharacterProfile {
  name: string;
  aliases: string[];
  description: string;
  firstAppearance: { chapterId: string; quote: string };
  relationships: Array<{ character: string; relationship: string }>;
  arc: string;
  keyMoments: Array<{ chapterId: string; quote: string; significance: string }>;
}

export async function buildCharacterProfile(book: Book, name: string): Promise<CharacterProfile>;
export async function identifyCharacters(book: Book): Promise<string[]>;
```

### Deliverables
- [ ] Extended thinking support in LLM service
- [ ] Analysis service with multiple types
- [ ] Theme tracking
- [ ] Character profiling
- [ ] Analysis storage and caching
- [ ] UI for analysis features

### Testing Checklist
- [ ] Complex question → uses extended thinking
- [ ] Theme analysis identifies major themes with evidence
- [ ] Character profile captures relationships and arc
- [ ] Analysis results are cached and reusable

---

## Phase 11: Personalization

**Goal**: The companion adapts to the reader's level and interests.

### 11.1 Reader Profile

```typescript
interface ReaderProfile {
  id: string;
  vocabularyLevel: 'beginner' | 'intermediate' | 'advanced';
  comprehensionLevel: 'casual' | 'engaged' | 'analytical';
  preferredExplanationDepth: 'brief' | 'moderate' | 'detailed';
  interestedIn: string[];  // e.g., ['character psychology', 'historical context']
  questionsAsked: number;
  wordsLookedUp: number;
  helpfulResponses: string[];
  unhelpfulResponses: string[];
}
```

### 11.2 Adaptive Prompts

```typescript
function buildAdaptiveSystemPrompt(
  profile: ReaderProfile,
  basePrompt: string
): string {
  // Adjust instructions based on reader's level and preferences
}
```

### 11.3 Feedback Loop

Add to chat messages:
- 👍 Helpful / 👎 Not helpful buttons
- Use feedback to adjust explanation depth and style

### 11.4 Proactive Assistance

Based on profile, offer help when:
- Reading slowly on complex chapter
- Many unfamiliar words encountered
- Approaching plot-critical section

### Deliverables
- [ ] Reader profile types and storage
- [ ] Profile inference from behavior
- [ ] Adaptive prompt building
- [ ] Feedback UI
- [ ] Proactive assistance offers
- [ ] Reader profile stored via platform adapter (IndexedDB/SQLite)

### Testing Checklist
- [ ] After many word lookups → vocabulary level adjusts
- [ ] Marking responses helpful/unhelpful → changes style
- [ ] Proactive help offered at appropriate moments

---

## Complete Phase Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                      PLATFORM TRACK                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 1: Adapter ──► Phase 2: Tauri ──► Phase 3: Native Storage│
│       │                                        │                │
│       │                                        ▼                │
│       │                              Phase 4: Desktop Polish    │
│       │                                        │                │
│       │                                        ▼                │
│       │                              Phase 5: Mobile (Future)   │
│       │                                                         │
└───────┼─────────────────────────────────────────────────────────┘
        │
        │ (Phase 1 enables clean storage for AI features)
        │
┌───────┼─────────────────────────────────────────────────────────┐
│       │                 AI COMPANION TRACK                       │
├───────┼─────────────────────────────────────────────────────────┤
│       │                                                         │
│       └──► Phase 6: Conversation Memory                         │
│                    │                                            │
│                    ▼                                            │
│            ┌───────┴────────┐                                   │
│            ▼                ▼                                   │
│     Phase 7: Retrieval    Phase 8: Summarization                │
│            │                │                                   │
│            └───────┬────────┘                                   │
│                    ▼                                            │
│            ┌───────┴────────┐                                   │
│            ▼                ▼                                   │
│     Phase 9: Vocabulary   Phase 10: Deep Analysis               │
│            │                │                                   │
│            └───────┬────────┘                                   │
│                    ▼                                            │
│           Phase 11: Personalization                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Reference for AI Phases

### Starting Phase 6
> "I'm implementing Phase 6: Conversation Memory. The goal is to make the chat remember previous messages. See docs/cross-platform-plan.md for details."

### Starting Phase 7
> "I'm implementing Phase 7: Better Retrieval. Phase 6 is complete. The goal is smaller chunks, hybrid search, and better ranking. See docs/cross-platform-plan.md for details."

### Starting Phase 8
> "I'm implementing Phase 8: Summarization & Comprehension. The goal is chapter summaries and discussion prompts. See docs/cross-platform-plan.md for details."

### Starting Phase 9
> "I'm implementing Phase 9: Vocabulary & Learning. The goal is to track looked-up words and enable review. See docs/cross-platform-plan.md for details."

### Starting Phase 10
> "I'm implementing Phase 10: Deep Analysis. Phases 6-7 should be complete. The goal is extended thinking, theme tracking, and character analysis. See docs/cross-platform-plan.md for details."

### Starting Phase 11
> "I'm implementing Phase 11: Personalization. The goal is adaptive responses based on reader behavior. See docs/cross-platform-plan.md for details."

---

## Open Questions to Decide Later

1. **Sync between platforms?** - Could add optional cloud sync in future
2. **Mobile feature parity?** - Maybe disable AI on mobile for battery?
3. **Update distribution?** - GitHub releases? Custom update server?
4. **Code signing?** - Required for macOS notarization, Windows SmartScreen
5. **Extended thinking costs** - More tokens = higher API cost. Make opt-in?
6. **Cross-book features** - Worth the complexity? Maybe Phase 12?
