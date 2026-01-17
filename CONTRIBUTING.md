# Contributing

Thanks for your interest in contributing to Kruthi.

## Quick Start

1. Fork the repo and create a feature branch.
2. Install dependencies: `npm install`
3. Run the app: `npm run dev`

## Development Guidelines

- Follow the phased plan in `plan.md` and `docs/cross-platform-plan.md`.
- Keep changes focused on the current phase.
- Avoid introducing new dependencies unless necessary.
- Prefer explicit TypeScript types (avoid `any`).
- Services throw errors; components display them.

## Validation

Before submitting a PR:

- `npm run check`
- `npm run test`
- `npm run build`

If you touch platform builds:

- `npm run build:tauri:web`
- `npm run build:capacitor`

## Commit Style

Use clear, descriptive commit messages. Example:

- `Add dictionary-first definitions`

## Reporting Issues

Please include:

- Steps to reproduce
- Expected vs actual behavior
- Browser/OS details
- Console logs or screenshots when helpful
