# Kruthi — Consolidated Plan

## Vision

A beautiful, trust-first reading companion for public domain classics. Quote-first answers with citations, crafted typography, and AI that helps you understand hard books without making things up.

**Core Philosophy:** Show the evidence first, then explain. Never invent quotes. Refuse to answer if the book doesn't contain it.

**Inspiration:** Alexandria.wiki, Karpathy's reader3, Kindle/Kobo reading quality

**Distribution:** Open source, self-hosted. Users deploy to their own Cloudflare account. No central server, complete privacy.

---

## Scope: Phased Approach

### V1 — Core MVP (Ship This First)

**Reader (minimal, polished)**
- EPUB support (local uploads only)
- Continuous scroll (no pagination yet)
- Chapter navigation + TOC
- Reading position persistence
- Clean typography (one good serif font, sensible defaults)
- Basic theming: light + dark
- Font size control only

**AI — Trust-First (core differentiator)**
- Highlight-to-ask: select text → Explain / Define
- General chat panel for broader questions
- **Quote-first answers** with citations
- **Scope toggle:** "Current chapter" vs "Whole book"
- **Refuse when uncertain:** "I could not find this in the book"

**Retrieval**
- Chunk books (800-1200 tokens, overlap)
- Embed + vector search for "whole book" scope
- Top-k retrieval with citations

**Infrastructure**
- Anthropic API direct (for caching + tools)
- Self-hosted on Cloudflare Pages
- Local storage only (no Workers/R2 yet)

**V1 is done when:** A user can load an EPUB, read it, highlight text to get explanations, ask questions with cited answers, and deploy to their own Cloudflare.

---

### V1.5 — Polish & Features

- Pagination mode (toggle with scroll)
- Sepia theme
- Full typography controls (font family, line-height, margins)
- Translate / Simplify actions
- Vocabulary list (save looked-up words)
- Chapter summaries + "Where was I?"
- Bookmarks
- Search within book
- Curated catalog: 10-20 pre-indexed classics on R2
- Cloudflare Workers for API proxy

---

### V2 — Advanced

- Character tracker (progressive, with relationships)
- Annotations (user notes)
- Export notes/highlights to Markdown
- Discussion prompts
- Extended thinking mode for deep analysis
- Gutenberg search + download integration
- PWA: offline reading, installable
- OpenRouter as alternative provider

---

### Future

- Cloud sync (auth, backend)
- Reading stats / streaks
- Spaced repetition for vocabulary
- Audio: TTS, pronunciation
- Native mobile app
- Multi-book RAG ("themes across Dostoevsky")

---

## User Flow

1. Pick a book (curated list or upload EPUB)
2. Read (continuous scroll or paginated, user's choice)
3. Highlight text → quick action (Explain / Define / Translate)
4. Or ask a question in chat → set scope (chapter or whole book)
5. See **quoted passages** from the book with citations
6. See **explanation** grounded in those quotes
7. (Optional) Expand "Context" for historical/external background

---

## Technical Architecture

### Stack
- **Frontend:** SvelteKit + Tailwind + custom typography CSS
- **EPUB Rendering:** epub.js
- **Storage:** IndexedDB (local books, progress), R2 (curated catalog)
- **Embeddings:** Cloudflare Vectorize (or in-browser for small catalogs)
- **API:** Cloudflare Workers
- **LLM:** OpenRouter API (via Worker proxy)

### Ingestion & Parsing
- Source: EPUB (Gutenberg + user upload)
- Parse: epub.js for chapters and text extraction
- Normalize: strip whitespace, remove Gutenberg boilerplate
- Chapter detection: use EPUB TOC; fallback to regex for plain text

### Chunking
- Target size: 800-1200 tokens per chunk
- Overlap: 100-200 tokens for continuity
- Metadata per chunk:
  ```
  {
    book_id, chapter_id, chunk_id,
    chapter_title, offset_start, offset_end
  }
  ```

### Embeddings & Retrieval
- Embed each chunk (OpenRouter embedding model or local)
- Store in Vectorize (CF) or local in-browser index
- On query:
  - Embed the question
  - Top-k vector search (k=6-10)
  - Boost current chapter chunks if scope is "current"
  - Optional: rerank with cross-encoder for quality

### Answering & Citations
- Prompt enforces: cite sources, no invented quotes, concise
- Response format:
  ```
  Quoted passages:
  - "exact quote" (chunk_id: X, chapter: Y)
  - "exact quote" (chunk_id: Z, chapter: W)

  Explanation:
  <grounded in the quotes above>

  Context (only if requested):
  <external knowledge, clearly labeled>
  ```

### Highlight-to-Ask (simpler path)
- No RAG needed — send selected text + surrounding paragraphs
- Direct LLM call with action-specific prompt
- Faster, stateless

### Data Model
```
Book {
  id, title, author, epubBlob,
  lastReadPosition, currentChapter, readingMode
}

Chunk {
  book_id, chapter_id, chunk_id,
  text, embedding, offset_start, offset_end
}

ChapterSummary {
  book_id, chapter_id, summary, generatedAt
}

Character {
  book_id, name, firstAppearance,
  description, relationships[], mentions[]
}

Vocabulary {
  book_id, word, definition, context, timestamp
}

Conversation {
  book_id, messages[], scope, chapterContext
}

Settings {
  openRouterKey, preferredModel, theme,
  readingMode, fontSize, fontFamily, lineHeight, margins
}
```

### API Endpoints (Cloudflare Workers)
```
GET  /books              → list curated books + metadata
GET  /books/:id          → text + chapter map
POST /query              → { book_id, scope, chapter_id?, question }
                         → answer + citations
POST /highlight-action   → { book_id, text, context, action }
                         → explanation
```

### Storage
| Data | Location |
|------|----------|
| Curated EPUBs | Cloudflare R2 |
| User uploads | IndexedDB (local) |
| Metadata, progress | IndexedDB or KV |
| Embeddings | Vectorize (CF) or local |
| Chat history | Client-side |

---

## Prompt Templates

### Q&A with Citations (default)
```
System:
You are a reading companion. Use ONLY the provided book excerpts.
Always quote passages verbatim and cite them by chunk_id.
If the answer is not in the excerpts, say "I could not find this in the book."
Be concise and clarifying. Avoid speculation.
Provide general context only when explicitly asked, and label it as "Context."

User:
Question: {{user_question}}
Scope: {{scope}}  # "current_chapter" or "whole_book"

Book excerpts:
{{#each excerpts}}
[chunk_id: {{chunk_id}} | chapter: {{chapter_title}}]
{{text}}
{{/each}}

Response format:
Quoted passages:
- "{{quote}}" (chunk_id: X)

Explanation:
<grounded in quotes>

Context (only if asked):
<external knowledge, labeled>
```

### Highlight Actions
```
System:
You are a reading companion helping with a specific passage.
The reader is reading "{{book_title}}" by {{author}}, Chapter {{chapter}}.

Action: {{action}}  # explain / define / translate / simplify

User:
Selected text: "{{selected_text}}"

Surrounding context:
{{surrounding_paragraphs}}

Respond concisely. For "define," include etymology if interesting.
For "translate," preserve tone. For "simplify," keep the meaning intact.
```

### Chapter Summary
```
System:
Summarize the chapter in a neutral, factual style.
Do not invent details. If something is unclear, say so.

User:
Book: {{book_title}}
Chapter: {{chapter_title}}

Excerpts:
{{chapter_text}}

Output:
- 5-8 bullet summary of key events/ideas
- 3-5 key terms with one-line definitions
- Major characters introduced or developed
```

### Character Query
```
System:
Based on the book excerpts, describe this character.
Cite specific passages. Do not invent details not in the text.

User:
Character: {{name}}
Book: {{book_title}}

Relevant excerpts:
{{excerpts_mentioning_character}}

Output:
- First appearance: chapter, context
- Description (from text)
- Relationships
- Role in story so far
```

---

## Design Principles

1. **Trust over magic.** Show evidence. Cite sources. Refuse when uncertain.

2. **Reading comes first.** AI enhances focus, never breaks it. No popups, no distractions.

3. **Invisible until needed.** Features are discoverable but not intrusive.

4. **Craft over features.** Typography, spacing, and feel matter. Less done beautifully beats more done poorly.

5. **Respect the text.** The book is the authority. AI is the assistant.

6. **Quality over speed.** Slower, accurate responses beat fast, wrong ones.

---

## Build Instructions for Claude Code

**How to use this plan:**
- One Claude Code instance per phase
- Each instance reads this full plan, but focuses on ONE phase
- Verify each phase works before starting the next
- Follow the Engineering Guidelines section exactly

---

### Phase 1: Core Reader

**Instance prompt:** "Read the plan at this path. Build Phase 1 only."

**What to build:**
- SvelteKit project with Tailwind, Cloudflare Pages adapter
- EPUB loading with epub.js (user uploads file)
- Continuous scroll rendering
- Chapter navigation + TOC sidebar
- Reading position persistence (IndexedDB)
- Typography: Libre Baskerville, 18-20px, 1.6 line-height
- Themes: light + dark toggle
- Font size control (small/medium/large)
- Responsive for mobile browsers

**Folder structure:**
```
src/
├── lib/
│   ├── components/
│   │   ├── reader/
│   │   │   ├── Reader.svelte
│   │   │   ├── ChapterContent.svelte
│   │   │   ├── ChapterNav.svelte
│   │   │   └── ReaderControls.svelte
│   │   └── common/
│   │       ├── ThemeToggle.svelte
│   │       └── FontSizeControl.svelte
│   ├── services/
│   │   ├── epub.ts
│   │   └── storage.ts
│   ├── stores/
│   │   ├── bookStore.ts
│   │   └── settingsStore.ts
│   ├── types/
│   │   ├── book.ts
│   │   └── settings.ts
│   └── config/
│       └── constants.ts
├── routes/
│   ├── +page.svelte (upload page)
│   └── read/
│       └── +page.svelte (reader page)
└── app.html
```

**Done when:**
1. `npm run dev` works
2. Can upload an EPUB
3. Book renders with continuous scroll
4. Can navigate chapters via TOC
5. Dark mode toggle works
6. Font size control works
7. Position persists across refresh

**Do NOT build:** Retrieval, AI, highlights, chat. Just the reader.

---

### Phase 2: Retrieval

**Instance prompt:** "Read the plan. Phase 1 is complete. Build Phase 2 only."

**Prerequisite:** Phase 1 working and committed.

**What to build:**
- Chunking pipeline in `src/lib/services/retrieval.ts`
  - Split book into chunks (800-1200 tokens)
  - Overlap: 100-200 tokens
  - Preserve paragraph boundaries when possible
  - Store metadata: book_id, chapter_id, chunk_id, offset
- Embedding generation
  - Use `@xenova/transformers` for in-browser embeddings
  - Model: `all-MiniLM-L6-v2` (small, fast)
  - Or: simple TF-IDF as fallback
- Vector storage in IndexedDB
  - Store chunks with embeddings
  - Index by book_id
- Search function
  - Embed query
  - Cosine similarity search
  - Top-k results (default k=6)
  - Filter by chapter if scope="current_chapter"

**New files:**
```
src/lib/
├── services/
│   └── retrieval.ts    # chunking, embedding, search
├── types/
│   └── retrieval.ts    # Chunk, SearchResult types
└── utils/
    └── tokenizer.ts    # simple token counting
```

**Done when:**
- Book is chunked on load (background, non-blocking)
- Can call `searchChunks(bookId, query, { scope, topK })`
- Returns relevant chunks with chunk_ids
- Works for "current_chapter" and "whole_book" scope

**Do NOT build:** AI integration, UI for chat. Just the retrieval backend.

**Tests to write:**
- `chunkText()` splits correctly
- `chunkText()` respects paragraph boundaries
- `searchChunks()` returns relevant results
- Scope filtering works

---

### Phase 3: AI — Citations & Trust

**Instance prompt:** "Read the plan. Phases 1-2 complete. Build Phase 3 only."

**Prerequisite:** Phases 1-2 working.

**What to build:**
- Anthropic API integration in `src/lib/services/llm.ts`
  - Direct API calls (not OpenRouter)
  - Prompt caching for chapter content
  - Streaming responses
- Settings UI for API key
  - Store in localStorage
  - Simple input in settings modal
- Tool definitions (search_book, cite_passage)
- Chat panel UI
  - Slide-out panel or modal
  - Message list with user/assistant
  - Input field with send button
  - Scope toggle: "This chapter" / "Whole book"
- Quote-first response format
  - Parse citations from response
  - Display quotes prominently
  - Link chunk_ids to source location
- Refusal behavior
  - Detect "not found" responses
  - Display appropriately

**New files:**
```
src/lib/
├── components/
│   └── ai/
│       ├── ChatPanel.svelte
│       ├── ChatMessage.svelte
│       ├── ScopeToggle.svelte
│       └── Citation.svelte
├── services/
│   ├── llm.ts           # Anthropic API calls
│   └── prompts.ts       # prompt templates
├── stores/
│   └── chatStore.ts
└── types/
    └── chat.ts          # ChatMessage, Citation types
```

**Prompt templates to implement:**
- Q&A with citations (from plan)
- Use the exact format from the plan's Prompt Templates section

**Done when:**
- Can open chat panel
- Can type a question
- Response streams in with quotes + explanation
- Citations show chunk references
- Scope toggle changes retrieval behavior
- "Not found" handled gracefully

**Do NOT build:** Highlight actions yet. Just the chat.

---

### Phase 4: Highlight Actions

**Instance prompt:** "Read the plan. Phases 1-3 complete. Build Phase 4 only."

**Prerequisite:** Phases 1-3 working.

**What to build:**
- Text selection detection in reader
  - Use epub.js selection events + browser Selection API
  - Get selected text + surrounding context
  - Get CFI (position in book)
- Action menu on selection
  - Popover near selection
  - Two buttons: "Explain" / "Define"
- LLM calls for actions
  - No RAG needed — send selected text + context directly
  - Use highlight action prompts from plan
- Response display
  - Inline popover or slide-in panel
  - Clean, readable format

**New files:**
```
src/lib/
├── components/
│   └── reader/
│       ├── SelectionMenu.svelte
│       └── ActionResponse.svelte
└── services/
    └── highlightActions.ts
```

**Done when:**
- Select text in reader
- Action menu appears
- Click "Explain" → get explanation
- Click "Define" → get definition
- Response displays cleanly
- Works on mobile (long-press to select)

---

### Phase 5: Deploy

**Instance prompt:** "Read the plan. Phases 1-4 complete. Build Phase 5: polish and deploy."

**Prerequisite:** Phases 1-4 working.

**What to build:**
- Cloudflare Pages deployment config
  - `wrangler.toml` if needed
  - Build command in `package.json`
- Deploy button in README
  - Use Cloudflare's deploy button format
- README documentation
  - What this is (one paragraph)
  - Features list
  - How to deploy (step by step)
  - How to develop locally
  - How to add your Anthropic API key
  - Architecture overview
  - Why quote-first citations matter
- Final polish
  - Error handling for common cases
  - Loading states everywhere
  - Empty states (no book loaded, no results)
  - Mobile testing

**Files to create/update:**
```
README.md
wrangler.toml (if needed)
docs/
├── setup.md
└── architecture.md
```

**Done when:**
- README is complete and clear
- Can fork repo and deploy in <5 minutes
- App works end-to-end on Cloudflare Pages
- Mobile experience is good

**V1 is now complete and shippable.**

---

## V1 Build Phases (Checklist)

### Phase 1: Core Reader
- [ ] Project setup: SvelteKit + Tailwind + Cloudflare Pages adapter
- [ ] EPUB loading with epub.js
- [ ] Continuous scroll rendering
- [ ] Chapter navigation + TOC
- [ ] Reading position persistence (IndexedDB)
- [ ] Typography: one serif font, sensible defaults
- [ ] Themes: light + dark toggle
- [ ] Font size control
- [ ] Responsive design (mobile browsers)

### Phase 2: Retrieval
- [ ] Chunking pipeline (800-1200 tokens, overlap)
- [ ] In-browser embedding (or Anthropic-compatible)
- [ ] In-browser vector storage (e.g., vectra or simple cosine)
- [ ] Top-k retrieval with chapter-scope filtering

### Phase 3: AI — Citations & Trust
- [ ] Anthropic API integration (direct, with prompt caching)
- [ ] Settings: API key input
- [ ] Tool definitions: search_book, cite_passage
- [ ] Q&A with citations (quote-first format)
- [ ] Scope toggle: current chapter vs whole book
- [ ] "Not found in book" refusal behavior
- [ ] Streaming responses

### Phase 4: Highlight Actions
- [ ] Text selection handling (epub.js + browser API)
- [ ] Action menu: Explain / Define
- [ ] Direct LLM calls for highlights (no RAG needed)

### Phase 5: Deploy
- [ ] Deploy to Cloudflare Pages button in README
- [ ] Setup documentation
- [ ] Basic README with rationale

**V1 Complete.** User can upload EPUB, read, highlight, ask questions, get cited answers.

---

## V1.5 Build Phases (after V1 ships)

- [ ] Pagination mode toggle
- [ ] Sepia theme
- [ ] Full typography controls UI
- [ ] Translate / Simplify actions
- [ ] Vocabulary list
- [ ] Chapter summaries + "Where was I?"
- [ ] Bookmarks
- [ ] Search within book
- [ ] Cloudflare Workers for API proxy (hide key)
- [ ] Curated catalog on R2

---

## V2 Build Phases

- [ ] Character tracker
- [ ] Annotations
- [ ] Export notes (Markdown)
- [ ] Discussion prompts
- [ ] Extended thinking mode
- [ ] Gutenberg integration
- [ ] PWA: offline, installable
- [ ] OpenRouter support

---

## Verification / Testing

1. **Reading UX:** Load War and Peace. Verify pagination, scroll, chapter nav, typography on desktop + mobile.

2. **Retrieval quality:** Ask "What does Pierre think about Napoleon?" — verify relevant chunks are retrieved, quotes are accurate.

3. **Citation accuracy:** Check that every quote in response exists verbatim in the book.

4. **Refusal behavior:** Ask about something not in the book. Verify "I could not find this" response.

5. **Highlight actions:** Select a difficult passage. Verify Explain/Define/Translate work correctly.

6. **Offline:** Enable airplane mode. Verify reading works, cached summaries accessible.

7. **Mobile:** Test on iOS Safari, Android Chrome. Verify touch selection, chat panel, responsiveness.

---

## Deployment

**Target:** Cloudflare (Pages + Workers + R2 + Vectorize)

**User setup flow:**
1. Fork repo on GitHub
2. Click "Deploy to Cloudflare" button
3. App live at `their-subdomain.pages.dev`
4. Enter OpenRouter API key in settings
5. Start reading

**Developer setup:**
```bash
git clone <repo>
npm install
npm run dev              # local development
npm run build            # production build
npx wrangler pages deploy  # deploy to CF
```

---

## Decisions Made

- **Trust model:** Quote-first, citations required, refuse if not found
- **V1 Reading mode:** Continuous scroll only (pagination in V1.5)
- **V1 Provider:** Anthropic API direct (for caching + tools). OpenRouter in V2.
- **V1 Storage:** Local only (IndexedDB). No Workers/R2 until V1.5.
- **V1 Actions:** Explain + Define only. Translate/Simplify in V1.5.
- **Curated catalog:** Deferred to V1.5 (V1 = upload your own EPUB)
- **Sync:** Local-only. Cloud sync is Future.
- **Distribution:** Self-hosted, open source, Cloudflare Pages

## Open Questions

1. **Name?** (Marginalia? Companion? Something evocative of reading + trust?)

---

## Anthropic/Claude-Specific Features to Leverage

If using Claude via OpenRouter (or directly via Anthropic API), these features can significantly improve the reading companion:

### 1. Prompt Caching (High Impact)

**What it is:** Cache static content (book text, system prompts) so you don't pay to resend it on every request.

**Why it matters for this app:**
- The book text is static — it never changes
- Users ask many questions about the same book/chapter
- Without caching: each question resends the entire chapter (expensive)
- With caching: pay once to cache, then just pay for new questions

**Implementation:**
```typescript
// First request: cache the chapter
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  system: [
    {
      type: 'text',
      text: READING_COMPANION_SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' }  // Cache this
    }
  ],
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: currentChapterText,  // Large text cached
          cache_control: { type: 'ephemeral' }
        },
        {
          type: 'text',
          text: userQuestion  // Only this is "new" each time
        }
      ]
    }
  ]
});
```

**Cost savings:** Up to 90% reduction for repeated queries on the same chapter.

**Cache strategy:**
- Cache the current chapter text
- Cache the system prompt
- Cache character list + prior summaries
- Only the user's question is "new" each request

### 2. Tool Use / Function Calling (High Impact)

**What it is:** Define tools that Claude can call to retrieve information, then synthesize a response.

**Why it matters:** Instead of dumping all context into the prompt, let Claude decide what to retrieve.

**Tools to define:**

```typescript
const tools = [
  {
    name: 'search_book',
    description: 'Search the book for passages related to a query.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to search for' },
        scope: { type: 'string', description: 'current_chapter or whole_book' },
        top_k: { type: 'number', description: 'Number of results' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_character',
    description: 'Get information about a character.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' }
      },
      required: ['name']
    }
  },
  {
    name: 'get_chapter_summary',
    description: 'Get the summary of a specific chapter.',
    input_schema: {
      type: 'object',
      properties: {
        chapter_id: { type: 'string' }
      },
      required: ['chapter_id']
    }
  },
  {
    name: 'cite_passage',
    description: 'Retrieve the full text of a passage by chunk ID.',
    input_schema: {
      type: 'object',
      properties: {
        chunk_id: { type: 'string' }
      },
      required: ['chunk_id']
    }
  }
];
```

**Flow with tools:**
1. User asks: "What does Pierre think about Napoleon?"
2. Claude calls `search_book({ query: "Pierre Napoleon", scope: "whole_book" })`
3. Your app returns relevant chunks
4. Claude calls `cite_passage({ chunk_id: "ch12_chunk_45" })` for exact quote
5. Claude synthesizes answer with citations

**Benefits:**
- Claude decides what's relevant (smarter than naive RAG)
- Only retrieves what's needed (efficient)
- Citations are explicit tool calls (verifiable)

### 3. Extended Thinking (Medium Impact)

**What it is:** Claude can "think" before responding, useful for complex reasoning.

**When to use:**
- Deep thematic analysis ("What is the significance of the green light?")
- Comparative questions ("How does Tolstoy's view compare to Dostoevsky's?")
- Synthesis across many chapters

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 16000,
  thinking: {
    type: 'enabled',
    budget_tokens: 10000  // Allow up to 10K tokens of thinking
  },
  messages: [...]
});
```

**Suggestion:** Make this a toggle — "Deep analysis" mode for complex questions.

### 4. Batch API (Medium Impact)

**What it is:** Send many requests at once, get results later. 50% cost reduction.

**When to use:**
- Pre-generating chapter summaries for curated books
- Pre-building character lists
- Pre-generating discussion questions

```typescript
const batch = await anthropic.batches.create({
  requests: book.chapters.map((chapter, i) => ({
    custom_id: `summary-${book.id}-ch${i}`,
    params: {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: `Summarize:\n\n${chapter.text}` }
      ]
    }
  }))
});
```

**Benefits:** 50% cheaper, great for background indexing.

### 5. Large Context Window (200K tokens)

**What this means:**
- Most novels fit entirely in context (except War and Peace, Les Mis)
- For books under ~400 pages: skip RAG, send the whole book
- For longer books: RAG still needed

**Hybrid strategy:**
```typescript
async function answerQuestion(book: Book, question: string) {
  const bookTokens = estimateTokens(book.fullText);

  if (bookTokens < 100000) {
    // Small book: send everything, use caching
    return await answerWithFullContext(book, question);
  } else {
    // Large book: use RAG
    return await answerWithRetrieval(book, question);
  }
}
```

### 6. Streaming

**Why it matters:** Literary explanations can be long. Streaming prevents blank-screen waiting.

```typescript
const stream = await anthropic.messages.stream({
  model: 'claude-sonnet-4-20250514',
  messages: [...],
});

for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    appendToUI(chunk.delta.text);
  }
}
```

### Summary: What to Implement

| Feature | Priority | Use Case |
|---------|----------|----------|
| **Prompt Caching** | Must have | Every request — cache chapter + system prompt |
| **Tool Use** | Must have | "Whole book" queries — let Claude retrieve |
| **Streaming** | Must have | All responses — better UX |
| **Batch API** | Should have | Pre-indexing curated books |
| **Extended Thinking** | Nice to have | "Deep analysis" mode |
| **Large Context** | Architecture | Skip RAG for small books |

### V1 Decision: Anthropic API Direct

**Why Anthropic for V1:**
- Prompt caching works (90% cost savings)
- Tool use works (smarter retrieval)
- Streaming works
- No compatibility guesswork

**OpenRouter in V2:**
- Add as alternative provider once core is stable
- Gives users model flexibility (GPT-4, Gemini, etc.)
- But may lack caching/tools — verify before adding

---

## Engineering Guidelines: Building This Right

The goal is a codebase that's clean, documented, debuggable, maintainable, and extensible. V2 and V3 should be easy to build on top of V1.

### Project Structure

```
kruthi/
├── src/
│   ├── lib/
│   │   ├── components/       # UI components (presentational)
│   │   │   ├── reader/       # Reader-specific components
│   │   │   ├── ai/           # AI chat, actions UI
│   │   │   └── common/       # Shared UI (buttons, modals, etc.)
│   │   ├── services/         # Business logic (no UI)
│   │   │   ├── epub.ts       # EPUB parsing, navigation
│   │   │   ├── retrieval.ts  # Chunking, embeddings, search
│   │   │   ├── llm.ts        # OpenRouter API calls
│   │   │   ├── storage.ts    # IndexedDB operations
│   │   │   └── prompts.ts    # All prompt templates
│   │   ├── stores/           # Svelte stores (state management)
│   │   ├── types/            # TypeScript types/interfaces
│   │   ├── utils/            # Pure utility functions
│   │   └── config/           # Configuration, constants
│   ├── routes/               # SvelteKit pages
│   └── app.html
├── functions/                # Cloudflare Workers (API)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                     # Documentation
└── scripts/                  # Build, indexing, utilities
```

### Architecture Principles

**1. Separation of Concerns**
- Components handle UI only — no business logic
- Services handle logic only — no UI, no state
- Stores manage state only — connect services to components
- Each file does ONE thing well

```typescript
// BAD: Component doing everything
function ReaderPage() {
  const epub = await fetch(url);  // fetching
  const parsed = parseEpub(epub); // parsing
  localStorage.set('position', pos); // storage
  return <div>...</div>; // UI
}

// GOOD: Component delegates to services
function ReaderPage() {
  const book = useBookStore();
  onMount(() => book.load(bookId));
  return <Reader content={book.currentChapter} />;
}
```

**2. Dependency Injection**
- Services receive their dependencies, don't create them
- Makes testing easy, makes swapping implementations easy

```typescript
// BAD: Hardcoded dependency
class LLMService {
  private client = new OpenRouterClient(API_KEY);
}

// GOOD: Injected dependency
class LLMService {
  constructor(private client: LLMClient) {}
}

// Now you can inject a mock for testing
const service = new LLMService(mockClient);
```

**3. Single Source of Truth**
- Each piece of data lives in ONE place
- Reading position → bookStore
- User settings → settingsStore
- Retrieved chunks → retrievalStore
- No duplicated state

**4. Unidirectional Data Flow**
```
User Action → Store Update → UI Re-render
                  ↓
            Service Call (if needed)
```

### TypeScript: Do's and Don'ts

**DO: Define types for everything**
```typescript
// Types go in src/lib/types/

interface Book {
  id: string;
  title: string;
  author: string;
  chapters: Chapter[];
  currentPosition: CFI;
}

interface Chunk {
  id: string;
  bookId: string;
  chapterId: string;
  text: string;
  embedding?: number[];
  offsetStart: number;
  offsetEnd: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
}
```

**DO: Use discriminated unions for state**
```typescript
type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Usage
const bookState: LoadingState<Book> = { status: 'loading' };
```

**DON'T: Use `any`**
```typescript
// BAD
function processChunk(chunk: any) { ... }

// GOOD
function processChunk(chunk: Chunk) { ... }
```

**DON'T: Use magic strings**
```typescript
// BAD
if (action === 'explain') { ... }

// GOOD
const ACTIONS = {
  EXPLAIN: 'explain',
  DEFINE: 'define',
  TRANSLATE: 'translate',
  SIMPLIFY: 'simplify',
} as const;

type Action = typeof ACTIONS[keyof typeof ACTIONS];

if (action === ACTIONS.EXPLAIN) { ... }
```

### Error Handling

**DO: Create typed error classes**
```typescript
// src/lib/types/errors.ts

class AppError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AppError';
  }
}

class EpubParseError extends AppError {
  constructor(message: string, public fileName: string) {
    super(message, 'EPUB_PARSE_ERROR');
  }
}

class LLMError extends AppError {
  constructor(message: string, public statusCode?: number) {
    super(message, 'LLM_ERROR');
  }
}

class RetrievalError extends AppError {
  constructor(message: string, public bookId: string) {
    super(message, 'RETRIEVAL_ERROR');
  }
}
```

**DO: Handle errors at boundaries**
```typescript
// Service layer: throw typed errors
async function queryBook(bookId: string, question: string): Promise<Answer> {
  const chunks = await retrieveChunks(bookId, question);
  if (chunks.length === 0) {
    throw new RetrievalError('No relevant passages found', bookId);
  }
  return await generateAnswer(chunks, question);
}

// Component layer: catch and display
try {
  const answer = await queryBook(bookId, question);
  showAnswer(answer);
} catch (e) {
  if (e instanceof RetrievalError) {
    showMessage('Could not find relevant passages in the book.');
  } else if (e instanceof LLMError) {
    showMessage('AI service unavailable. Please try again.');
  } else {
    showMessage('Something went wrong.');
    console.error(e);
  }
}
```

**DON'T: Swallow errors silently**
```typescript
// BAD
try {
  await doSomething();
} catch (e) {
  // silence
}

// GOOD
try {
  await doSomething();
} catch (e) {
  console.error('Failed to do something:', e);
  throw e; // or handle appropriately
}
```

### Naming Conventions

**Files:**
- Components: `PascalCase.svelte` (e.g., `ChapterNav.svelte`)
- Services: `camelCase.ts` (e.g., `retrieval.ts`)
- Types: `camelCase.ts` (e.g., `book.ts`)
- Utilities: `camelCase.ts` (e.g., `textUtils.ts`)

**Variables/Functions:**
- Functions: `camelCase`, verb-first (`getChunks`, `parseEpub`, `renderPage`)
- Booleans: `is/has/should` prefix (`isLoading`, `hasError`, `shouldRefetch`)
- Constants: `SCREAMING_SNAKE_CASE` (`MAX_CHUNK_SIZE`, `DEFAULT_THEME`)
- Types/Interfaces: `PascalCase` (`Book`, `ChapterSummary`)

**Be explicit, not clever:**
```typescript
// BAD
const d = getD();
const proc = (x) => x.map(fn);

// GOOD
const chunks = getChunksForQuery();
const processedChunks = chunks.map(normalizeChunk);
```

### State Management (Svelte Stores)

**DO: Keep stores focused**
```typescript
// src/lib/stores/bookStore.ts
import { writable, derived } from 'svelte/store';

function createBookStore() {
  const { subscribe, set, update } = writable<BookState>({
    status: 'idle',
    book: null,
    currentChapter: 0,
  });

  return {
    subscribe,

    async load(bookId: string) {
      update(s => ({ ...s, status: 'loading' }));
      try {
        const book = await epubService.load(bookId);
        set({ status: 'success', book, currentChapter: 0 });
      } catch (e) {
        set({ status: 'error', error: e, book: null });
      }
    },

    nextChapter() {
      update(s => ({ ...s, currentChapter: s.currentChapter + 1 }));
    },

    setPosition(cfi: string) {
      update(s => ({ ...s, currentPosition: cfi }));
      storageService.savePosition(s.book.id, cfi);
    },
  };
}

export const bookStore = createBookStore();
```

**DO: Use derived stores for computed values**
```typescript
export const currentChapterContent = derived(
  bookStore,
  $book => $book.book?.chapters[$book.currentChapter]?.content ?? ''
);

export const readingProgress = derived(
  bookStore,
  $book => {
    if (!$book.book) return 0;
    return ($book.currentChapter / $book.book.chapters.length) * 100;
  }
);
```

### Component Guidelines

**DO: Keep components small and focused**
```svelte
<!-- BAD: Monolithic component -->
<script>
  // 200 lines of logic
</script>
<div>
  <!-- 300 lines of markup -->
</div>

<!-- GOOD: Composed from smaller components -->
<Reader>
  <ReaderHeader {book} />
  <ReaderContent {chapter} on:select={handleSelect} />
  <ReaderFooter {progress} />
  <ActionMenu {selection} on:action={handleAction} />
</Reader>
```

**DO: Props down, events up**
```svelte
<!-- Parent -->
<ChapterNav
  chapters={book.chapters}
  current={currentChapter}
  on:navigate={handleNavigate}
/>

<!-- Child -->
<script>
  import { createEventDispatcher } from 'svelte';
  export let chapters;
  export let current;

  const dispatch = createEventDispatcher();

  function goTo(index) {
    dispatch('navigate', { index });
  }
</script>
```

**DON'T: Access stores directly in deep components**
```svelte
<!-- BAD: Deep component reaching into global store -->
<script>
  import { bookStore } from '$lib/stores';
  $: chapters = $bookStore.book?.chapters;
</script>

<!-- GOOD: Receive data as props -->
<script>
  export let chapters;
</script>
```

### Testing Strategy

**Unit Tests (services, utilities)**
```typescript
// tests/unit/retrieval.test.ts
import { chunkText, cosineSimilarity } from '$lib/services/retrieval';

describe('chunkText', () => {
  it('splits text into chunks of target size', () => {
    const text = 'Long text...';
    const chunks = chunkText(text, { targetSize: 1000, overlap: 100 });

    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach(chunk => {
      expect(chunk.text.length).toBeLessThanOrEqual(1200);
    });
  });

  it('preserves paragraph boundaries when possible', () => {
    const text = 'Paragraph 1.\n\nParagraph 2.';
    const chunks = chunkText(text, { targetSize: 100, overlap: 0 });

    expect(chunks[0].text).not.toContain('Paragraph 2');
  });
});
```

**Integration Tests (service combinations)**
```typescript
// tests/integration/query.test.ts
describe('Query Pipeline', () => {
  it('retrieves and answers with citations', async () => {
    const book = await loadTestBook('war-and-peace');
    const answer = await queryBook(book.id, 'Who is Pierre?');

    expect(answer.quotes.length).toBeGreaterThan(0);
    expect(answer.explanation).toBeTruthy();

    // Verify quotes exist in book
    for (const quote of answer.quotes) {
      expect(book.fullText).toContain(quote.text);
    }
  });
});
```

**E2E Tests (user flows)**
```typescript
// tests/e2e/reading.test.ts
test('user can read and ask about a passage', async ({ page }) => {
  await page.goto('/read/war-and-peace');

  // Select text
  await page.locator('.chapter-content').selectText('Prince Andrew');

  // Click explain
  await page.click('[data-action="explain"]');

  // Verify response
  await expect(page.locator('.ai-response')).toContainText('Prince Andrew');
  await expect(page.locator('.citation')).toBeVisible();
});
```

### Documentation Standards

**Every service file needs a header:**
```typescript
/**
 * retrieval.ts
 *
 * Handles text chunking, embedding generation, and semantic search.
 *
 * Key functions:
 * - chunkBook(book): Split book into indexed chunks
 * - embedChunks(chunks): Generate vector embeddings
 * - searchChunks(query, bookId, scope): Find relevant chunks
 *
 * Dependencies:
 * - OpenRouter API for embeddings
 * - Vectorize (CF) or local index for storage
 */
```

**Complex functions need JSDoc:**
```typescript
/**
 * Retrieves the most relevant chunks for a query.
 *
 * @param query - The user's question
 * @param bookId - The book to search within
 * @param options - Search options
 * @param options.scope - 'chapter' or 'book'
 * @param options.chapterId - Required if scope is 'chapter'
 * @param options.topK - Number of results (default: 6)
 *
 * @returns Ranked chunks with similarity scores
 *
 * @throws {RetrievalError} If book is not indexed
 *
 * @example
 * const chunks = await searchChunks(
 *   'What does Pierre think about war?',
 *   'war-and-peace',
 *   { scope: 'book', topK: 8 }
 * );
 */
async function searchChunks(
  query: string,
  bookId: string,
  options: SearchOptions
): Promise<RankedChunk[]> {
  // ...
}
```

**README must include:**
- What this project is (one paragraph)
- How to deploy (step by step)
- How to develop locally
- Architecture overview (with diagram if possible)
- Key decisions and rationale

### Extensibility Patterns

**1. Plugin-style prompt system**
```typescript
// src/lib/config/prompts.ts

interface PromptConfig {
  system: string;
  formatResponse: (raw: string) => FormattedResponse;
}

const prompts: Record<string, PromptConfig> = {
  explain: {
    system: `You are a reading companion...`,
    formatResponse: parseExplanation,
  },
  define: {
    system: `Define this word...`,
    formatResponse: parseDefinition,
  },
  // Easy to add new actions:
  analyze_theme: {
    system: `Analyze the thematic significance...`,
    formatResponse: parseThemeAnalysis,
  },
};

// Adding a new action = adding one entry here
```

**2. Abstract storage interface**
```typescript
// src/lib/types/storage.ts

interface StorageAdapter {
  saveBook(book: Book): Promise<void>;
  getBook(id: string): Promise<Book | null>;
  savePosition(bookId: string, position: string): Promise<void>;
  getPosition(bookId: string): Promise<string | null>;
}

// Implementations
class IndexedDBStorage implements StorageAdapter { ... }
class CloudflareKVStorage implements StorageAdapter { ... }

// Swap implementations without changing consumers
const storage: StorageAdapter = isLocal
  ? new IndexedDBStorage()
  : new CloudflareKVStorage();
```

**3. Feature flags for gradual rollout**
```typescript
// src/lib/config/features.ts

export const features = {
  characterTracker: true,
  vocabularyList: true,
  discussionPrompts: false,  // Coming in V2
  cloudSync: false,          // Coming in V3
};

// Usage in components
{#if features.characterTracker}
  <CharacterPanel {book} />
{/if}
```

### Performance Guidelines

**DO: Lazy load heavy resources**
```typescript
// Don't load epub.js until needed
const epubJs = await import('epubjs');

// Don't embed all chapters upfront
async function embedChapter(chapterId: string) {
  if (!embeddingCache.has(chapterId)) {
    const embedding = await generateEmbedding(chapterId);
    embeddingCache.set(chapterId, embedding);
  }
  return embeddingCache.get(chapterId);
}
```

**DO: Debounce expensive operations**
```typescript
import { debounce } from '$lib/utils/timing';

// Don't save position on every scroll
const savePosition = debounce((cfi: string) => {
  storage.savePosition(bookId, cfi);
}, 1000);
```

**DO: Virtualize long lists**
```typescript
// For chapter lists, vocabulary lists with many items
import { VirtualList } from '$lib/components/common';

<VirtualList items={vocabulary} itemHeight={48} let:item>
  <VocabItem word={item} />
</VirtualList>
```

### Security

**DO: Validate all inputs**
```typescript
// Never trust user input
function loadBook(url: string) {
  if (!isValidGutenbergUrl(url) && !isLocalFile(url)) {
    throw new Error('Invalid book source');
  }
}

function setApiKey(key: string) {
  if (!key.startsWith('sk-or-')) {
    throw new Error('Invalid OpenRouter key format');
  }
}
```

**DO: Sanitize before rendering**
```typescript
// EPUB content could contain malicious HTML
import DOMPurify from 'dompurify';

function renderChapter(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'span', 'em', 'strong', 'h1', 'h2', 'h3'],
  });
}
```

**DON'T: Expose secrets**
```typescript
// API key stays in localStorage, sent only to your Worker
// Worker proxies to OpenRouter — key never exposed to browser network tab
```

### Common Pitfalls to Avoid

| Pitfall | Problem | Solution |
|---------|---------|----------|
| God components | 500+ line files, impossible to test | Split into small, focused components |
| Prop drilling | Passing props through 5 levels | Use stores for global state |
| Premature optimization | Complex caching before measuring | Profile first, optimize bottlenecks |
| Inconsistent naming | `getBook`, `fetchChapter`, `loadPosition` | Pick one verb, use consistently |
| Missing loading states | UI freezes during async ops | Always handle loading/error states |
| No error boundaries | One error crashes entire app | Wrap sections in error boundaries |
| Hardcoded values | Magic numbers scattered in code | Centralize in config |
| Over-abstraction | Factory factory pattern | YAGNI — abstract when needed, not before |

### Code Review Checklist

Before merging any PR:

- [ ] Types are explicit (no `any`)
- [ ] Errors are handled, not swallowed
- [ ] Loading and error states exist
- [ ] Component is under 200 lines
- [ ] Service has no UI code
- [ ] New functions have JSDoc if complex
- [ ] No hardcoded strings/numbers
- [ ] Tests cover happy path + error case
- [ ] No console.log left in (use proper logging)
- [ ] Accessibility: proper labels, keyboard nav

---

## Key Implementation Notes

### epub.js Integration
- Use `ePub()` to parse, `rendition` to display
- CFI (Canonical Fragment Identifiers) for position tracking
- `rendition.getRange()` for text selection

### Typography Recommendations
- Fonts: Georgia, Libre Baskerville, Literata
- Size: 18-20px base
- Line-height: 1.6-1.8
- Max-width: 65-75 characters
- Generous margins

### OpenRouter
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Use `openai` npm package (compatible API)
- Recommended models: Claude Sonnet, GPT-4o, Gemini Pro

### Gutenberg
- API: `https://gutendex.com/` for search
- Direct EPUB download links available
- Strip boilerplate (header/footer) during ingestion

---

## Estimated Complexity

**Medium-large project.**

- Phase 1-2: Core reader + retrieval pipeline — foundational, takes most time
- Phase 3-4: AI integration — straightforward once retrieval works
- Phase 5-6: Features + polish — incremental

The retrieval/citation system is the differentiator. Get this right and the product is trustworthy. Typography craft takes iteration but is worth it.
