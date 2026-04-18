"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardAnalytics } from "@/components/dribads/dashboard-analytics";
import { AppSelector } from "@/components/dribads/app-selector";
import { authJsonFetch } from "@/lib/dribads/client-auth";
import { AuthRequiredCard } from "@/components/dribads/auth-required-card";

function safePercent(a, b) {
  if (!b) return 0;
  return (a / b) * 100;
}

function safeNumber(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function calcCpm(earnings, views) {
  if (!views) return 0;
  return (earnings / views) * 1000;
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + safeNumber(row[key]), 0);
}

function StatCard({ label, value }) {
  return (
    <article className="dribads-card dribads-stat-card">
      <p className="dribads-muted">{label}</p>
      <p className="dribads-stat-value">{value}</p>
    </article>
  );
}

export function AnalyticsPageClient({ messages }) {
  const searchParams = useSearchParams();
  const selectedApp = (searchParams.get("app") || "all").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");
  const [apps, setApps] = useState([]);
  const [data, setData] = useState({ totalViews: 0, totalClicks: 0, balance: 0, estimatedCpc: 0.05, ads: [] });
  const [trend, setTrend] = useState([]);

  const loginRequiredText = useMemo(
    () => messages?.authRequired || "يجب تسجيل الدخول لعرض التحليلات.",
    [messages]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setNeedsLogin(false);

      const appQuery = selectedApp && selectedApp !== "all" ? `app=${encodeURIComponent(selectedApp)}` : "";
      const dashboardUrl = `/api/dashboard${appQuery ? `?${appQuery}` : ""}`;
      const analyticsUrl = `/api/analytics?days=30${appQuery ? `&${appQuery}` : ""}`;

      const [dashboardRes, analyticsRes, appsRes] = await Promise.all([
        authJsonFetch(dashboardUrl),
        authJsonFetch(analyticsUrl),
        authJsonFetch("/api/apps"),
      ]);

      if (cancelled) return;

      if (dashboardRes.status === 401 || analyticsRes.status === 401 || appsRes.status === 401) {
        setNeedsLogin(true);
        setLoading(false);
        return;
      }

      if (!dashboardRes.ok || !analyticsRes.ok || !appsRes.ok) {
        setError(messages.loadError || "Failed to load analytics.");
        setLoading(false);
        return;
      }

      setData(dashboardRes.data || { totalViews: 0, totalClicks: 0, balance: 0, estimatedCpc: 0.05, ads: [] });
      setTrend(Array.isArray(analyticsRes.data?.trend) ? analyticsRes.data.trend : []);
      setApps(Array.isArray(appsRes.data?.apps) ? appsRes.data.apps : []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [messages, selectedApp]);

  if (loading) {
    return (
      <div className="dribads-page">
        <div className="dribads-container">
          <p className="dribads-note">{messages.loading || "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (needsLogin) {
    return (
      <div className="dribads-page">
        <div className="dribads-container dribads-stack">
          <AuthRequiredCard
            title={messages.title}
            message={loginRequiredText}
            loginLabel={messages.loginNow || "تسجيل الدخول"}
            signupLabel={messages.signupNow || "إنشاء حساب"}
            bullets={[
              messages.previewBenefit1 || "حلّل الأداء يوميًا بدقة مثل المنصات الإعلانية الكبيرة.",
              messages.previewBenefit2 || "اكتشف الإعلانات الأعلى تأثيرًا بسرعة.",
            ]}
          />
        </div>
      </div>
    );
  }

  const totalViews = safeNumber(data.totalViews);
  const totalClicks = safeNumber(data.totalClicks);
  const ctr = safePercent(totalClicks, totalViews);
  const cpm = calcCpm(safeNumber(data.balance), totalViews);
  const activeAds = (data.ads || []).filter((ad) => (ad.status || "active") === "active").length;
  const avgDailyViews = trend.length ? Math.round(sum(trend, "views") / trend.length) : 0;

  const topAds = [...(data.ads || [])]
    .map((ad) => ({
      ...ad,
      views: safeNumber(ad.views),
      clicks: safeNumber(ad.clicks),
      ctr: safePercent(safeNumber(ad.clicks), safeNumber(ad.views)),
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 8);

  return (
    <div className="dribads-page">
      <div className="dribads-container dribads-stack">
        <section className="dribads-stack">
          <p className="dribads-kicker">{messages.kicker}</p>
          <h1 className="dribads-section-title">{messages.title}</h1>
          <p className="dribads-note">{messages.note}</p>
          <AppSelector pathname="/analytics" selectedApp={selectedApp} apps={apps} messages={messages.apps} />
          {error ? <p className="dribads-feedback dribads-feedback-error">{error}</p> : null}
        </section>

        <section className="dribads-dashboard-grid dribads-dashboard-grid-5">
          <StatCard label={messages.cards.impressions} value={totalViews} />
          <StatCard label={messages.cards.clicks} value={totalClicks} />
          <StatCard label={messages.cards.ctr} value={`${ctr.toFixed(2)}%`} />
          <StatCard label={messages.cards.cpm} value={`$${cpm.toFixed(2)}`} />
          <StatCard label={messages.cards.activeAds} value={activeAds} />
          <StatCard label={messages.cards.avgDailyViews} value={avgDailyViews} />
        </section>

        <section className="dribads-card">
          <DashboardAnalytics
            data={trend}
            messages={{
              analytics: messages.chart,
            }}
          />
        </section>

        <section className="dribads-card dribads-stack">
          <h2 className="dribads-section-title">{messages.topAds}</h2>
          <div className="dribads-table-wrap">
            <table className="dribads-table">
              <thead>
                <tr>
                  <th>{messages.columns.title}</th>
                  <th>{messages.columns.status}</th>
                  <th>{messages.columns.views}</th>
                  <th>{messages.columns.clicks}</th>
                  <th>{messages.columns.ctr}</th>
                </tr>
              </thead>
              <tbody>
                {topAds.map((ad) => (
                  <tr key={ad.id}>
                    <td>{ad.title}</td>
                    <td>{ad.status || "active"}</td>
                    <td>{ad.views}</td>
                    <td>{ad.clicks}</td>
                    <td>{ad.ctr.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dribads-card dribads-stack">
          <h2 className="dribads-section-title">{messages.trendTable}</h2>
          <div className="dribads-table-wrap">
            <table className="dribads-table">
              <thead>
                <tr>
                  <th>{messages.columns.date}</th>
                  <th>{messages.columns.views}</th>
                  <th>{messages.columns.clicks}</th>
                  <th>{messages.columns.ctr}</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((day) => {
                  const dayCtr = safePercent(safeNumber(day.clicks), safeNumber(day.views));
                  return (
                    <tr key={day.date}>
                      <td>{day.date}</td>
                      <td>{safeNumber(day.views)}</td>
                      <td>{safeNumber(day.clicks)}</td>
                      <td>{dayCtr.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
