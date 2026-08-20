# Quartier OS

Mobile-first neighborhood discovery for Moroccan cities. v1 ships with
Casablanca only, editorial content, no accounts. Built with Next.js (App
Router), Tailwind CSS, static content (no database required), Mapbox GL JS,
and Cohere for the "Ask AI" screen.

## Stack

- Next.js 16 (App Router, TypeScript, flat routes — no `[locale]` segment)
- Tailwind CSS v4
- Static in-repo content (`lib/staticData.ts`) — no database round-trip
- Mapbox GL JS (`mapbox-gl`)
- Cohere Chat API (v2, called directly via `fetch`) via a server-side `/api/chat` route
- framer-motion for the draggable bottom sheet

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get a Mapbox token

Create a free account at [mapbox.com](https://mapbox.com) and copy a public
token (starts with `pk.`) from [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens/).

### 3. (Optional) Get a Cohere API key

Only needed for the Ask AI screen to actually respond — the map and profile
pages work without it. Create a key at [dashboard.cohere.com/api-keys](https://dashboard.cohere.com/api-keys).
This key is server-side only (used in `app/api/chat/route.ts`) and is never
sent to the client.

### 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values above:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk...
COHERE_API_KEY=                          # optional, only for Ask AI
COHERE_MODEL=command-r-plus-08-2024      # optional override
```

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to
`/casablanca`. The map and all 3 quartier profiles work immediately with
just the Mapbox token. Without `COHERE_API_KEY`, the Ask AI screen shows
a clear inline error instead of a response — everything else is unaffected.

## Project structure

```
app/
  page.tsx                    → redirects to /casablanca
  [city]/page.tsx             → Screen 1: Map Home
  [city]/[quartier]/page.tsx  → Screen 2: Quartier Profile
  [city]/ask-ai/page.tsx      → Screen 3: Ask AI (fullscreen chat)
  api/chat/route.ts           → server-side Cohere proxy
components/                   → Map, BottomSheet, RatingBar(s), StatGrid,
                                 TopControls, ChatInterface, etc.
lib/
  data.ts                     → data access layer, reads lib/staticData.ts
  staticData.ts                → the actual content (1 city, 3 quartiers)
  types.ts                    → shared row/entity types
  constants.ts                → rating/essential labels, icons, ordering
  supabase.ts                  → unused for now, kept for a later DB swap
supabase/
  migrations/0001_init.sql    → schema + RLS policies (for a later DB swap)
  seed.sql                    → same content as staticData.ts, as SQL
```

## Decisions I made

A few points were left to reasonable judgment, or changed after the initial
build per follow-up direction; documenting them here rather than leaving
them silent:

- **Static content instead of Supabase, and Mapbox instead of Google Maps.**
  The original spec called for a Supabase-backed data layer and the Google
  Maps JavaScript API. Both were swapped out on request, to get a fully
  working app with a single API key (Mapbox) and zero backend setup.
  `lib/data.ts` keeps the same function signatures either way
  (`getCityBySlug`, `getQuartiersForCity`, `getQuartierDetail`,
  `getCityAiDataset`), reading from `lib/staticData.ts` — switching back to
  a live database later means changing the bodies of those 4 functions, not
  any calling code. The original Supabase schema/seed SQL and client (now
  unused) are kept in `supabase/` and `lib/supabase.ts` for that purpose.
- **Pages are statically generated (SSG).** Since the data is now genuinely
  static, `/[city]`, `/[city]/[quartier]`, and `/[city]/ask-ai` all use
  `generateStaticParams` and prerender at build time — no server round-trip
  to view them. Only `/api/chat` is server-rendered on demand, since it
  calls the Cohere API live.
- **Mapbox container sizing.** Mapbox GL's own stylesheet sets
  `position: relative` on the exact `<div>` you hand it as a container,
  which silently overrides Tailwind's `.absolute`/`.inset-0` utility classes
  and collapses its height to 0. `components/Map.tsx` sets `position` /
  `inset` via inline style instead (inline styles always win the cascade),
  plus a `ResizeObserver` that calls `map.resize()` if the container's
  measured size settles after Mapbox's first read.
- **Cohere instead of Claude for Ask AI.** The spec called for the Anthropic
  API (naming "Claude Sonnet 4.6", which isn't a real model id). Swapped to
  Cohere's Chat API v2 on request, using a test key. `/api/chat` calls
  `https://api.cohere.com/v2/chat` directly via `fetch` (no SDK needed) with
  the quartier dataset as a `system` message — same prompt, same
  `{"matches": [...]}` contract either provider. Defaults to
  `command-r-plus-08-2024`, overridable via `COHERE_MODEL`. Swapping back to
  Claude (or any other provider) only touches `app/api/chat/route.ts` — the
  request/response contract with `ChatInterface.tsx` doesn't change.
- **Non-streaming chat.** `/api/chat` returns a single JSON response rather
  than streaming tokens. Simpler and reliable for v1; streaming can be added
  later without changing the request contract.
- **Polygon "shadow" on selection.** The spec asks for a "subtle shadow" on
  the selected polygon; Mapbox's fill/line layers have no CSS box-shadow
  equivalent, so selection is instead conveyed via full opacity stroke +
  thicker stroke + higher `zIndex` (via `feature-state`).
- **AI matches persistence.** Matched quartier slugs from the Ask AI screen
  are stored in `sessionStorage` (not the URL) so they survive the
  Ask AI → map navigation and are cleared naturally when the tab closes.
- **Back navigation from the profile screen.** Uses a normal `<Link>` back to
  `/[city]`. Full in-memory map state (selected quartier, sheet expansion)
  is not persisted across navigation in v1 — reopening the map screen resets
  to the resting state.
- **Share icon.** Uses the Web Share API when available, falling back to
  copying the URL to the clipboard.
- **Images use `unoptimized`.** Hero/gallery photos are Unsplash placeholder
  URLs, not a fixed allow-listable domain — `next/image`'s `unoptimized`
  prop avoids a `remotePatterns` config that would need updating per photo.
  Swap in real, licensed photos before any real launch.
- **Turbopack root.** `next.config.ts` pins `turbopack.root` explicitly —
  without it, Turbopack's workspace-root inference climbed up to a stray
  `package.json` in the home directory on this machine.

## Known limitations / not implemented (by design, per spec)

- No accounts, reviews, or admin panel.
- Filters modal is a stub ("Bientôt disponible").
- No compare view, no i18n, no analytics beyond `// TODO` markers in the two
  page components.
- Only Casablanca is seeded; the schema/types support more cities/countries
  without restructuring.

## Deploying to Vercel

```bash
vercel
```

Or connect the repo in the Vercel dashboard and set the env vars from
`.env.example` under Project Settings → Environment Variables
(`COHERE_API_KEY` stays server-side automatically since it lacks the
`NEXT_PUBLIC_` prefix).
