# VibePing Notarization Setup

Use this once to wire macOS signing and notarization for release builds.

## 1) Create and export the signing certificate

In Apple Developer:

1. Create a **Developer ID Application** certificate.
2. Install it into Keychain Access.
3. Export the certificate as `.p12` with a password.

Convert the `.p12` to base64 for GitHub secrets:

```bash
base64 -i /path/to/developer-id-app.p12 | pbcopy
```

## 2) Create Apple app-specific password

1. Open your Apple ID security settings.
2. Generate an app-specific password.
3. Keep this value for `APPLE_APP_SPECIFIC_PASSWORD`.

## 3) Add required GitHub repository secrets

macOS signing + notarization:

- `CSC_LINK` -> base64 `.p12` value
- `CSC_KEY_PASSWORD` -> `.p12` export password
- `APPLE_ID` -> Apple ID email
- `APPLE_APP_SPECIFIC_PASSWORD` -> app-specific password
- `APPLE_TEAM_ID` -> Apple Developer Team ID

Windows signing (for full release matrix):

- `WIN_CSC_LINK`
- `WIN_CSC_KEY_PASSWORD`

## 4) Run preflight notarization check

In GitHub Actions, run:

- `Notarization Preflight`

This validates secrets and builds a notarized macOS package with:

- `VIBEPING_REQUIRE_NOTARIZATION=1`

If notarization fails, the workflow fails.

## 5) Release flow after preflight passes

1. Create tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

2. The `Release Draft` workflow builds and attaches artifacts.
