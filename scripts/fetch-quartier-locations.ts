/**
 * Look up real coordinates for the informal quartier names that have no
 * official boundary anywhere (see lib/staticData.ts's Tier 2/3 comment),
 * using the Places API (New) Text Search endpoint. Writes
 * lib/geo/quartier-locations.json, which lib/staticData.ts merges in
 * automatically — no code changes needed after running this.
 *
 * Usage:
 *   npm run fetch:quartier-locations -- [--dry-run] [--quartier=<slug>]
 *   npx tsx scripts/fetch-quartier-locations.ts [--dry-run] [--quartier=<slug>]
 *
 * Requires GOOGLE_PLACES_API_KEY in .env.local.
 *
 * Important: Google's public Places API returns a verified POINT and a
 * rough bounding box (`viewport`) for a named place — not a true polygon
 * outline. Google doesn't expose real neighborhood boundary geometry via
 * its public API (that's exactly why the 16 official arrondissements are
 * sourced from OpenStreetMap instead, which does have real surveyed
 * boundaries — see lib/geo/casablanca-arrondissements.json). This script
 * upgrades Tier 2/3 quartiers from "guessed or OSM-point-only" to
 * "Google-verified point + viewport-sized placeholder box" — a real
 * accuracy improvement, not a real boundary.
 *
 * API note: this uses the *new* Places API (v1, `places.googleapis.com`),
 * not the legacy `maps.googleapis.com/maps/api/place/...` endpoint — the
 * legacy one returned REQUEST_DENIED ("legacy API not enabled") against
 * the key this project uses, and the legacy Geocoding API separately
 * required billing to be enabled. The new Places API worked directly.
 */

import fs from "node:fs";
import path from "node:path";
import { QUARTIERS_NEEDING_LOCATION, STATIC_CITY } from "../lib/staticData";

loadEnvLocal();

const DRY_RUN = process.argv.includes("--dry-run");
const QUARTIER_FILTER = process.argv.find((a) => a.startsWith("--quartier="))?.split("=")[1];

const LOCATIONS_PATH = path.join(__dirname, "..", "lib", "geo", "quartier-locations.json");
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Half-width/half-height clamp for the viewport-derived placeholder box, in
// degrees — keeps an unusually huge or tiny Google viewport from producing
// a degenerate polygon.
const MIN_DELTA = 0.002;
const MAX_DELTA = 0.01;

interface QuartierLocation {
  lat: number;
  lng: number;
  dLat: number;
  dLng: number;
}

interface PlaceResult {
  displayName?: { text: string };
  types?: string[];
  location: { latitude: number; longitude: number };
  viewport?: { low: { latitude: number; longitude: number }; high: { latitude: number; longitude: number } };
}

// Text Search ranks by text relevance, not place type — for a name like
// "Nassim" or "Val d'Anfa" that's also a business/hotel/street name, the
// top-ranked result is often a real estate office or a hotel, not the
// neighborhood. Prefer an actual place-type result over the raw top hit;
// reject pure commercial/POI results (hotel, store, clinic, restaurant,
// ...) entirely rather than silently writing a business's address as a
// neighborhood's coordinates.
const PLACE_TYPE_TIERS: string[][] = [
  ["neighborhood", "sublocality", "sublocality_level_1"],
  ["locality", "administrative_area_level_3", "administrative_area_level_4"],
  ["route", "premise", "street_address"],
];

function pickBestResult(places: PlaceResult[]): PlaceResult | null {
  for (const tier of PLACE_TYPE_TIERS) {
    const match = places.find((p) => (p.types ?? []).some((t) => tier.includes(t)));
    if (match) return match;
  }
  return null;
}

function loadEnvLocal(): void {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function clampDelta(degrees: number): number {
  return Math.min(MAX_DELTA, Math.max(MIN_DELTA, degrees));
}

interface LookupSuccess extends QuartierLocation {
  matchedName: string;
  matchedTypes: string[];
}

async function lookupQuartier(name: string, cityName: string): Promise<LookupSuccess | { error: string }> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask": "places.location,places.viewport,places.displayName,places.types",
    },
    body: JSON.stringify({ textQuery: `${name}, ${cityName}, Morocco` }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { error: data.error?.message ?? `HTTP ${res.status}` };
  }
  if (!data.places?.length) {
    return { error: "no results" };
  }

  const place = pickBestResult(data.places);
  if (!place) {
    return { error: `no real-place result (only businesses/POIs: ${data.places.map((p: PlaceResult) => p.displayName?.text).join(", ")})` };
  }

  const { latitude: lat, longitude: lng } = place.location;
  const viewport = place.viewport;
  const dLat = viewport ? clampDelta(Math.abs(viewport.high.latitude - viewport.low.latitude) / 2) : MIN_DELTA;
  const dLng = viewport ? clampDelta(Math.abs(viewport.high.longitude - viewport.low.longitude) / 2) : MIN_DELTA;

  return { lat, lng, dLat, dLng, matchedName: place.displayName?.text ?? "?", matchedTypes: place.types ?? [] };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadExisting(): Record<string, QuartierLocation> {
  try {
    return JSON.parse(fs.readFileSync(LOCATIONS_PATH, "utf8"));
  } catch {
    return {};
  }
}

function save(data: Record<string, QuartierLocation>) {
  fs.writeFileSync(LOCATIONS_PATH, JSON.stringify(data, null, 2) + "\n");
}

async function main() {
  if (!API_KEY) {
    console.error("GOOGLE_PLACES_API_KEY is not set in .env.local");
    process.exit(1);
  }

  const targets = QUARTIER_FILTER
    ? QUARTIERS_NEEDING_LOCATION.filter(([, slug]) => slug === QUARTIER_FILTER)
    : QUARTIERS_NEEDING_LOCATION;

  if (targets.length === 0) {
    console.error(
      QUARTIER_FILTER
        ? `No quartier matches --quartier=${QUARTIER_FILTER} (or it already has a real boundary and doesn't need a lookup)`
        : "Nothing to look up.",
    );
    process.exit(1);
  }

  console.log(`${DRY_RUN ? "[DRY RUN] " : ""}Looking up ${targets.length} quartier(s) via the Places API...\n`);

  const locations = loadExisting();

  for (const [name, slug] of targets) {
    const result = await lookupQuartier(name, STATIC_CITY.name);

    if ("error" in result) {
      console.log(`${name}: lookup failed (${result.error}), keeping existing estimate`);
    } else {
      console.log(
        `${name}: matched "${result.matchedName}" [${result.matchedTypes.join(",")}] at ${result.lat.toFixed(6)}, ${result.lng.toFixed(6)} (box ±${result.dLat.toFixed(4)}/±${result.dLng.toFixed(4)})`,
      );
      if (!DRY_RUN) {
        const { lat, lng, dLat, dLng } = result;
        locations[slug] = { lat, lng, dLat, dLng };
        save(locations);
      }
    }

    await wait(300 + Math.random() * 300);
  }

  console.log(DRY_RUN ? "\nDone (dry-run, nothing written)." : `\nDone. Results written to ${LOCATIONS_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
