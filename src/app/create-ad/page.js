import { CreateAdForm } from "@/components/dribads/forms/create-ad-form";
import { getDribadsMessages } from "@/lib/dribads/i18n";
import { getRequestLocale } from "@/lib/dribads/locale-server";

export default async function CreateAdPage() {
  const locale = await getRequestLocale();
  const messages = getDribadsMessages(locale).createAd;

  return (
    <div className="dribads-page">
      <div className="dribads-container">
        <CreateAdForm messages={messages} />
      </div>
    </div>
  );
}
