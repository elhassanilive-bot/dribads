-- Dridoud Blog Schema (Supabase / Postgres)
-- هدف: نظام واحد شامل للمقالات + وسائط (صور/فيديو/صوت/مستندات/روابط) مع RLS.
--
-- طريقة الاستخدام:
-- 1) افتح Supabase SQL Editor والصق هذا الملف وشغّله.
-- 2) إذا تريد النشر "عام مؤقتًا" بدون تسجيل دخول، فعّل سياسة insert المؤقتة بالأسفل.

-- Extensions
create extension if not exists pgcrypto;

-- Enums (اختياري لكن أنيق)
do $$ begin
  create type public.blog_post_status as enum ('draft','published','archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.blog_asset_type as enum ('image','video','audio','document','embed','link');
exception when duplicate_object then null;
end $$;

-- Main posts table
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null,
  -- content: store Markdown (editor uses Markdown)
  content text not null,
  -- optional structured content blocks for future
  content_blocks jsonb,
  cover_image_url text,
  category text,
  tags text[] not null default '{}'::text[],
  status public.blog_post_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_status_published_at_idx
  on public.blog_posts (status, published_at desc);

create index if not exists blog_posts_created_at_idx
  on public.blog_posts (created_at desc);

create index if not exists blog_posts_tags_gin_idx
  on public.blog_posts using gin (tags);

-- Assets table (multiple assets per post)
create table if not exists public.blog_post_assets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  type public.blog_asset_type not null,
  title text,
  url text not null,
  -- extra metadata: {mime,size,width,height,duration,provider,thumbnailUrl,...}
  meta jsonb not null default '{}'::jsonb,
  -- ordering within the post
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists blog_post_assets_post_id_pos_idx
  on public.blog_post_assets (post_id, position);

-- Optional: links table (if you want curated sources/refs separate from assets)
create table if not exists public.blog_post_links (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  label text,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists blog_post_links_post_id_pos_idx
  on public.blog_post_links (post_id, position);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
before update on public.blog_posts
for each row execute function public.set_updated_at();

-- RLS
alter table public.blog_posts enable row level security;
alter table public.blog_post_assets enable row level security;
alter table public.blog_post_links enable row level security;

-- Public read: published posts only
drop policy if exists blog_posts_read_published on public.blog_posts;
create policy blog_posts_read_published
on public.blog_posts
for select
to anon, authenticated
using (status = 'published');

drop policy if exists blog_assets_read_published on public.blog_post_assets;
create policy blog_assets_read_published
on public.blog_post_assets
for select
to anon, authenticated
using (
  exists (
    select 1 from public.blog_posts p
    where p.id = blog_post_assets.post_id and p.status = 'published'
  )
);

drop policy if exists blog_links_read_published on public.blog_post_links;
create policy blog_links_read_published
on public.blog_post_links
for select
to anon, authenticated
using (
  exists (
    select 1 from public.blog_posts p
    where p.id = blog_post_links.post_id and p.status = 'published'
  )
);

-- Write policies (Recommended: use service_role only via server)
-- In Supabase, service_role bypasses RLS anyway if you use Service Role key server-side.
-- Keep RLS strict by default:
drop policy if exists blog_posts_write_authenticated on public.blog_posts;
drop policy if exists blog_assets_write_authenticated on public.blog_post_assets;
drop policy if exists blog_links_write_authenticated on public.blog_post_links;

-- TEMP OPTION (غير آمن): السماح بالنشر بدون تسجيل دخول (للتجارب فقط)
-- فعّله إذا أردت أن يعمل /admin/blog الآن باستخدام anon key:
-- create policy blog_posts_insert_temp
-- on public.blog_posts
-- for insert
-- to anon, authenticated
-- with check (true);
--
-- create policy blog_posts_update_temp
-- on public.blog_posts
-- for update
-- to anon, authenticated
-- using (true)
-- with check (true);
--
-- create policy blog_assets_insert_temp
-- on public.blog_post_assets
-- for insert
-- to anon, authenticated
-- with check (true);
--
-- create policy blog_links_insert_temp
-- on public.blog_post_links
-- for insert
-- to anon, authenticated
-- with check (true);

