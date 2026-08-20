// Data access layer. Currently backed by static in-repo content (see
// lib/staticData.ts) so the app runs with zero external services. The
// function signatures match what a Supabase-backed implementation would
// expose, so swapping the bodies below for real queries later is a
// contained change — see README "Decisions I made".
import { STATIC_CITY, STATIC_QUARTIERS } from "./staticData";
import type {
  City,
  EssentialCategory,
  QuartierDetail,
  QuartierSummary,
  RatingDimension,
} from "./types";

export async function getCityBySlug(slug: string): Promise<City | null> {
  return STATIC_CITY.slug === slug && STATIC_CITY.is_active ? STATIC_CITY : null;
}

/** All quartiers for a city, enriched with their rating dimensions. Powers the map + browse list. */
export async function getQuartiersForCity(cityId: string): Promise<QuartierSummary[]> {
  return STATIC_QUARTIERS.filter((q) => q.city_id === cityId).map((q) => ({
    id: q.id,
    city_id: q.city_id,
    name: q.name,
    slug: q.slug,
    one_liner: q.one_liner,
    description: q.description,
    polygon: q.polygon,
    center_lat: q.center_lat,
    center_lng: q.center_lng,
    price_buy_per_sqm: q.price_buy_per_sqm,
    price_rent_2br: q.price_rent_2br,
    hero_photo_url: q.hero_photo_url,
    author_type: q.author_type,
    created_at: q.created_at,
    ratings: q.ratings,
  }));
}

/** Full profile data for a single quartier, used by `/[city]/[quartier]`. */
export async function getQuartierDetail(
  cityId: string,
  quartierSlug: string,
): Promise<QuartierDetail | null> {
  const quartier = STATIC_QUARTIERS.find((q) => q.city_id === cityId && q.slug === quartierSlug);
  return quartier ?? null;
}

export interface QuartierAiRecord {
  slug: string;
  name: string;
  one_liner: string;
  description: string;
  price_buy_per_sqm: number;
  price_rent_2br: number;
  ratings: Partial<Record<RatingDimension, number>>;
  pros: string[];
  cons: string[];
  commute: { reference_point: string; duration_minutes: number }[];
  essentials: Partial<Record<EssentialCategory, number>>;
}

/** Full per-quartier dataset for a city, shaped for the Ask AI system prompt. */
export async function getCityAiDataset(cityId: string): Promise<QuartierAiRecord[]> {
  return STATIC_QUARTIERS.filter((q) => q.city_id === cityId).map((q) => ({
    slug: q.slug,
    name: q.name,
    one_liner: q.one_liner,
    description: q.description,
    price_buy_per_sqm: q.price_buy_per_sqm,
    price_rent_2br: q.price_rent_2br,
    ratings: q.ratings,
    pros: q.prosCons.filter((pc) => pc.type === "pro").map((pc) => pc.content),
    cons: q.prosCons.filter((pc) => pc.type === "con").map((pc) => pc.content),
    commute: q.commute.map((c) => ({
      reference_point: c.reference_point,
      duration_minutes: c.duration_minutes,
    })),
    essentials: q.essentials.reduce<Partial<Record<EssentialCategory, number>>>((acc, e) => {
      acc[e.category] = e.count;
      return acc;
    }, {}),
  }));
}
