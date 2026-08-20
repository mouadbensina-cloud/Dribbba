export type RatingDimension =
  | "safety_day"
  | "safety_night"
  | "noise"
  | "cleanliness"
  | "walkability"
  | "family_friendly"
  | "nightlife"
  | "traffic";

export type EssentialCategory =
  | "schools"
  | "clinics"
  | "pharmacies"
  | "supermarkets"
  | "mosques"
  | "parks";

export type ProConType = "pro" | "con";

export interface GeoJSONPolygon {
  type: "Polygon";
  // GeoJSON order is [lng, lat] per ring.
  coordinates: number[][][];
}

export interface City {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  center_lat: number;
  center_lng: number;
  default_zoom: number;
  is_active: boolean;
  created_at: string;
}

export interface QuartierRow {
  id: string;
  city_id: string;
  name: string;
  slug: string;
  one_liner: string;
  description: string;
  polygon: GeoJSONPolygon;
  center_lat: number;
  center_lng: number;
  price_buy_per_sqm: number;
  price_rent_2br: number;
  hero_photo_url: string | null;
  author_type: string;
  created_at: string;
}

export interface QuartierRatingRow {
  id: string;
  quartier_id: string;
  dimension: RatingDimension;
  score: number;
  author_type: string;
}

export interface QuartierPhotoRow {
  id: string;
  quartier_id: string;
  url: string;
  caption: string | null;
  order_index: number;
}

export interface QuartierProConRow {
  id: string;
  quartier_id: string;
  type: ProConType;
  content: string;
  order_index: number;
}

export interface QuartierCommuteRow {
  id: string;
  quartier_id: string;
  reference_point: string;
  duration_minutes: number;
}

export interface QuartierEssentialRow {
  id: string;
  quartier_id: string;
  category: EssentialCategory;
  count: number;
}

/** Quartier enriched with its ratings, shaped for the map + list screens. */
export interface QuartierSummary extends QuartierRow {
  ratings: Partial<Record<RatingDimension, number>>;
}

/** Full quartier profile data for the `/[city]/[quartier]` screen. */
export interface QuartierDetail extends QuartierSummary {
  photos: QuartierPhotoRow[];
  prosCons: QuartierProConRow[];
  commute: QuartierCommuteRow[];
  essentials: QuartierEssentialRow[];
}
