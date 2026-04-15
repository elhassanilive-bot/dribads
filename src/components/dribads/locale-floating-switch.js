"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function LocaleFloatingSwitch({ locale, labelAr, labelEn }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fullPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const arHref = `/api/lang?lang=ar&redirect=${encodeURIComponent(fullPath)}`;
  const enHref = `/api/lang?lang=en&redirect=${encodeURIComponent(fullPath)}`;

  return (
    <div className="dribads-locale-floating" role="group" aria-label="Language switch">
      <a href={arHref} className={locale === "ar" ? "is-active" : ""}>
        {labelAr}
      </a>
      <a href={enHref} className={locale === "en" ? "is-active" : ""}>
        {labelEn}
      </a>
    </div>
  );
}
