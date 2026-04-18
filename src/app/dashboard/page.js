import { DashboardPageClient } from "@/components/dribads/pages/dashboard-page-client";
import { getDribadsMessages } from "@/lib/dribads/i18n";
import { getRequestLocale } from "@/lib/dribads/locale-server";

export default async function DashboardPage() {
  const locale = await getRequestLocale();
  const messages = getDribadsMessages(locale).dashboard;

  return <DashboardPageClient messages={messages} localeTag={locale === "ar" ? "ar-MA" : "en-US"} />;
}

