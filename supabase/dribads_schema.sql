-- Dribads isolated schema (MVP)
-- IMPORTANT: all ad-network objects are inside dribads schema only.

create schema if not exists dribads;

create extension if not exists pgcrypto;

grant usage on schema dribads to anon, authenticated, service_role;

create table if not exists dribads.apps (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  api_key text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists dribads.ads (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null default '',
  media_url text not null,
  target_url text not null,
  status text not null default 'active',
  ad_placement text not null default 'pre_roll' check (ad_placement in ('pre_roll', 'post_roll', 'both')),
  skippable_enabled boolean not null default true,
  skip_after_seconds integer not null default 5 check (skip_after_seconds >= 0 and skip_after_seconds <= 30),
  budget numeric(12,2) not null check (budget > 0),
  created_at timestamptz not null default now()
);

alter table dribads.ads
  add column if not exists status text not null default 'active';

alter table dribads.ads
  add column if not exists description text not null default '';

alter table dribads.ads
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

alter table dribads.ads
  add column if not exists ad_placement text not null default 'pre_roll';

alter table dribads.ads
  add column if not exists skippable_enabled boolean not null default true;

alter table dribads.ads
  add column if not exists skip_after_seconds integer not null default 5;

alter table dribads.ads
  drop constraint if exists ads_ad_placement_check;

alter table dribads.ads
  add constraint ads_ad_placement_check check (ad_placement in ('pre_roll', 'post_roll', 'both'));

alter table dribads.ads
  drop constraint if exists ads_skip_after_seconds_check;

alter table dribads.ads
  add constraint ads_skip_after_seconds_check check (skip_after_seconds >= 0 and skip_after_seconds <= 30);

create table if not exists dribads.ad_views (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references dribads.ads(id) on delete cascade,
  app_id uuid references dribads.apps(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists dribads.ad_clicks (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references dribads.ads(id) on delete cascade,
  app_id uuid references dribads.apps(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists dribads.ad_skips (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references dribads.ads(id) on delete cascade,
  app_id uuid references dribads.apps(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists dribads.ad_completions (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references dribads.ads(id) on delete cascade,
  app_id uuid references dribads.apps(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists dribads.ad_earnings_ledger (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references dribads.ads(id) on delete cascade,
  ad_click_id uuid unique references dribads.ad_clicks(id) on delete set null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  app_id uuid references dribads.apps(id) on delete set null,
  amount numeric(12,4) not null check (amount > 0),
  created_at timestamptz not null default now()
);

alter table dribads.ad_views
  add column if not exists app_id uuid references dribads.apps(id) on delete set null;

alter table dribads.ad_clicks
  add column if not exists app_id uuid references dribads.apps(id) on delete set null;

create table if not exists dribads.app_monetization_features (
  app_id uuid primary key references dribads.apps(id) on delete cascade,
  video_monetization_enabled boolean not null default true,
  rewards_enabled boolean not null default false,
  subscriptions_enabled boolean not null default false,
  ads_enabled boolean not null default false,
  gifts_enabled boolean not null default false,
  live_stream_enabled boolean not null default false,
  min_payout numeric(12,2) not null default 10.00,
  payout_cycle_days integer not null default 30,
  updated_at timestamptz not null default now()
);

create table if not exists dribads.payout_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid references auth.users(id) on delete set null,
  app_id uuid not null references dribads.apps(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'rejected')),
  payout_method text not null default 'paypal' check (payout_method in ('paypal', 'perfect_money', 'vodafone_cash')),
  payout_destination text not null default '',
  provider_ref text,
  provider_status text not null default 'queued',
  error_message text not null default '',
  note text not null default '',
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table dribads.payout_requests
  add column if not exists payout_method text not null default 'paypal';

alter table dribads.payout_requests
  add column if not exists payout_destination text not null default '';

alter table dribads.payout_requests
  add column if not exists provider_ref text;

alter table dribads.payout_requests
  add column if not exists provider_status text not null default 'queued';

alter table dribads.payout_requests
  add column if not exists error_message text not null default '';

alter table dribads.payout_requests
  add column if not exists requester_user_id uuid references auth.users(id) on delete set null;

create table if not exists dribads.publisher_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  country text not null default '',
  company_name text not null default '',
  payment_method text not null default 'bank_transfer' check (payment_method in ('bank_transfer', 'paypal', 'payoneer', 'crypto')),
  payout_email text not null default '',
  publisher_type text not null default 'individual' check (publisher_type in ('individual', 'company')),
  kyc_status text not null default 'pending' check (kyc_status in ('pending', 'in_review', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dribads.publisher_app_links (
  id uuid primary key default gen_random_uuid(),
  publisher_user_id uuid not null references auth.users(id) on delete cascade,
  app_id uuid not null references dribads.apps(id) on delete cascade,
  linked_from text not null default 'mobile',
  link_status text not null default 'active' check (link_status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (publisher_user_id, app_id)
);

create table if not exists dribads.publisher_eligibility_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  followers_count bigint not null default 0 check (followers_count >= 0),
  video_views_count bigint not null default 0 check (video_views_count >= 0),
  watch_minutes bigint not null default 0 check (watch_minutes >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists dribads.monetization_user_overrides (
  user_id uuid primary key references auth.users(id) on delete cascade,
  video_monetization_bypass boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dribads.kyc_audit_logs (
  id uuid primary key default gen_random_uuid(),
  profile_user_id uuid not null references dribads.publisher_profiles(user_id) on delete cascade,
  previous_status text not null check (previous_status in ('pending', 'in_review', 'verified', 'rejected')),
  new_status text not null check (new_status in ('pending', 'in_review', 'verified', 'rejected')),
  reason text not null default '',
  actor_label text not null default 'admin',
  created_at timestamptz not null default now()
);

grant select on table dribads.apps to anon, authenticated, service_role;
grant insert, update on table dribads.apps to service_role;
grant select on table dribads.ads to anon, authenticated, service_role;
grant insert on table dribads.ads to authenticated, service_role;

grant select on table dribads.ad_views to authenticated, service_role;
grant insert on table dribads.ad_views to anon, authenticated, service_role;

grant select on table dribads.ad_clicks to authenticated, service_role;
grant insert on table dribads.ad_clicks to anon, authenticated, service_role;
grant select on table dribads.ad_skips to authenticated, service_role;
grant insert on table dribads.ad_skips to anon, authenticated, service_role;
grant select on table dribads.ad_completions to authenticated, service_role;
grant insert on table dribads.ad_completions to anon, authenticated, service_role;
grant select on table dribads.ad_earnings_ledger to authenticated, service_role;
grant insert on table dribads.ad_earnings_ledger to service_role;
grant select on table dribads.app_monetization_features to authenticated, service_role;
grant insert, update on table dribads.app_monetization_features to service_role;
grant select on table dribads.payout_requests to authenticated, service_role;
grant insert on table dribads.payout_requests to authenticated, service_role;
grant update on table dribads.payout_requests to service_role;
grant select, insert, update on table dribads.publisher_profiles to authenticated, service_role;
grant select, insert, update on table dribads.publisher_app_links to authenticated, service_role;
grant select on table dribads.publisher_eligibility_stats to authenticated, service_role;
grant insert, update on table dribads.publisher_eligibility_stats to service_role;
grant select on table dribads.monetization_user_overrides to service_role;
grant insert, update on table dribads.monetization_user_overrides to service_role;
grant select, insert on table dribads.kyc_audit_logs to service_role;

create index if not exists idx_dribads_ad_views_ad_id on dribads.ad_views(ad_id);
create index if not exists idx_dribads_ad_clicks_ad_id on dribads.ad_clicks(ad_id);
create index if not exists idx_dribads_ad_views_app_id on dribads.ad_views(app_id);
create index if not exists idx_dribads_ad_clicks_app_id on dribads.ad_clicks(app_id);
create index if not exists idx_dribads_ad_skips_ad_id on dribads.ad_skips(ad_id);
create index if not exists idx_dribads_ad_skips_app_id on dribads.ad_skips(app_id);
create index if not exists idx_dribads_ad_completions_ad_id on dribads.ad_completions(ad_id);
create index if not exists idx_dribads_ad_completions_app_id on dribads.ad_completions(app_id);
create index if not exists idx_dribads_earnings_owner_user_id on dribads.ad_earnings_ledger(owner_user_id);
create index if not exists idx_dribads_earnings_ad_id on dribads.ad_earnings_ledger(ad_id);
create index if not exists idx_dribads_earnings_app_id on dribads.ad_earnings_ledger(app_id);
create index if not exists idx_dribads_earnings_created_at on dribads.ad_earnings_ledger(created_at desc);
create index if not exists idx_dribads_ads_created_at on dribads.ads(created_at desc);
create index if not exists idx_dribads_ads_owner_user_id on dribads.ads(owner_user_id);
create index if not exists idx_dribads_apps_slug on dribads.apps(slug);
create index if not exists idx_dribads_payout_requests_app_id on dribads.payout_requests(app_id);
create index if not exists idx_dribads_payout_requests_requester_user_id on dribads.payout_requests(requester_user_id);
create index if not exists idx_dribads_payout_requests_requested_at on dribads.payout_requests(requested_at desc);
create index if not exists idx_dribads_publisher_profiles_kyc on dribads.publisher_profiles(kyc_status);
create index if not exists idx_dribads_publisher_app_links_user_id on dribads.publisher_app_links(publisher_user_id);
create index if not exists idx_dribads_publisher_app_links_app_id on dribads.publisher_app_links(app_id);
create index if not exists idx_dribads_publisher_eligibility_updated_at on dribads.publisher_eligibility_stats(updated_at desc);
create index if not exists idx_dribads_monetization_overrides_bypass on dribads.monetization_user_overrides(video_monetization_bypass);
create index if not exists idx_dribads_kyc_audit_profile_user_id on dribads.kyc_audit_logs(profile_user_id);
create index if not exists idx_dribads_kyc_audit_created_at on dribads.kyc_audit_logs(created_at desc);

alter table dribads.apps enable row level security;
alter table dribads.ads enable row level security;
alter table dribads.ad_views enable row level security;
alter table dribads.ad_clicks enable row level security;
alter table dribads.ad_skips enable row level security;
alter table dribads.ad_completions enable row level security;
alter table dribads.ad_earnings_ledger enable row level security;
alter table dribads.app_monetization_features enable row level security;
alter table dribads.payout_requests enable row level security;
alter table dribads.publisher_profiles enable row level security;
alter table dribads.publisher_app_links enable row level security;
alter table dribads.publisher_eligibility_stats enable row level security;
alter table dribads.monetization_user_overrides enable row level security;
alter table dribads.kyc_audit_logs enable row level security;

drop policy if exists dribads_apps_select on dribads.apps;
create policy dribads_apps_select on dribads.apps
  for select
  using (true);

drop policy if exists dribads_apps_service_update on dribads.apps;
create policy dribads_apps_service_update on dribads.apps
  for all
  to service_role
  using (true)
  with check (true);

-- Ads can be read publicly; creation is limited to authenticated users.
drop policy if exists dribads_ads_select on dribads.ads;
create policy dribads_ads_select on dribads.ads
  for select
  using (true);

drop policy if exists dribads_ads_insert on dribads.ads;
create policy dribads_ads_insert on dribads.ads
  for insert
  to authenticated
  with check (auth.uid() = owner_user_id);

-- Tracking rows can be inserted publicly (for app impressions/clicks).
drop policy if exists dribads_ad_views_insert on dribads.ad_views;
create policy dribads_ad_views_insert on dribads.ad_views
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists dribads_ad_clicks_insert on dribads.ad_clicks;
create policy dribads_ad_clicks_insert on dribads.ad_clicks
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists dribads_ad_skips_insert on dribads.ad_skips;
create policy dribads_ad_skips_insert on dribads.ad_skips
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists dribads_ad_completions_insert on dribads.ad_completions;
create policy dribads_ad_completions_insert on dribads.ad_completions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists dribads_earnings_select_own on dribads.ad_earnings_ledger;
create policy dribads_earnings_select_own on dribads.ad_earnings_ledger
  for select
  to authenticated, service_role
  using (auth.uid() = owner_user_id or auth.role() = 'service_role');

drop policy if exists dribads_earnings_service_insert on dribads.ad_earnings_ledger;
create policy dribads_earnings_service_insert on dribads.ad_earnings_ledger
  for insert
  to service_role
  with check (true);

-- Optional read policies for analytics dashboards.
drop policy if exists dribads_ad_views_select on dribads.ad_views;
create policy dribads_ad_views_select on dribads.ad_views
  for select
  to authenticated
  using (true);

drop policy if exists dribads_ad_clicks_select on dribads.ad_clicks;
create policy dribads_ad_clicks_select on dribads.ad_clicks
  for select
  to authenticated
  using (true);

drop policy if exists dribads_ad_skips_select on dribads.ad_skips;
create policy dribads_ad_skips_select on dribads.ad_skips
  for select
  to authenticated
  using (true);

drop policy if exists dribads_ad_completions_select on dribads.ad_completions;
create policy dribads_ad_completions_select on dribads.ad_completions
  for select
  to authenticated
  using (true);

drop policy if exists dribads_monetization_select on dribads.app_monetization_features;
create policy dribads_monetization_select on dribads.app_monetization_features
  for select
  to authenticated, service_role
  using (true);

drop policy if exists dribads_monetization_service_write on dribads.app_monetization_features;
create policy dribads_monetization_service_write on dribads.app_monetization_features
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists dribads_payout_select on dribads.payout_requests;
create policy dribads_payout_select on dribads.payout_requests
  for select
  to authenticated, service_role
  using (auth.uid() = requester_user_id or auth.role() = 'service_role');

drop policy if exists dribads_payout_insert on dribads.payout_requests;
create policy dribads_payout_insert on dribads.payout_requests
  for insert
  to authenticated, service_role
  with check (auth.uid() = requester_user_id or auth.role() = 'service_role');

drop policy if exists dribads_payout_service_update on dribads.payout_requests;
create policy dribads_payout_service_update on dribads.payout_requests
  for update
  to service_role
  using (true)
  with check (true);

drop policy if exists dribads_publisher_profiles_select_own on dribads.publisher_profiles;
create policy dribads_publisher_profiles_select_own on dribads.publisher_profiles
  for select
  to authenticated, service_role
  using (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists dribads_publisher_profiles_insert_own on dribads.publisher_profiles;
create policy dribads_publisher_profiles_insert_own on dribads.publisher_profiles
  for insert
  to authenticated, service_role
  with check (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists dribads_publisher_profiles_update_own on dribads.publisher_profiles;
create policy dribads_publisher_profiles_update_own on dribads.publisher_profiles
  for update
  to authenticated, service_role
  using (auth.uid() = user_id or auth.role() = 'service_role')
  with check (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists dribads_publisher_app_links_select_own on dribads.publisher_app_links;
create policy dribads_publisher_app_links_select_own on dribads.publisher_app_links
  for select
  to authenticated, service_role
  using (auth.uid() = publisher_user_id or auth.role() = 'service_role');

drop policy if exists dribads_publisher_app_links_insert_own on dribads.publisher_app_links;
create policy dribads_publisher_app_links_insert_own on dribads.publisher_app_links
  for insert
  to authenticated, service_role
  with check (auth.uid() = publisher_user_id or auth.role() = 'service_role');

drop policy if exists dribads_publisher_app_links_update_own on dribads.publisher_app_links;
create policy dribads_publisher_app_links_update_own on dribads.publisher_app_links
  for update
  to authenticated, service_role
  using (auth.uid() = publisher_user_id or auth.role() = 'service_role')
  with check (auth.uid() = publisher_user_id or auth.role() = 'service_role');

drop policy if exists dribads_publisher_eligibility_stats_select_own on dribads.publisher_eligibility_stats;
create policy dribads_publisher_eligibility_stats_select_own on dribads.publisher_eligibility_stats
  for select
  to authenticated, service_role
  using (auth.uid() = user_id or auth.role() = 'service_role');

drop policy if exists dribads_publisher_eligibility_stats_service_write on dribads.publisher_eligibility_stats;
create policy dribads_publisher_eligibility_stats_service_write on dribads.publisher_eligibility_stats
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists dribads_monetization_overrides_service_select on dribads.monetization_user_overrides;
create policy dribads_monetization_overrides_service_select on dribads.monetization_user_overrides
  for select
  to service_role
  using (true);

drop policy if exists dribads_monetization_overrides_service_write on dribads.monetization_user_overrides;
create policy dribads_monetization_overrides_service_write on dribads.monetization_user_overrides
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists dribads_kyc_audit_service_select on dribads.kyc_audit_logs;
create policy dribads_kyc_audit_service_select on dribads.kyc_audit_logs
  for select
  to service_role
  using (true);

drop policy if exists dribads_kyc_audit_service_insert on dribads.kyc_audit_logs;
create policy dribads_kyc_audit_service_insert on dribads.kyc_audit_logs
  for insert
  to service_role
  with check (true);

insert into dribads.apps (slug, name, api_key, is_active)
values
  ('web', 'Dribads Web', null, true),
  ('dribdo', 'Dribdo', 'dribdo_default_key_change_me', true),
  ('dridoud', 'Dridoud', 'dridoud_default_key_change_me', true),
  ('dixard', 'Dexard', 'dixard_default_key_change_me', true)
on conflict (slug) do nothing;

update dribads.apps
set name = 'Dexard'
where slug = 'dixard';

insert into dribads.app_monetization_features (
  app_id,
  video_monetization_enabled,
  rewards_enabled,
  subscriptions_enabled,
  ads_enabled,
  gifts_enabled,
  live_stream_enabled
)
select
  id,
  true,
  false,
  false,
  false,
  false,
  false
from dribads.apps
on conflict (app_id) do nothing;

-- Internal test bypass: this user can access video monetization without eligibility checks.
insert into dribads.monetization_user_overrides (user_id, video_monetization_bypass, notes)
values ('62fb0b2e-8cdd-4226-878f-3eec5131952c', true, 'Internal owner bypass for Dribdo monetization testing')
on conflict (user_id) do update
set
  video_monetization_bypass = excluded.video_monetization_bypass,
  notes = excluded.notes,
  updated_at = now();

-- For Dribdo now, keep only video monetization enabled until other features are fully implemented.
update dribads.app_monetization_features f
set
  video_monetization_enabled = true,
  rewards_enabled = false,
  subscriptions_enabled = false,
  ads_enabled = false,
  gifts_enabled = false,
  live_stream_enabled = false,
  updated_at = now()
from dribads.apps a
where f.app_id = a.id
  and a.slug = 'dribdo';

-- Storage bucket for uploaded ad media (images/videos).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dribads-media',
  'dribads-media',
  true,
  26214400,
  array['image/*', 'video/*']
)
on conflict (id) do nothing;

drop policy if exists dribads_media_public_read on storage.objects;
create policy dribads_media_public_read on storage.objects
  for select
  using (bucket_id = 'dribads-media');

drop policy if exists dribads_media_auth_insert on storage.objects;
create policy dribads_media_auth_insert on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'dribads-media');
