# Setup Guide — Auth, Payments & Deployment

This guide walks you through connecting Clerk (auth), Stripe (payments), Supabase (database), and deploying to Vercel.

---

## 1. Supabase — create the purchases table

1. Go to https://supabase.com and create a free project
2. Open the **SQL Editor** and run:

```sql
create table purchases (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  stripe_session_id text,
  stripe_customer_id text,
  amount integer,
  currency text,
  status text default 'active',
  purchased_at timestamptz default now()
);

-- Allow authenticated reads (for usePlan hook via anon key)
alter table purchases enable row level security;

create policy "Users can read own purchase"
  on purchases for select
  using (true);  -- or restrict to clerk_user_id if you pass a JWT
```

3. Go to **Settings → API** and copy:
   - Project URL → `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - `anon` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — only used in the webhook)

---

## 2. Clerk — authentication

1. Go to https://clerk.com and create a new application
2. Enable **Email** and **Google** sign-in (or whichever you prefer)
3. Go to **API Keys** and copy:
   - Publishable key → `VITE_CLERK_PUBLISHABLE_KEY`

No backend Clerk key is needed — the frontend SDK is enough for this setup.

---

## 3. Stripe — one-time payment

1. Go to https://stripe.com and create an account
2. In **Developers → API Keys**, copy:
   - Secret key → `STRIPE_SECRET_KEY`
3. Create a **Product**:
   - Go to **Products → Add product**
   - Name: "Mixmoments — Lifetime"
   - Price: $19.00, one-time
   - Copy the **Price ID** (starts with `price_`) → `STRIPE_PRICE_ID`
4. Set up a **Webhook** (after deploying to Vercel):
   - Go to **Developers → Webhooks → Add endpoint**
   - URL: `https://your-app.vercel.app/api/stripe-webhook`
   - Events to listen: `checkout.session.completed`
   - Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 4. Deploy to Vercel

1. Push the project to a GitHub repo
2. Go to https://vercel.com → **New Project** → import your repo
3. Add all environment variables in **Settings → Environment Variables**:

```
VITE_CLERK_PUBLISHABLE_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL   ← set to your Vercel URL, e.g. https://wedding-playlist.vercel.app
```

4. Deploy. Vercel auto-detects Vite and serves `/api/*` as serverless functions.

5. After deploy, go back to Stripe and add the webhook URL (step 3.4 above).

---

## 5. Local development

Create a `.env.local` file (copy from `.env.example`) and fill in your keys:

```bash
cp .env.example .env.local
```

For Stripe webhooks locally, use the Stripe CLI:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:5173/api/stripe-webhook
```

This gives you a local `STRIPE_WEBHOOK_SECRET` to put in `.env.local`.

Then run:

```bash
npm install
npm run dev
```

---

## How it works end-to-end

```
User adds 6+ songs
  → Export clicked
  → App checks usePlan() → isPro = false
  → UpgradeModal shown

User clicks "Get lifetime access"
  → POST /api/create-checkout (Vercel function)
  → Stripe Checkout session created
  → User redirected to Stripe hosted page

User pays
  → Stripe sends webhook to /api/stripe-webhook
  → Webhook verified, purchase written to Supabase
  → User redirected back to app with ?payment=success

App reloads
  → usePlan() queries Supabase → isPro = true
  → All songs unlocked, export works
```

---

## Free vs Paid limits

Edit `FREE_LIMIT` in `src/App.jsx` (currently `5`) to change how many songs are free.
