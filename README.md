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
  staticData.ts                → the actual content (1 city, 47 quartiers)
  geo/casablanca-arrondissements.json → real boundary shapes (16 arrondissements)
  quartierPrices.json          → scraped achat/loyer medians, merged over the
                                  defaults in staticData.ts (see scripts/ below)
  types.ts                    → shared row/entity types
  constants.ts                → rating/essential labels, icons, ordering
  supabase.ts                  → unused for now, kept for a later DB swap
scripts/
  scrape-mubawab-prices.ts    → Playwright scraper, writes lib/quartierPrices.json
supabase/
  migrations/0001_init.sql    → schema + RLS policies (for a later DB swap)
  seed.sql                    → same content as staticData.ts, as SQL
```

## Refreshing real prices (`scrape-mubawab-prices.ts`)

`price_buy_per_sqm` and `price_rent_2br` in `lib/staticData.ts` are
placeholder defaults (from the 4 character templates). A Playwright script
scrapes real per-quartier medians from Mubawab.ma listings and writes them
into `lib/quartierPrices.json`, which `staticData.ts` merges on top of those
defaults automatically — no code changes or restart needed, just a rebuild.

```bash
npm run scrape:prices                    # scrape all 47 quartiers
npm run scrape:prices -- --dry-run       # log only, write nothing
npm run scrape:prices -- --quartier=racine  # one quartier only
```

It always launches a **visible** (non-headless) browser — if Mubawab shows a
Cloudflare challenge, the script pauses and waits for you to solve it in
that window, then continues once you press Enter. Between quartiers it waits
20–40s, and 10–15s between the achat and loyer page loads within a quartier,
to stay polite. A full run across all 47 is slow (there are pauses by
design) — expect on the order of 30–45+ minutes, more if Cloudflare
intervenes.

**Known limitation:** Mubawab has its own curated quartier taxonomy, not a
keyword search — the script guesses a Mubawab-style URL slug from each
quartier's name (`mubawab.ma/fr/sd/casablanca/{slug}/appartements-a-vendre`).
Many of our 47 won't have a match at all (confirmed: "bourgogne" 404s even
though "racine" works) — those are logged and skipped, not forced. Expect a
real run to fill in noticeably fewer than 47.

## Refreshing quartier locations (`fetch-quartier-locations.ts`)

The 28 informal-name quartiers (Racine, CIL, Zenata, etc. — see "Decisions
I made" below) get their center point from the Places API (New) rather
than a hand-typed guess. Needs `GOOGLE_PLACES_API_KEY` in `.env.local`.

```bash
npm run fetch:quartier-locations                          # all 28
npm run fetch:quartier-locations -- --dry-run              # log only, write nothing
npm run fetch:quartier-locations -- --quartier=zenata      # one quartier only
```

Writes `lib/geo/quartier-locations.json`, which `lib/staticData.ts` merges
in automatically. Makes billed Google Maps Platform API calls (trivial
cost for 28 lookups). A lookup that fails is logged and skipped — that
quartier just keeps its previous coordinate rather than blocking the run.

## Decisions I made

A few points were left to reasonable judgment, or changed after the initial
build per follow-up direction; documenting them here rather than leaving
them silent:

- **`fetch-quartier-locations.ts` uses the Places API (New), not the
  legacy endpoint.** The legacy `maps.googleapis.com/maps/api/place/...`
  Text Search returned `REQUEST_DENIED` ("legacy API not enabled") against
  the provided key, and legacy Geocoding separately required billing to be
  enabled on top of that — confirmed by calling both directly, not
  assumed. `places.googleapis.com/v1/places:searchText` (POST + a field
  mask header) worked immediately, so the script uses that.
- **The script prefers a real place-type result over the raw top hit, and
  rejects pure-business results outright.** Text Search ranks by text
  relevance, not place type — for a name that's also a business/hotel/road
  name (Nassim, Val d'Anfa, Zenata, Triangle d'Or), the top-ranked result
  was often a real estate office, a hotel, or a road, not the neighborhood
  itself. Caught this by actually inspecting what each lookup matched
  (`displayName`/`types`), not just trusting coordinates came back —
  9 of the first 28 lookups were silently wrong this way, including
  "Nassim" resolving to a specific office's street address ~4km from the
  real district. Fixed with a type-tiered preference
  (neighborhood/sublocality → locality/administrative area → route/premise
  → reject) and an explicit failure when only businesses/POIs are found
  (e.g. "Triangle d'Or" — a shopping mall by that name exists, the
  district apparently isn't in Google's Places index under that query, so
  it's skipped rather than pointed at the mall).
- **Price scraper writes to `lib/quartierPrices.json`, not Supabase.** As
  originally spec'd, the scraper was meant to write straight to Supabase.
  Since the app runs entirely on static data (see below) and Supabase isn't
  even connected right now, that would've written somewhere the live app
  doesn't read from, and `supabase/seed.sql` only has 3 of the 47 quartiers
  anyway. Confirmed with you and redirected the writes into a JSON override
  file that `staticData.ts` merges on top of the template defaults — same
  spirit (real scraped medians overriding placeholders), actually wired
  into what's live. Also renamed the "loyer" field to match our existing
  `price_rent_2br`, but note it's really an all-apartment-sizes median, not
  filtered to 2-bedroom listings specifically — the spec didn't ask for
  bedroom-count filtering, and adding it was out of scope for this pass.
- **The scraper's URL pattern isn't the one in the original spec.**
  `?keywords=...` doesn't filter anything — confirmed by watching it
  silently redirect to the unfiltered national listing page. The site
  actually uses path-based deep links per its own curated quartier list
  (`/fr/sd/casablanca/{quartier}/appartements-a-vendre`), discovered by
  using Mubawab's own location search UI and reading the resulting URL.
- **Quartiers are dots/pills only — no shape is ever drawn, not even for the
  16 with a real boundary.** Originally a selected quartier's polygon (fill
  + outline) rendered on the map. Investigating a user-reported bad shape
  (Ancienne Médina's placeholder box looked nothing like its real,
  irregular outline — see below) turned into confirming, across five
  independent sources (OSM Overpass, OSM Nominatim, Google Places API,
  Mapbox Geocoding API, Mapbox's own vector tiles, Who's on First), that no
  free/public source has a real boundary for any of the 31 informal
  quartiers — only the 16 official arrondissements do. Rendering 16 real
  shapes next to 31 guessed boxes read as more precise than the data
  actually is, and was inconsistent besides. Removed shape rendering
  entirely, for all 47: at rest, each quartier is a small dot; at zoom ≥ 13
  those dots expand into named pills (`icon-text-fit` capsule images,
  Airbnb-style), using Mapbox's own label-collision system so fewer names
  show when zoomed out and more appear as you zoom in — no clustering
  library needed. Selecting a quartier now swaps its dot/pill for a filled,
  name-bearing badge (`mapboxgl.Marker`, same pattern already used for the
  Ask AI sparkle badges) instead of drawing a shape. The polygon data
  itself wasn't deleted — every quartier still has a `polygon` field,
  because `fitBounds` (below) still needs it for camera framing — it's
  just never drawn on screen.
- **Selecting a quartier frames its extent with `fitBounds`, not a fixed
  zoom bump.** A flat "zoom in one level" doesn't account for how big the
  selected quartier's extent actually is (a tiny placeholder box vs. a
  large arrondissement) or how zoomed in the user already was — it either
  barely moves or wildly over-zooms. `fitBounds(polygonBounds(quartier.polygon), …)`
  sizes the zoom to that extent, even though the polygon itself is never
  drawn (see above). Its `padding` is asymmetric — small on top, ~48% of
  the container height on the bottom — to match the bottom sheet's
  "preview" state (see BottomSheet's PREVIEW fraction), so the quartier
  lands fully inside the space still visible above the sheet instead of
  being centered behind it.
- **Mapbox GL feature-state needs numeric feature ids.** Discovered while
  building the above: a GeoJSON source's features had `id: quartier.slug`
  (a string) — the source data keeps it fine, but `setFeatureState` /
  `queryRenderedFeatures` then silently can't find it on the rendered
  feature (confirmed empirically against mapbox-gl 3.29; not documented
  anywhere obvious). Switched to the array index as a numeric id;
  `slug` still lives in `properties` for click handling and filters, which
  read fine as either a string or number.
- **Mapbox's "load" event can hang forever on a spotty network; "style.load"
  doesn't.** `load` waits for literally everything (every tile, every
  source) to finish, which never happened reliably in this dev sandbox.
  `style.load` only waits for the style spec/sprite/glyphs, which is all
  that's needed before calling `addSource`/`addLayer` — switched to that.
- **47 quartiers, 3 "full" + 44 "lightweight."** On request, every named
  district of Casablanca is now active/clickable on the map, not just the
  original 3. Bourgogne, Sidi Maarouf, and Gauthier keep their hand-authored
  content (unique photos, description, pros/cons). The other 44 in
  `lib/staticData.ts` are generated from 4 "character" templates
  (upscale-coastal / central-chic / popular-central / residential-family) —
  a template supplies all 8 ratings, prices, and essentials counts, so
  every profile page still renders fully rather than looking broken/empty.
  Commute times are estimated from straight-line distance to 3 fixed
  reference points, and their gallery photos array is empty (the profile
  page already hides that section when empty). Treat these 44 as
  placeholders to replace with real per-quartier content later, the same
  way the original 3 were meant to be replaced before a real launch.
- **16 of those 44 use real, surveyed boundary shapes; the other 28 use a
  Google-verified point, not a real shape.** Casablanca has 16 official
  arrondissements (administrative subdivisions — Anfa, Maârif, Al Fida,
  Ain Chock, Ain Sebaâ, Ben M'Sick, Hay Hassani, Hay Mohammadi, Mers
  Sultan, Moulay Rachid, Roches Noires, Sbata, Sidi Belyout, Sidi
  Bernoussi, Sidi Moumen, Sidi Othmane); their exact boundaries are public
  OpenStreetMap data, fetched via `polygons.openstreetmap.fr`,
  Douglas-Peucker-simplified to ~10-70 points each, and checked into
  `lib/geo/casablanca-arrondissements.json` (~8 KB). The other 28
  lightweight quartiers are informal, commonly-used neighborhood names
  (Racine, CIL, Val Fleuri, Belvédère, Zenata, etc.) that have no official
  boundary anywhere — even OpenStreetMap only has a single point for most
  of them, since their extent is genuinely undefined in real life, not
  just unmapped.

  These 28 originally used a mix of hand-typed guesses and OSM points of
  varying reliability — one guess (Zenata) turned out to be in the sea.
  All 28 now come from a single verified source instead:
  `scripts/fetch-quartier-locations.ts` looks each one up via the Places
  API (New) and writes a real point + a viewport-derived box size into
  `lib/geo/quartier-locations.json`, which `lib/staticData.ts` merges in
  (falling back to the original hand-typed estimate only if a lookup ever
  fails). This is still **not** a true boundary polygon — Google's public
  API doesn't expose real neighborhood shapes for informal names any more
  than OSM does, which is exactly why the 16 official arrondissements had
  to come from OSM's actual administrative-boundary data instead. It's a
  verified center point with a box sized to roughly the right extent, a
  real accuracy upgrade over guessing, not a claim of a real outline.
  Confirmed there's no free/public source for the real shape either:
  Google's own consumer Maps product renders a boundary for some informal
  districts (e.g. Ancienne Médina) that its public API doesn't expose, and
  a follow-up OSM search (any way/relation named "medina" or tagged
  historic within 1.5km of it) came back empty too. Getting a real polygon
  for a specific quartier means either manually digitizing coordinates
  exported from Google Maps, or tracing one from a reference screenshot —
  both one-off, per-quartier work, left undone for now.
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
- 44 of the 47 quartiers use generated placeholder content, and 28 of those
  44 also use an approximate (not surveyed) polygon shape — see "Decisions
  I made" above.

## Deploying to Vercel

```bash
vercel
```

Or connect the repo in the Vercel dashboard and set the env vars from
`.env.example` under Project Settings → Environment Variables
(`COHERE_API_KEY` stays server-side automatically since it lacks the
`NEXT_PUBLIC_` prefix).
