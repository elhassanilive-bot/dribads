import { EarningsPageClient } from "@/components/dribads/pages/earnings-page-client";
import { getDribadsMessages } from "@/lib/dribads/i18n";
import { getRequestLocale } from "@/lib/dribads/locale-server";

export default async function EarningsPage() {
  const locale = await getRequestLocale();
  const messages = getDribadsMessages(locale).earningsPage;

  return <EarningsPageClient messages={messages} />;
}

