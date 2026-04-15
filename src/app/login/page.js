import { LoginForm } from "@/components/dribads/forms/login-form";
import { getDribadsMessages } from "@/lib/dribads/i18n";
import { getRequestLocale } from "@/lib/dribads/locale-server";

export default async function LoginPage() {
  const locale = await getRequestLocale();
  const messages = getDribadsMessages(locale).login;

  return (
    <div className="dribads-page">
      <div className="dribads-container">
        <LoginForm messages={messages} />
      </div>
    </div>
  );
}
