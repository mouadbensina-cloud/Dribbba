import { supabase } from "./supabase";
import type {
  City,
  EssentialCategory,
  QuartierCommuteRow,
  QuartierDetail,
  QuartierEssentialRow,
  QuartierPhotoRow,
  QuartierProConRow,
  QuartierRatingRow,
  QuartierRow,
  QuartierSummary,
  RatingDimension,
} from "./types";

export async function getCityBySlug(slug: string): Promise<City | null> {
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

function groupRatingsByQuartier(ratings: QuartierRatingRow[]) {
  const byQuartier = new Map<string, QuartierSummary["ratings"]>();
  for (const rating of ratings) {
    const existing = byQuartier.get(rating.quartier_id) ?? {};
    existing[rating.dimension] = rating.score;
    byQuartier.set(rating.quartier_id, existing);
  }
  return byQuartier;
}

/** All quartiers for a city, enriched with their rating dimensions. Powers the map + browse list. */
export async function getQuartiersForCity(
  cityId: string,
): Promise<QuartierSummary[]> {
  const [{ data: quartiers, error: quartiersError }, { data: ratings, error: ratingsError }] =
    await Promise.all([
      supabase
        .from("quartiers")
        .select("*")
        .eq("city_id", cityId)
        .order("name", { ascending: true }),
      supabase
        .from("quartier_ratings")
        .select("*")
        .eq("author_type", "editorial"),
    ]);

  if (quartiersError) throw new Error(quartiersError.message);
  if (ratingsError) throw new Error(ratingsError.message);

  const quartierRows = (quartiers ?? []) as QuartierRow[];
  const quartierIds = new Set(quartierRows.map((q) => q.id));
  const relevantRatings = ((ratings ?? []) as QuartierRatingRow[]).filter((r) =>
    quartierIds.has(r.quartier_id),
  );
  const ratingsByQuartier = groupRatingsByQuartier(relevantRatings);

  return quartierRows.map((q) => ({
    ...q,
    ratings: ratingsByQuartier.get(q.id) ?? {},
  }));
}

/** Full profile data for a single quartier, used by `/[city]/[quartier]`. */
export async function getQuartierDetail(
  cityId: string,
  quartierSlug: string,
): Promise<QuartierDetail | null> {
  const { data: quartier, error: quartierError } = await supabase
    .from("quartiers")
    .select("*")
    .eq("city_id", cityId)
    .eq("slug", quartierSlug)
    .maybeSingle();

  if (quartierError) throw new Error(quartierError.message);
  if (!quartier) return null;

  const quartierRow = quartier as QuartierRow;

  const [ratingsRes, photosRes, prosConsRes, commuteRes, essentialsRes] =
    await Promise.all([
      supabase
        .from("quartier_ratings")
        .select("*")
        .eq("quartier_id", quartierRow.id)
        .eq("author_type", "editorial"),
      supabase
        .from("quartier_photos")
        .select("*")
        .eq("quartier_id", quartierRow.id)
        .order("order_index", { ascending: true }),
      supabase
        .from("quartier_pros_cons")
        .select("*")
        .eq("quartier_id", quartierRow.id)
        .order("order_index", { ascending: true }),
      supabase
        .from("quartier_commute")
        .select("*")
        .eq("quartier_id", quartierRow.id)
        .order("duration_minutes", { ascending: true }),
      supabase
        .from("quartier_essentials")
        .select("*")
        .eq("quartier_id", quartierRow.id),
    ]);

  for (const res of [ratingsRes, photosRes, prosConsRes, commuteRes, essentialsRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const ratings = groupRatingsByQuartier(
    (ratingsRes.data ?? []) as QuartierRatingRow[],
  ).get(quartierRow.id) ?? {};

  return {
    ...quartierRow,
    ratings,
    photos: (photosRes.data ?? []) as QuartierPhotoRow[],
    prosCons: (prosConsRes.data ?? []) as QuartierProConRow[],
    commute: (commuteRes.data ?? []) as QuartierCommuteRow[],
    essentials: (essentialsRes.data ?? []) as QuartierEssentialRow[],
  };
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
  const quartiers = await getQuartiersForCity(cityId);
  const ids = quartiers.map((q) => q.id);
  if (ids.length === 0) return [];

  const [prosConsRes, commuteRes, essentialsRes] = await Promise.all([
    supabase.from("quartier_pros_cons").select("*").in("quartier_id", ids).order("order_index"),
    supabase.from("quartier_commute").select("*").in("quartier_id", ids),
    supabase.from("quartier_essentials").select("*").in("quartier_id", ids),
  ]);

  for (const res of [prosConsRes, commuteRes, essentialsRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const prosCons = (prosConsRes.data ?? []) as QuartierProConRow[];
  const commute = (commuteRes.data ?? []) as QuartierCommuteRow[];
  const essentials = (essentialsRes.data ?? []) as QuartierEssentialRow[];

  return quartiers.map((q) => ({
    slug: q.slug,
    name: q.name,
    one_liner: q.one_liner,
    description: q.description,
    price_buy_per_sqm: q.price_buy_per_sqm,
    price_rent_2br: q.price_rent_2br,
    ratings: q.ratings,
    pros: prosCons.filter((pc) => pc.quartier_id === q.id && pc.type === "pro").map((pc) => pc.content),
    cons: prosCons.filter((pc) => pc.quartier_id === q.id && pc.type === "con").map((pc) => pc.content),
    commute: commute
      .filter((c) => c.quartier_id === q.id)
      .map((c) => ({ reference_point: c.reference_point, duration_minutes: c.duration_minutes })),
    essentials: essentials
      .filter((e) => e.quartier_id === q.id)
      .reduce<Partial<Record<EssentialCategory, number>>>((acc, e) => {
        acc[e.category] = e.count;
        return acc;
      }, {}),
  }));
}
