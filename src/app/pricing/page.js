import { getDribadsMessages } from "@/lib/dribads/i18n";
import { getRequestLocale } from "@/lib/dribads/locale-server";

async function handleCheckout(priceId) {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  });

  const data = await response.json();
  if (data?.url) {
    window.location.href = data.url;
  } else {
    alert(data?.error || "Stripe checkout failed");
  }
}

export default async function PricingPage() {
  const locale = await getRequestLocale();
  const messages = getDribadsMessages(locale).pricing;
  const pricing = messages.plans;

  return (
    <div className="dribads-page">
      <div className="dribads-container dribads-stack">
        <header className="dribads-stack">
          <p className="dribads-kicker">Pricing</p>
          <h1 className="dribads-section-title">{messages.title}</h1>
          <p className="dribads-note">{messages.subtitle}</p>
        </header>

        <div className="dribads-grid dribads-grid-3">
          {pricing.map((plan) => (
            <article key={plan.name} className="dribads-card dribads-pricing-card">
              <h3>{plan.name}</h3>
              <p className="dribads-pricing-price">{plan.price}</p>
              <p className="dribads-muted">{plan.desc}</p>
              <ul className="dribads-pricing-list">
                {plan.features.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              {plan.checkout ? (
                <button
                  type="button"
                  className="dribads-btn dribads-btn-primary"
                  onClick={() => handleCheckout(plan.checkout)}
                >
                  {messages.cta}
                </button>
              ) : (
                <button type="button" className="dribads-btn dribads-btn-ghost" disabled>
                  {messages.ctaEnterprise}
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
