import { AccountPageClient } from "@/components/dribads/account/account-page-client";
import { getDribadsMessages } from "@/lib/dribads/i18n";
import { getRequestLocale } from "@/lib/dribads/locale-server";

export default async function AccountPage() {
  const locale = await getRequestLocale();
  const messages = getDribadsMessages(locale).account;

  return (
    <div className="dribads-page">
      <div className="dribads-container">
        <AccountPageClient messages={messages} />
      </div>
    </div>
  );
}
