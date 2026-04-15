import ContactForm from './ContactForm';

export const metadata = {
  title: 'اتصل بنا | دريبدو',
  description: 'تواصل مباشرة مع فريق دريبدو عبر نموذج احترافي يصل الرسائل إلى support@dribdo.com.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/45">تواصل مع فريق الدعم</p>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">اتصل بنا</h1>
          <p className="max-w-3xl text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            هذه الصفحة مخصصة للتواصل المهني مع فريق دريبدو. يمكنك استخدامها للدعم الفني، الاستفسارات العامة،
            ملاحظات المنتج، اقتراحات التحسين، أو أي طلب يحتاج متابعة مباشرة من الفريق.
          </p>
        </section>

        <ContactForm />
      </div>
    </div>
  );
}

