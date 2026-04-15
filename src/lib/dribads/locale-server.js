import { cookies } from "next/headers";
import { DEFAULT_LOCALE, DRIBADS_LANG_COOKIE, normalizeLocale } from "@/lib/dribads/i18n";

export async function getRequestLocale() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(DRIBADS_LANG_COOKIE)?.value;
  return normalizeLocale(raw || DEFAULT_LOCALE);
}
