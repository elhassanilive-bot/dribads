'use client';

import Link from 'next/link';
import { useState } from 'react';

const links = [
  { href: '/', label: 'الرئيسية' },
  { href: '/features', label: 'المميزات' },
  { href: '/blog', label: 'المدونة' },
  { href: '/download', label: 'التحميل' },
  { href: '/admin', label: 'الإدارة' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-right">
          <span className="text-xs font-semibold uppercase tracking-[0.45em] text-black/45">Dribdo</span>
          <span className="text-2xl font-black text-black">دريبدو</span>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-2 py-2 md:flex">
          {links.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/download"
            className="hidden rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-800 md:inline-flex"
          >
            حمّل التطبيق
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-black transition hover:bg-black/5 md:hidden"
            aria-label={isOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={isOpen}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-black/10 bg-white px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {links.map((link) => (
              <NavLinkMobile key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                {link.label}
              </NavLinkMobile>
            ))}
            <Link
              href="/download"
              onClick={() => setIsOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-red-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-800"
            >
              حمّل التطبيق
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children }) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-2 text-sm font-semibold text-black/70 transition hover:bg-white hover:text-black"
    >
      {children}
    </Link>
  );
}

function NavLinkMobile({ href, children, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-2xl border border-black/10 px-4 py-3 text-right text-base font-semibold text-black transition hover:bg-black/5"
    >
      {children}
    </Link>
  );
}
