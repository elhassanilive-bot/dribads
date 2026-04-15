import Link from "next/link";
import { AdSlot } from "@/components/dribads/ad-slot";
import { getDribadsMessages } from "@/lib/dribads/i18n";
import { getRequestLocale } from "@/lib/dribads/locale-server";

export default async function HomePage() {
  const locale = await getRequestLocale();
  const messages = getDribadsMessages(locale).home;

  return (
    <div className="dribads-home">
      <section className="dribads-hero dribads-container">
        <p className="dribads-kicker">{messages.kicker}</p>
        <div className="dribads-trust-badge">{messages.trust}</div>
        <h1 className="dribads-hero-title">{messages.title}</h1>
        <p className="dribads-hero-description">{messages.description}</p>
        <div className="dribads-hero-actions">
          <Link href="/create-ad" className="dribads-btn dribads-btn-primary">
            {messages.primaryCta}
          </Link>
          <Link href="/dashboard" className="dribads-btn dribads-btn-ghost">
            {messages.secondaryCta}
          </Link>
        </div>
      </section>

      <section className="dribads-container dribads-section">
        <div className="dribads-section-heading">
          <p className="dribads-kicker">{messages.featuresKicker}</p>
          <h2 className="dribads-section-title">{messages.featuresTitle}</h2>
        </div>

        <div className="dribads-grid dribads-grid-3">
          {messages.features.map((feature) => (
            <article key={feature.title} className="dribads-card">
              <h3>{feature.title}</h3>
              <p className="dribads-muted">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dribads-container dribads-section">
        <div className="dribads-section-heading">
          <p className="dribads-kicker">{messages.howKicker}</p>
          <h2 className="dribads-section-title">{messages.howTitle}</h2>
        </div>

        <div className="dribads-grid dribads-grid-3">
          {messages.steps.map((step, index) => (
            <article key={step} className="dribads-card dribads-step-card">
              <span className="dribads-step-index">0{index + 1}</span>
              <h3>{step}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="dribads-container dribads-section">
        <AdSlot messages={messages.liveAd} />
      </section>
    </div>
  );
}
