import Link from "next/link";
import { redirect } from "next/navigation";
import { createPost, isBlogPublishingEnabled } from "@/lib/blog/posts";
import BlogEditorField from "@/components/blog/BlogEditorField";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const metadata = {
  title: "لوحة المدونة",
  description: "نشر وإدارة مقالات دريبدو.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin/blog" },
};

function SetupBox() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-10">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">إعداد النشر (مرة واحدة)</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        استخدم ملف SQL الجاهز: <code>supabase/blog_schema.sql</code> (انسخه إلى Supabase SQL Editor وشغّله).
        إذا تريد النشر “عام مؤقتًا” بدون تسجيل دخول، شغّل أيضًا: <code>supabase/blog_temp_publishing.sql</code>.
      </p>
      <ol className="space-y-3 text-gray-700 dark:text-gray-300 list-decimal pr-6">
        <li>
          تأكد من وجود <code>NEXT_PUBLIC_SUPABASE_URL</code> و <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> داخل <code>.env.local</code>.
        </li>
        <li>
          شغّل ملف <code>supabase/blog_schema.sql</code> لإنشاء الجداول والسياسات.
        </li>
      </ol>
      <details className="mt-6">
        <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white">SQL مختصر (بديل سريع)</summary>
        <pre className="mt-4 overflow-auto rounded-2xl bg-black text-white p-4 text-sm">
{`create table if not exists public.blog_posts (
  id bigserial primary key,
  slug text unique not null,
  title text not null,
  excerpt text not null,
  content text not null,
  cover_image_url text,
  category text,
  tags text[] default '{}'::text[],
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

-- Public can read published posts
create policy "read_published_posts"
on public.blog_posts
for select
to anon, authenticated
using (status = 'published');

-- TEMP (for now): allow publishing from admin UI without auth
-- IMPORTANT: tighten this later (auth, token, or service role).
create policy "insert_posts_temp"
on public.blog_posts
for insert
to anon, authenticated
with check (true);`}
        </pre>
      </details>
    </div>
  );
}

export default function AdminBlogPage({ searchParams }) {
  async function onCreatePost(formData) {
    "use server";

    const expectedToken = process.env.BLOG_ADMIN_TOKEN || "";
    const providedToken = String(formData.get("adminToken") || "");
    if (expectedToken && providedToken !== expectedToken) {
      redirect("/admin/blog?error=unauthorized");
    }

    const result = await createPost({
      title: formData.get("title"),
      slug: formData.get("slug"),
      excerpt: formData.get("excerpt"),
      coverImageUrl: formData.get("coverImageUrl"),
      category: formData.get("category"),
      tags: String(formData.get("tags") || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      content: formData.get("content"),
    });

    if (!result.ok) {
      redirect(`/admin/blog?error=${encodeURIComponent(result.error || "failed")}`);
    }

    redirect(`/blog/${result.slug}`);
  }

  const publishingEnabled = isBlogPublishingEnabled();
  const error = searchParams?.error;
  const requiresToken = Boolean(process.env.BLOG_ADMIN_TOKEN);
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="w-full">
      <section className="w-full bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">لوحة نشر المقالات</h1>
              <p className="mt-3 text-lg text-gray-700 dark:text-gray-300">
                أنشئ مقالًا جديدًا وسيظهر مباشرة في صفحة <Link href="/blog" className="text-red-800 dark:text-red-300 font-semibold">المدونة</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-14 sm:py-20 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {error ? (
            <div className="mb-8 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-5 text-red-900 dark:text-red-200">
              {error === "unauthorized" ? "رمز الإدارة غير صحيح. تأكد من BLOG_ADMIN_TOKEN." : `تعذر النشر: ${error}`}
            </div>
          ) : null}

          {!supabaseReady ? (
            <SetupBox />
          ) : (
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-10">
              {!publishingEnabled ? (
                <div className="mb-8 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-5 text-amber-900 dark:text-amber-200">
                  لوحة النشر تحتاج سياسة RLS للسماح بـ <code>insert</code> (انظر SQL داخل “إعداد النشر”).
                </div>
              ) : null}

              <details className="mb-8">
                <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white">إعداد النشر (SQL)</summary>
                <div className="mt-4">
                  <SetupBox />
                </div>
              </details>

              <form action={onCreatePost} className="space-y-6">
                {requiresToken ? (
                  <label className="block">
                    <span className="block font-semibold text-gray-900 dark:text-white mb-2">رمز الإدارة</span>
                    <input
                      name="adminToken"
                      type="password"
                      required
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white"
                      placeholder="BLOG_ADMIN_TOKEN"
                    />
                  </label>
                ) : (
                  <input name="adminToken" type="hidden" value="" />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="block">
                    <span className="block font-semibold text-gray-900 dark:text-white mb-2">عنوان المقال</span>
                    <input
                      name="title"
                      required
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white"
                      placeholder="مثال: كيف تبني مجتمعك على دريبدو؟"
                    />
                  </label>
                  <label className="block">
                    <span className="block font-semibold text-gray-900 dark:text-white mb-2">Slug (اختياري)</span>
                    <input
                      name="slug"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white"
                      placeholder="مثال: how-to-build-community"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="block font-semibold text-gray-900 dark:text-white mb-2">ملخص قصير</span>
                  <textarea
                    name="excerpt"
                    required
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white"
                    placeholder="سطرين إلى ثلاثة أسطر تظهر في بطاقة المقال."
                  />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="block">
                    <span className="block font-semibold text-gray-900 dark:text-white mb-2">صورة الغلاف (URL)</span>
                    <input
                      name="coverImageUrl"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white"
                      placeholder="https://..."
                    />
                  </label>
                  <label className="block">
                    <span className="block font-semibold text-gray-900 dark:text-white mb-2">التصنيف</span>
                    <input
                      name="category"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white"
                      placeholder="أخبار / تحديثات / دليل"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="block font-semibold text-gray-900 dark:text-white mb-2">Tags (مفصولة بفواصل)</span>
                  <input
                    name="tags"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white"
                    placeholder="Dribdo, community, updates"
                  />
                </label>

                <div>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className="block font-semibold text-gray-900 dark:text-white">المحتوى (Markdown)</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">كتابة + معاينة + حفظ مسودة</span>
                  </div>
                  <BlogEditorField name="content" storageKey="Dribdo_blog_editor_draft" />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center bg-red-700 hover:bg-red-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    نشر المقال
                  </button>
                  <Link href="/blog" className="text-gray-700 dark:text-gray-300 hover:text-red-800 dark:hover:text-red-300">
                    عرض المدونة
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

