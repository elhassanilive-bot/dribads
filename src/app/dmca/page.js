export const metadata = {
  title: 'سياسة حقوق النشر (DMCA) | دريبدو',
  description: 'إجراءات دريبدو للتعامل مع إشعارات التعدي على حقوق النشر، الإشعار المضاد، والتكرار.',
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
    case 'document':
      return (
        <svg {...shared}>
          <path d="M6 3h7l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          <path d="M13 3v4h4" />
          <path d="M9 11h6" />
          <path d="M9 15h6" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...shared}>
          <path d="M12 3 4 6v5c0 5.25 3.5 9.75 8 10 4.5-.25 8-4.75 8-10V6z" />
          <path d="M12 11v6" />
          <path d="M8 13h8" />
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
      <Icon name="shield" className="h-6 w-6 text-red-600" />
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-white">{title}</p>
        <div className="text-sm text-gray-600 dark:text-gray-300">{children}</div>
      </div>
    </div>
  );
}

export default function DmcaPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 py-12 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4">
        <header className="space-y-4">
          <div className="flex items-center gap-4">
            <Icon name="document" className="h-10 w-10 text-red-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-600">سياسة حقوق النشر (DMCA)</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">إجراءات دريبدو تجاه انتهاكات حقوق النشر</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">آخر تحديث: {lastUpdated}</p>
          <p className="max-w-3xl text-base leading-relaxed text-gray-700 dark:text-gray-300">
            في دريبدو، نحترم حقوق الملكية الفكرية ونتعامل مع انتهاكات حقوق النشر بشكل جدي. هذه السياسة تشرح كيفية التعامل مع المحتوى الذي قد
            ينتهك حقوق الطبع والنشر، والإجراءات المتبعة عند تقديم شكوى، وفق مبادئ قانون DMCA مع تكييفها لمنصة دريبدو.
          </p>
        </header>

        <div className="flex flex-col gap-6">
          <Section number="1." title="مقدمة">
            <p>
              تم إعداد هذه الصفحة وفق مبادئ قانون Digital Millennium Copyright Act (DMCA)، مع تكييفها لتناسب طبيعة منصة دريبدو.
            </p>
          </Section>

          <Section number="2." title="احترام حقوق النشر">
            <BulletList
              items={[
                'نشر محتوى يملكون حقوقه أو لديهم إذن لاستخدامه',
                'عدم إعادة نشر محتوى محمي بدون تصريح',
                'احترام حقوق المبدعين والجهات المالكة للمحتوى',
              ]}
            />
            <NotePanel title="تنبيه الحقوق">
              أي انتهاك قد يؤدي إلى حذف المحتوى أو اتخاذ إجراءات على الحساب.
            </NotePanel>
          </Section>

          <Section number="3." title="أنواع الانتهاكات">
            <BulletList
              items={[
                'إعادة نشر فيديوهات أو صور بدون إذن',
                'استخدام محتوى محمي (موسيقى، صور، نصوص) بدون ترخيص',
                'انتحال أعمال إبداعية ونسبها لنفسك',
                'إعادة رفع محتوى تمت إزالته سابقاً بسبب انتهاك',
              ]}
            />
          </Section>

          <Section number="4." title="كيفية تقديم إشعار DMCA">
            <BulletList
              items={[
                'اسمك الكامل ومعلومات الاتصال',
                'وصف دقيق للمحتوى المحمي',
                'رابط المحتوى داخل دريبدو',
                'تصريح بأنك المالك أو مخول قانونياً',
                'تصريح بأن المعلومات المقدمة صحيحة',
                'توقيع إلكتروني أو اسمك الكامل',
              ]}
            />
            <NotePanel title="سرعة المعالجة">
              يجب أن تكون المعلومات واضحة لتسريع المعالجة.
            </NotePanel>
          </Section>

          <Section number="5." title="معالجة الشكاوى">
            <BulletList
              items={[
                'يتم مراجعة الطلب تقنياً',
                'قد يتم إزالة المحتوى مؤقتاً أو نهائياً',
                'يتم إشعار المستخدم الذي نشر المحتوى',
              ]}
            />
            <NotePanel title="في الحالات الواضحة">
              يتم الحذف مباشرة بدون تأخير.
            </NotePanel>
          </Section>

          <Section number="6." title="الإشعار المضاد">
            <BulletList
              items={[
                'معلوماتك الكاملة',
                'رابط المحتوى المحذوف',
                'توضيح سبب الاعتراض',
                'تصريح بأنك تعتقد بحسن نية أن الحذف كان خطأ',
              ]}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              سيتم مراجعة الطلب وقد يتم إعادة المحتوى إذا كان مبرراً.
            </p>
          </Section>

          <Section number="7." title="سياسة التكرار">
            <BulletList
              items={[
                'الحسابات التي تقوم بانتهاك حقوق النشر بشكل متكرر قد تتعرض لتقييد الميزات',
                'قد يتم تعليق الحساب',
                'قد يتم حذف الحساب نهائياً',
              ]}
            />
          </Section>

          <Section number="8." title="مسؤولية المستخدم">
            <BulletList
              items={[
                'المستخدم مسؤول بالكامل عن المحتوى الذي ينشره',
                'التأكد من امتلاكه للحقوق',
                'عدم انتهاك قوانين الملكية الفكرية',
              ]}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              دريبدو لا يتحمل مسؤولية المحتوى الذي ينشره المستخدمون، لكنه يتدخل عند التبليغ.
            </p>
          </Section>

          <Section number="9." title="دور دريبدو">
            <BulletList
              items={[
                'دريبدو يوفر منصة لنشر المحتوى',
                'لا يقوم بمراجعة كل المحتوى مسبقاً',
                'يعتمد على التبليغات لاكتشاف الانتهاكات',
              ]}
            />
            <NotePanel title="نهج عملي">
              هذا نهج عملي في الأنظمة الكبيرة.
            </NotePanel>
          </Section>

          <Section number="10." title="المحتوى المتكرر">
            <BulletList
              items={[
                'في حالة إعادة نشر محتوى تمت إزالته، يتم حذف المحتوى مباشرة',
                'قد يتم اتخاذ إجراء أسرع على الحساب',
              ]}
            />
          </Section>

          <Section number="11." title="المحتوى المسموح باستخدامه">
            <BulletList
              items={[
                'المحتوى المرخص',
                'المحتوى المستخدم بإذن',
                'الاستخدام العادل (حسب القوانين المعمول بها)',
              ]}
            />
          </Section>

          <Section number="12." title="مدة المعالجة">
            <BulletList
              items={[
                'تتم مراجعة الطلبات في أقرب وقت ممكن',
                'الوقت يختلف حسب وضوح الشكوى',
              ]}
            />
            <NotePanel title="مستند كامل">
              الطلبات غير المكتملة قد يتم تجاهلها.
            </NotePanel>
          </Section>

          <Section number="13." title="إساءة استخدام النظام">
            <BulletList
              items={[
                'أي شخص يقدم بلاغات كاذبة أو مضللة قد يتم تجاهل طلباته',
                'قد يتم اتخاذ إجراءات على حسابه',
              ]}
            />
          </Section>

          <Section number="14." title="التعديلات على السياسة">
            <p>
              قد يتم تحديث هذه السياسة حسب الحاجة القانونية أو التقنية. استمرار استخدام المنصة يعني قبول التحديثات.
            </p>
          </Section>

          <Section number="15." title="التواصل">
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

