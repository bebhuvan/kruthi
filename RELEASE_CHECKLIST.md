# Release Checklist

Use this checklist for every user-facing release.

## 1) Pre-merge quality gate

- [ ] All work lands through PR into `main`
- [ ] `npm run check` passes
- [ ] `npm test` passes
- [ ] Build commands for touched targets pass

## 2) Versioning

- [ ] Pick semantic version bump (`major` / `minor` / `patch`)
- [ ] Update `package.json` version
- [ ] Update `src-tauri/tauri.conf.json` version
- [ ] Keep versions aligned across release artifacts

## 3) Release notes

- [ ] Summarize user-visible changes
- [ ] Call out migrations/manual steps (if any)
- [ ] Include known issues/workarounds

## 4) Publish desktop release

- [ ] Create and push release tag:
  - `git tag vX.Y.Z`
  - `git push origin vX.Y.Z`
- [ ] Verify GitHub Actions release job succeeds
- [ ] Verify installers and `SHA256SUMS.txt` are attached

## 5) Post-release validation

- [ ] Install latest artifact on Linux/Windows/macOS smoke machine
- [ ] Confirm app launches and reads an EPUB
- [ ] Confirm update instructions in README are still accurate

## 6) User communication

- [ ] Publish release notes
- [ ] Share update instructions:
  - Linux: `bash scripts/install-linux.sh`
  - Desktop: download latest installer from Releases

