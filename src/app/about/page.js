export const metadata = {
  title: 'من نحن',
  description: 'تعرف على دريبدو، رؤيتنا، ما الذي نقدمه، ولماذا تم بناء المنصة بهذا الشكل.',
  alternates: { canonical: '/about' },
};

const principles = [
  {
    title: 'منصة اجتماعية شاملة',
    text: 'دريبدو ليس مجرد صفحة رئيسية ومنشورات، بل منصة تجمع النشر، الفيديوهات، الدردشة، المجتمعات، المساحات، والخدمات الإضافية في تجربة واحدة.',
  },
  {
    title: 'وضوح في التجربة',
    text: 'نركز على الواجهة الواضحة وتقليل التشتيت، حتى يعرف المستخدم أين يذهب وماذا يفعل دون ازدحام بصري أو تعقيد غير ضروري.',
  },
  {
    title: 'مرونة في المحتوى',
    text: 'ندعم المنشورات النصية، الصور، الفيديوهات، التسجيلات الصوتية، المستندات، القصص، والبث المباشر ضمن منظومة واحدة متماسكة.',
  },
  {
    title: 'أقسام تخدم الحياة اليومية',
    text: 'إلى جانب التواصل، يحتوي دريبدو على السوق، الوظائف، العقارات، بيت الحلال، الصدقات، المذكرات، الجداول، وأدوات أخرى مساندة.',
  },
];

const sections = [
  {
    eyebrow: 'فكرة المنتج',
    title: 'لماذا تم إنشاء دريبدو؟',
    text: 'ولد دريبدو من فكرة واضحة: كثير من المستخدمين يحتاجون إلى أكثر من تجربة اجتماعية تقليدية، لكنهم يضطرون للتنقل بين تطبيقات كثيرة من أجل النشر، الفيديو، الرسائل، المجتمعات، والخدمات اليومية. لذلك جاء دريبدو ليجمع هذه العناصر داخل منتج واحد أكثر ترتيبًا ووضوحًا، مع اهتمام بالهوية العربية وسهولة الاستخدام.',
  },
  {
    eyebrow: 'ما الذي نقدمه',
    title: 'منتج واحد لسيناريوهات متعددة',
    text: 'داخل دريبدو يستطيع المستخدم نشر منشورات صورية ونصية وفيديو وصوت ومستندات، وإنشاء القصص، واستهلاك الفيديوهات بشكل تسلسلي، والتحدث عبر الدردشة الفردية والجماعية، وإدارة ملفه وإشعاراته وطلباته. كما يمكنه أيضًا استخدام أقسام متخصصة مثل المساحات والمجتمعات والعقارات والوظائف والسوق وبيت الحلال والصدقات والمذكرات والجداول.',
  },
  {
    eyebrow: 'رؤيتنا',
    title: 'تجربة عربية حديثة لا تنسى الوضوح',
    text: 'رؤيتنا هي بناء منصة عربية حديثة توازن بين كثرة الإمكانات وسهولة الوصول. نحن لا نريد مجرد إضافة مزايا كثيرة، بل نريد أن تبقى هذه المزايا مفهومة ومنظمة وقابلة للاستخدام الفعلي من طرف أشخاص مختلفين: مستخدم عادي، صانع محتوى، علامة تجارية، مجتمع، أو شخص يبحث عن خدمة محددة داخل التطبيق.',
  },
  {
    eyebrow: 'التزامنا',
    title: 'تحسين مستمر واحترام للمستخدم',
    text: 'نلتزم بتحسين المنتج تدريجيًا، وتبسيط مسارات الاستخدام، وتطوير صفحات الدعم والخصوصية والسياسات، مع احترام المستخدم العربي من حيث اللغة والتجربة والوضوح. كما نعتبر أن جودة المنتج لا تقتصر على الواجهة فقط، بل تشمل أيضًا الأمان، الشفافية، وإمكانية فهم النظام من الداخل إلى الخارج.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f7f5f1] text-black">
      <section className="border-b border-black/8">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6 text-right">
              <p className="text-sm font-semibold uppercase tracking-[0.45em] text-black/35">من نحن</p>
              <h1 className="text-5xl font-black leading-tight text-black sm:text-6xl">دريبدو منصة اجتماعية عربية حديثة تجمع أكثر من تجربة في مكان واحد</h1>
              <p className="max-w-3xl text-lg leading-8 text-black/65">
                دريبدو مشروع يركز على جعل التواصل، النشر، الفيديو، الدردشة، المجتمعات، والخدمات اليومية أقرب إلى
                المستخدم عبر هيكل واضح وتجربة أخف وأكثر تنظيمًا.
              </p>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-black/35">ملخص سريع</p>
              <div className="mt-6 space-y-4">
                {principles.map((item) => (
                  <article key={item.title} className="rounded-[1.5rem] bg-[#faf8f6] p-5">
                    <h2 className="text-lg font-bold text-black">{item.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-black/65">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-black/35">{section.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-black text-black">{section.title}</h2>
              <p className="mt-4 max-w-5xl text-base leading-8 text-black/65">{section.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-black/8 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <article className="rounded-[2rem] border border-black/10 bg-[#faf8f6] p-8">
              <h3 className="text-2xl font-black text-black">ماذا يميزنا؟</h3>
              <p className="mt-4 text-base leading-8 text-black/65">
                السعي إلى بناء منصة اجتماعية واسعة بدون أن تصبح التجربة نفسها مشتتة أو مرهقة في الاستخدام.
              </p>
            </article>
            <article className="rounded-[2rem] border border-black/10 bg-[#faf8f6] p-8">
              <h3 className="text-2xl font-black text-black">لمن صمم دريبدو؟</h3>
              <p className="mt-4 text-base leading-8 text-black/65">
                للمستخدم اليومي، وصناع المحتوى، والعلامات التجارية، والمجتمعات، وكل شخص يريد منصة تجمع التواصل والخدمات معًا.
              </p>
            </article>
            <article className="rounded-[2rem] border border-black/10 bg-[#faf8f6] p-8">
              <h3 className="text-2xl font-black text-black">كيف تتواصل معنا؟</h3>
              <p className="mt-4 text-base leading-8 text-black/65">
                عبر صفحات الدعم الرسمية داخل الموقع أو من خلال البريد:
                {' '}
                <a href="mailto:support@dribdo.com" className="font-semibold text-black hover:underline">
                  support@dribdo.com
                </a>
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
