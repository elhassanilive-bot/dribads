'use client';

import { useEffect, useMemo, useState } from 'react';
import { getPopularHelpSuggestions } from '@/content/helpCenterData';

export default function FaqAccordion({ sections }) {
  const [search, setSearch] = useState('');
  const [openSectionId, setOpenSectionId] = useState(() => sections[0]?.id ?? '');
  const [openId, setOpenId] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.location.hash.replace('#', '');
  });
  const inputId = 'help-center-search';
  const searchIndex = useMemo(() => buildSearchIndex(sections), [sections]);

  const filteredSections = useMemo(() => filterSections(sections, search), [search, sections]);
  const totalMatches = filteredSections.reduce((sum, section) => sum + section.items.length, 0);
  const suggestedTerms = useMemo(() => buildSuggestions(searchIndex.terms, search), [searchIndex.terms, search]);
  const popularTerms = useMemo(() => getPopularHelpSuggestions(), []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  const handleToggle = (id) => {
    setOpenId((prev) => (prev === id ? '' : id));
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  const applySuggestion = (value) => {
    setSearch(value);
    const nextFiltered = filterSections(sections, value);
    const firstMatch = nextFiltered[0]?.items[0]?.id ?? '';
    if (firstMatch) {
      setOpenSectionId(nextFiltered[0]?.id ?? '');
      setOpenId(firstMatch);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="mx-auto max-w-3xl space-y-5 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-black/40">ابحث في كل الأقسام</p>
          <h2 className="text-3xl font-black text-black sm:text-4xl">بحث شامل في أسئلة دريبدو</h2>
          <p className="text-base leading-8 text-black/65">
            اكتب أي كلمة مثل: الرسائل، حذف الحساب، المنشورات، الفيديوهات، المجتمعات، الوظائف، أو الأعطال التقنية،
            وسيتم عرض الأسئلة الأقرب لما تبحث عنه مع اقتراحات ذكية جاهزة.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <label htmlFor={inputId} className="sr-only">بحث مركز المساعدة</label>
          <div className="relative">
            <input
              id={inputId}
              type="search"
              value={search}
              onChange={(event) => {
                const nextValue = event.target.value;
                setSearch(nextValue);
                const nextFiltered = filterSections(sections, nextValue);
                const firstMatch = nextFiltered[0]?.items[0]?.id ?? '';
                if (firstMatch) {
                  setOpenSectionId(nextFiltered[0]?.id ?? '');
                  setOpenId(firstMatch);
                }
              }}
              placeholder="ابحث عن سؤال أو ميزة أو مشكلة"
              className="w-full rounded-[1.6rem] border border-black/10 bg-[#faf8f6] px-5 py-4 pr-14 text-base text-black outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)]"
            />
            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-black/45">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {(search.trim() ? suggestedTerms : popularTerms).slice(0, 10).map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => applySuggestion(term)}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black/70 transition hover:border-black/20 hover:text-black"
              >
                {term}
              </button>
            ))}
          </div>

          <p className="mt-4 text-center text-xs uppercase tracking-[0.4em] text-black/40">{totalMatches} نتيجة مطابقة</p>
        </div>
      </section>

      {filteredSections.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-black/15 bg-white p-8 text-center text-black/65 shadow-sm">
          لم نعثر على نتائج مطابقة. جرّب كلمات أقصر أو استخدم اقتراحات البحث الجاهزة.
        </div>
      ) : null}

      <div className="space-y-8">
        {filteredSections.map((section) => (
          <section key={section.id} className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
            <button
              type="button"
              onClick={() => setOpenSectionId((prev) => (prev === section.id && !search.trim() ? '' : section.id))}
              className="flex w-full items-center justify-between gap-4 text-right"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-[#faf8f6] text-black">
                  {renderIcon(section.icon)}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/35">قسم الدعم</p>
                  <h3 className="text-2xl font-bold text-black">{section.title}</h3>
                </div>
              </div>
              <span className="text-2xl leading-none text-black/45">{search.trim() || openSectionId === section.id ? '−' : '+'}</span>
            </button>

            {(search.trim() || openSectionId === section.id) && (
              <div className="mt-6 space-y-3">
                {section.items.map((item) => (
                  <AccordionItem key={item.id} item={item} isOpen={openId === item.id} onToggle={() => handleToggle(item.id)} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function filterSections(sections, query) {
  if (!query.trim()) {
    return sections;
  }

  const term = query.trim().toLowerCase();

  return sections
    .map((section) => {
      const items = section.items.filter((item) => {
        const haystack = [item.question, item.answer, ...(item.keywords ?? [])].join(' ').toLowerCase();
        return haystack.includes(term);
      });
      return { ...section, items };
    })
    .filter((section) => section.items.length > 0);
}

function buildSearchIndex(sections) {
  const terms = new Set();

  sections.forEach((section) => {
    terms.add(section.title);
    section.items.forEach((item) => {
      item.question.split(' ').forEach((word) => {
        const normalized = word.replace(/[؟.,،]/g, '');
        if (normalized.length >= 4) {
          terms.add(normalized);
        }
      });
      (item.keywords ?? []).forEach((word) => terms.add(word));
    });
  });

  return { terms: Array.from(terms).filter(Boolean) };
}

function buildSuggestions(list, query) {
  const lower = query.trim().toLowerCase();
  if (!lower) {
    return list.slice(0, 12);
  }

  return list
    .filter((term) => term.toLowerCase().includes(lower))
    .sort((a, b) => a.length - b.length);
}

function renderIcon(name) {
  const baseProps = {
    viewBox: '0 0 24 24',
    className: 'h-5 w-5',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
  };

  switch (name) {
    case 'user':
      return <svg {...baseProps}><circle cx="12" cy="8" r="4" /><path d="M6 20c0-3.5 3.5-6 6-6s6 2.5 6 6" /></svg>;
    case 'shield':
      return <svg {...baseProps}><path d="M12 3 4 6v5c0 5.25 3.5 9.75 8 10 4.5-.25 8-4.75 8-10V6z" /><path d="M9 12h6" /><path d="M12 9v6" /></svg>;
    case 'message':
      return <svg {...baseProps}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M8 11h8M8 15h6" /></svg>;
    case 'sparkles':
      return <svg {...baseProps}><path d="M12 2v4M12 18v4M4.5 9.5h4M15.5 9.5h4" /><circle cx="12" cy="12" r="2" /></svg>;
    case 'users':
      return <svg {...baseProps}><circle cx="8" cy="8.5" r="3" /><circle cx="16" cy="9.5" r="2.5" /><path d="M3.5 19c.8-2.7 3.1-4.5 6.5-4.5s5.7 1.8 6.5 4.5" /></svg>;
    case 'cog':
      return <svg {...baseProps}><circle cx="12" cy="12" r="3" /><path d="M4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" /></svg>;
    case 'refresh':
      return <svg {...baseProps}><path d="M4 7a8 8 0 1 1 2.1 12" /><polyline points="4 7 4 3 8 3" /></svg>;
    case 'bug':
      return <svg {...baseProps}><rect x="7" y="6" width="10" height="12" rx="3" /><path d="M9 6V4M15 6V4M9 18v2M15 18v2M3 12h18" /></svg>;
    default:
      return <svg {...baseProps}><circle cx="12" cy="12" r="1" /><path d="M12 6v2M12 16v2" /></svg>;
  }
}

function AccordionItem({ item, isOpen, onToggle }) {
  return (
    <div id={item.id} className={`rounded-[1.5rem] border bg-[#fcfbf9] transition ${isOpen ? 'border-black/20' : 'border-black/10'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-right"
        aria-expanded={isOpen}
      >
        <span className="text-base font-semibold leading-7 text-black">{item.question}</span>
        <span className="text-2xl leading-none text-black/55">{isOpen ? '−' : '+'}</span>
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden px-5">
          <p className="text-sm leading-8 text-black/65">{item.answer}</p>
          <div className="pb-5" />
        </div>
      </div>
    </div>
  );
}
