export const metadata = {
  title: 'مميزات دريبدو',
  description: 'استكشف أقسام دريبدو بتصميم واضح وأيقونات سوداء بسيطة من دون خلفيات ملوّنة.',
  alternates: { canonical: '/features' },
};

const featureSections = [
  {
    title: 'الرئيسية',
    description: 'تجمع المنشورات والصور والفيديو في تجربة موحّدة أسهل للقراءة والتحكم.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
        <path d="M3 11.5 12 4l9 7.5V21H3z" />
      </svg>
    ),
  },
  {
    title: 'الصور',
    description: 'شبكة صور منظّمة تبرز المحتوى البصري من دون ازدحام في العناصر المحيطة.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8" cy="9" r="1.5" />
        <path d="m3 20 4-5 3 4 4-6 5 7" />
      </svg>
    ),
  },
  {
    title: 'الفيديو',
    description: 'محتوى الفيديو يظهر في بطاقات نظيفة مع انتقالات أكثر هدوءًا وسرعة.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="m10 9 6 3-6 3z" />
      </svg>
    ),
  },
  {
    title: 'الاستكشاف',
    description: 'منطقة مخصصة للعثور على أشخاص وموضوعات جديدة بترتيب بصري أوضح.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
        <circle cx="12" cy="12" r="9" />
        <path d="m16 8-4 8-4-4 8-4z" />
      </svg>
    ),
  },
  {
    title: 'المجموعات',
    description: 'تجربة مجتمعات أسهل للمتابعة والنقاش وإدارة المشاركات.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
        <path d="M4 17v-2a4 4 0 0 1 4-4h1" />
        <path d="M20 17v-2a4 4 0 0 0-4-4h-1" />
        <path d="M12 11a4 4 0 1 0-4-4" />
        <path d="M6 21a6 6 0 0 1 12 0" />
      </svg>
    ),
  },
  {
    title: 'القنوات',
    description: 'واجهة تناسب الناشرين وصنّاع المحتوى والعلامات التجارية.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
        <path d="M3 7c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6 3V7z" />
        <path d="m14 12 6-3-6-3z" />
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <div className="min-h-screen bg-[#f6f2ef] py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 space-y-5 text-right">
          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-black/35">المميزات</p>
          <h1 className="text-4xl font-black text-black sm:text-5xl">أقسام دريبدو بواجهة أخف وأيقونات سوداء صافية</h1>
          <p className="max-w-3xl text-lg leading-8 text-black/65">
            تم تبسيط العرض البصري في هذه الصفحة حتى تبرز الأقسام نفسها، من دون دوائر ملوّنة أو خلفيات زائدة حول الأيقونات.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureSections.map((feature) => (
            <article key={feature.title} className="rounded-[30px] border border-black/10 bg-white p-7 text-right shadow-sm">
              <div className="text-black">{feature.icon}</div>
              <h2 className="mt-5 text-2xl font-bold text-black">{feature.title}</h2>
              <p className="mt-3 text-base leading-8 text-black/65">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
