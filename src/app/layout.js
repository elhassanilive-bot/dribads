import { Sora, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { DribadsFooter } from "@/components/dribads/footer";
import { DribadsHeader } from "@/components/dribads/header";
import { getDirection, getDribadsMessages } from "@/lib/dribads/i18n";
import { getRequestLocale } from "@/lib/dribads/locale-server";

const headingFont = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Dribads | منصة إعلانات لتطبيقاتك",
    template: "%s | Dribads",
  },
  description:
    "حوّل تطبيقاتك إلى مصدر دخل عبر Dribads. أنشئ الإعلانات، تتبع المشاهدات والنقرات لحظيًا، ووسع حملاتك بسهولة.",
  alternates: {
    canonical: "/",
  },
};

export default async function RootLayout({ children }) {
  const locale = await getRequestLocale();
  const direction = getDirection(locale);
  const messages = getDribadsMessages(locale);

  return (
    <html lang={locale} dir={direction}>
      <body className={`${headingFont.variable} ${bodyFont.variable} dribads-body`}>
        <div className="dribads-shell">
          <DribadsHeader locale={locale} messages={messages.header} />
          <main className="dribads-main">{children}</main>
          <DribadsFooter messages={messages.footer} />
        </div>
      </body>
    </html>
  );
}
