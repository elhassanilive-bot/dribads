import Link from "next/link";

export const metadata = {
  title: "لوحة الأدمن",
  description: "لوحة إدارة موقع دريبدو.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin" },
};

export default function AdminHome() {
  return (
    <div className="w-full">
      <section className="w-full bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white">لوحة الأدمن</h1>
            <p className="mt-4 text-xl text-gray-700 dark:text-gray-300">
              لوحة عامة مؤقتًا. لاحقًا يمكن تقييدها للمسؤول فقط.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full py-14 sm:py-20 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">المدونة</h2>
              <p className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed">
                إنشاء وكتابة ونشر المقالات بمحرر متقدم مع معاينة فورية.
              </p>
              <div className="mt-8 flex gap-4">
                <Link
                  href="/admin/blog"
                  className="inline-flex items-center justify-center bg-red-700 hover:bg-red-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  محرر المقالات
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center justify-center bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  عرض المدونة
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">إعدادات</h2>
              <p className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed">
                هذا المكان مخصص لاحقًا لإعدادات الموقع (روابط السوشيال، البريد، SEO…).
              </p>
              <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                حاليًا الإعدادات موجودة في <code>.env.local</code> و <code>src/config/site.js</code>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

