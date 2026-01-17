# Kruthi

Kruthi is a trust-first EPUB reader with quoted answers, highlights, and local-first AI analysis. It runs on web, desktop, and mobile.

## What Makes It Different

- Quote-first answers: show passages before explanations, refuse when the text is missing.
- Local-first by default: books and notes stay on your device; AI is opt-in.
- One codebase: SvelteKit for web, Tauri for desktop, Capacitor for mobile.

## Core Features

Reading
- EPUB upload and drag/drop import.
- Continuous scroll reading with TOC navigation and in-book search.
- Typography controls (font family, size, line height, margins, paper texture).
- Light, sepia, and dark themes; focus mode for distraction-free reading.

Library & Highlights
- Bookshelf with reading progress and quick resume.
- Highlights with notes and multiple colors.
- Printable highlight export page.

Vocabulary & Definitions
- Built-in dictionary (Webster's 1913) for fast offline definitions.
- Vocabulary list and review flow.

AI Companion
- Ask questions with citations from the book.
- Highlight actions (Explain / Define) with grounded responses.
- Chapter summaries plus deeper analysis (themes, character profiles).
- Analysis caching to keep responses fast.

## Privacy & Data

- Web: IndexedDB + localStorage.
- Desktop: SQLite + filesystem.
- Mobile: SQLite + filesystem.
- AI requests only run when you configure a provider key in Settings.

## Tech Stack

- SvelteKit + Tailwind
- Tauri (desktop) and Capacitor (mobile)
- epub.js for parsing
- Hybrid retrieval (BM25 + embeddings) for citations

## Quick Start

Requirements: Node 22+ (Capacitor 8)

```bash
npm install
npm run dev
```

## Builds

```bash
npm run check
npm run build
npm run build:tauri
npm run build:capacitor
```

## Desktop Downloads

Desktop installers are published on GitHub Releases after a tagged release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Releases: https://github.com/bebhuvan/kruthi/releases

## Docs

- `docs/architecture.md`
- `docs/setup.md`
- `docs/releasing.md`

## License

MIT. See `LICENSE`.
