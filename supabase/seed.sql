-- Quartier OS — seed data
-- 1 city (Casablanca) + 3 quartiers with plausible placeholder data so the
-- app can be exercised end-to-end. Polygon coordinates are approximate.
-- Run after 0001_init.sql. Safe to re-run: it wipes and re-inserts by slug.

begin;

delete from quartiers where slug in ('bourgogne', 'sidi-maarouf', 'gauthier');
delete from cities where slug = 'casablanca';

insert into cities (id, name, slug, country_code, center_lat, center_lng, default_zoom, is_active)
values (
  '00000000-0000-0000-0000-000000000001',
  'Casablanca',
  'casablanca',
  'MA',
  33.5731,
  -7.5898,
  12,
  true
);

-- ─── Bourgogne ────────────────────────────────────────────────────────
insert into quartiers (
  id, city_id, name, slug, one_liner, description, polygon,
  center_lat, center_lng, price_buy_per_sqm, price_rent_2br, hero_photo_url, author_type
) values (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  'Bourgogne',
  'bourgogne',
  'Quartier historique et vivant, entre commerces de rue et immeubles Art déco.',
  'Bourgogne est un quartier populaire et animé du centre de Casablanca, connu pour son architecture Art déco et ses rues commerçantes. On y trouve un bon mélange d''anciens immeubles rénovés et de petits commerces de proximité ouverts tard. L''ambiance est dense et vivante en journée, avec une circulation qui se calme en soirée. Un bon compromis pour qui cherche un quartier authentique et bien connecté, sans le prix du centre-ville chic.',
  '{
    "type": "Polygon",
    "coordinates": [[
      [-7.6175, 33.6035],
      [-7.6095, 33.6040],
      [-7.6080, 33.6000],
      [-7.6110, 33.5975],
      [-7.6180, 33.5980],
      [-7.6175, 33.6035]
    ]]
  }'::jsonb,
  33.6005, -7.6130,
  16000, 7500,
  'https://source.unsplash.com/800x600/?casablanca,artdeco&sig=101',
  'editorial'
);

-- ─── Sidi Maarouf ─────────────────────────────────────────────────────
insert into quartiers (
  id, city_id, name, slug, one_liner, description, polygon,
  center_lat, center_lng, price_buy_per_sqm, price_rent_2br, hero_photo_url, author_type
) values (
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000001',
  'Sidi Maarouf',
  'sidi-maarouf',
  'Pôle d''affaires moderne au sud de la ville, calme le soir.',
  'Sidi Maarouf s''est imposé comme le principal pôle d''affaires de Casablanca, avec ses tours de bureaux, ses sièges d''entreprises et sa proximité avec la rocade. Le quartier est calme et sécurisé le soir, mais reste très dépendant de la voiture, avec peu de commerces de proximité en dehors des heures de bureau. Il convient bien aux familles qui cherchent du neuf, de l''espace et de la tranquillité, à condition d''accepter des trajets plus longs pour sortir le soir.',
  '{
    "type": "Polygon",
    "coordinates": [[
      [-7.6650, 33.5340],
      [-7.6560, 33.5345],
      [-7.6540, 33.5300],
      [-7.6580, 33.5270],
      [-7.6660, 33.5280],
      [-7.6650, 33.5340]
    ]]
  }'::jsonb,
  33.5310, -7.6595,
  13500, 8500,
  'https://source.unsplash.com/800x600/?office,modernbuilding&sig=102',
  'editorial'
);

-- ─── Gauthier ─────────────────────────────────────────────────────────
insert into quartiers (
  id, city_id, name, slug, one_liner, description, polygon,
  center_lat, center_lng, price_buy_per_sqm, price_rent_2br, hero_photo_url, author_type
) values (
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000001',
  'Gauthier',
  'gauthier',
  'Central, chic et ultra marchable, au cœur de la vie casablancaise.',
  'Gauthier est l''un des quartiers les plus centraux et recherchés de Casablanca, à deux pas du Twin Center et du boulevard Zerktouni. Ambiance urbaine et marchable, avec une forte concentration de restaurants, cafés et commerces haut de gamme. C''est un quartier vivant à toute heure, avec une vie nocturne active, mais qui se paie au prix fort, à l''achat comme à la location.',
  '{
    "type": "Polygon",
    "coordinates": [[
      [-7.6295, 33.5905],
      [-7.6220, 33.5910],
      [-7.6205, 33.5870],
      [-7.6235, 33.5840],
      [-7.6300, 33.5845],
      [-7.6295, 33.5905]
    ]]
  }'::jsonb,
  33.5875, -7.6255,
  22000, 9500,
  'https://source.unsplash.com/800x600/?casablanca,downtown&sig=103',
  'editorial'
);

-- ─── Ratings ────────────────────────────────────────────────────────────
insert into quartier_ratings (quartier_id, dimension, score, author_type) values
  ('00000000-0000-0000-0000-000000000101', 'safety_day', 4, 'editorial'),
  ('00000000-0000-0000-0000-000000000101', 'safety_night', 3, 'editorial'),
  ('00000000-0000-0000-0000-000000000101', 'noise', 3, 'editorial'),
  ('00000000-0000-0000-0000-000000000101', 'cleanliness', 3, 'editorial'),
  ('00000000-0000-0000-0000-000000000101', 'walkability', 4, 'editorial'),
  ('00000000-0000-0000-0000-000000000101', 'family_friendly', 3, 'editorial'),
  ('00000000-0000-0000-0000-000000000101', 'nightlife', 3, 'editorial'),
  ('00000000-0000-0000-0000-000000000101', 'traffic', 3, 'editorial'),

  ('00000000-0000-0000-0000-000000000102', 'safety_day', 4, 'editorial'),
  ('00000000-0000-0000-0000-000000000102', 'safety_night', 4, 'editorial'),
  ('00000000-0000-0000-0000-000000000102', 'noise', 2, 'editorial'),
  ('00000000-0000-0000-0000-000000000102', 'cleanliness', 4, 'editorial'),
  ('00000000-0000-0000-0000-000000000102', 'walkability', 2, 'editorial'),
  ('00000000-0000-0000-0000-000000000102', 'family_friendly', 4, 'editorial'),
  ('00000000-0000-0000-0000-000000000102', 'nightlife', 2, 'editorial'),
  ('00000000-0000-0000-0000-000000000102', 'traffic', 4, 'editorial'),

  ('00000000-0000-0000-0000-000000000103', 'safety_day', 4, 'editorial'),
  ('00000000-0000-0000-0000-000000000103', 'safety_night', 4, 'editorial'),
  ('00000000-0000-0000-0000-000000000103', 'noise', 3, 'editorial'),
  ('00000000-0000-0000-0000-000000000103', 'cleanliness', 4, 'editorial'),
  ('00000000-0000-0000-0000-000000000103', 'walkability', 5, 'editorial'),
  ('00000000-0000-0000-0000-000000000103', 'family_friendly', 3, 'editorial'),
  ('00000000-0000-0000-0000-000000000103', 'nightlife', 4, 'editorial'),
  ('00000000-0000-0000-0000-000000000103', 'traffic', 4, 'editorial');

-- ─── Photos (hero already set on quartiers; these are gallery extras) ──
insert into quartier_photos (quartier_id, url, caption, order_index) values
  ('00000000-0000-0000-0000-000000000101', 'https://source.unsplash.com/800x600/?casablanca,street&sig=111', 'Rue commerçante de Bourgogne', 0),
  ('00000000-0000-0000-0000-000000000101', 'https://source.unsplash.com/800x600/?morocco,building&sig=112', 'Immeuble Art déco', 1),
  ('00000000-0000-0000-0000-000000000101', 'https://source.unsplash.com/800x600/?casablanca,cafe&sig=113', 'Terrasse de café', 2),

  ('00000000-0000-0000-0000-000000000102', 'https://source.unsplash.com/800x600/?business,district&sig=121', 'Tours de bureaux', 0),
  ('00000000-0000-0000-0000-000000000102', 'https://source.unsplash.com/800x600/?casablanca,skyline&sig=122', 'Skyline de Sidi Maarouf', 1),
  ('00000000-0000-0000-0000-000000000102', 'https://source.unsplash.com/800x600/?morocco,highway&sig=123', 'Accès à la rocade', 2),

  ('00000000-0000-0000-0000-000000000103', 'https://source.unsplash.com/800x600/?restaurant,street&sig=131', 'Rue animée de Gauthier', 0),
  ('00000000-0000-0000-0000-000000000103', 'https://source.unsplash.com/800x600/?morocco,city&sig=132', 'Vie urbaine', 1),
  ('00000000-0000-0000-0000-000000000103', 'https://source.unsplash.com/800x600/?casablanca,night&sig=133', 'Gauthier de nuit', 2);

-- ─── Pros / cons ─────────────────────────────────────────────────────────
insert into quartier_pros_cons (quartier_id, type, content, order_index) values
  ('00000000-0000-0000-0000-000000000101', 'pro', 'Architecture Art déco unique et quartier à taille humaine', 0),
  ('00000000-0000-0000-0000-000000000101', 'pro', 'Très bien desservi, à distance de marche du centre-ville', 1),
  ('00000000-0000-0000-0000-000000000101', 'pro', 'Commerces de proximité ouverts tard le soir', 2),
  ('00000000-0000-0000-0000-000000000101', 'con', 'Circulation dense et stationnement difficile en journée', 0),
  ('00000000-0000-0000-0000-000000000101', 'con', 'Certains immeubles anciens nécessitent des rénovations', 1),

  ('00000000-0000-0000-0000-000000000102', 'pro', 'Immeubles récents et bien équipés', 0),
  ('00000000-0000-0000-0000-000000000102', 'pro', 'Quartier calme et sécurisé en soirée', 1),
  ('00000000-0000-0000-0000-000000000102', 'pro', 'Proche de la rocade, accès rapide aux autoroutes', 2),
  ('00000000-0000-0000-0000-000000000102', 'con', 'Peu de vie de quartier hors des heures de bureau', 0),
  ('00000000-0000-0000-0000-000000000102', 'con', 'Dépendance forte à la voiture, transports en commun limités', 1),
  ('00000000-0000-0000-0000-000000000102', 'con', 'Trafic important aux heures de pointe', 2),

  ('00000000-0000-0000-0000-000000000103', 'pro', 'Ultra marchable, tout est accessible à pied', 0),
  ('00000000-0000-0000-0000-000000000103', 'pro', 'Grand choix de restaurants et cafés', 1),
  ('00000000-0000-0000-0000-000000000103', 'pro', 'Quartier vivant à toute heure de la journée', 2),
  ('00000000-0000-0000-0000-000000000103', 'con', 'Prix de l''immobilier parmi les plus élevés de la ville', 0),
  ('00000000-0000-0000-0000-000000000103', 'con', 'Bruit et affluence en soirée, surtout le week-end', 1);

-- ─── Commute ─────────────────────────────────────────────────────────────
insert into quartier_commute (quartier_id, reference_point, duration_minutes) values
  ('00000000-0000-0000-0000-000000000101', 'Centre-ville', 8),
  ('00000000-0000-0000-0000-000000000101', 'Casa Finance City', 20),
  ('00000000-0000-0000-0000-000000000101', 'Aéroport', 35),

  ('00000000-0000-0000-0000-000000000102', 'Casa Finance City', 10),
  ('00000000-0000-0000-0000-000000000102', 'Centre-ville', 25),
  ('00000000-0000-0000-0000-000000000102', 'Aéroport', 20),

  ('00000000-0000-0000-0000-000000000103', 'Centre-ville', 10),
  ('00000000-0000-0000-0000-000000000103', 'Casa Finance City', 15),
  ('00000000-0000-0000-0000-000000000103', 'Aéroport', 30);

-- ─── Life essentials ──────────────────────────────────────────────────────
insert into quartier_essentials (quartier_id, category, count) values
  ('00000000-0000-0000-0000-000000000101', 'schools', 4),
  ('00000000-0000-0000-0000-000000000101', 'clinics', 3),
  ('00000000-0000-0000-0000-000000000101', 'pharmacies', 8),
  ('00000000-0000-0000-0000-000000000101', 'supermarkets', 5),
  ('00000000-0000-0000-0000-000000000101', 'mosques', 6),
  ('00000000-0000-0000-0000-000000000101', 'parks', 1),

  ('00000000-0000-0000-0000-000000000102', 'schools', 3),
  ('00000000-0000-0000-0000-000000000102', 'clinics', 2),
  ('00000000-0000-0000-0000-000000000102', 'pharmacies', 4),
  ('00000000-0000-0000-0000-000000000102', 'supermarkets', 3),
  ('00000000-0000-0000-0000-000000000102', 'mosques', 3),
  ('00000000-0000-0000-0000-000000000102', 'parks', 2),

  ('00000000-0000-0000-0000-000000000103', 'schools', 2),
  ('00000000-0000-0000-0000-000000000103', 'clinics', 4),
  ('00000000-0000-0000-0000-000000000103', 'pharmacies', 10),
  ('00000000-0000-0000-0000-000000000103', 'supermarkets', 6),
  ('00000000-0000-0000-0000-000000000103', 'mosques', 4),
  ('00000000-0000-0000-0000-000000000103', 'parks', 1);

commit;
