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
import realArrondissementRings from "./geo/casablanca-arrondissements.json";
import quartierPriceOverrides from "./quartierPrices.json";

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

// The 3 original quartiers, fully hand-authored (unique photos, pros/cons,
// description). Below this, LIGHTWEIGHT_QUARTIERS covers the rest of
// Casablanca's named districts with generated placeholder data — see that
// section and README "Decisions I made".
const DETAILED_QUARTIERS: QuartierDetail[] = [
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

// ─── Lightweight quartiers ──────────────────────────────────────────────
// The rest of Casablanca's named districts, so the whole city is clickable
// on the map. Stats (ratings/prices/essentials) come from one of a few
// "character" templates rather than being hand-tuned per district; commute
// durations are estimated from straight-line distance. Two tiers of
// geographic accuracy:
//  - 16 slugs match an official arrondissement (Casablanca's real
//    administrative subdivisions) and get their exact surveyed boundary
//    from OpenStreetMap, via REAL_ARRONDISSEMENT_BOUNDARIES below.
//  - The rest are informal, commonly-used neighborhood names with no
//    official boundary anywhere (including in OpenStreetMap — they're only
//    ever mapped as a single point, because their extent is genuinely
//    fuzzy in real life). For the ones OSM has a point for, POINT_FIXES
//    corrects the center coordinate; the polygon itself stays an
//    approximate placeholder shape around that corrected point.
// Swap in real per-district content before any real launch — see README
// "Decisions I made".

type Template = "upscale-coastal" | "central-chic" | "popular-central" | "residential-family";

const TEMPLATES: Record<
  Template,
  {
    ratings: QuartierDetail["ratings"];
    priceBuyPerSqm: number;
    priceRent2br: number;
    essentials: Record<QuartierEssentialRow["category"], number>;
    pro: string;
    con: string;
    blurb: string;
  }
> = {
  "upscale-coastal": {
    ratings: {
      safety_day: 5,
      safety_night: 4,
      noise: 2,
      cleanliness: 5,
      walkability: 4,
      family_friendly: 4,
      nightlife: 3,
      traffic: 3,
    },
    priceBuyPerSqm: 24000,
    priceRent2br: 11000,
    essentials: { schools: 3, clinics: 3, pharmacies: 6, supermarkets: 5, mosques: 3, parks: 3 },
    pro: "Quartier résidentiel huppé, proche du littoral",
    con: "Prix de l'immobilier parmi les plus élevés de la ville",
    blurb: "Quartier résidentiel chic de Casablanca, prisé pour son cadre de vie et sa proximité avec la côte.",
  },
  "central-chic": {
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
    priceBuyPerSqm: 19000,
    priceRent2br: 9000,
    essentials: { schools: 3, clinics: 4, pharmacies: 8, supermarkets: 6, mosques: 3, parks: 2 },
    pro: "Central et très marchable, bien pourvu en commerces",
    con: "Circulation dense aux heures de pointe",
    blurb: "Quartier central et animé de Casablanca, bien desservi et recherché pour son emplacement.",
  },
  "popular-central": {
    ratings: {
      safety_day: 3,
      safety_night: 2,
      noise: 4,
      cleanliness: 2,
      walkability: 4,
      family_friendly: 3,
      nightlife: 2,
      traffic: 3,
    },
    priceBuyPerSqm: 12000,
    priceRent2br: 5500,
    essentials: { schools: 4, clinics: 2, pharmacies: 6, supermarkets: 3, mosques: 8, parks: 1 },
    pro: "Quartier vivant et authentique, très animé",
    con: "Propreté et infrastructures inégales selon les rues",
    blurb: "Quartier populaire et dense du centre de Casablanca, à l'ambiance authentique.",
  },
  "residential-family": {
    ratings: {
      safety_day: 4,
      safety_night: 3,
      noise: 2,
      cleanliness: 3,
      walkability: 3,
      family_friendly: 4,
      nightlife: 1,
      traffic: 2,
    },
    priceBuyPerSqm: 9000,
    priceRent2br: 4000,
    essentials: { schools: 5, clinics: 2, pharmacies: 4, supermarkets: 3, mosques: 5, parks: 2 },
    pro: "Quartier calme et familial",
    con: "Plus éloigné du centre-ville et des zones d'emploi",
    blurb: "Quartier résidentiel familial de Casablanca, calme et principalement composé d'habitations.",
  },
};

// Confirmed-reachable Unsplash placeholder photos, cycled by index.
const PHOTO_POOL = [
  "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200&q=80",
  "https://images.unsplash.com/photo-1553603227-2358aabe821e?w=1200&q=80",
  "https://images.unsplash.com/photo-1554502078-ef0fc409efce?w=1200&q=80",
  "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
  "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=1200&q=80",
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&q=80",
  "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1200&q=80",
  "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80",
];

const COMMUTE_REFERENCE_POINTS: [string, number, number][] = [
  ["Centre-ville", 33.5931, -7.6184],
  ["Casa Finance City", 33.527, -7.642],
  ["Aéroport", 33.3675, -7.5898],
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimatedCommuteMinutes(lat: number, lng: number): [string, number][] {
  return COMMUTE_REFERENCE_POINTS.map(([point, refLat, refLng]) => {
    const km = haversineKm(lat, lng, refLat, refLng);
    const minutes = Math.max(5, Math.round((5 + km * 2.2) / 5) * 5);
    return [point, minutes];
  });
}

function smallPolygon(lat: number, lng: number, dLat = 0.004, dLng = 0.005): QuartierDetail["polygon"] {
  return {
    type: "Polygon",
    coordinates: [
      [
        [lng - dLng, lat + dLat],
        [lng + dLng, lat + dLat],
        [lng + dLng * 0.7, lat - dLat],
        [lng - dLng * 0.7, lat - dLat],
        [lng - dLng, lat + dLat],
      ],
    ],
  };
}

// [name, slug, lat, lng, template]
const LIGHTWEIGHT_INPUT: [string, string, number, number, Template][] = [
  ["Anfa", "anfa", 33.589, -7.65, "upscale-coastal"],
  ["Ain Diab", "ain-diab", 33.592, -7.665, "upscale-coastal"],
  ["Corniche", "corniche", 33.5945, -7.671, "upscale-coastal"],
  ["Racine", "racine", 33.587, -7.63, "upscale-coastal"],
  ["Val d'Anfa", "val-danfa", 33.582, -7.642, "upscale-coastal"],
  ["Triangle d'Or", "triangle-dor", 33.5895, -7.628, "upscale-coastal"],
  ["Dar Bouazza", "dar-bouazza", 33.555, -7.755, "upscale-coastal"],
  ["Californie", "californie", 33.57, -7.635, "central-chic"],
  ["CIL", "cil", 33.575, -7.63, "central-chic"],
  ["Polo", "polo", 33.568, -7.63, "central-chic"],
  ["Maarif", "maarif", 33.572, -7.647, "central-chic"],
  ["Palmier", "palmier", 33.574, -7.635, "central-chic"],
  ["Beauséjour", "beausejour", 33.568, -7.625, "central-chic"],
  ["Val Fleuri", "val-fleuri", 33.565, -7.628, "central-chic"],
  ["Mers Sultan", "mers-sultan", 33.585, -7.61, "central-chic"],
  ["Belvédère", "belvedere", 33.582, -7.6, "central-chic"],
  ["Oasis", "oasis", 33.555, -7.63, "central-chic"],
  ["Centre-Ville", "centre-ville", 33.593, -7.618, "popular-central"],
  ["Sidi Belyout", "sidi-belyout", 33.6, -7.62, "popular-central"],
  ["Habous", "habous", 33.578, -7.605, "popular-central"],
  ["Ancienne Médina", "ancienne-medina", 33.602, -7.618, "popular-central"],
  ["Derb Omar", "derb-omar", 33.595, -7.605, "popular-central"],
  ["Derb Ghallef", "derb-ghallef", 33.57, -7.612, "popular-central"],
  ["Derb Sultan", "derb-sultan", 33.575, -7.595, "popular-central"],
  ["Al Fida", "al-fida", 33.58, -7.59, "popular-central"],
  ["Ben M'Sick", "ben-msick", 33.555, -7.578, "popular-central"],
  ["Hay Mohammadi", "hay-mohammadi", 33.598, -7.57, "residential-family"],
  ["Roches Noires", "roches-noires", 33.605, -7.585, "residential-family"],
  ["Ain Sebaa", "ain-sebaa", 33.615, -7.535, "residential-family"],
  ["Sidi Bernoussi", "sidi-bernoussi", 33.625, -7.51, "residential-family"],
  ["Sidi Moumen", "sidi-moumen", 33.59, -7.53, "residential-family"],
  ["Sidi Othmane", "sidi-othmane", 33.565, -7.555, "residential-family"],
  ["Sbata", "sbata", 33.545, -7.57, "residential-family"],
  ["Moulay Rachid", "moulay-rachid", 33.57, -7.535, "residential-family"],
  ["Hay Hassani", "hay-hassani", 33.545, -7.66, "residential-family"],
  ["Lissasfa", "lissasfa", 33.53, -7.645, "residential-family"],
  ["Errahma", "errahma", 33.51, -7.67, "residential-family"],
  ["Oulfa", "oulfa", 33.558, -7.685, "residential-family"],
  ["Nassim", "nassim", 33.55, -7.675, "residential-family"],
  ["Mediouna", "mediouna", 33.495, -7.545, "residential-family"],
  ["Bouskoura", "bouskoura", 33.445, -7.65, "residential-family"],
  ["Nouaceur", "nouaceur", 33.365, -7.585, "residential-family"],
  ["Zenata", "zenata", 33.68, -7.47, "residential-family"],
  ["Ain Chock", "ain-chock", 33.5445, -7.605, "residential-family"],
];

// Real point coordinates from OpenStreetMap (place=quarter/suburb nodes),
// correcting the rough estimates above for informal names that don't have
// an official boundary to use instead. [lat, lng].
const POINT_FIXES: Record<string, [number, number]> = {
  racine: [33.5896092, -7.6407011],
  cil: [33.5724839, -7.6577176],
  "val-danfa": [33.5949159, -7.6543731],
  beausejour: [33.5684105, -7.6492935],
  californie: [33.5411922, -7.626038],
  "derb-ghallef": [33.5736066, -7.6296039],
  "ancienne-medina": [33.6007224, -7.6203326],
  oasis: [33.5589388, -7.6386245],
  polo: [33.5587054, -7.6163969],
  "triangle-dor": [33.5883665, -7.6381283],
  "centre-ville": [33.5906153, -7.6139096],
  "ain-diab": [33.5811626, -7.6843877],
  "val-fleuri": [33.5748756, -7.6369836],
  palmier: [33.5806544, -7.6289276],
  lissasfa: [33.5314545, -7.6724261],
  oulfa: [33.5544751, -7.6797967],
};

const REAL_BOUNDARIES = realArrondissementRings as unknown as Record<string, [number, number][]>;

function ringCentroid(ring: [number, number][]): [number, number] {
  const lats = ring.map(([, lat]) => lat);
  const lngs = ring.map(([lng]) => lng);
  return [
    lats.reduce((a, b) => a + b, 0) / lats.length,
    lngs.reduce((a, b) => a + b, 0) / lngs.length,
  ];
}

function ringToPolygon(ring: [number, number][]): QuartierDetail["polygon"] {
  return { type: "Polygon", coordinates: [ring] };
}

const LIGHTWEIGHT_QUARTIERS: QuartierDetail[] = LIGHTWEIGHT_INPUT.map(
  ([name, slug, estimatedLat, estimatedLng, template], i) => {
    const id = `lightweight-${slug}`;
    const t = TEMPLATES[template];

    const realBoundary = REAL_BOUNDARIES[slug];
    const [lat, lng] = realBoundary
      ? ringCentroid(realBoundary)
      : (POINT_FIXES[slug] ?? [estimatedLat, estimatedLng]);
    const polygon = realBoundary ? ringToPolygon(realBoundary) : smallPolygon(lat, lng);

    return {
      id,
      city_id: STATIC_CITY.id,
      name,
      slug,
      one_liner: t.blurb,
      description: t.blurb,
      polygon,
      center_lat: lat,
      center_lng: lng,
      price_buy_per_sqm: t.priceBuyPerSqm,
      price_rent_2br: t.priceRent2br,
      hero_photo_url: PHOTO_POOL[i % PHOTO_POOL.length],
      author_type: "editorial",
      created_at: "2026-01-01T00:00:00.000Z",
      ratings: t.ratings,
      photos: [],
      prosCons: prosCons(id, [t.pro], [t.con]),
      commute: commute(id, estimatedCommuteMinutes(lat, lng)),
      essentials: essentials(id, t.essentials),
    };
  },
);

// Real per-quartier prices scraped from Mubawab listings, layered on top of
// the hand-authored/template defaults above where available — see
// scripts/scrape-mubawab-prices.ts and README "Decisions I made". Missing
// or stale entries just fall back to the defaults already set on each
// quartier, so this file can be partial (some quartiers, or none at all).
interface PriceOverride {
  price_buy_per_sqm?: number;
  price_rent_2br?: number;
  updated_at?: string;
  buy_sample_size?: number;
  rent_sample_size?: number;
}

const PRICE_OVERRIDES = quartierPriceOverrides as Record<string, PriceOverride>;

function applyPriceOverride(quartier: QuartierDetail): QuartierDetail {
  const override = PRICE_OVERRIDES[quartier.slug];
  if (!override) return quartier;
  return {
    ...quartier,
    price_buy_per_sqm: override.price_buy_per_sqm ?? quartier.price_buy_per_sqm,
    price_rent_2br: override.price_rent_2br ?? quartier.price_rent_2br,
  };
}

export const STATIC_QUARTIERS: QuartierDetail[] = [
  ...DETAILED_QUARTIERS,
  ...LIGHTWEIGHT_QUARTIERS,
].map(applyPriceOverride);
