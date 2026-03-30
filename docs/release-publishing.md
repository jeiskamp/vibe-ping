# VibePing Draft Release Publishing

This document describes how draft GitHub releases are generated from tags.

## Trigger

- Push a semantic version tag that starts with `v` (example: `v1.0.0`).
- The workflow `.github/workflows/release-draft.yml` runs automatically.

## What The Workflow Does

1. Builds platform packages on:
   - `ubuntu-latest`
   - `windows-latest`
   - `macos-latest`
2. Uploads each platform output from `apps/watcher/release`.
3. Combines all artifacts.
4. Generates `SHA256SUMS.txt`.
5. Creates or updates a draft GitHub release for the tag and attaches artifacts plus checksums.

## Required GitHub Secrets

macOS release job requires:

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

Windows release job requires:

- `WIN_CSC_LINK`
- `WIN_CSC_KEY_PASSWORD`

If required secrets are missing, the release workflow fails fast with a clear error instead of publishing unsigned artifacts.

Detailed Apple certificate + notarization setup:

- [docs/notarization-setup.md](./notarization-setup.md)

## Local Validation Before Tagging

Run these before creating the release tag:

```bash
pnpm typecheck
pnpm build
pnpm package:watcher:smoke
```

`pnpm package:watcher:smoke` does not require notarization secrets and will skip notarization locally when those secrets are not present.

## Example Tag Flow

```bash
git tag v1.0.0
git push origin v1.0.0
```
