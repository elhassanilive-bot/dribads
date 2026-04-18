"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardTabs } from "@/components/dribads/dashboard-tabs";
import { BillingPortalCard } from "@/components/dribads/billing-portal-card";
import { AppSelector } from "@/components/dribads/app-selector";
import { authJsonFetch } from "@/lib/dribads/client-auth";
import { AuthRequiredCard } from "@/components/dribads/auth-required-card";

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

export function DashboardPageClient({ messages, localeTag }) {
  const searchParams = useSearchParams();
  const selectedApp = (searchParams.get("app") || "all").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");
  const [apps, setApps] = useState([]);
  const [data, setData] = useState({ totalViews: 0, totalClicks: 0, balance: 0, estimatedCpc: 0.05, ads: [] });
  const [analytics, setAnalytics] = useState([]);

  const loginRequiredText = useMemo(
    () => messages?.authRequired || "يجب تسجيل الدخول لعرض لوحة التحكم والإحصائيات.",
    [messages]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setNeedsLogin(false);

      const appQuery = selectedApp && selectedApp !== "all" ? `?app=${encodeURIComponent(selectedApp)}` : "";

      const [dashboardRes, analyticsRes, appsRes] = await Promise.all([
        authJsonFetch(`/api/dashboard${appQuery}`),
        authJsonFetch(`/api/analytics?days=14${appQuery ? `&${appQuery.slice(1)}` : ""}`),
        authJsonFetch("/api/apps"),
      ]);

      if (cancelled) return;

      if (dashboardRes.status === 401 || analyticsRes.status === 401 || appsRes.status === 401) {
        setNeedsLogin(true);
        setLoading(false);
        return;
      }

      if (!dashboardRes.ok || !analyticsRes.ok || !appsRes.ok) {
        setError(messages.loadError || "Failed to load dashboard.");
        setLoading(false);
        return;
      }

      setData(dashboardRes.data || { totalViews: 0, totalClicks: 0, balance: 0, estimatedCpc: 0.05, ads: [] });
      setAnalytics(Array.isArray(analyticsRes.data?.trend) ? analyticsRes.data.trend : []);
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
              messages.previewBenefit1 || "شاهد الإحصائيات الحقيقية لحملاتك لحظة بلحظة.",
              messages.previewBenefit2 || "تتبّع النقرات والمشاهدات والأرباح من لوحة واحدة.",
            ]}
          />
        </div>
      </div>
    );
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
            {messages.cpc} ${Number(data.estimatedCpc || 0.05).toFixed(2)}.
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
            <StatCard
              label={messages.statClicks}
              value={data.totalClicks}
              sub={growthLabel(clicksLast, clicksPrev, messages)}
            />
            <StatCard label={messages.statBalance} value={`$${Number(data.balance || 0).toFixed(2)}`} />
            <StatCard label={messages.statCtr} value={`${ctr.toFixed(2)}%`} />
            <StatCard label={messages.statConversion} value={`${conversion.toFixed(2)}%`} />
          </div>
        </section>

        <BillingPortalCard messages={messages.billing} />

        <section className="dribads-card">
          <h2 className="dribads-section-title">{messages.adsList}</h2>
          <div className="dribads-toolbar">
            <p className="dribads-note">
              {messages.totalAds}: {Array.isArray(data.ads) ? data.ads.length : 0}
            </p>
            <p className="dribads-muted">{messages.loginRequiredExport || "يجب تسجيل الدخول لتنزيل التقارير."}</p>
          </div>

          <DashboardTabs
            data={{ ads: data.ads || [], analytics }}
            messages={{
              ...messages,
              localeTag,
            }}
          />
        </section>
      </div>
    </div>
  );
}
