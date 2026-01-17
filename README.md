# Kruthi

A trust-first EPUB reader with refined typography, continuous scroll, and a retrieval backend that can surface quoted passages from the book. Everything runs locally in the browser: uploads, storage, and retrieval indexing.

## Status

- Web app: Phase 5 (Deploy + polish) complete.
- Cross-platform: Phase 4 (Desktop polish) complete; Phase 5 (Mobile/Capacitor) complete.
- AI companion: Phase 11 (Personalization) complete.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[![Deploy to Cloudflare Pages](https://deploy.cloudflare.com/button)](https://deploy.cloudflare.com/?url=https://github.com/bebhuvan/kruthi)

Replace `bebhuvan/kruthi` with your fork URL.

Roadmaps and platform notes live in `docs/cross-platform-plan.md`.

## Downloads

- Desktop installers: https://github.com/bebhuvan/kruthi/releases
- Web: deploy to Cloudflare Pages (recommended) or any static host
- Mobile: build from `android/` or `ios/` (see `docs/releasing.md`)

## Features

Phase 1 (Reader)
- Local EPUB upload and library
- Continuous scroll reading
- Chapter navigation with TOC sidebar
- Reading position persistence (IndexedDB)
- Light/dark/sepia theme toggle
- Typography controls (font family + size + width)
- Expanded reading fonts (Literata, Lora, Merriweather, Cormorant Garamond, Libre Baskerville)
- Responsive layout for mobile

Phase 2 (Retrieval)
- Chunking pipeline (400–500 token target, 100 overlap)
- Paragraph-aware chunking with long-paragraph splitting
- In-browser embeddings via `@xenova/transformers`
- BM25 fallback when embeddings are unavailable
- Chunk + embedding storage in IndexedDB
- Retrieval API: `searchChunks(bookId, query, { scope, topK })`

Phase 3 (AI — Citations & Trust)
- Anthropic API integration with streaming responses
- OpenRouter integration (OpenAI-compatible streaming)
- OpenAI and Gemini direct integrations (streaming)
- Prompt caching for book excerpts
- Chat panel with message history and scope toggle
- Chat modes: Grounded (quote-first) and Companion (interpretive context)
- Quote-first answers with chunk citations
- Settings modal for API keys and models (Anthropic/OpenRouter/OpenAI/Gemini)
- Refusal handling for missing answers

Phase 4 (Selection Actions)
- Text selection detection with CFI capture
- Inline action menu for Explain / Define
- Streamed responses via Anthropic, OpenRouter, OpenAI, or Gemini
- Context-aware prompts using surrounding paragraphs
- Dictionary-first definitions (Webster's 1913) with AI fallback
- Selection action responses are ephemeral (highlights are saved separately)

Phase 5 (Deploy)
- Cloudflare Pages-ready build output
- Deployment docs + architecture notes
- UI empty/loading/error states

Phase 6 (Conversation Memory)
- Conversation-aware follow-up questions in chat
- Token-budgeted history trimming for long sessions

Phase 7 (Better Retrieval)
- Smaller chunks for tighter citations
- Hybrid ranking (BM25 + embeddings) with reciprocal rank fusion
- Reindexing helper for older books

Phase 8 (Summarization & Comprehension)
- Chapter summaries (brief + detailed, cached)
- Discussion prompts (comprehension/analysis/reflection/prediction)
- "Recap so far" flow for returning readers

Phase 9 (Vocabulary & Learning)
- Vocabulary capture from Define actions
- Vocabulary library with filters and search
- Spaced repetition review flow
- Anki-ready export (TSV)

Phase 10 (Deep Analysis)
- Extended thinking support for Claude
- Deep analysis modes (style, historical context, comparison)
- Theme tracking across chapters
- Character profiling with relationships and arcs

Phase 11 (Personalization)
- Reader profile inference (vocabulary level, comprehension level, preferred depth)
- Adaptive prompts tuned to reader preferences
- Helpful / Not helpful feedback on assistant responses
- Proactive assistance suggestions in chat

Cross-Platform (Desktop)
- Tauri desktop shell running the web adapter
- Static build config for desktop packaging
- Native storage (filesystem + SQLite) behind the platform adapter
- Native file picker + .epub file associations
- Desktop menu (Open Book, fullscreen) and window state persistence
- Updater configuration scaffolded in `src-tauri/tauri.conf.json`

Cross-Platform (Mobile)
- Capacitor iOS and Android native projects
- Capacitor platform adapter (filesystem + SQLite + preferences)
- Static build output synced to native platforms
- Build scripts: `npm run cap:ios` / `npm run cap:android`

Highlights & Notes
- Persistent highlights stored in IndexedDB
- Notes attached to highlights (edit any time)
- Highlights library with search + book filtering
- Export highlights to Markdown or print-ready PDF
- Multiple highlight colors (yellow, green, blue, pink, orange)
- Theme-aware highlight colors for light/dark/sepia modes

Design & Typography
- Refined typography system with optical sizing and improved kerning
- Better drop caps and scene breaks for chapter starts
- Generative book covers (unique covers based on title/author)
- Visual reading progress bar with toggle in settings
- Enhanced focus mode with gradient spotlight effect
- Paper texture option for tactile feel
- Hyphenation support for justified text
- Staggered entry animations throughout

Planned (Storage)
- Local persistence for chat history and highlight responses (IndexedDB, per book).
- Optional Cloudflare sync for multi-device access (Worker + KV/R2 + auth).

## Open Source

- License: MIT (see `LICENSE`)
- Code of conduct: `CODE_OF_CONDUCT.md`
- Security policy: `SECURITY.md`
- Third-party notices: `NOTICE.md`
- Release guide: `docs/releasing.md`

## Architecture Overview

- `src/lib/services/epub.ts`: EPUB parsing and chapter extraction
- `src/lib/platform/types.ts`: platform adapter interface
- `src/lib/platform/web.ts`: web adapter (IndexedDB + localStorage)
- `src/lib/platform/index.ts`: adapter entry point
- `src/lib/platform/tauri.ts`: Tauri adapter (filesystem + SQLite + store)
- `src/lib/platform/capacitor.ts`: Capacitor adapter (filesystem + SQLite + preferences)
- `src-tauri/tauri.conf.json`: Tauri build and window configuration
- `src-tauri/migrations/001_init.sql`: SQLite schema for desktop storage
- `vite.config.tauri.ts`: Vite config for Tauri builds (swaps platform adapter, defines TAURI env)
- `vite.config.capacitor.ts`: Vite config for Capacitor builds (swaps platform adapter, defines CAPACITOR env)
- `capacitor.config.ts`: Capacitor project configuration
- `src-tauri/capabilities/default.json`: Tauri permissions (dialog/updater/fs)
- `src/lib/services/retrieval.ts`: chunking, embeddings, and search
- `src/lib/services/bm25.ts`: BM25 indexing and scoring
- `src/lib/services/llm.ts`: streaming chat integration (Anthropic/OpenRouter/OpenAI/Gemini)
- `src/lib/services/highlightActions.ts`: highlight streaming (Anthropic/OpenRouter/OpenAI/Gemini)
- `src/lib/services/highlights.ts`: highlight persistence + DOM range helpers
- `src/lib/services/summarization.ts`: chapter summaries + recap generation
- `src/lib/services/discussionPrompts.ts`: discussion prompt generation
- `src/lib/services/analysis.ts`: deep analysis, theme tracking, character profiling
- `src/lib/services/llmText.ts`: shared text streaming for summaries/prompts
- `src/lib/services/personalization.ts`: reader profile inference + adaptive prompt guidance
- `src/lib/services/vocabulary.ts`: vocabulary capture + spaced repetition scheduling
- `src/lib/services/dictionary.ts`: bundled dictionary lookup for definition actions
- `src/lib/services/openrouter.ts`: OpenRouter streaming helper
- `src/lib/services/openai.ts`: OpenAI streaming helper
- `src/lib/services/gemini.ts`: Gemini streaming helper
- `src/lib/services/prompts.ts`: prompt templates and citation parsing
- `src/lib/services/conversationContext.ts`: conversation history trimming and formatting
- `src/lib/stores/bookStore.ts`: book lifecycle + background indexing trigger
- `src/lib/stores/chatStore.ts`: chat state + streaming updates
- `src/lib/stores/readerProfileStore.ts`: reader profile state + session signals
- `src/lib/stores/settingsStore.ts`: persisted user settings with theme/font/highlight colors
- `src/lib/utils/coverGenerator.ts`: deterministic generative book cover algorithm
- `src/lib/components/GenerativeCover.svelte`: SVG-based book cover component
- `src/lib/components/reader/SelectionMenu.svelte`: selection popover UI
- `src/lib/components/reader/ActionResponse.svelte`: highlight response panel
- `src/lib/components/reader/HighlightNote.svelte`: note editor popover
- `src/lib/components/reader/SummaryPanel.svelte`: chapter summary + recap drawer
- `src/lib/components/reader/AnalysisPanel.svelte`: deep analysis, themes, and character profiles
- `src/lib/components/vocabulary/VocabularyPanel.svelte`: vocabulary sidebar list
- `src/lib/components/vocabulary/VocabularyCard.svelte`: vocabulary detail card
- `src/lib/components/vocabulary/VocabularyReview.svelte`: review flow UI
- `src/routes/highlights/+page.svelte`: highlights library
- `src/routes/highlights/export/+page.svelte`: print-ready PDF export
- `src/routes/vocabulary/+page.svelte`: vocabulary library and review
- `src/lib/utils/tokenizer.ts`: tokenization + token counting
- `src/lib/types/*`: core interfaces and errors
- `src/lib/types/analysis.ts`: deep analysis types and cache entries
- `src/lib/types/readerProfile.ts`: reader profile, session, and feedback types
- `static/dictionaries/websters.json(.gz)`: bundled Webster's 1913 dictionary data

## Retrieval Pipeline

1. **Book load:** `bookStore` loads an EPUB and starts `indexBook()` in the background.
2. **Chunking:** chapters are split into chunks using token-based sizes, preserving paragraph boundaries when possible.
3. **Storage:** chunks are stored in IndexedDB (`chunks` store) keyed by `chunkId`, with indexes for `bookId` and `bookId:chapterId`.
4. **Embeddings:** if `@xenova/transformers` is available, embeddings are generated for each chunk and persisted.
5. **Search:** `searchChunks()` runs a hybrid ranker (BM25 + embeddings) and fuses results with reciprocal rank fusion. If embeddings are missing, it falls back to BM25-only ranking.

## Data Model (Phase 11)

```
Book {
  id, title, author,
  chapters: Chapter[],
  toc: TocItem[]
}

Chapter {
  id, title, href, html
}

Chunk {
  id, bookId, chapterId, chapterTitle,
  bookChapter, text,
  offsetStart, offsetEnd,
  embedding?, embeddingModel?
}

ChatMessage {
  id, role, content,
  citations?, createdAt, notFound?,
  chapterId?, feedback?
}

ChatState {
  scope, mode, maxHistoryTokens
}

Citation {
  chunkId, chapterId?, chapterTitle?, quote
}

Settings {
  theme, fontFamily, fontSize,
  lineHeight, paragraphSpacing, readingWidth,
  paragraphIndent, paperTexture, swipeNavigation,
  textAlign, focusMode,
  showReadingProgress, highlightColor,
  llmProvider, anthropicApiKey,
  openRouterApiKey, openRouterModel,
  systemPrompt
}

ReaderProfile {
  id,
  vocabularyLevel, comprehensionLevel,
  preferredExplanationDepth,
  interestedIn[],
  questionsAsked, wordsLookedUp,
  helpfulResponses[], unhelpfulResponses[],
  updatedAt
}

ChapterSummary {
  id, bookId, chapterId,
  brief, detailed?,
  keyPoints[], characters[],
  generatedAt
}

DiscussionPrompt {
  id, type, question,
  hint?
}

AnalysisResult {
  id, bookId, type,
  chapterId?, subject?,
  response, generatedAt
}

ThemeTracker {
  id, bookId, theme,
  description, occurrences[],
  evolution, generatedAt
}

CharacterProfile {
  id, bookId, name,
  aliases[], description,
  firstAppearance, relationships[],
  arc, keyMoments[],
  generatedAt
}

HighlightSelection {
  bookId, chapterId, chapterTitle,
  selectedText, context, cfi?
}

Highlight {
  id, bookId, bookTitle, author,
  chapterId, chapterTitle, bookChapter,
  selectedText, context, cfi?,
  range?, note?, createdAt, updatedAt
}

VocabularyEntry {
  id, word, definition, etymology?,
  context, bookId, bookTitle, chapterId,
  lookedUpAt, reviewCount, lastReviewedAt?,
  mastered
}
```

## IndexedDB Storage

Database: `reading-companion` (version 7)

Stores:
- `books`: stored EPUB blobs + metadata
- `positions`: reading position per book
- `chunks`: retrieval chunks + embeddings
- `highlights`: saved highlights + notes
- `summaries`: cached chapter summaries
- `vocabulary`: saved vocabulary entries + review metadata
- `analysis_cache`: deep analysis, theme, and character caches
- `reader_profile`: personalization profile + feedback history

Planned additions:
- `conversations`: chat history per book

## Cloudflare Sync (Optional)

Local storage is the default for privacy. A future optional sync would store encrypted user data in Cloudflare (Worker + KV/R2) for cross-device access. This is not required for V1.

If you already have a local DB from Phase 1, the upgrade is automatic when the app next loads.

## Retrieval Usage

```ts
import { indexBook, searchChunks } from '$lib/services/retrieval';

await indexBook(book);
const results = await searchChunks('Who is Pierre?', book.id, {
  scope: 'whole_book',
  topK: 12
});
```

If you need to rebuild smaller chunks for an existing book:

```ts
import { reindexBook } from '$lib/services/retrieval';

await reindexBook(book);
```

## AI Chat Usage

1. Open a book.
2. Click "Settings" and choose Anthropic, OpenRouter, OpenAI, or Gemini.
3. Enter your API key (and model for OpenRouter/OpenAI/Gemini).
   - Presets include Claude 4.5, OpenAI GPT-5.2, GPT-4o mini, Gemini 3 (preview), Qwen3, Kimi K2, and Z.AI GLM 4.7, plus a custom model field.
4. Click "Ask" to open the chat panel.
5. Choose Grounded (quote-first) or Companion (interpretive context) mode.
6. Submit a question.
7. Mark responses Helpful/Not helpful to tune future explanations.

## Selection Actions Usage

1. Select text in the reader.
2. Choose "Explain" or "Define" from the popover.
3. Read the streamed response anchored to the selection (not saved).

## Summaries & Recap Usage

1. Click "Summary" in the reader header to generate a chapter summary.
2. Use the discussion prompts tab to spark comprehension or analysis questions.
3. When returning to a book, click "Recap" to generate a story-so-far overview.

## Highlights Usage

1. Select text in the reader.
2. Choose "Highlight" or "Note" from the popover.
3. Visit `/highlights` to view, edit, or remove notes.
4. Export to Markdown or PDF from the Highlights page.

## Deploy to Cloudflare Pages

1. Fork this repo.
2. Click the "Deploy to Cloudflare Pages" button above.
3. Set the build command to `npm run build`.
4. Set the build output directory to `.svelte-kit/cloudflare`.
5. Deploy, then open the site and add your API key in Settings (Anthropic/OpenRouter/OpenAI/Gemini).

You can also deploy from the CLI:

```bash
npm install
npm run build
npx wrangler pages deploy .svelte-kit/cloudflare
```

More details in `docs/setup.md`.

### Pages vs Workers

The current app is fully client-side, so Pages is the simplest deployment. If you want edge logic (API proxy, auth, secrets), add a Worker later. See `docs/setup.md` for a Workers-oriented note.

## Local Development

```bash
npm install
npm run dev
```

## Desktop Development (Tauri)

```bash
npm run dev:tauri
```

Tauri uses `vite.config.tauri.ts` to swap the platform adapter and enable the `TAURI` environment flag.

## Mobile Development (Capacitor)

Build and sync web assets to native platforms:

```bash
npm run cap:sync
```

Open in Xcode (iOS):

```bash
npm run cap:ios
```

Open in Android Studio:

```bash
npm run cap:android
```

Capacitor uses `vite.config.capacitor.ts` to swap the platform adapter and enable the `CAPACITOR` environment flag. The native projects are in `ios/` and `android/`.

## PWA

Kruthi ships as a Progressive Web App. Install it from your browser menu for offline-friendly reading. The service worker caches the app shell and recent assets.

## Testing

```bash
npm run test
npm run check
```

## Why Quote-First Citations

Kruthi never invents quotes. Every answer shows the exact passages first, with citations back to the book, and refuses to answer when the text is missing. That keeps trust anchored to the book, not the model.

## Architecture Overview

The app is fully client-side: EPUB parsing, storage, retrieval, and AI calls all run in the browser. IndexedDB stores books, reading progress, and chunk embeddings via the platform adapter. Anthropic, OpenRouter, OpenAI, or Gemini is called directly from the client for chat and highlight actions, using streaming for fast feedback.

For the full walkthrough, see `docs/architecture.md`.

## Project Layout

```
.
├── docs/
│   ├── architecture.md
│   ├── cross-platform-plan.md
│   └── setup.md
├── src-tauri/                  # Tauri desktop project
│   ├── src/
│   └── tauri.conf.json
├── ios/                        # Capacitor iOS project
│   └── App/
├── android/                    # Capacitor Android project
│   └── app/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── reader/
│   │   │   ├── ai/
│   │   │   └── common/
│   │   ├── services/
│   │   │   ├── curatedDownload.ts
│   │   │   ├── epub.ts
│   │   │   ├── gemini.ts
│   │   │   ├── highlightActions.ts
│   │   │   ├── highlights.ts
│   │   │   ├── llm.ts
│   │   │   ├── openai.ts
│   │   │   ├── openrouter.ts
│   │   │   ├── prompts.ts
│   │   │   └── retrieval.ts
│   │   ├── platform/
│   │   │   ├── index.ts
│   │   │   ├── capacitor.ts
│   │   │   ├── tauri.ts
│   │   │   ├── types.ts
│   │   │   └── web.ts
│   │   ├── stores/
│   │   │   ├── bookStore.ts
│   │   │   ├── chatStore.ts
│   │   │   └── settingsStore.ts
│   │   ├── types/
│   │   │   ├── book.ts
│   │   │   ├── chat.ts
│   │   │   ├── errors.ts
│   │   │   ├── highlight.ts
│   │   │   ├── retrieval.ts
│   │   │   └── settings.ts
│   │   └── utils/
│   │       └── tokenizer.ts
│   ├── routes/
│   │   ├── +page.svelte
│   │   └── read/+page.svelte
│   └── app.html
├── capacitor.config.ts         # Capacitor configuration
├── vite.config.capacitor.ts    # Vite config for mobile builds
├── vite.config.tauri.ts        # Vite config for desktop builds
```
