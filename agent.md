# Agent Guide

This repository follows the phased plan in `plan.md`. Build one phase at a time and keep changes focused. The current priority is Phase 5 (Deploy) because Phase 4 is complete.

## Scope Guardrails

- Do not implement V1.5+ features unless explicitly requested.
- Phase 5 scope: deploy configuration, docs, and polish (loading/empty/error states).
- Keep UI changes limited to polish and deployment needs.

## Development Workflow

1. Read `plan.md` and confirm the active phase.
2. Create or update files only within the phase scope.
3. Avoid introducing new dependencies unless necessary for the phase.
4. Run `npm run check` after meaningful changes.

## Documentation Checkpoints

Update `README.md` at these points:

- End of each phase (Phase 1–5)
- New service or store added
- Data model or storage changes
- Deployment or build changes

## Phase 1 Checklist

- SvelteKit + Tailwind + Cloudflare Pages adapter
- EPUB upload + parse via epub.js
- Continuous scroll rendering
- Chapter navigation + TOC sidebar
- Reading position persistence (IndexedDB)
- Typography: Libre Baskerville, 18–20px, 1.6 line-height
- Light/dark theme toggle
- Font size control
- Mobile-friendly layout

## Phase 5 Checklist

- Cloudflare Pages deployment config
- README deploy docs + architecture notes
- `docs/setup.md` and `docs/architecture.md`
- Loading/error/empty states verified

## Code Organization

- UI components live in `src/lib/components/`
- Business logic in `src/lib/services/`
- State in `src/lib/stores/`
- Types in `src/lib/types/`
- Constants in `src/lib/config/`

## Quality Expectations

- Avoid `any` in TypeScript.
- Prefer explicit types and small components.
- Handle errors at boundaries (services throw, components display).
- Use IndexedDB for persistence; do not add server storage in V1.

## Validation

- `npm run check` must pass before declaring Phase 5 complete.
- `npm run test` must pass for retrieval unit tests.
