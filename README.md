# aroha-astrology/mobile

Two Expo apps:
- **`/`** — main consumer app (`@aroha-astrology/mobile`)
- **`/astrologer/`** — astrologer-facing app (`@aroha-astrology/astrologer-mobile`)

Both built via EAS Build → Google Play / App Store.

## Backend / API

The mobile app calls the backend over HTTPS at `EXPO_PUBLIC_API_URL`. Set this via EAS Secrets (not eas.json — that file is committed to a public repo).

## Build secrets — set via `eas secret:create`

Required for both `preview` and `production` build profiles:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://api.arohaastrology.in
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://...
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJ...
```

EAS injects these into the build environment so the bundled JS contains the values, but they never appear in the repo.

## Android signing

Keystores (`*.jks`, `*.keystore`) are NEVER committed. Use:
- `eas credentials` to upload/manage your release keystore on EAS's encrypted storage
- Or check in only `credentials.json` referencing local paths if running EAS Build locally

The original keystore from the monorepo has been removed; you must rotate it if it was ever leaked (any keystore in past commits of the source monorepo).

## Branches

- `main` — production. PR + 1 approval required.
- `staging` — preview. PR required.
- `develop` — active dev.

## Local dev

```bash
pnpm install
pnpm dev              # consumer app: expo start
cd astrologer && pnpm dev   # astrologer app
```

## Origin

Split off from `Wookiee17/jyotish-ai` monorepo (apps/mobile + apps/astrologer-mobile) on 2026-05-24.
