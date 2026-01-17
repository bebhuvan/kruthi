# Releasing

This repo ships three distribution targets:

- Web (static build)
- Desktop (Tauri)
- Mobile (Capacitor)

## One-Time Setup

1. Replace `bebhuvan/kruthi` placeholders in:
   - `README.md`
   - `package.json`
   - `SECURITY.md`
   - `CODE_OF_CONDUCT.md`
2. Create a GitHub repo and push `main`.
3. Enable GitHub Releases and GitHub Security Advisories.

## CI

- `CI` runs on every PR and push to `main`.
- `Release` runs on tags matching `v*` and uploads desktop bundles.

## Release (Web)

Web is deployed via Cloudflare Pages (recommended) or any static host:

```bash
npm run build
```

Deploy `.svelte-kit/cloudflare` to your host.

## Release (Desktop)

Create a tag and push it:

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions will build and attach desktop installers to the release.

## Release (Mobile)

Mobile builds require signing keys and platform tooling:

- Android: build an APK/AAB from `android/` using Gradle.
- iOS: build from `ios/` using Xcode and ship via TestFlight.

We recommend keeping mobile releases manual until you add signing secrets to CI.

Quick flow:

```bash
npm run cap:sync
npx cap open ios
npx cap open android
```

- iOS: Archive in Xcode, then upload to TestFlight/App Store.
- Android: Generate a signed APK/AAB in Android Studio, then upload to Play Console (or share the APK).
