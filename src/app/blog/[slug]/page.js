import Image from "next/image";
import Link from "next/link";
import { getPostBySlugDetailed } from "@/lib/blog/posts";
import { formatArabicDate } from "@/lib/blog/render";
import { renderMarkdownToHtml } from "@/lib/blog/markdown";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata({ params }) {
  const { post } = await getPostBySlugDetailed(params.slug);
  if (!post) {
    return {
      title: "مقال غير موجود",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { post, error } = await getPostBySlugDetailed(params.slug);
  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">المقال غير موجود</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-8">قد يكون تم حذفه أو لم يتم نشره بعد.</p>
        {error ? (
          <div className="mb-8 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-5 text-red-900 dark:text-red-200">
            سبب Supabase: <span className="font-mono">{error}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-4">
          <Link href="/blog" className="text-red-800 dark:text-red-300 font-semibold">
            العودة إلى المدونة
          </Link>
          <Link href="/admin/blog" className="text-gray-700 dark:text-gray-300 hover:text-red-800 dark:hover:text-red-300">
            إعداد/نشر المقالات
          </Link>
        </div>
      </div>
    );
  }

  const html = renderMarkdownToHtml(post.content);
  const cover = post.coverImageUrl || "/screenshots/feed.svg";

  return (
    <div className="w-full">
      <section className="w-full bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Link href="/blog" className="hover:text-red-800 dark:hover:text-red-300">
              المدونة
            </Link>{" "}
            <span>/</span> <span className="text-gray-700 dark:text-gray-300">{post.category || "مقال"}</span>
          </nav>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
            {post.title}
          </h1>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-red-800 dark:text-red-300">{post.category || "مقال"}</span>
            <time dateTime={post.publishedAt || post.createdAt}>{formatArabicDate(post.publishedAt || post.createdAt)}</time>
          </div>

          <p className="mt-6 text-xl text-gray-700 dark:text-gray-300 leading-relaxed">{post.excerpt}</p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="relative h-64 sm:h-80 lg:h-[420px] rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <Image src={cover} alt={post.title} fill className="object-cover" priority />
          </div>
        </div>
      </section>

      <section className="w-full py-14 sm:py-20 bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </article>
        </div>
      </section>
    </div>
  );
}
