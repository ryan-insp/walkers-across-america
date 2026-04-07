-- ============================================================
-- Seed data for Ryan's Walker Across America 2026
-- Run AFTER schema.sql
-- ============================================================

-- ── Challenge ─────────────────────────────────────────────
insert into challenges (
  slug, title, year, start_date, end_date,
  start_location_name, end_location_name,
  start_lat, start_lng, end_lat, end_lng,
  target_miles, target_steps, is_public
) values (
  'walker-2026',
  'Ryan''s Walk Across America 2026',
  2026,
  '2026-01-01',
  '2026-12-31',
  'Playa Vista, Los Angeles, CA',
  'Manhattan, New York, NY',
  33.9752, -118.4250,
  40.7831, -73.9712,
  2900, 5800000, true
) on conflict (slug) do nothing;

-- ── Route points ──────────────────────────────────────────
-- (Inserted relative to the challenge created above)
do $$
declare
  cid uuid;
begin
  select id into cid from challenges where slug = 'walker-2026';

  insert into route_points (challenge_id, order_index, name, lat, lng, cumulative_mile_marker, point_type)
  values
    (cid, 0,  'Playa Vista, Los Angeles, CA', 33.9752, -118.4250,    0, 'start'),
    (cid, 1,  'Pasadena, CA',                 34.1478, -118.1445,   15, 'checkpoint'),
    (cid, 2,  'Palm Springs, CA',             33.8303, -116.5453,  110, 'checkpoint'),
    (cid, 3,  'Phoenix, AZ',                  33.4484, -112.0740,  300, 'checkpoint'),
    (cid, 4,  'Tucson, AZ',                   32.2226, -110.9747,  420, 'checkpoint'),
    (cid, 5,  'El Paso, TX',                  31.7619, -106.4850,  650, 'checkpoint'),
    (cid, 6,  'San Antonio, TX',              29.4241,  -98.4936,  900, 'checkpoint'),
    (cid, 7,  'Austin, TX',                   30.2672,  -97.7431, 1000, 'checkpoint'),
    (cid, 8,  'Dallas, TX',                   32.7767,  -96.7970, 1100, 'checkpoint'),
    (cid, 9,  'Oklahoma City, OK',            35.4676,  -97.5164, 1250, 'checkpoint'),
    (cid, 10, 'Kansas City, MO',              39.0997,  -94.5786, 1450, 'checkpoint'),
    (cid, 11, 'St. Louis, MO',                38.6270,  -90.1994, 1600, 'checkpoint'),
    (cid, 12, 'Chicago, IL',                  41.8781,  -87.6298, 1800, 'checkpoint'),
    (cid, 13, 'Cleveland, OH',                41.4993,  -81.6944, 2000, 'checkpoint'),
    (cid, 14, 'Pittsburgh, PA',               40.4406,  -79.9959, 2200, 'checkpoint'),
    (cid, 15, 'Philadelphia, PA',             39.9526,  -75.1652, 2400, 'checkpoint'),
    (cid, 16, 'Manhattan, New York, NY',      40.7831,  -73.9712, 2900, 'finish')
  on conflict (challenge_id, order_index) do nothing;

  -- App settings
  insert into app_settings (challenge_id, theme, map_style, show_exact_values)
  values (cid, 'dark', 'mapbox://styles/mapbox/dark-v11', true)
  on conflict (challenge_id) do nothing;

  -- SMS settings stub
  insert into sms_settings (challenge_id)
  values (cid)
  on conflict (challenge_id) do nothing;

end $$;

-- ── Optional: seed some mock daily activity to test locally ─
-- Uncomment the block below if you want local data before HealthKit syncs.
-- DELETE it before going to production.

/*
do $$
declare
  cid uuid;
  d date := '2026-01-01';
  i int := 0;
begin
  select id into cid from challenges where slug = 'walker-2026';

  while i < 95 loop
    insert into daily_activity (challenge_id, activity_date, miles, steps, source_priority)
    values (
      cid,
      d,
      round((7.0 + sin(i * 1.3) * 2.5 + cos(i * 0.7) * 1.5)::numeric, 2),
      round((7.0 + sin(i * 1.3) * 2.5) * 2000)::bigint,
      'healthkit_miles'
    )
    on conflict (challenge_id, activity_date) do nothing;

    d := d + 1;
    i := i + 1;
  end loop;
end $$;
*/
