# Mixmoments — Playlist Builder

A React + Vite web app to create your event playlist — trim songs, add fade-outs, and export a single merged MP3. Everything runs in the browser; no files are uploaded anywhere.

## Features

- **Load MP3 files** via drag & drop or file browser
- **Drag to reorder** tracks with smooth DnD
- **Trim each song** — set start and end times (format: `m:ss`)
- **Fade-out** between tracks (0 – 8 seconds, configurable per transition)
- **Export** — merges all tracks into one `mixmoments-playlist.mp3`

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Stack

- **React 19** — UI
- **Vite 8** — build tool & dev server
- **@dnd-kit** — drag-and-drop sorting
- **lamejs** — in-browser MP3 encoding
- **Web Audio API** — audio decoding & mixing (native browser API, no extra package)
- **CSS Modules** — scoped styles

## Project Structure

```
src/
  App.jsx                  # Root layout, state, export logic
  App.module.css
  components/
    DropZone.jsx           # File drop / browse UI
    SongCard.jsx           # Per-song trim + fade controls
    ExportPanel.jsx        # Export button + progress
  utils/
    audio.js               # Audio decode, mix, MP3 encode helpers
```

## Deploying to Vercel

Mixmoments uses Vercel for hosting and serverless API routes (Stripe webhook + checkout session). Follow these steps in order.

### 1. External services setup

Before deploying you need accounts and keys from three services:

| Service | What you need |
|---|---|
| [Clerk](https://clerk.com) | Create an app → copy **Publishable key** and **Secret key** |
| [Supabase](https://supabase.com) | Create a project → Settings → API → copy **URL**, **anon key**, and **service_role key** |
| [Stripe](https://stripe.com) | Create a product with a one-time price → copy **Secret key**, **Price ID** |

#### Supabase — create the purchases table

Run this in the Supabase SQL editor:

```sql
create table purchases (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  created_at timestamptz default now()
);
```

### 2. Deploy to Vercel

```bash
# Install the Vercel CLI (skip if already installed)
npm i -g vercel

# From the project root — follow the prompts
vercel
```

Or connect directly via the Vercel dashboard: **Add New Project → Import Git Repository**.

### 3. Set environment variables

In **Vercel → Project → Settings → Environment Variables**, add every key from `.env.example`:

| Variable | Where to find it |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `VITE_SUPABASE_URL` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `VITE_PUBLIC_URL` | Your Vercel deployment URL, e.g. `https://mixmoments.app` |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `STRIPE_PRICE_ID` | Stripe → Product catalog → your product → Price ID |
| `STRIPE_WEBHOOK_SECRET` | Set after step 4 below |
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `NEXT_PUBLIC_APP_URL` | Same as `VITE_PUBLIC_URL` |

`VITE_*` variables are exposed to the browser bundle. The rest are server-only (used only by the `api/` functions).

### 4. Register the Stripe webhook

```bash
# Install the Stripe CLI if needed
# https://stripe.com/docs/stripe-cli

stripe login
stripe listen --forward-to https://<your-vercel-domain>/api/stripe-webhook
```

For production, register the endpoint permanently in the Stripe dashboard:

1. Stripe → Developers → Webhooks → **Add endpoint**
2. URL: `https://<your-vercel-domain>/api/stripe-webhook`
3. Events to listen for: `checkout.session.completed`
4. Copy the **Signing secret** → paste it as `STRIPE_WEBHOOK_SECRET` in Vercel

### 5. Configure Clerk redirect URLs

In Clerk → your app → **Paths**, set:

- **Sign-in URL**: `https://<your-vercel-domain>/`
- **After sign-in URL**: `https://<your-vercel-domain>/`
- **Allowed redirect URLs**: `https://<your-vercel-domain>/*`

### 6. Redeploy

After adding all environment variables, trigger a fresh deployment so they take effect:

```bash
vercel --prod
```

Or push a commit to your linked Git branch — Vercel redeploys automatically.

### Local development with real services

```bash
cp .env.example .env
# Fill in .env with your actual keys

npm run dev

# In a separate terminal, forward Stripe events locally:
stripe listen --forward-to localhost:5173/api/stripe-webhook
```

## Notes

- MP3 encoding with lamejs can take 30–60s for large playlists
- All processing is done client-side — no backend required for audio
- The `api/` folder contains Vercel serverless functions (Stripe checkout + webhook)
- The `dist/` folder contains a ready-to-deploy production build
