import { DashboardTabs } from "@/components/dribads/dashboard-tabs";
import { BillingPortalCard } from "@/components/dribads/billing-portal-card";
import { AppSelector } from "@/components/dribads/app-selector";
import { getAnalyticsData, getApps, getDashboardData } from "@/lib/dribads/repository";
import { getDribadsMessages } from "@/lib/dribads/i18n";
import { getRequestLocale } from "@/lib/dribads/locale-server";
import { normalizeDribadsError } from "@/lib/dribads/error-utils";

function StatCard({ label, value, sub }) {
  return (
    <article className="dribads-card dribads-stat-card">
      <p className="dribads-muted">{label}</p>
      <p className="dribads-stat-value">{value}</p>
      {sub ? <p className="dribads-stat-sub">{sub}</p> : null}
    </article>
  );
}

function safePercent(clicks, views) {
  if (!views) return 0;
  return (clicks / views) * 100;
}

function sumRows(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function growthLabel(current, previous, messages) {
  if (!previous) return messages.growth.na;
  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? "+" : "";
  const className = delta >= 0 ? "dribads-trend up" : "dribads-trend down";
  return (
    <span className={className}>
      {sign}
      {delta.toFixed(1)}% {messages.growth.last7}
    </span>
  );
}

export default async function DashboardPage({ searchParams }) {
  const locale = await getRequestLocale();
  const messages = getDribadsMessages(locale).dashboard;
  const params = await searchParams;
  const selectedApp = typeof params?.app === "string" ? params.app.toLowerCase() : "all";

  let data;
  let analytics = [];
  let apps = [];
  let error = "";

  try {
    [data, analytics, apps] = await Promise.all([
      getDashboardData({ appSlug: selectedApp }),
      getAnalyticsData(14, { appSlug: selectedApp }),
      getApps(),
    ]);
  } catch (dashboardError) {
    error = normalizeDribadsError(dashboardError, messages);
    data = { totalViews: 0, totalClicks: 0, balance: 0, estimatedCpc: 0.05, ads: [] };
    apps = [];
  }

  const ctr = safePercent(Number(data.totalClicks || 0), Number(data.totalViews || 0));
  const conversion = ctr;

  const last7 = analytics.slice(-7);
  const prev7 = analytics.slice(-14, -7);
  const viewsLast = sumRows(last7, "views");
  const viewsPrev = sumRows(prev7, "views");
  const clicksLast = sumRows(last7, "clicks");
  const clicksPrev = sumRows(prev7, "clicks");

  return (
    <div className="dribads-page">
      <div className="dribads-container dribads-stack">
        <section className="dribads-stack">
          <p className="dribads-kicker">{messages.kicker}</p>
          <h1 className="dribads-section-title">{messages.title}</h1>
          <p className="dribads-note">
            {messages.cpc} ${data.estimatedCpc.toFixed(2)}.
          </p>
          <div className="dribads-toolbar-actions">
            <a className="dribads-btn dribads-btn-ghost dribads-btn-sm" href="/analytics">
              {messages.quick.analytics}
            </a>
            <a className="dribads-btn dribads-btn-ghost dribads-btn-sm" href="/earnings">
              {messages.quick.earnings}
            </a>
          </div>
          <AppSelector pathname="/dashboard" selectedApp={selectedApp} apps={apps} messages={messages.apps} />
          {error ? <p className="dribads-feedback dribads-feedback-error">{error}</p> : null}

          <div className="dribads-dashboard-grid dribads-dashboard-grid-5">
            <StatCard label={messages.statViews} value={data.totalViews} sub={growthLabel(viewsLast, viewsPrev, messages)} />
            <StatCard label={messages.statClicks} value={data.totalClicks} sub={growthLabel(clicksLast, clicksPrev, messages)} />
            <StatCard label={messages.statBalance} value={`$${Number(data.balance).toFixed(2)}`} />
            <StatCard label={messages.statCtr} value={`${ctr.toFixed(2)}%`} />
            <StatCard label={messages.statConversion} value={`${conversion.toFixed(2)}%`} />
          </div>
        </section>

        <BillingPortalCard messages={messages.billing} />

        <section className="dribads-card">
          <h2 className="dribads-section-title">{messages.adsList}</h2>
          <div className="dribads-toolbar">
            <p className="dribads-note">
              {messages.totalAds}: {data.ads.length}
            </p>
            <div className="dribads-toolbar-actions">
              <a className="dribads-btn dribads-btn-ghost dribads-btn-sm" href="/api/reports/csv">
                {messages.exports.csv}
              </a>
              <a className="dribads-btn dribads-btn-ghost dribads-btn-sm" href="/api/reports/pdf">
                {messages.exports.pdf}
              </a>
              <a className="dribads-btn dribads-btn-ghost dribads-btn-sm" href="/api/reports/xlsx">
                {messages.exports.xlsx}
              </a>
            </div>
          </div>

          <DashboardTabs
            data={{ ads: data.ads, analytics }}
            messages={{
              ...messages,
              localeTag: locale === "ar" ? "ar-MA" : "en-US",
            }}
          />
        </section>
      </div>
    </div>
  );
}
