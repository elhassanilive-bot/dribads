import Link from 'next/link';

export const metadata = {
  title: 'الاتفاقيات والسياسات | دريبدو',
  description: 'كل الاتفاقيات والسياسات التي تحكم استخدام منصة دريبدو، بدءاً من الاستخدام والمحتوى وصولاً إلى الخصوصية والأمان.',
};

const lastUpdated = new Intl.DateTimeFormat('ar-MA', { dateStyle: 'long' }).format(new Date());

function Icon({ name, className = 'h-5 w-5' }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    className,
  };

  switch (name) {
    case 'document':
      return (
        <svg {...commonProps}>
          <path d="M6 3h7l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          <path d="M13 3v4h4" />
          <path d="M9 11h6" />
          <path d="M9 15h6" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...commonProps}>
          <path d="M12 3c3.866 0 7 3.134 7 7 0 4.636-3.921 9.643-6.17 12.221a1 1 0 0 1-1.66 0C8.921 19.643 5 14.636 5 10c0-3.866 3.134-7 7-7z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...commonProps}>
          <path d="M12 3 4 6v5c0 5.25 3.5 9.75 8 10 4.5-.25 8-4.75 8-10V6z" />
          <path d="M12 11v6" />
          <path d="M8 13h8" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...commonProps}>
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M4 9l8 6 8-6" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...commonProps}>
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
      <Icon name="pin" className="h-6 w-6 text-red-600" />
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-white">{title}</p>
        <div className="text-sm text-gray-600 dark:text-gray-300">{children}</div>
      </div>
    </div>
  );
}

export default function AgreementsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 py-12 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <header className="space-y-4">
          <div className="flex items-center gap-4">
            <Icon name="document" className="h-10 w-10 text-red-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-600">الاتفاقيات والسياسات</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">كل ما تحتاج معرفته قبل استخدام دريبدو</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">آخر تحديث: {lastUpdated}</p>
          <p className="max-w-3xl text-base leading-relaxed text-gray-700 dark:text-gray-300">
            هذه الصفحة تجمع جميع الاتفاقيات والسياسات التي تحكم استخدام منصة دريبدو. الهدف منها هو توضيح القواعد العامة التي يعتمد
            عليها النظام لضمان تجربة مستقرة، آمنة، وعادلة لجميع المستخدمين.
          </p>
          <p className="max-w-3xl text-base leading-relaxed text-gray-700 dark:text-gray-300">
            دريبدو ليس مجرد تطبيق، بل نظام متكامل فيه تفاعل، محتوى، وبيانات، لذلك تم وضع هذه السياسات لتنظيم كل هذه الجوانب بشكل واضح.
          </p>
        </header>

        <div className="flex flex-col gap-6">
          <Section number="1." title="نظرة عامة">
            <p className="text-gray-700 dark:text-gray-300">
              ملفات الاتفاقيات والسياسات تجمع المتطلبات القانونية والتنظيمية للتعامل مع المحتوى والاقتصاد الرقمي لدريبدو.
            </p>
          </Section>

          <Section number="2." title="اتفاقية استخدام المنصة">
            <BulletList
              items={[
                'احترام جميع القوانين المعمول بها',
                'عدم استخدام المنصة لأغراض ضارة أو غير قانونية',
                'عدم محاولة استغلال النظام أو التلاعب به',
              ]}
            />
            <NotePanel title="تنبيه حول الحساب">
              أي استخدام خارج هذا الإطار قد يؤدي إلى تقييد الحساب أو إيقافه.
            </NotePanel>
          </Section>

          <Section number="3." title="سياسة المحتوى">
            <SubSection label="3.1" title="المحتوى المسموح">
              <BulletList
                items={['منشورات نصية', 'صور وفيديوهات', 'محتوى ترفيهي أو تعليمي', 'آراء شخصية']}
              />
            </SubSection>
            <SubSection label="3.2" title="المحتوى غير المسموح">
              <BulletList
                items={[
                  'المحتوى المخالف للقانون',
                  'التحريض على العنف أو الكراهية',
                  'المحتوى المضلل أو المزيف',
                  'انتهاك حقوق الآخرين',
                ]}
              />
            </SubSection>
            <SubSection label="3.3" title="إدارة المحتوى">
              <BulletList
                items={[
                  'يمكن للنظام أو فريق الإشراف حذف أي محتوى مخالف',
                  'بعض المحتوى قد يتم تقليص انتشاره بدلاً من حذفه',
                  'يمكن للمستخدمين الإبلاغ عن أي محتوى',
                ]}
              />
            </SubSection>
          </Section>

          <Section number="4." title="سياسة النشر">
            <BulletList
              items={[
                'تم تصميم نظام النشر في دريبدو ليكون مرن: يمكنك نشر صور، فيديوهات، GIF، واستطلاعات',
                'يمكنك الإشارة إلى المستخدمين أو إضافة موقع',
                'يمكنك تمييز المنشورات (ذكاء اصطناعي / محتوى حساس)',
              ]}
            />
            <NotePanel title="المسؤولية">
              أي منشور تقوم به هو مسؤوليتك الشخصية.
            </NotePanel>
          </Section>

          <Section number="5." title="سياسة التفاعل">
            <SubSection label="5.1" title="التفاعل المقبول">
              <BulletList
                items={['التعليقات المحترمة', 'النقاش البناء', 'التفاعل الإيجابي']}
              />
            </SubSection>
            <SubSection label="5.2" title="التفاعل غير المقبول">
              <BulletList
                items={['السب أو الإهانة', 'التحرش أو المضايقة', 'نشر روابط مزعجة (Spam)']}
              />
            </SubSection>
            <NotePanel title="عقوبات السلوك غير المقبول">
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>حظر مؤقت</li>
                <li>حظر دائم</li>
              </ul>
            </NotePanel>
          </Section>

          <Section number="6." title="سياسة الحسابات">
            <SubSection label="6.1" title="الحسابات المسموح بها">
              <BulletList items={['حساب شخصي حقيقي', 'حساب لمشروع أو قناة']} />
            </SubSection>
            <SubSection label="6.2" title="الحسابات غير المسموح بها">
              <BulletList
                items={['الحسابات الوهمية أو المزيفة', 'انتحال شخصية شخص آخر', 'الحسابات الآلية (Bots) بدون تصريح']}
              />
            </SubSection>
            <SubSection label="6.3" title="إدارة الحساب">
              <BulletList
                items={['يحق لدريبدو تعليق الحساب', 'حذفه', 'تقييد بعض الميزات']}
              />
            </SubSection>
          </Section>

          <Section number="7." title="سياسة الخصوصية (ملخص)">
            <BulletList
              items={['نحترم بيانات المستخدمين', 'لا نبيع المعلومات لأي جهة', 'يتم استخدام البيانات فقط لتحسين الخدمة']}
            />
            <NotePanel title="المزيد">
              التفاصيل الكاملة موجودة في صفحة{' '}
              <Link className="font-semibold text-red-600 hover:underline" href="/privacy">
                سياسة الخصوصية
              </Link>
              .
            </NotePanel>
          </Section>

          <Section number="8." title="سياسة الأمان">
            <BulletList
              items={['حماية تسجيل الدخول', 'مراقبة الأنشطة المشبوهة', 'تقليل محاولات الاختراق']}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              لكن: لا يوجد نظام آمن بنسبة 100%، لذلك المستخدم مسؤول أيضاً عن حماية حسابه.
            </p>
          </Section>

          <Section number="9." title="سياسة الحظر والإبلاغ">
            <BulletList
              items={['حظر المستخدمين', 'الإبلاغ عن المحتوى', 'إخفاء المنشورات']}
            />
            <NotePanel title="عند الإبلاغ">
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>يتم مراجعة الحالة</li>
                <li>اتخاذ القرار حسب المخالفة</li>
              </ul>
            </NotePanel>
          </Section>

          <Section number="10." title="سياسة القنوات والمجموعات">
            <SubSection label="القنوات" title="نوع الاستخدام">
              <BulletList
                items={['مخصصة لصناع المحتوى والعلامات التجارية', 'يجب احترام قوانين النشر']}
              />
            </SubSection>
            <SubSection label="المجموعات" title="إدارة المجتمع">
              <BulletList
                items={['يمكن إنشاؤها بحرية', 'صاحب المجموعة مسؤول عن إدارتها']}
              />
            </SubSection>
          </Section>

          <Section number="11." title="سياسة الفيديو والمحتوى المرئي">
            <BulletList
              items={[
                'عرض الفيديوهات يتم بشكل منظم (Feed + تسلسلي)',
                'يمنع نشر فيديوهات مخالفة',
                'يمكن تقييد أو حذف الفيديو',
              ]}
            />
          </Section>

          <Section number="12." title="سياسة الإشعارات">
            <BulletList
              items={['يتم إرسال إشعارات للتفاعلات والتحديثات', 'يمكن التحكم فيها من الإعدادات']}
            />
          </Section>

          <Section number="13." title="سياسة التحديثات">
            <BulletList
              items={[
                'دريبدو قد يضيف أو يغير ميزات في أي وقت',
                'يتم تحديث السياسات حسب الحاجة',
                'استمرار الاستخدام يعني الموافقة',
              ]}
            />
          </Section>

          <Section number="14." title="سياسة الخدمات الخارجية">
            <BulletList
              items={['قد يعتمد التطبيق على خدمات مثل التخزين والحماية']}
            />
            <NotePanel title="حدود المشاركة">
              لكن بدون مشاركة بيانات غير ضرورية.
            </NotePanel>
          </Section>

          <Section number="15." title="سياسة الأداء والاستخدام العادل">
            <BulletList
              items={['يمنع الاستخدام المفرط أو غير الطبيعي', 'يمنع استغلال الثغرات', 'يتم مراقبة الأداء بشكل عام']}
            />
          </Section>

          <Section number="16." title="المسؤولية القانونية">
            <BulletList
              items={[
                'المستخدم مسؤول عن المحتوى الذي ينشره',
                'دريبدو غير مسؤول عن تصرفات المستخدمين',
                'أي مخالفة قد تعرض المستخدم للمساءلة القانونية',
              ]}
            />
          </Section>

          <Section number="17." title="إنهاء الخدمة">
            <BulletList
              items={['يمكن للمستخدم حذف حسابه', 'لدريبدو إيقاف الحساب المخالف']}
            />
          </Section>

          <Section number="18." title="التوافق مع القوانين">
            <BulletList
              items={['دريبدو يعمل على احترام القوانين العامة', 'حماية المستخدمين', 'توفير بيئة آمنة']}
            />
          </Section>

          <Section number="19." title="خلاصة">
            <p>
              هذه السياسات ليست مجرد قواعد، بل هي أساس عمل المنصة. الهدف هو خلق بيئة آمنة، منظمة، وعادلة.
            </p>
            <BulletList items={['آمنة', 'منظمة', 'عادلة']} />
          </Section>

          <Section number="20." title="التواصل">
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

