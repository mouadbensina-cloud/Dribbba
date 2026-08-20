// Static content for v1. No database round-trip required to run the app.
//
// This mirrors the shape (and content) of supabase/seed.sql exactly, so
// switching back to the Supabase-backed implementation later is a matter of
// swapping the function bodies in lib/data.ts — the types and the data
// itself don't need to change. See README "Decisions I made".
import type {
  City,
  QuartierDetail,
  QuartierCommuteRow,
  QuartierEssentialRow,
  QuartierPhotoRow,
  QuartierProConRow,
} from "./types";

export const STATIC_CITY: City = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Casablanca",
  slug: "casablanca",
  country_code: "MA",
  center_lat: 33.5731,
  center_lng: -7.5898,
  default_zoom: 12,
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
};

const BOURGOGNE_ID = "00000000-0000-0000-0000-000000000101";
const SIDI_MAAROUF_ID = "00000000-0000-0000-0000-000000000102";
const GAUTHIER_ID = "00000000-0000-0000-0000-000000000103";

function photos(quartierId: string, entries: [string, string][]): QuartierPhotoRow[] {
  return entries.map(([url, caption], i) => ({
    id: `${quartierId}-photo-${i}`,
    quartier_id: quartierId,
    url,
    caption,
    order_index: i,
  }));
}

function prosCons(
  quartierId: string,
  pros: string[],
  cons: string[],
): QuartierProConRow[] {
  return [
    ...pros.map((content, i) => ({
      id: `${quartierId}-pro-${i}`,
      quartier_id: quartierId,
      type: "pro" as const,
      content,
      order_index: i,
    })),
    ...cons.map((content, i) => ({
      id: `${quartierId}-con-${i}`,
      quartier_id: quartierId,
      type: "con" as const,
      content,
      order_index: i,
    })),
  ];
}

function commute(
  quartierId: string,
  entries: [string, number][],
): QuartierCommuteRow[] {
  return entries.map(([reference_point, duration_minutes], i) => ({
    id: `${quartierId}-commute-${i}`,
    quartier_id: quartierId,
    reference_point,
    duration_minutes,
  }));
}

function essentials(
  quartierId: string,
  counts: Record<QuartierEssentialRow["category"], number>,
): QuartierEssentialRow[] {
  return (Object.entries(counts) as [QuartierEssentialRow["category"], number][]).map(
    ([category, count], i) => ({
      id: `${quartierId}-essential-${i}`,
      quartier_id: quartierId,
      category,
      count,
    }),
  );
}

export const STATIC_QUARTIERS: QuartierDetail[] = [
  {
    id: BOURGOGNE_ID,
    city_id: STATIC_CITY.id,
    name: "Bourgogne",
    slug: "bourgogne",
    one_liner: "Quartier historique et vivant, entre commerces de rue et immeubles Art déco.",
    description:
      "Bourgogne est un quartier populaire et animé du centre de Casablanca, connu pour son architecture Art déco et ses rues commerçantes. On y trouve un bon mélange d'anciens immeubles rénovés et de petits commerces de proximité ouverts tard. L'ambiance est dense et vivante en journée, avec une circulation qui se calme en soirée. Un bon compromis pour qui cherche un quartier authentique et bien connecté, sans le prix du centre-ville chic.",
    polygon: {
      type: "Polygon",
      coordinates: [
        [
          [-7.6175, 33.6035],
          [-7.6095, 33.604],
          [-7.608, 33.6],
          [-7.611, 33.5975],
          [-7.618, 33.598],
          [-7.6175, 33.6035],
        ],
      ],
    },
    center_lat: 33.6005,
    center_lng: -7.613,
    price_buy_per_sqm: 16000,
    price_rent_2br: 7500,
    hero_photo_url: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200&q=80",
    author_type: "editorial",
    created_at: "2026-01-01T00:00:00.000Z",
    ratings: {
      safety_day: 4,
      safety_night: 3,
      noise: 3,
      cleanliness: 3,
      walkability: 4,
      family_friendly: 3,
      nightlife: 3,
      traffic: 3,
    },
    photos: photos(BOURGOGNE_ID, [
      ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80", "Rue commerçante de Bourgogne"],
      ["https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&q=80", "Immeuble Art déco"],
    ]),
    prosCons: prosCons(
      BOURGOGNE_ID,
      [
        "Architecture Art déco unique et quartier à taille humaine",
        "Très bien desservi, à distance de marche du centre-ville",
        "Commerces de proximité ouverts tard le soir",
      ],
      ["Circulation dense et stationnement difficile en journée", "Certains immeubles anciens nécessitent des rénovations"],
    ),
    commute: commute(BOURGOGNE_ID, [
      ["Centre-ville", 8],
      ["Casa Finance City", 20],
      ["Aéroport", 35],
    ]),
    essentials: essentials(BOURGOGNE_ID, {
      schools: 4,
      clinics: 3,
      pharmacies: 8,
      supermarkets: 5,
      mosques: 6,
      parks: 1,
    }),
  },
  {
    id: SIDI_MAAROUF_ID,
    city_id: STATIC_CITY.id,
    name: "Sidi Maarouf",
    slug: "sidi-maarouf",
    one_liner: "Pôle d'affaires moderne au sud de la ville, calme le soir.",
    description:
      "Sidi Maarouf s'est imposé comme le principal pôle d'affaires de Casablanca, avec ses tours de bureaux, ses sièges d'entreprises et sa proximité avec la rocade. Le quartier est calme et sécurisé le soir, mais reste très dépendant de la voiture, avec peu de commerces de proximité en dehors des heures de bureau. Il convient bien aux familles qui cherchent du neuf, de l'espace et de la tranquillité, à condition d'accepter des trajets plus longs pour sortir le soir.",
    polygon: {
      type: "Polygon",
      coordinates: [
        [
          [-7.665, 33.534],
          [-7.656, 33.5345],
          [-7.654, 33.53],
          [-7.658, 33.527],
          [-7.666, 33.528],
          [-7.665, 33.534],
        ],
      ],
    },
    center_lat: 33.531,
    center_lng: -7.6595,
    price_buy_per_sqm: 13500,
    price_rent_2br: 8500,
    hero_photo_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
    author_type: "editorial",
    created_at: "2026-01-01T00:00:00.000Z",
    ratings: {
      safety_day: 4,
      safety_night: 4,
      noise: 2,
      cleanliness: 4,
      walkability: 2,
      family_friendly: 4,
      nightlife: 2,
      traffic: 4,
    },
    photos: photos(SIDI_MAAROUF_ID, [
      ["https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80", "Tours de bureaux"],
      ["https://images.unsplash.com/photo-1553603227-2358aabe821e?w=1200&q=80", "Skyline de Sidi Maarouf"],
    ]),
    prosCons: prosCons(
      SIDI_MAAROUF_ID,
      ["Immeubles récents et bien équipés", "Quartier calme et sécurisé en soirée", "Proche de la rocade, accès rapide aux autoroutes"],
      [
        "Peu de vie de quartier hors des heures de bureau",
        "Dépendance forte à la voiture, transports en commun limités",
        "Trafic important aux heures de pointe",
      ],
    ),
    commute: commute(SIDI_MAAROUF_ID, [
      ["Casa Finance City", 10],
      ["Centre-ville", 25],
      ["Aéroport", 20],
    ]),
    essentials: essentials(SIDI_MAAROUF_ID, {
      schools: 3,
      clinics: 2,
      pharmacies: 4,
      supermarkets: 3,
      mosques: 3,
      parks: 2,
    }),
  },
  {
    id: GAUTHIER_ID,
    city_id: STATIC_CITY.id,
    name: "Gauthier",
    slug: "gauthier",
    one_liner: "Central, chic et ultra marchable, au cœur de la vie casablancaise.",
    description:
      "Gauthier est l'un des quartiers les plus centraux et recherchés de Casablanca, à deux pas du Twin Center et du boulevard Zerktouni. Ambiance urbaine et marchable, avec une forte concentration de restaurants, cafés et commerces haut de gamme. C'est un quartier vivant à toute heure, avec une vie nocturne active, mais qui se paie au prix fort, à l'achat comme à la location.",
    polygon: {
      type: "Polygon",
      coordinates: [
        [
          [-7.6295, 33.5905],
          [-7.622, 33.591],
          [-7.6205, 33.587],
          [-7.6235, 33.584],
          [-7.63, 33.5845],
          [-7.6295, 33.5905],
        ],
      ],
    },
    center_lat: 33.5875,
    center_lng: -7.6255,
    price_buy_per_sqm: 22000,
    price_rent_2br: 9500,
    hero_photo_url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200&q=80",
    author_type: "editorial",
    created_at: "2026-01-01T00:00:00.000Z",
    ratings: {
      safety_day: 4,
      safety_night: 4,
      noise: 3,
      cleanliness: 4,
      walkability: 5,
      family_friendly: 3,
      nightlife: 4,
      traffic: 4,
    },
    photos: photos(GAUTHIER_ID, [
      ["https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=1200&q=80", "Rue animée de Gauthier"],
      ["https://images.unsplash.com/photo-1554502078-ef0fc409efce?w=1200&q=80", "Vie urbaine"],
      ["https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1200&q=80", "Gauthier de nuit"],
    ]),
    prosCons: prosCons(
      GAUTHIER_ID,
      ["Ultra marchable, tout est accessible à pied", "Grand choix de restaurants et cafés", "Quartier vivant à toute heure de la journée"],
      ["Prix de l'immobilier parmi les plus élevés de la ville", "Bruit et affluence en soirée, surtout le week-end"],
    ),
    commute: commute(GAUTHIER_ID, [
      ["Centre-ville", 10],
      ["Casa Finance City", 15],
      ["Aéroport", 30],
    ]),
    essentials: essentials(GAUTHIER_ID, {
      schools: 2,
      clinics: 4,
      pharmacies: 10,
      supermarkets: 6,
      mosques: 4,
      parks: 1,
    }),
  },
];
