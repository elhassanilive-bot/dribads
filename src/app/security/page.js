export const metadata = {
  title: 'أمان البيانات | دريبدو',
  description: 'كيف يؤمن دريبدو بيانات المستخدمين من الحسابات حتى الحوادث الأمنية عبر بنية موثوقة ومراقبة مستمرة.',
};

const lastUpdated = new Intl.DateTimeFormat('ar-MA', { dateStyle: 'long' }).format(new Date());

function Icon({ name, className = 'h-5 w-5' }) {
  const shared = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    className,
  };

  switch (name) {
    case 'shield':
      return (
        <svg {...shared}>
          <path d="M12 3 4 6v5c0 5.25 3.5 9.75 8 10 4.5-.25 8-4.75 8-10V6z" />
          <path d="M12 11v6" />
          <path d="M8 13h8" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...shared}>
          <path d="M6 11V8a6 6 0 0 1 12 0v3" />
          <rect x="6" y="11" width="12" height="9" rx="2" />
        </svg>
      );
    case 'monitor':
      return (
        <svg {...shared}>
          <rect x="4" y="5" width="16" height="11" rx="2" />
          <path d="M8 20h8" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...shared}>
          <path d="M12 2 4 6v5c0 4.5 2 8 8 10 6-2 8-6 8-10V6z" />
          <path d="M12 9v4" />
          <circle cx="12" cy="17" r="1" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...shared}>
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M4 9l8 6 8-6" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...shared}>
          <path d="M7 5h2l1 4-2 2a11 11 0 0 0 5 5l2-2 4 1v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
        </svg>
      );
    default:
      return null;
  }
}

function Section({ number, title, children }) {
  return (
    <section className="rounded-3xl border border-gray-200/60 bg-white/80 px-6 py-6 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900/70">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-[0.2em] uppercase text-gray-400">{number}</span>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </section>
  );
}

function SubSection({ label, title, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-red-600">{label}</span>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{title}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function NotePanel({ title, children }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-dashed border-gray-300/90 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-white/5">
      <Icon name="alert" className="h-6 w-6 text-red-600" />
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-white">{title}</p>
        <div className="text-sm text-gray-600 dark:text-gray-300">{children}</div>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 py-12 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <header className="space-y-4">
          <div className="flex items-center gap-4">
            <Icon name="shield" className="h-10 w-10 text-red-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-600">أمان البيانات</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">مقاربة دريبدو الشاملة لحماية البيانات</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">آخر تحديث: {lastUpdated}</p>
          <p className="max-w-3xl text-base leading-relaxed text-gray-700 dark:text-gray-300">
            في دريبدو، أمان البيانات ليس ميزة إضافية، بل جزء أساسي من تصميم النظام. من أول مرحلة في بناء المنصة تتبعنا مقاربة تقلل المخاطر، تعزل البيانات، وتضبط الوصول.
          </p>
          <p className="max-w-3xl text-base leading-relaxed text-gray-700 dark:text-gray-300">
            هذه الصفحة تشرح كيف يتم تأمين بيانات المستخدمين على مستوى البنية التقنية والتشغيل اليومي.
          </p>
        </header>

        <div className="flex flex-col gap-6">
          <Section number="1." title="مقدمة">
            <p>
              في دريبدو، أمان البيانات هو جزء أساسي من تصميم النظام وليس ميزة اختيارية. تم اعتماد مقاربة تعتمد على تقليل المخاطر، عزل البيانات، والتحكم في الوصول.
            </p>
          </Section>

          <Section number="2." title="فلسفة الأمان في دريبدو">
            <BulletList
              items={[
                'تقليل البيانات الحساسة قدر الإمكان',
                'تقليل نقاط الوصول',
                'مراقبة الأنشطة بدل الثقة المطلقة',
                'كل شيء في النظام مبني على تقليل احتمالية الخطأ قبل التعامل معه',
              ]}
            />
          </Section>

          <Section number="3." title="حماية الحسابات">
            <SubSection label="3.1" title="تسجيل الدخول">
              <BulletList
                items={[
                  'يتم تأمين تسجيل الدخول باستخدام بروتوكولات حديثة',
                  'كلمات المرور لا يتم تخزينها بشكل مباشر، بل يتم تشفيرها',
                  'يتم مراقبة محاولات الدخول المتكررة أو غير الطبيعية',
                ]}
              />
            </SubSection>
            <SubSection label="3.2" title="إدارة الجلسات">
              <BulletList
                items={[
                  'يتم إنشاء جلسات آمنة لكل مستخدم',
                  'يتم إنهاء الجلسات عند تسجيل الخروج',
                  'يتم تقليل مدة صلاحية الجلسات في الحالات الحساسة',
                ]}
              />
            </SubSection>
          </Section>

          <Section number="4." title="تشفير البيانات">
            <SubSection label="4.1" title="أثناء النقل">
              <BulletList
                items={[
                  'جميع البيانات المرسلة بين التطبيق والخوادم مشفرة باستخدام HTTPS',
                  'هذا يمنع اعتراض البيانات أثناء الاتصال',
                ]}
              />
            </SubSection>
            <SubSection label="4.2" title="أثناء التخزين">
              <BulletList
                items={[
                  'يتم تشفير البيانات الحساسة عند الحاجة',
                  'يتم فصل البيانات الحساسة عن باقي النظام',
                ]}
              />
            </SubSection>
          </Section>

          <Section number="5." title="البنية التحتية">
            <BulletList
              items={[
                'يتم استخدام خوادم موثوقة ومحمية',
                'يتم توزيع البيانات لتقليل المخاطر',
                'يتم عزل الخدمات (Auth / Storage / API)',
              ]}
            />
            <NotePanel title="الهدف">
              إذا حدث خلل في جزء، لا يؤثر على النظام بالكامل.
            </NotePanel>
          </Section>

          <Section number="6." title="التحكم في الوصول">
            <BulletList
              items={[
                'ليس كل جزء من النظام يمكنه الوصول لكل البيانات',
                'يتم تحديد صلاحيات دقيقة لكل خدمة',
                'يتم تسجيل أي محاولة وصول غير عادية',
              ]}
            />
          </Section>

          <Section number="7." title="مراقبة النظام">
            <BulletList
              items={[
                'النشاطات غير الطبيعية',
                'محاولات الاختراق',
                'الاستخدام غير المعتاد',
              ]}
            />
            <NotePanel title="استجابة سريعة">
              أي سلوك غير طبيعي يتم التعامل معه بسرعة.
            </NotePanel>
          </Section>

          <Section number="8." title="حماية المحتوى">
            <BulletList
              items={[
                'يتم تخزين الصور والفيديوهات بطريقة آمنة',
                'يتم منع الوصول غير المصرح به للملفات',
                'يتم استخدام روابط مؤقتة عند الحاجة',
              ]}
            />
          </Section>

          <Section number="9." title="الحماية من الهجمات">
            <SubSection label="9.1" title="هجمات القوة الغاشمة">
              <BulletList
                items={[
                  'تحديد عدد محاولات تسجيل الدخول',
                  'حظر مؤقت عند تجاوز الحد',
                ]}
              />
            </SubSection>
            <SubSection label="9.2" title="الهجمات الآلية (Bots)">
              <BulletList
                items={[
                  'مراقبة الأنشطة المتكررة',
                  'تقليل الطلبات المشبوهة',
                ]}
              />
            </SubSection>
            <SubSection label="9.3" title="هجمات API">
              <BulletList
                items={[
                  'تحديد عدد الطلبات (Rate Limiting)',
                  'التحقق من كل طلب',
                ]}
              />
            </SubSection>
          </Section>

          <Section number="10." title="إدارة الثغرات">
            <BulletList
              items={[
                'يتم اختبار النظام بشكل دوري',
                'يتم إصلاح الثغرات فور اكتشافها',
                'يتم تحديث النظام باستمرار',
              ]}
            />
          </Section>

          <Section number="11." title="دور المستخدم في الأمان">
            <BulletList
              items={[
                'استخدام كلمة مرور قوية',
                'عدم مشاركة الحساب',
                'تجنب الروابط المشبوهة',
                'تحديث التطبيق باستمرار',
              ]}
            />
          </Section>

          <Section number="12." title="التعامل مع الحوادث الأمنية">
            <BulletList
              items={[
                'يتم عزل الجزء المتأثر',
                'تحليل السبب',
                'إصلاح الخلل',
                'اتخاذ إجراءات لمنع التكرار',
              ]}
            />
            <NotePanel title="شبكة الإشعار">
              إذا كانت المشكلة تؤثر على المستخدمين، يتم إشعارهم.
            </NotePanel>
          </Section>

          <Section number="13." title="النسخ الاحتياطي">
            <BulletList
              items={[
                'يتم أخذ نسخ احتياطية بشكل دوري',
                'يتم تخزين النسخ في بيئة منفصلة',
                'يمكن استرجاع البيانات في حالة الطوارئ',
              ]}
            />
          </Section>

          <Section number="14." title="الخدمات الخارجية">
            <BulletList
              items={[
                'في بعض الحالات نستخدم خدمات خارجية مثل التخزين والحماية',
              ]}
            />
            <NotePanel title="اختيار دقيق">
              يتم اختيار الشركاء بعناية مع تقليل الوصول للبيانات.
            </NotePanel>
          </Section>

          <Section number="15." title="تحديثات الأمان">
            <BulletList
              items={[
                'يتم تحديث النظام بشكل مستمر',
                'أي تحديث أمني يتم تطبيقه مباشرة',
                'يتم تقليل وقت التعرض لأي خطر',
              ]}
            />
          </Section>

          <Section number="16." title="حدود الأمان">
            <p>
              بشكل واقعي، لا يوجد نظام آمن بنسبة 100%، لكننا نعمل على تقليل المخاطر، نراقب النظام بشكل دائم، ونستجيب بسرعة لأي تهديد.
            </p>
          </Section>

          <Section number="17." title="التوافق مع السياسات">
            <BulletList
              items={[
                'نظام الأمان في دريبدو يعمل بالتكامل مع سياسة الخصوصية',
                'الشروط والأحكام',
                'سياسات الاستخدام',
              ]}
            />
          </Section>

          <Section number="18." title="الشفافية">
            <p>
              نحاول إبقاء الأمور واضحة: لا ندّعي حماية مطلقة، نوضح كيف نشتغل فعلياً، ونطور النظام باستمرار.
            </p>
          </Section>

          <Section number="19." title="التواصل">
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-3">
                <Icon name="mail" className="h-6 w-6 text-red-600" />
                <a className="font-semibold text-red-600 hover:underline" href="mailto:support@dribdo.com">
                  support@dribdo.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="phone" className="h-6 w-6 text-red-600" />
                <a className="font-semibold text-red-600 hover:underline" href="tel:+212638813823">
                  +212638813823
                </a>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

