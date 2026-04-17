# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server at http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint on all .js/.jsx files
```

No test runner is configured. Lint via ESLint 9 (flat config). Deploy target is Vercel.

## Architecture

**Mixmoments** is a browser-based audio playlist builder. Core audio processing runs entirely client-side — no backend is needed for playlist building. A payment tier (Clerk + Stripe + Supabase) gates usage beyond 5 songs.

### Data flow

1. `index.html` → `src/main.jsx` mounts `<App>` wrapped in Clerk's `<ClerkProvider>`
2. `src/App.jsx` is the single state owner — holds the song list, export progress, and pro/free gating logic
3. Users drop or browse MP3 files → `handleFiles()` decodes them via Web Audio API
4. `SongCard` components expose trim (start/end time) and fade-out controls per song; `@dnd-kit` handles reordering
5. On export, `buildMergedBuffers()` + `encodeMp3()` in `src/utils/audio.js` produce a downloadable `mixmoments-playlist.mp3`
6. If the user has >5 songs (free limit = `FREE_LIMIT` constant in `App.jsx`), `UpgradeModal` blocks export and triggers the payment flow

### Audio processing (`src/utils/audio.js`)

- **Decode**: `decodeAudioData()` (Web Audio API)
- **Merge**: extracts trimmed segments, applies fade-out curves between transitions
- **Encode**: `@breezystack/lamejs` (MP3 encoder running in the main thread — can take 30–60 s for large playlists)

### Payment flow (`api/`)

These are Vercel serverless functions:
- `api/create-checkout.js` — creates a Stripe Checkout session and returns the URL
- `api/stripe-webhook.js` — verifies Stripe signature, writes a row to Supabase `purchases` table on successful payment
- `src/hooks/usePlan.js` — queries Supabase with the Clerk user ID to determine pro status

### Styling

CSS Modules (`.module.css`) per component; global styles in `src/index.css`.

## Environment variables

Copy `.env.example` to `.env`. Required keys: Clerk publishable/secret keys, Supabase URL/anon key, Stripe secret key + webhook secret + price ID, and the app's public URL. See `SETUP.md` for the full integration setup steps.
