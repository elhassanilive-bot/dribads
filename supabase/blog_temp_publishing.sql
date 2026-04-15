-- TEMP Publishing Policies (DEV ONLY)
-- يسمح للنشر من /admin/blog باستخدام anon key بدون تسجيل دخول.
-- غير آمن للإنتاج. احذفه/عطله لاحقًا واستعمل Service Role أو Auth.

alter table public.blog_posts enable row level security;
alter table public.blog_post_assets enable row level security;
alter table public.blog_post_links enable row level security;

-- Posts
drop policy if exists blog_posts_insert_temp on public.blog_posts;
create policy blog_posts_insert_temp
on public.blog_posts
for insert
to anon, authenticated
with check (true);

drop policy if exists blog_posts_update_temp on public.blog_posts;
create policy blog_posts_update_temp
on public.blog_posts
for update
to anon, authenticated
using (true)
with check (true);

-- Assets
drop policy if exists blog_assets_insert_temp on public.blog_post_assets;
create policy blog_assets_insert_temp
on public.blog_post_assets
for insert
to anon, authenticated
with check (true);

-- Links
drop policy if exists blog_links_insert_temp on public.blog_post_links;
create policy blog_links_insert_temp
on public.blog_post_links
for insert
to anon, authenticated
with check (true);

