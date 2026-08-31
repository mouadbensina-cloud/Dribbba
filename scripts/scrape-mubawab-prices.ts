/**
 * Scrape Mubawab.ma for per-quartier apartment prices (achat + loyer) and
 * write the results into lib/quartierPrices.json, which lib/staticData.ts
 * merges on top of each quartier's default prices at build/dev time (see
 * `applyPriceOverride` there).
 *
 * Usage:
 *   npm run scrape:prices -- [--dry-run] [--quartier=<slug>]
 *   npx tsx scripts/scrape-mubawab-prices.ts [--dry-run] [--quartier=<slug>]
 *
 * Decisions / limitations (see README "Decisions I made" for the full
 * writeup) — read this before assuming the spec's original design works:
 *
 * - Mubawab has its own curated quartier taxonomy; there is no query-string
 *   search (`?keywords=...` silently redirects to the unfiltered national
 *   listing page — confirmed empirically, not a guess). URLs here are
 *   built from a guessed Mubawab-style slug
 *   (mubawab.ma/fr/sd/{city}/{quartier}/appartements-a-vendre|a-louer).
 *   Many of our 47 quartiers won't have a match at all (confirmed:
 *   "bourgogne" 404s even though "racine" works) — those are logged and
 *   skipped, not forced with a fallback search.
 * - There's no JSON-LD on listing pages. Listings are scraped from the DOM
 *   (`.listingBox` cards), which already include price, surface, title,
 *   and a description snippet — no need to open each individual listing.
 * - "Apartment only" is enforced primarily by using the
 *   appartements-a-vendre/-a-louer URLs themselves; a title/description
 *   keyword filter (villa/terrain/riad/local commercial) catches the
 *   occasional mis-categorized listing Mubawab's own search still returns.
 * - Only page 1 of results is scraped, per spec.
 * - Cloudflare handling: if a challenge page is detected, the script pauses
 *   and waits for you to solve it in the visible browser window (it always
 *   launches headed, since a human needs to be able to see and solve it),
 *   then continues on Enter.
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { chromium, type Page } from "playwright";
import { STATIC_CITY, STATIC_QUARTIERS } from "../lib/staticData";

const DRY_RUN = process.argv.includes("--dry-run");
const QUARTIER_FILTER = process.argv.find((a) => a.startsWith("--quartier="))?.split("=")[1];

const PRICES_PATH = path.join(__dirname, "..", "lib", "quartierPrices.json");

const BUY_MIN_PER_SQM = 5000;
const BUY_MAX_PER_SQM = 60000;
const RENT_MIN = 2000;
const RENT_MAX = 40000;
const MIN_LISTINGS = 5;

const NON_APARTMENT_KEYWORDS = ["villa", "riad", "terrain", "local commercial"];
const SHORT_STAY_KEYWORDS = [
  "courte durée",
  "courte duree",
  "vacances",
  "airbnb",
  "week-end",
  "weekend",
  "hebdomadaire",
];

interface PriceOverride {
  price_buy_per_sqm?: number;
  price_rent_2br?: number;
  updated_at?: string;
  buy_sample_size?: number;
  rent_sample_size?: number;
}

interface RawListing {
  priceText: string;
  title: string;
  description: string;
  surfaceText: string;
}

interface Listing {
  price: number;
  surface: number | null;
  title: string;
  description: string;
}

interface ScrapeResult {
  median: number;
  count: number;
}

function slugifyForMubawab(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseDigits(text: string): number | null {
  const digits = text.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : null;
}

function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function containsAny(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((n) => lower.includes(n));
}

function wait(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isCloudflareChallenge(page: Page): Promise<boolean> {
  const title = await page.title().catch(() => "");
  if (/just a moment|attention required/i.test(title)) return true;
  const challenge = await page.$("#challenge-form, #cf-challenge-running");
  return !!challenge;
}

async function pauseForManualSolve(context: string): Promise<void> {
  console.log(
    `\n⚠️  Cloudflare challenge detected (${context}). Solve it in the open browser window, then press Enter here to continue...`,
  );
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await rl.question("");
  rl.close();
}

async function isNotFoundPage(page: Page): Promise<boolean> {
  const text = await page
    .locator("body")
    .innerText()
    .catch(() => "");
  return /n'est plus disponible|page introuvable/i.test(text.slice(0, 2000));
}

async function loadListingsPage(
  page: Page,
  url: string,
  context: string,
): Promise<"ok" | "not-found" | "load-error"> {
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => null);
  if (!response) return "load-error";

  if (await isCloudflareChallenge(page)) {
    await pauseForManualSolve(context);
  }

  if (response.status() === 404 || (await isNotFoundPage(page))) return "not-found";

  await page.waitForSelector(".listingBox.pictureHeight", { timeout: 10_000 }).catch(() => {});
  return "ok";
}

async function extractRawListings(page: Page): Promise<RawListing[]> {
  return page.$$eval(".listingBox.pictureHeight", (cards) =>
    cards.map((card) => {
      const priceEl = card.querySelector(".priceTag");
      const titleEl = card.querySelector(".listingTit a");
      const descEl = card.querySelector(".listingP.descLi");
      const surfaceEl = card
        .querySelector(".adDetailFeature .icon-triangle")
        ?.parentElement?.querySelector("span");
      return {
        priceText: priceEl?.textContent?.trim() ?? "",
        title: (titleEl?.textContent ?? "").trim().replace(/\s+/g, " "),
        description: (descEl?.textContent ?? "").trim().replace(/\s+/g, " "),
        surfaceText: (surfaceEl?.textContent ?? "").trim(),
      };
    }),
  );
}

function toListings(raw: RawListing[]): Listing[] {
  const out: Listing[] = [];
  for (const r of raw) {
    const price = parseDigits(r.priceText);
    if (price === null) continue;
    out.push({ price, surface: parseDigits(r.surfaceText), title: r.title, description: r.description });
  }
  return out;
}

async function scrapeAchat(
  page: Page,
  citySlug: string,
  quartierSlug: string,
  quartierName: string,
): Promise<{ result: ScrapeResult | null; skipReason: string | null }> {
  const url = `https://www.mubawab.ma/fr/sd/${citySlug}/${quartierSlug}/appartements-a-vendre`;
  const status = await loadListingsPage(page, url, `${quartierName} — achat`);

  if (status === "not-found") return { result: null, skipReason: "not found on Mubawab" };
  if (status === "load-error") return { result: null, skipReason: "page failed to load" };

  const listings = toListings(await extractRawListings(page));
  const apartments = listings.filter(
    (l) => !containsAny(l.title, NON_APARTMENT_KEYWORDS) && !containsAny(l.description, NON_APARTMENT_KEYWORDS),
  );
  const pricesPerSqm = apartments
    .filter((l) => l.surface && l.surface > 0)
    .map((l) => Math.round(l.price / (l.surface as number)))
    .filter((p) => p >= BUY_MIN_PER_SQM && p <= BUY_MAX_PER_SQM);

  if (pricesPerSqm.length < MIN_LISTINGS) {
    return { result: null, skipReason: `only ${pricesPerSqm.length} valid listing(s), need ${MIN_LISTINGS}` };
  }
  return { result: { median: median(pricesPerSqm), count: pricesPerSqm.length }, skipReason: null };
}

async function scrapeLoyer(
  page: Page,
  citySlug: string,
  quartierSlug: string,
  quartierName: string,
): Promise<{ result: ScrapeResult | null; skipReason: string | null }> {
  const url = `https://www.mubawab.ma/fr/sd/${citySlug}/${quartierSlug}/appartements-a-louer`;
  const status = await loadListingsPage(page, url, `${quartierName} — loyer`);

  if (status === "not-found") return { result: null, skipReason: "not found on Mubawab" };
  if (status === "load-error") return { result: null, skipReason: "page failed to load" };

  const listings = toListings(await extractRawListings(page));
  const filtered = listings.filter(
    (l) =>
      !containsAny(l.title, SHORT_STAY_KEYWORDS) &&
      !containsAny(l.description, SHORT_STAY_KEYWORDS) &&
      l.price >= RENT_MIN &&
      l.price <= RENT_MAX,
  );

  if (filtered.length < MIN_LISTINGS) {
    return { result: null, skipReason: `only ${filtered.length} valid listing(s), need ${MIN_LISTINGS}` };
  }
  return { result: { median: median(filtered.map((l) => l.price)), count: filtered.length }, skipReason: null };
}

function loadExistingOverrides(): Record<string, PriceOverride> {
  try {
    return JSON.parse(fs.readFileSync(PRICES_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveOverrides(data: Record<string, PriceOverride>) {
  fs.writeFileSync(PRICES_PATH, JSON.stringify(data, null, 2) + "\n");
}

async function main() {
  const quartiers = QUARTIER_FILTER
    ? STATIC_QUARTIERS.filter((q) => q.slug === QUARTIER_FILTER)
    : STATIC_QUARTIERS;

  if (quartiers.length === 0) {
    console.error(`No quartier matches --quartier=${QUARTIER_FILTER}`);
    process.exit(1);
  }

  console.log(`${DRY_RUN ? "[DRY RUN] " : ""}Scraping ${quartiers.length} quartier(s) from Mubawab...\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
    locale: "fr-MA",
  });
  const page = await context.newPage();
  const overrides = loadExistingOverrides();

  for (let i = 0; i < quartiers.length; i++) {
    const quartier = quartiers[i];
    const citySlug = STATIC_CITY.slug;
    const quartierSlug = slugifyForMubawab(quartier.name);

    const { result: achat, skipReason: achatSkip } = await scrapeAchat(
      page,
      citySlug,
      quartierSlug,
      quartier.name,
    );

    await wait(10_000, 15_000);

    const { result: loyer, skipReason: loyerSkip } = await scrapeLoyer(
      page,
      citySlug,
      quartierSlug,
      quartier.name,
    );

    const achatStr = achat
      ? `achat median ${formatNumber(achat.median)} DH/m² (from ${achat.count} listings)`
      : `achat skipped (${achatSkip})`;
    const loyerStr = loyer
      ? `loyer median ${formatNumber(loyer.median)} DH (from ${loyer.count} listings)`
      : `loyer skipped (${loyerSkip})`;
    console.log(`${quartier.name}: ${achatStr} | ${loyerStr}`);

    if (!DRY_RUN && (achat || loyer)) {
      overrides[quartier.slug] = {
        ...overrides[quartier.slug],
        ...(achat ? { price_buy_per_sqm: achat.median, buy_sample_size: achat.count } : {}),
        ...(loyer ? { price_rent_2br: loyer.median, rent_sample_size: loyer.count } : {}),
        updated_at: new Date().toISOString(),
      };
      saveOverrides(overrides);
    }

    if (i < quartiers.length - 1) {
      await wait(20_000, 40_000);
    }
  }

  await browser.close();
  console.log(DRY_RUN ? "\nDone (dry-run, nothing written)." : `\nDone. Results written to ${PRICES_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
