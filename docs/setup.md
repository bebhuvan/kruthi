# Setup

## Local Development

```bash
npm install
npm run dev
```

## Desktop Development (Tauri)

```bash
npm run dev:tauri
```

Tauri runs a desktop shell that loads the same Svelte app. The Tauri build uses `vite.config.tauri.ts` and `svelte.config.tauri.js` for a static bundle.

To build a desktop package:

```bash
npm run build:tauri
```

Desktop storage uses the platform adapter with:
- SQLite for metadata, chunks, highlights, summaries, analysis cache, and vocabulary.
- App data directory for storing EPUB files.

Desktop polish (Phase 4) adds:
- Native application menu with Open Book (Cmd/Ctrl+O) and fullscreen toggle.
- .epub file associations so double-click opens Kruthi.
- Window size/position persistence (stored in localStorage).
- Updater configuration in `src-tauri/tauri.conf.json` (replace the endpoint and public key).

## PWA

Kruthi includes a service worker and web app manifest. To install:

1. Build and deploy the app.
2. Open the site in Chrome or Edge.
3. Use the browser install button (or the menu item) to add it to your device.

## Bundled Dictionary

Definition lookups use a bundled Webster's 1913 dictionary first, with AI fallback. The data lives in:

- `static/dictionaries/websters.json.gz` (preferred, smaller)
- `static/dictionaries/websters.json` (fallback if gzip decompression is unavailable)

If you want a smaller build and are comfortable with AI-only definitions, you can remove these files.

## Cloudflare Pages Deploy

1. Fork the repo.
2. Create a new Cloudflare Pages project.
3. Connect the repo and choose the `main` branch.
4. Build command: `npm run build`.
5. Build output directory: `.svelte-kit/cloudflare`.
6. Deploy and open the site.
7. Add your Anthropic, OpenRouter, OpenAI, or Gemini API key in Settings.

The repo includes `wrangler.toml` with the Pages output directory configured. You can also use the Deploy button in `README.md` to create a Pages project from your fork.

### Pages vs Workers

This app is a static SvelteKit build that runs entirely in the browser, so Cloudflare Pages is the simplest deploy target. If you want edge logic (API proxy, auth, secrets, or custom routing), use Cloudflare Workers. You can also combine both by keeping Pages for the UI and adding a Worker later.

## Cloudflare Workers Deploy (Static)

If you prefer deploying as a Worker, you can use Wrangler to deploy the built output as static assets.

1. Build the app: `npm run build`.
2. Deploy static assets: `npx wrangler pages deploy .svelte-kit/cloudflare`.

Note: This still uses the Pages static output directory. For a pure Worker script, you would need a Worker entrypoint and asset bindings, which this repo does not include.

## CLI Deploy (Wrangler)

```bash
npm install
npm run build
npx wrangler pages deploy .svelte-kit/cloudflare
```

## Validation

```bash
npm run check
npm run test
```

## Releases

See `docs/releasing.md` for tagging, desktop installers, and web/mobile distribution.

## Instructions to Claude Code, Codex, Cursor, etc.

When asking an AI coding tool to deploy this project, provide the following explicit steps and constraints:

1. Build the project:
   - `npm install`
   - `npm run build`
2. Deploy to Cloudflare Pages:
   - `npx wrangler pages deploy .svelte-kit/cloudflare`
3. Verify:
   - Open the deployed URL.
   - Set your Anthropic, OpenRouter, OpenAI, or Gemini API key in Settings.

If you want a Workers-first deployment, tell the tool to:
- Keep the static output path as `.svelte-kit/cloudflare`.
- Use Wrangler to deploy static assets (Pages) unless you provide a Worker entrypoint.
- Avoid adding server storage or new dependencies.

## API Keys

- Anthropic: stored locally via the platform adapter and sent only to Anthropic.
- OpenRouter: stored locally via the platform adapter and sent only to OpenRouter. Set the model name in Settings.
- OpenAI: stored locally via the platform adapter and sent only to OpenAI. Set the model name in Settings.
- Gemini: stored locally via the platform adapter and sent only to Gemini. Set the model name in Settings.

These keys power chat, highlight actions, chapter summaries, discussion prompts, recap generation, and vocabulary lookups.
They also power deep analysis, theme tracking, and character profiling.

## Personalization

Reader profiles, feedback, and proactive suggestion signals are stored locally via the platform adapter. Web builds keep this data in IndexedDB, and Tauri builds keep it in SQLite.
