# Agent Guide

This repository follows `plan.md` and `docs/cross-platform-plan.md`. Build one phase at a time and keep changes focused. The current priority is **Phase 10: Deep Analysis** from `docs/cross-platform-plan.md`.

## Scope Guardrails

- Do not implement Phase 11+ features unless explicitly requested.
- Phase 10 scope: extended thinking support, analysis service, theme tracking, character profiling, analysis storage/caching, and reader UI integration.
- Keep UI changes limited to analysis surfaces and their loading/empty/error states.
- Avoid introducing new dependencies unless necessary for the phase.

## Development Workflow

1. Read `plan.md` and `docs/cross-platform-plan.md` to confirm the active phase.
2. Create or update files only within the phase scope.
3. Prefer explicit types; avoid `any`.
4. Handle errors at boundaries (services throw, components display).
5. Run `npm run check` after meaningful changes.

## Documentation Checkpoints

Update `README.md` at these points:

- End of each Phase 6–11 milestone (AI companion track)
- New service or store added
- Data model or storage changes
- Build/deploy changes

Keep `docs/architecture.md` and `docs/setup.md` aligned with new services, storage, and user flows.

## Phase 10 Checklist (Deep Analysis)

- Extended thinking support in LLM service
- Analysis service with multiple types
- Theme tracking
- Character profiling
- Analysis storage and caching
- UI for analysis features

## Code Organization

- UI components: `src/lib/components/`
- Business logic: `src/lib/services/`
- State: `src/lib/stores/`
- Types: `src/lib/types/`
- Constants: `src/lib/config/`
- Platform adapters: `src/lib/platform/`

## Validation

- `npm run check` must pass before declaring Phase 10 complete.
- `npm run test` must pass if retrieval logic is modified.
