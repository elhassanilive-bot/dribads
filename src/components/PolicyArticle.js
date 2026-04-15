import PolicyIcon from './PolicyIcon';

function SectionCard({ section }) {
  return (
    <section className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-black/35">{section.index}</span>
        <h2 className="text-2xl font-bold text-black">{section.title}</h2>
      </div>

      <div className="mt-5 space-y-4 text-base leading-8 text-black/75">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {section.bullets?.length ? (
        <ul className="mt-5 space-y-3">
          {section.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3 text-black/75">
              <span className="mt-2 h-2.5 w-2.5 rounded-full bg-black shrink-0" />
              <span className="leading-7">{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default function PolicyArticle({ icon, eyebrow, title, description, highlights, sections, supportEmail }) {
  return (
    <div className="min-h-screen bg-[#f7f5f1] py-12 text-black">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6">
        <header className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-black/10 p-3 text-black">
              <PolicyIcon name={icon} className="h-8 w-8" />
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.45em] text-black/45">{eyebrow}</p>
              <h1 className="text-3xl font-bold leading-tight sm:text-5xl">{title}</h1>
              <p className="max-w-4xl text-base leading-8 text-black/70 sm:text-lg">{description}</p>
            </div>
          </div>

          {highlights?.length ? (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {highlights.map((highlight) => (
                <div key={highlight.title} className="rounded-3xl border border-black/10 bg-[#faf8f6] p-5">
                  <p className="text-sm font-semibold text-black">{highlight.title}</p>
                  <p className="mt-2 text-sm leading-7 text-black/65">{highlight.text}</p>
                </div>
              ))}
            </div>
          ) : null}
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            {sections.map((section, index) => (
              <SectionCard key={section.title} section={{ ...section, index: `${index + 1}.` }} />
            ))}
          </div>

          <aside className="space-y-6 rounded-[2rem] border border-black/10 bg-white p-8 shadow-sm lg:sticky lg:top-24 lg:self-start">
            <div className="flex items-center gap-3">
              <PolicyIcon name={icon} className="h-6 w-6 text-black" />
              <h2 className="text-xl font-bold text-black">مبادئ التطبيق في هذا القسم</h2>
            </div>
            <div className="space-y-3 text-sm leading-7 text-black/70">
              <p>نعتمد في دريبدو على وضوح القواعد قبل تفعيل الميزات، حتى يعرف المستخدم ما هو المسموح وما هو غير المسموح.</p>
              <p>كل سياسات الخدمات هنا مرتبطة بحماية المجتمع، تقليل إساءة الاستخدام، ومساعدة الأفراد والجهات على استخدام الأدوات المتخصصة بثقة أكبر.</p>
              <p>عند وجود بلاغ أو نزاع أو طلب توضيح، نراجع الحالة وفق البيانات المتوفرة وسجل الاستخدام والسياسات المرتبطة بهذه الصفحة.</p>
            </div>

            <div className="rounded-3xl border border-black/10 bg-[#faf8f6] p-5">
              <div className="flex items-center gap-2">
                <PolicyIcon name="mail" className="h-5 w-5 text-black" />
                <p className="text-sm font-semibold text-black">قناة التواصل الرسمية</p>
              </div>
              <a href={`mailto:${supportEmail}`} className="mt-3 block text-sm text-black/75 hover:underline">
                {supportEmail}
              </a>
              <p className="mt-3 text-sm leading-7 text-black/65">
                إذا كانت حالتك تتعلق بمشكلة حساسة أو تحتاج مراجعة يدوية، يمكنك استخدام صفحة التواصل أو البلاغات مع الإشارة إلى اسم القسم ورابط المحتوى أو الحساب.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
