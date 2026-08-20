# Quartier OS

Mobile-first neighborhood discovery for Moroccan cities. v1 ships with
Casablanca only, editorial content, no accounts. Built with Next.js (App
Router), Tailwind CSS, Supabase, the Google Maps JavaScript API, and Claude
(Anthropic API) for the "Ask AI" screen.

## Stack

- Next.js 16 (App Router, TypeScript, flat routes — no `[locale]` segment)
- Tailwind CSS v4
- Supabase (Postgres + Row Level Security, public read-only)
- Google Maps JavaScript API (`@googlemaps/js-api-loader`)
- Anthropic API (`@anthropic-ai/sdk`) via a server-side `/api/chat` route
- framer-motion for the draggable bottom sheet

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — this creates the 7 tables and Row Level Security policies (public read, no public writes).
3. Run [`supabase/seed.sql`](supabase/seed.sql) — this inserts Casablanca and 3 quartiers (Bourgogne, Sidi Maarouf, Gauthier) with plausible placeholder data. It's idempotent (deletes-then-inserts by slug), so it's safe to re-run.
4. From Project Settings → API, copy the Project URL and the `anon` public key.

If you have the Supabase CLI installed and a project linked, you can instead run:

```bash
supabase db push --db-url <your-connection-string>
psql <your-connection-string> -f supabase/seed.sql
```

### 3. Get a Google Maps JavaScript API key

Enable the **Maps JavaScript API** in Google Cloud Console and create an API key. Restrict it to your domain(s) once deployed.

### 4. Get an Anthropic API key

Create a key at [console.anthropic.com](https://console.anthropic.com). This key is server-side only (used in `app/api/chat/route.ts`) and is never sent to the client.

### 5. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the 4 values above:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-5   # optional override
```

### 6. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/casablanca`.

Without real Supabase credentials the app builds and runs, but data-dependent
routes (`/[city]`, `/[city]/[quartier]`, `/[city]/ask-ai`) will throw a clear
`fetch failed` error at request time rather than crashing the build — this is
intentional (see "Decisions I made" below).

## Project structure

```
app/
  page.tsx                    → redirects to /casablanca
  [city]/page.tsx             → Screen 1: Map Home
  [city]/[quartier]/page.tsx  → Screen 2: Quartier Profile
  [city]/ask-ai/page.tsx      → Screen 3: Ask AI (fullscreen chat)
  api/chat/route.ts           → server-side Anthropic proxy
components/                   → Map, BottomSheet, RatingBar(s), StatGrid,
                                 TopControls, ChatInterface, etc.
lib/
  data.ts                     → all Supabase queries, typed
  types.ts                    → DB row types
  constants.ts                → rating/essential labels, icons, ordering
  mapStyles.ts                → desaturated Google Maps style array
supabase/
  migrations/0001_init.sql    → schema + RLS policies
  seed.sql                    → 1 city, 3 quartiers, full seed data
```

## Decisions I made

A few points in the spec were left to reasonable judgment; documenting them
here rather than leaving them silent:

- **AI model id.** The spec named "Claude Sonnet 4.6", which isn't a real
  model id. `/api/chat` defaults to `claude-sonnet-5` (the current flagship)
  and is overridable via `ANTHROPIC_MODEL` in `.env.local`.
- **Non-streaming chat.** `/api/chat` returns a single JSON response rather
  than streaming tokens. Simpler and reliable for v1; streaming can be added
  later without changing the request contract.
- **Data fetching is server-side, not client-side Supabase queries.** Each
  route is a Server Component that fetches via `lib/data.ts` and passes
  plain data down to client components. Routes are marked
  `export const dynamic = "force-dynamic"` since quartier data can change
  without a redeploy, and so the build doesn't try to statically prerender
  pages that need a live database.
- **Placeholder Supabase client instead of a lazy singleton.** `lib/supabase.ts`
  falls back to a harmless placeholder URL/key when env vars are unset, so
  `next build` always succeeds even before real credentials are configured.
  Real requests against the placeholder fail loudly at runtime instead.
- **Polygon "shadow" on selection.** The spec asks for a "subtle shadow" on
  the selected polygon; the Google Maps `Polygon` overlay has no CSS
  box-shadow equivalent, so selection is instead conveyed via full opacity
  stroke + thicker stroke + higher `zIndex`.
- **AI matches persistence.** Matched quartier slugs from the Ask AI screen
  are stored in `sessionStorage` (not the URL) so they survive the
  Ask AI → map navigation and are cleared naturally when the tab closes.
- **Back navigation from the profile screen.** Uses `router.back()`-style
  navigation to `/[city]`. Full in-memory map state (selected quartier,
  sheet expansion) is not persisted across navigation in v1 — reopening the
  map screen resets to the resting state.
- **Share icon.** Uses the Web Share API when available, falling back to
  copying the URL to the clipboard.
- **Images use `unoptimized`.** Hero/gallery photos come from Unsplash
  placeholder URLs (`source.unsplash.com`), which aren't a fixed, allow-listable
  domain — `next/image`'s `unoptimized` prop is used to avoid a `remotePatterns`
  config that would need updating per-photo-host. Swap in real, licensed
  photos (and a proper image loader) before any real launch.
- **Turbopack root.** `next.config.ts` pins `turbopack.root` explicitly —
  without it, Turbopack's workspace-root inference climbed up to a stray
  `package.json` in the home directory on this machine.

## Known limitations / not implemented (by design, per spec)

- No accounts, reviews, or admin panel.
- Filters modal is a stub ("Bientôt disponible").
- No compare view, no i18n, no analytics beyond `// TODO` markers in the two
  page components.
- Only Casablanca is seeded; the schema supports more cities/countries
  without changes.

## Deploying to Vercel

```bash
vercel
```

Or connect the repo in the Vercel dashboard and set the 5 environment
variables from `.env.example` (all of them, including `ANTHROPIC_API_KEY`,
under Project Settings → Environment Variables — mark `ANTHROPIC_API_KEY` as
**not** exposed to the client, which it isn't by default since it lacks the
`NEXT_PUBLIC_` prefix).
