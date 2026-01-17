# Architecture

Kruthi is fully client-side. Books are parsed in the browser, chunks and embeddings are stored in IndexedDB via a platform adapter, and AI calls go directly to Anthropic, OpenRouter, OpenAI, or Gemini. A service worker provides the PWA shell cache.

## High-Level Flow

```
EPUB upload
  -> epub.js parsing
  -> sanitized chapter HTML
  -> chunking + embeddings
  -> IndexedDB storage (platform adapter)
  -> hybrid retrieval search (BM25 + embeddings)
  -> LLM responses
  -> dictionary lookup for define actions
  -> cached summaries + discussion prompts
  -> vocabulary capture + review scheduling
  -> reader profile + adaptive prompt hints
  -> analysis cache (themes, character profiles, deep analysis)
```

## Desktop Shell (Tauri)

Phase 2 adds a Tauri wrapper that loads the same static Svelte app. The desktop build swaps in `svelte.config.tauri.js` and `vite.config.tauri.ts` to generate a static bundle, and uses a Vite alias to swap `$lib/platform/index` to the Tauri adapter at build time.

## Desktop Native Storage (Tauri)

Phase 3 moves desktop persistence to filesystem + SQLite via the Tauri adapter:

- EPUB files stored under the app data `books/` directory.
- SQLite database stores metadata, positions, chunks, and highlights.
- Tauri Store persists settings and secure values.

```
App data
├── kruthi.db
├── settings.json
├── secure.json
└── books/
    └── {book-id}.epub
```

## Desktop Polish (Tauri)

Phase 4 adds native desktop affordances:
- Application menu with Open Book (Cmd/Ctrl+O) and fullscreen toggle.
- File associations for `.epub` with an app-level `open-file` event.
- Window size/position persistence stored in localStorage.
- Updater configuration scaffolded in `src-tauri/tauri.conf.json`.

## Key Modules

- `src/lib/services/epub.ts`: EPUB parsing, chapter extraction, CFI helpers.
- `src/lib/services/retrieval.ts`: chunking, embeddings, hybrid search + RRF.
- `src/lib/services/bm25.ts`: BM25 indexing and scoring for lexical ranking.
- `src/lib/services/llm.ts`: streaming chat responses with citations.
- `src/lib/services/conversationContext.ts`: conversation history trimming and prompt formatting.
- `src/lib/services/highlightActions.ts`: highlight explain/define requests.
- `src/lib/services/highlights.ts`: highlight persistence + DOM range helpers.
- `src/lib/services/summarization.ts`: chapter summaries + recap generation.
- `src/lib/services/discussionPrompts.ts`: discussion prompt generation.
- `src/lib/services/llmText.ts`: shared text streaming for summary flows.
- `src/lib/services/analysis.ts`: deep analysis, theme tracking, character profiling.
- `src/lib/services/personalization.ts`: reader profile inference + adaptive prompt hints.
- `src/lib/services/vocabulary.ts`: vocabulary capture + spaced repetition scheduling.
- `src/lib/services/dictionary.ts`: bundled dictionary lookup for definitions.
- `src/lib/services/openrouter.ts`: OpenRouter streaming helper.
- `src/lib/services/openai.ts`: OpenAI streaming helper.
- `src/lib/services/gemini.ts`: Gemini streaming helper.
- `src/lib/platform/types.ts`: platform adapter interface.
- `src/lib/platform/web.ts`: IndexedDB/localStorage implementation.
- `src/lib/platform/tauri.ts`: filesystem + SQLite implementation for desktop.
- `src/lib/stores/readerProfileStore.ts`: reader profile state + session signals.
- `src-tauri/tauri.conf.json`: Tauri app configuration and build hooks.
- `src-tauri/migrations/001_init.sql`: SQLite schema for native storage.
- `vite.config.tauri.ts`: Tauri-specific Vite config.
- `svelte.config.tauri.js`: Static SvelteKit adapter for Tauri builds.

## Retrieval Strategy

- Chunk targets are tuned for tighter citations (400-500 tokens, 100 overlap).
- BM25 provides lexical precision; embeddings provide semantic recall.
- Reciprocal rank fusion (RRF) combines both rankings for the final result set.

## Data Storage

IndexedDB database (web adapter): `reading-companion`

Stores:
- `books`: EPUB blobs and metadata.
- `positions`: reading position by book.
- `chunks`: chunk text, metadata, embeddings.
- `highlights`: persistent highlights + notes.
- `summaries`: cached chapter summaries.
- `vocabulary`: looked-up words with review metadata.
- `analysis_cache`: cached deep analysis, theme tracking, character profiles.
- `reader_profile`: reader personalization profile + feedback history.

Bundled assets:
- `static/dictionaries/websters.json(.gz)`: offline definitions for the Define action.

## Trust Model

Grounded mode is quote-first and refuses when the book does not contain relevant text. Companion mode allows labeled interpretive context without quotes when excerpts are not relevant.
