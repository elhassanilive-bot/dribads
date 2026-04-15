import { AppSelector } from "@/components/dribads/app-selector";
import { getAnalyticsData, getApps, getDashboardData } from "@/lib/dribads/repository";
import { getDribadsMessages } from "@/lib/dribads/i18n";
import { getRequestLocale } from "@/lib/dribads/locale-server";
import { normalizeDribadsError } from "@/lib/dribads/error-utils";

function safeNumber(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function calcRpm(earnings, views) {
  if (!views) return 0;
  return (earnings / views) * 1000;
}

function StatCard({ label, value, sub }) {
  return (
    <article className="dribads-card dribads-stat-card">
      <p className="dribads-muted">{label}</p>
      <p className="dribads-stat-value">{value}</p>
      {sub ? <p className="dribads-stat-sub">{sub}</p> : null}
    </article>
  );
}

export default async function EarningsPage({ searchParams }) {
  const locale = await getRequestLocale();
  const messages = getDribadsMessages(locale).earningsPage;
  const params = await searchParams;
  const selectedApp = typeof params?.app === "string" ? params.app.toLowerCase() : "all";

  let data = {
    totalViews: 0,
    totalClicks: 0,
    balance: 0,
    estimatedCpc: 0.05,
    ads: [],
  };
  let trend = [];
  let apps = [];
  let error = "";

  try {
    [data, trend, apps] = await Promise.all([
      getDashboardData({ appSlug: selectedApp }),
      getAnalyticsData(30, { appSlug: selectedApp }),
      getApps(),
    ]);
  } catch (earningsError) {
    error = normalizeDribadsError(earningsError, messages);
  }

  const total = safeNumber(data.balance);
  const avgCpc = safeNumber(data.estimatedCpc || 0.05);
  const rpm = calcRpm(total, safeNumber(data.totalViews));
  const pending = Number((total * 0.2).toFixed(2));
  const available = Number((total - pending).toFixed(2));

  const last14 = trend.slice(-14);
  const last14Revenue = last14.reduce((sum, day) => sum + safeNumber(day.clicks) * avgCpc, 0);
  const monthlyProjection = Number(((last14Revenue / Math.max(last14.length, 1)) * 30).toFixed(2));

  const dailyRevenueRows = trend.map((day) => ({
    ...day,
    revenue: Number((safeNumber(day.clicks) * avgCpc).toFixed(2)),
  }));

  const topRevenueAds = [...data.ads]
    .map((ad) => ({
      ...ad,
      clicks: safeNumber(ad.clicks),
      revenue: Number((safeNumber(ad.clicks) * avgCpc).toFixed(2)),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return (
    <div className="dribads-page">
      <div className="dribads-container dribads-stack">
        <section className="dribads-stack">
          <p className="dribads-kicker">{messages.kicker}</p>
          <h1 className="dribads-section-title">{messages.title}</h1>
          <p className="dribads-note">{messages.note}</p>
          <AppSelector pathname="/earnings" selectedApp={selectedApp} apps={apps} messages={messages.apps} />
          {error ? <p className="dribads-feedback dribads-feedback-error">{error}</p> : null}
        </section>

        <section className="dribads-dashboard-grid dribads-dashboard-grid-5">
          <StatCard label={messages.cards.total} value={`$${total.toFixed(2)}`} />
          <StatCard label={messages.cards.available} value={`$${available.toFixed(2)}`} />
          <StatCard label={messages.cards.pending} value={`$${pending.toFixed(2)}`} />
          <StatCard label={messages.cards.avgCpc} value={`$${avgCpc.toFixed(4)}`} />
          <StatCard label={messages.cards.rpm} value={`$${rpm.toFixed(2)}`} />
          <StatCard label={messages.cards.monthlyProjection} value={`$${monthlyProjection.toFixed(2)}`} sub="30d estimate" />
        </section>

        <section className="dribads-card dribads-stack">
          <h2 className="dribads-section-title">{messages.dailyRevenue}</h2>
          <div className="dribads-table-wrap">
            <table className="dribads-table">
              <thead>
                <tr>
                  <th>{messages.columns.date}</th>
                  <th>{messages.columns.clicks}</th>
                  <th>{messages.columns.revenue}</th>
                </tr>
              </thead>
              <tbody>
                {dailyRevenueRows.map((row) => (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td>{safeNumber(row.clicks)}</td>
                    <td>${row.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dribads-card dribads-stack">
          <h2 className="dribads-section-title">{messages.topRevenueAds}</h2>
          <div className="dribads-table-wrap">
            <table className="dribads-table">
              <thead>
                <tr>
                  <th>{messages.columns.title}</th>
                  <th>{messages.columns.status}</th>
                  <th>{messages.columns.clicks}</th>
                  <th>{messages.columns.revenue}</th>
                </tr>
              </thead>
              <tbody>
                {topRevenueAds.map((ad) => (
                  <tr key={ad.id}>
                    <td>{ad.title}</td>
                    <td>{ad.status || "active"}</td>
                    <td>{ad.clicks}</td>
                    <td>${ad.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
