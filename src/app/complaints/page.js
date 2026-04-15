import ComplaintsForm from './ComplaintsForm';

export const metadata = {
  title: 'شكاوى وبلاغات | دريبدو',
  description: 'أرسل بلاغاً عن محتوى مخالف أو مشكلة تقنية، ويصلك رد فريق دريبدو بعد المراجعة.',
  alternates: { canonical: '/complaints' },
};

export default function ComplaintsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <section className="space-y-4 rounded-3xl border border-black/10 bg-white p-10 shadow-sm dark:from-gray-900 dark:to-gray-800">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/45">النظام الإشرافي</p>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">شكاوى وبلاغات</h1>
          <p className="max-w-3xl text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            هذه الصفحة مخصصة لتلقي البلاغات المنظمة المتعلقة بالمحتوى المخالف، انتحال الهوية، الرسائل المزعجة،
            المشكلات التقنية، أو أي حالة تستدعي مراجعة إشرافية من فريق دريبدو.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-[#faf8f6] px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-black/75 dark:border-red-600/40 dark:bg-red-900/40">
              الإبلاغ عن محتوى
            </div>
            <div className="rounded-2xl border border-black/10 bg-[#faf8f6] px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-black/75 dark:border-red-600/40 dark:bg-red-900/40">
              دعم سريع وآمن
            </div>
          </div>
        </section>

        <ComplaintsForm />
      </div>
    </div>
  );
}

