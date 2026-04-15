import DocViewer from "@/components/DocViewer";
import { docsContent } from "@/content/docs";

const doc = docsContent.privacyPolicy;

export const metadata = {
  title: doc.ar.title || "سياسة الخصوصية",
  description: "توضح سياسة دريبدو كيفية جمع البيانات واستخدامها وحمايتها داخل المنصة.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  const title = doc.ar.title || "سياسة الخصوصية";
  const updated = doc.ar.updated || doc.en.updated || "آخر تحديث قريبًا";

  return (
    <div className="w-full">
      <section className="w-full bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-red-600">{doc.en.title || "Privacy Policy"}</p>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mt-3">{title}</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mt-4">{updated}</p>
          <p className="text-base text-gray-700 dark:text-gray-300 mt-3 max-w-3xl mx-auto">
            نضع الشفافية في صلب تعاملنا مع البيانات، وتوضح هذه الصفحة كيف تتحكم في المعلومات الخاصة بك على دريبدو.
          </p>
        </div>
      </section>

      <section className="w-full py-20 sm:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <DocViewer arText={doc.ar.text} enText={doc.en.text} />
        </div>
      </section>
    </div>
  );
}

