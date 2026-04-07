-- ============================================================
-- Ryan's Walker Across America — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- challenges
-- ============================================================
create table if not exists challenges (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  year          integer not null,
  start_date    date not null,
  end_date      date not null,
  start_location_name text not null default '',
  end_location_name   text not null default '',
  start_lat     double precision not null default 0,
  start_lng     double precision not null default 0,
  end_lat       double precision not null default 0,
  end_lng       double precision not null default 0,
  target_miles  double precision not null default 2900,
  target_steps  bigint not null default 5800000,
  is_public     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- route_points
-- ============================================================
create table if not exists route_points (
  id                    uuid primary key default gen_random_uuid(),
  challenge_id          uuid not null references challenges(id) on delete cascade,
  order_index           integer not null,
  name                  text not null,
  lat                   double precision not null,
  lng                   double precision not null,
  cumulative_mile_marker double precision not null default 0,
  point_type            text not null check (point_type in ('start', 'checkpoint', 'finish')),
  created_at            timestamptz not null default now(),
  unique (challenge_id, order_index)
);

-- ============================================================
-- daily_activity
-- ============================================================
create table if not exists daily_activity (
  id              uuid primary key default gen_random_uuid(),
  challenge_id    uuid not null references challenges(id) on delete cascade,
  activity_date   date not null,
  miles           double precision,
  steps           bigint,
  source_priority text not null check (source_priority in (
    'healthkit_miles', 'healthkit_steps_converted', 'manual'
  )) default 'healthkit_miles',
  synced_at       timestamptz not null default now(),
  unique (challenge_id, activity_date)
);

-- Index for fast lookups by challenge + date range
create index if not exists idx_daily_activity_challenge_date
  on daily_activity (challenge_id, activity_date);

-- ============================================================
-- sync_events
-- ============================================================
create table if not exists sync_events (
  id                  uuid primary key default gen_random_uuid(),
  challenge_id        uuid not null references challenges(id) on delete cascade,
  sync_started_at     timestamptz not null default now(),
  sync_completed_at   timestamptz,
  status              text not null check (status in ('running', 'success', 'error')) default 'running',
  records_written     integer not null default 0,
  error_message       text,
  source              text not null default 'healthkit_ios'
);

create index if not exists idx_sync_events_challenge_started
  on sync_events (challenge_id, sync_started_at desc);

-- ============================================================
-- milestones
-- ============================================================
create table if not exists milestones (
  id                uuid primary key default gen_random_uuid(),
  challenge_id      uuid not null references challenges(id) on delete cascade,
  milestone_type    text not null check (milestone_type in (
    'miles_100', 'percent_10', 'checkpoint', 'fastest_week', 'surprise'
  )),
  title             text not null,
  body              text not null default '',
  milestone_date    date not null,
  trigger_value     double precision,
  is_auto_generated boolean not null default true,
  is_visible        boolean not null default true,
  created_at        timestamptz not null default now(),
  -- Prevent duplicate auto milestones
  unique (challenge_id, milestone_type, trigger_value)
);

create index if not exists idx_milestones_challenge_date
  on milestones (challenge_id, milestone_date desc);

-- ============================================================
-- app_settings
-- ============================================================
create table if not exists app_settings (
  id                    uuid primary key default gen_random_uuid(),
  challenge_id          uuid not null references challenges(id) on delete cascade unique,
  theme                 text not null default 'dark',
  logo_url              text,
  public_share_image_url text,
  map_style             text not null default 'mapbox://styles/mapbox/dark-v11',
  show_exact_values     boolean not null default true,
  updated_at            timestamptz not null default now()
);

-- ============================================================
-- sms_settings (Phase 2 — table exists but unused for now)
-- ============================================================
create table if not exists sms_settings (
  id                      uuid primary key default gen_random_uuid(),
  challenge_id            uuid not null references challenges(id) on delete cascade unique,
  enabled                 boolean not null default false,
  phone_number            text,
  weekly_summary_enabled  boolean not null default false,
  milestone_sms_enabled   boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- Public read for challenges, route_points, daily_activity,
-- milestones, app_settings when is_public = true.
-- All writes require service role.
-- ============================================================

alter table challenges enable row level security;
alter table route_points enable row level security;
alter table daily_activity enable row level security;
alter table sync_events enable row level security;
alter table milestones enable row level security;
alter table app_settings enable row level security;
alter table sms_settings enable row level security;

-- Public read policies
create policy "public_read_challenges" on challenges
  for select using (is_public = true);

create policy "public_read_route_points" on route_points
  for select using (
    exists (
      select 1 from challenges c where c.id = route_points.challenge_id and c.is_public = true
    )
  );

create policy "public_read_daily_activity" on daily_activity
  for select using (
    exists (
      select 1 from challenges c where c.id = daily_activity.challenge_id and c.is_public = true
    )
  );

create policy "public_read_milestones" on milestones
  for select using (
    is_visible = true and exists (
      select 1 from challenges c where c.id = milestones.challenge_id and c.is_public = true
    )
  );

create policy "public_read_app_settings" on app_settings
  for select using (
    exists (
      select 1 from challenges c where c.id = app_settings.challenge_id and c.is_public = true
    )
  );

-- Note: The backend uses the service role key which bypasses RLS.
-- These policies only matter for direct client-side queries.
