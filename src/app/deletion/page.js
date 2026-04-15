import DeletionForm from './DeletionForm';

export const metadata = {
  title: 'طلب حذف الحساب | دريبدو',
  description: 'أرسل طلب حذف نهائي لحسابك عبر واجهة آمنة مع شرح العواقب والحماية.',
  alternates: { canonical: '/deletion' },
};

export default function DeletionPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <section className="space-y-6 rounded-3xl border border-black/10 bg-white p-10 shadow-sm dark:from-gray-900 dark:to-gray-800">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/45">طلب حذف الحساب</p>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">طلب حذف الحساب</h1>
          <p className="max-w-3xl text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            يمكنك من خلال هذه الصفحة إرسال طلب حذف نهائي لحسابك في دريبدو. نُراجع الطلبات بحرص ونرسل تأكيدًا بعد مراجعة التفاصيل.
          </p>
          <div className="rounded-3xl border border-black/10 bg-[#faf8f6] p-6 text-sm text-black/75 shadow-inner dark:border-red-500/60 dark:bg-red-950/40 dark:text-red-200">
            <p className="font-semibold text-base">تنبيه واضح</p>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed">
              <li>حذف الحساب نهائي ولا يمكن التراجع عنه.</li>
              <li>سيتم حذف المنشورات، الصور، الفيديوهات، الرسائل، والتفاعلات.</li>
              <li>قد يستغرق تنفيذ الطلب عدة أيام بعد التحقق.</li>
            </ul>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <DeletionForm />
          <aside className="space-y-6 rounded-3xl border border-black/10 bg-[#faf8f6] p-8 text-gray-700 shadow-sm dark:from-gray-900 dark:to-gray-950 dark:text-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">معلومات مهمة</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              استخدم هذه الصفحة عندما ترغب في الحذف النهائي للحساب أو إغلاقه بعد مراجعة الهوية. نطلب معلومات دقيقة لتجنب أي طلبات غير مصرح بها.
            </p>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <span className="text-black">✉</span>
                <a href="mailto:support@dribdo.com" className="font-semibold text-black hover:underline">
                  support@dribdo.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-black">◼</span>
                +212638813823
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.4em] text-black/45">حماية الطلبات</p>
          </aside>
        </div>
      </div>
    </div>
  );
}

