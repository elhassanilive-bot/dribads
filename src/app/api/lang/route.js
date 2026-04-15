import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, DRIBADS_LANG_COOKIE, normalizeLocale } from "@/lib/dribads/i18n";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locale = normalizeLocale(searchParams.get("lang") || DEFAULT_LOCALE);
  const redirectPath = searchParams.get("redirect") || "/";
  const safePath = redirectPath.startsWith("/") ? redirectPath : "/";

  const response = NextResponse.redirect(new URL(safePath, request.url));
  response.cookies.set({
    name: DRIBADS_LANG_COOKIE,
    value: locale,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}
