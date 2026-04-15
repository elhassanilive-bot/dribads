import Link from "next/link";
import Image from "next/image";
import { listPostsDetailed, isBlogEnabled } from "@/lib/blog/posts";
import { formatArabicDate } from "@/lib/blog/render";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata = {
  title: "المدونة",
  description: "آخر أخبار ومقالات دريبدو.",
  alternates: { canonical: "/blog" },
};

function PostCard({ post, variant = "normal" }) {
  const isFeatured = variant === "featured";
  const cover = post.coverImageUrl || "/screenshots/feed.svg";

  return (
    <article
      className={[
        "rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden hover:shadow-lg transition-shadow",
        isFeatured ? "md:col-span-2" : "",
      ].join(" ")}
    >
      <Link href={`/blog/${post.slug}`} className="block">
        <div className={isFeatured ? "grid md:grid-cols-2" : ""}>
          <div className={isFeatured ? "relative h-64 md:h-full" : "relative h-52"}>
            <Image src={cover} alt={post.title} fill className="object-cover" />
          </div>
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-red-800 dark:text-red-300">{post.category || "مقال"}</span>
              <time dateTime={post.publishedAt || post.createdAt}>{formatArabicDate(post.publishedAt || post.createdAt)}</time>
            </div>
            <h2 className={isFeatured ? "text-3xl font-bold mt-3 text-gray-900 dark:text-white" : "text-2xl font-bold mt-3 text-gray-900 dark:text-white"}>
              {post.title}
            </h2>
            <p className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed">
              {post.excerpt}
            </p>
            <div className="mt-6 text-red-800 dark:text-red-300 font-semibold">اقرأ المزيد</div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default async function BlogIndex() {
  const enabled = isBlogEnabled();
  const { posts, error } = await listPostsDetailed({ limit: 30 });
  const [first, ...rest] = posts;

  return (
    <div className="w-full">
      <section className="w-full bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-4">المدونة</h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              مقالات وأخبار وتحديثات حول دريبدو—بأسلوب مواقع الأخبار.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full py-14 sm:py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!enabled ? (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-10 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">المدونة جاهزة… فقط فعّل Supabase</h2>
              <p className="text-gray-700 dark:text-gray-300">
                أضف مفاتيح Supabase في <code>.env.local</code> وأنشئ جدول <code>blog_posts</code>.
              </p>
              <div className="mt-6">
                <Link href="/admin/blog" className="inline-flex items-center justify-center bg-red-700 hover:bg-red-800 text-white px-7 py-3 rounded-lg font-semibold">
                  لوحة نشر المقالات
                </Link>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-3xl p-10 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">تعذر تحميل المقالات</h2>
              <p className="text-gray-700 dark:text-gray-300">
                السبب من Supabase: <span className="font-mono">{error}</span>
              </p>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                غالبًا الجدول غير موجود أو سياسات RLS لا تسمح بالقراءة.
              </p>
              <div className="mt-6">
                <Link href="/admin/blog" className="inline-flex items-center justify-center bg-red-700 hover:bg-red-800 text-white px-7 py-3 rounded-lg font-semibold">
                  فتح إعداد النشر
                </Link>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-10 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">لا توجد مقالات بعد</h2>
              <p className="text-gray-700 dark:text-gray-300">
                انشر أول مقال من لوحة الإدارة وسيظهر هنا تلقائيًا.
              </p>
              <div className="mt-6">
                <Link href="/admin/blog" className="inline-flex items-center justify-center bg-red-700 hover:bg-red-800 text-white px-7 py-3 rounded-lg font-semibold">
                  نشر مقال جديد
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {first ? <PostCard post={first} variant="featured" /> : null}
                {rest.slice(0, 2).map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>

              {rest.length > 2 ? (
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {rest.slice(2).map((p) => (
                    <PostCard key={p.slug} post={p} />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

