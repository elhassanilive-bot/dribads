import { AnalyticsPageClient } from "@/components/dribads/pages/analytics-page-client";
import { getDribadsMessages } from "@/lib/dribads/i18n";
import { getRequestLocale } from "@/lib/dribads/locale-server";

export default async function AnalyticsPage() {
  const locale = await getRequestLocale();
  const messages = getDribadsMessages(locale).analyticsPage;

  return <AnalyticsPageClient messages={messages} />;
}

