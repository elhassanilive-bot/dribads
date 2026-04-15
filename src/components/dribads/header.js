"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

function LanguageSwitch({ locale, pathname, searchParams, messages }) {
  const fullPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const arHref = `/api/lang?lang=ar&redirect=${encodeURIComponent(fullPath)}`;
  const enHref = `/api/lang?lang=en&redirect=${encodeURIComponent(fullPath)}`;

  return (
    <div className="dribads-lang-switch" role="group" aria-label="Language switch">
      <a href={arHref} className={locale === "ar" ? "is-active" : ""}>
        {messages.languageAr}
      </a>
      <a href={enHref} className={locale === "en" ? "is-active" : ""}>
        {messages.languageEn}
      </a>
    </div>
  );
}

function AccountAvatar({ user, href, className = "" }) {
  const fullName = user?.user_metadata?.full_name || "";
  const avatarUrl = user?.user_metadata?.avatar_url || "";
  const initialsSource = (fullName || user?.email || "U").trim();
  const initials = initialsSource.slice(0, 1).toUpperCase();

  return (
    <Link href={href} className={`dribads-avatar-link ${className}`.trim()} aria-label="account">
      {avatarUrl ? (
        <img src={avatarUrl} alt={fullName || "avatar"} className="dribads-avatar-img" />
      ) : (
        <span className="dribads-avatar-fallback">{initials}</span>
      )}
    </Link>
  );
}

export function DribadsHeader({ locale, messages }) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const navLinks = useMemo(
    () => (messages.nav || []).filter((link) => link.href !== "/login" && link.href !== "/account"),
    [messages.nav]
  );
  const showCta = pathname !== "/account";

  useEffect(() => {
    if (!supabase) return undefined;

    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data?.user || null);
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
    };
  }, [supabase]);

  const profileHref = user ? "/account" : "/login";

  return (
    <header className="dribads-header">
      <div className="dribads-container dribads-header-inner">
        <div className="dribads-brand-cluster">
          <Link href="/" className="dribads-logo" onClick={() => setIsOpen(false)}>
            <span className="dribads-logo-wordmark">{messages.brand}</span>
          </Link>
          <AccountAvatar user={user} href={profileHref} className="dribads-avatar-desktop" />
        </div>

        <nav className="dribads-nav-desktop" aria-label={messages.navAria}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="dribads-nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="dribads-header-actions">
          <LanguageSwitch locale={locale} pathname={pathname} searchParams={searchParams} messages={messages} />
          {showCta ? (
            <Link href="/create-ad" className="dribads-btn dribads-btn-primary">
              {messages.cta}
            </Link>
          ) : null}
          <AccountAvatar user={user} href={profileHref} className="dribads-avatar-mobile" />
          <button
            type="button"
            className="dribads-menu-btn"
            onClick={() => setIsOpen((value) => !value)}
            aria-expanded={isOpen}
            aria-label={isOpen ? messages.closeMenu : messages.openMenu}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="dribads-mobile-nav">
          <div className="dribads-container dribads-mobile-nav-inner">
            <LanguageSwitch locale={locale} pathname={pathname} searchParams={searchParams} messages={messages} />
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="dribads-mobile-link"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
