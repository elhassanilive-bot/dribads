import { getDribadsMessages } from "@/lib/dribads/i18n";
import { getRequestLocale } from "@/lib/dribads/locale-server";

const codeSample = `fetch("/api/ads", { cache: "no-store" })\n  .then((res) => res.json())\n  .then(({ ad }) => {\n    if (!ad) return;\n    // Render ad.media_url and track view\n    fetch("/api/ad-view", {\n      method: "POST",\n      headers: { "Content-Type": "application/json" },\n      body: JSON.stringify({ ad_id: ad.id }),\n    });\n  });`;

export default async function OnboardingPage() {
  const locale = await getRequestLocale();
  const messages = getDribadsMessages(locale).onboarding;

  return (
    <div className="dribads-page">
      <div className="dribads-container dribads-stack">
        <header className="dribads-stack">
          <p className="dribads-kicker">Onboarding</p>
          <h1 className="dribads-section-title">{messages.title}</h1>
          <p className="dribads-note">{messages.subtitle}</p>
        </header>

        <div className="dribads-grid dribads-grid-3">
          {messages.steps.map((step, index) => (
            <article key={step} className="dribads-card dribads-step-card">
              <span className="dribads-step-index">0{index + 1}</span>
              <h3>{step}</h3>
            </article>
          ))}
        </div>

        <section className="dribads-card">
          <h2 className="dribads-section-title">{messages.codeTitle}</h2>
          <pre className="dribads-code">
            <code>{codeSample}</code>
          </pre>
        </section>
      </div>
    </div>
  );
}
