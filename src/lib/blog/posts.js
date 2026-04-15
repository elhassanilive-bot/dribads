import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export function isBlogEnabled() {
  return isSupabaseConfigured();
}

export function isBlogPublishingEnabled() {
  return isSupabaseConfigured();
}

function normalizePost(row) {
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.cover_image_url,
    category: row.category,
    tags: row.tags || [],
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

export async function listPosts({ limit = 20 } = {}) {
  if (!isSupabaseConfigured()) return [];

  const supabase = await getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,slug,title,excerpt,cover_image_url,category,tags,published_at,created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []).map(normalizePost);
}

export async function listPostsDetailed({ limit = 20 } = {}) {
  if (!isSupabaseConfigured()) return { posts: [], error: "Supabase غير مُعد" };

  const supabase = await getSupabaseClient();
  if (!supabase) return { posts: [], error: "Supabase client غير متاح" };

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,slug,title,excerpt,cover_image_url,category,tags,published_at,created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) return { posts: [], error: error.message };
  return { posts: (data || []).map(normalizePost), error: null };
}

export async function getPostBySlug(slug) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,slug,title,excerpt,content,cover_image_url,category,tags,published_at,created_at,status")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return normalizePost(data);
}

export async function getPostBySlugDetailed(slug) {
  if (!isSupabaseConfigured()) return { post: null, error: "Supabase غير مُعد" };

  const supabase = await getSupabaseClient();
  if (!supabase) return { post: null, error: "Supabase client غير متاح" };

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,slug,title,excerpt,content,cover_image_url,category,tags,published_at,created_at,status")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) return { post: null, error: error.message };
  if (!data) return { post: null, error: null };
  return { post: normalizePost(data), error: null };
}

function slugify(input) {
  const trimmed = String(input || "").trim();
  const ascii = trimmed
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (ascii) return ascii;

  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ].join("");
  return `post-${stamp}`;
}

export async function createPost(input) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured" };
  }

  const title = String(input?.title || "").trim();
  const excerpt = String(input?.excerpt || "").trim();
  const content = String(input?.content || "").trim();
  const coverImageUrl = String(input?.coverImageUrl || "").trim() || null;
  const category = String(input?.category || "").trim() || null;
  const tags = Array.isArray(input?.tags) ? input.tags : [];
  const desiredSlug = String(input?.slug || "").trim();
  const slug = desiredSlug ? slugify(desiredSlug) : slugify(title);

  if (!title || !excerpt || !content) {
    return { ok: false, error: "Missing required fields" };
  }

  const writer = isSupabaseAdminConfigured()
    ? await getSupabaseAdminClient()
    : await getSupabaseClient();

  if (!writer) {
    return { ok: false, error: "Supabase client is not available" };
  }

  const { data, error } = await writer
    .from("blog_posts")
    .insert({
      slug,
      title,
      excerpt,
      content,
      cover_image_url: coverImageUrl,
      category,
      tags,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select("slug")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  return { ok: true, slug: data?.slug || slug };
}
