'use client';

import Link from 'next/link';
import { site } from '@/config/site';

const quickLinks = [
  { href: '/', label: 'الرئيسية' },
  { href: '/features', label: 'المميزات' },
  { href: '/download', label: 'التنزيل' },
  { href: '/about', label: 'من نحن' },
  { href: '/faq', label: 'الأسئلة الشائعة' },
];

const legalLinks = [
  { href: '/privacy', label: 'سياسة الخصوصية' },
  { href: '/terms', label: 'الشروط والأحكام' },
  { href: '/agreements', label: 'الاتفاقيات والسياسات' },
  { href: '/dmca', label: 'حقوق النشر (DMCA)' },
  { href: '/security', label: 'أمان البيانات' },
];

const serviceLinks = [
  { href: '/service-policies/verification', label: 'سياسة توثيق الحسابات' },
  { href: '/service-policies/marketplace', label: 'سياسة البيع والشراء' },
  { href: '/service-policies/real-estate', label: 'سياسة العقارات' },
  { href: '/service-policies/marriage', label: 'سياسة بيت الحلال' },
  { href: '/service-policies/charity', label: 'سياسة الصدقات' },
  { href: '/service-policies/jobs', label: 'سياسة الوظائف' },
  { href: '/service-policies/notes-sheets', label: 'سياسة المذكرات والجداول' },
  { href: '/service-policies/tools', label: 'سياسة الأدوات الإضافية' },
];

const supportLinks = [
  { href: '/help-center', label: 'مركز المساعدة' },
  { href: '/contact', label: 'اتصل بنا' },
  { href: '/report-issue', label: 'الإبلاغ عن شيء لا يعمل' },
  { href: '/complaints', label: 'شكاوى وبلاغات' },
  { href: '/deletion', label: 'طلب حذف الحساب' },
];

function SocialIcon({ name }) {
  const shared = {
    viewBox: '0 0 24 24',
    className: 'h-5 w-5',
    fill: 'currentColor',
  };

  switch (name) {
    case 'x':
      return (
        <svg {...shared}>
          <path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.9-6.2L6.5 22H2l7.4-8.6L1 2h6.3l4.4 5.6L18.9 2zm-1.1 18h1.7L6.4 3.9H4.6L17.8 20z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg {...shared}>
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.5A4.5 4.5 0 1 1 12 16a4.5 4.5 0 0 1 0-9zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zM17.8 6.2a1 1 0 1 1-1-1 1 1 0 0 1 1 1z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...shared}>
          <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.2 31.6 31.6 0 0 0 2 12a31.6 31.6 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 22 12a31.6 31.6 0 0 0-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
        </svg>
      );
    default:
      return null;
  }
}

function LinkColumn({ title, links }) {
  return (
    <div>
      <h4 className="mb-4 text-lg font-semibold text-black">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link prefetch={false} href={link.href} className="text-sm text-black/70 transition-colors hover:text-black">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const socialEntries = [
    { name: 'x', href: site.socials.x },
    { name: 'instagram', href: site.socials.instagram },
    { name: 'youtube', href: site.socials.youtube },
  ].filter((item) => item.href);

  return (
    <footer className="border-t border-black/10 bg-white py-12 text-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr,1fr,1fr,1fr]">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-red-600">دريبدو</h3>
            <p className="max-w-sm leading-8 text-black/65">
              منصة عربية حديثة للتواصل تجمع القصص والقنوات والمجموعات والدردشة في مكان واحد سريع وواضح.
            </p>
            <p className="text-sm text-black/65">
              تواصل معنا عبر:{' '}
              <a className="font-medium text-black hover:underline" href={`mailto:${site.supportEmail}`}>
                {site.supportEmail}
              </a>
            </p>

            {socialEntries.length > 0 ? (
              <div className="pt-2">
                <p className="mb-3 text-sm font-semibold text-black">المساعدة والدعم</p>
                <div className="flex items-center gap-4 text-black/65">
                  {socialEntries.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-black"
                      aria-label={social.name}
                    >
                      <SocialIcon name={social.name} />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <LinkColumn title="روابط سريعة" links={quickLinks} />
          <LinkColumn title="سياسات وقوانين" links={legalLinks} />
          <div className="space-y-8">
            <LinkColumn title="سياسات الخدمات" links={serviceLinks} />
            <LinkColumn title="مساعدة ودعم" links={supportLinks} />
          </div>
        </div>

        <div className="mt-10 border-t border-black/10 pt-8">
          <p className="text-center text-sm text-black/55">&copy; {currentYear} دريبدو. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
