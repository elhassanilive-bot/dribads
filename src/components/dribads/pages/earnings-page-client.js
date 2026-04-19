"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppSelector } from "@/components/dribads/app-selector";
import { authJsonFetch } from "@/lib/dribads/client-auth";
import { AuthRequiredCard } from "@/components/dribads/auth-required-card";

function safeNumber(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function calcRpm(earnings, views) {
  if (!views) return 0;
  return (earnings / views) * 1000;
}

function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function calcProgress(current, required) {
  const safeRequired = safeNumber(required);
  if (safeRequired <= 0) return 100;
  return clampPercent((safeNumber(current) / safeRequired) * 100);
}

function getCheckByKey(checks, key) {
  return (checks || []).find((item) => item?.key === key) || null;
}

function ProgressRing({ label, current, required, percent, numberFormat, percentFormat }) {
  return (
    <article className="dribads-eligibility-ring-card">
      <div
        className="dribads-eligibility-ring"
        style={{
          "--progress-angle": `${Math.round(clampPercent(percent) * 3.6)}deg`,
        }}
      >
        <strong>{percentFormat.format(clampPercent(percent) / 100)}</strong>
      </div>
      <div className="dribads-eligibility-ring-meta">
        <p>{label}</p>
        <span>
          {numberFormat.format(safeNumber(current))} / {numberFormat.format(safeNumber(required))}
        </span>
      </div>
    </article>
  );
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

export function EarningsPageClient({ messages, localeTag }) {
  const searchParams = useSearchParams();
  const selectedApp = (searchParams.get("app") || "all").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState("");
  const [apps, setApps] = useState([]);
  const [data, setData] = useState({ totalViews: 0, totalClicks: 0, balance: 0, estimatedCpc: 0.05, ads: [] });
  const [trend, setTrend] = useState([]);
  const [monetization, setMonetization] = useState({ app: null, features: {}, eligibility: { checks: [] } });

  const loginRequiredText = useMemo(
    () => messages?.authRequired || "يجب تسجيل الدخول لعرض الأرباح.",
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
      const monetizationUrl = `/api/monetization${appQuery ? `?${appQuery}` : ""}`;

      const [dashboardRes, analyticsRes, appsRes, monetizationRes] = await Promise.all([
        authJsonFetch(dashboardUrl),
        authJsonFetch(analyticsUrl),
        authJsonFetch("/api/apps"),
        authJsonFetch(monetizationUrl),
      ]);

      if (cancelled) return;

      if (dashboardRes.status === 401 || analyticsRes.status === 401 || appsRes.status === 401 || monetizationRes.status === 401) {
        setNeedsLogin(true);
        setLoading(false);
        return;
      }

      if (!dashboardRes.ok || !analyticsRes.ok || !appsRes.ok || !monetizationRes.ok) {
        setError(messages.loadError || "Failed to load earnings data.");
        setLoading(false);
        return;
      }

      setData(dashboardRes.data || { totalViews: 0, totalClicks: 0, balance: 0, estimatedCpc: 0.05, ads: [] });
      setTrend(Array.isArray(analyticsRes.data?.trend) ? analyticsRes.data.trend : []);
      setApps(Array.isArray(appsRes.data?.apps) ? appsRes.data.apps : []);
      setMonetization(monetizationRes.data || { app: null, features: {}, eligibility: { checks: [] } });
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
              messages.previewBenefit1 || "اطّلع على أرباحك المتوقعة والمتاحة للسحب.",
              messages.previewBenefit2 || "تابع تغيّر الإيرادات لحظيًا مع كل تفاعل.",
            ]}
          />
        </div>
      </div>
    );
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
    revenue:
      day && typeof day.earnings !== "undefined"
        ? Number(safeNumber(day.earnings).toFixed(2))
        : Number((safeNumber(day.clicks) * avgCpc).toFixed(2)),
  }));

  const topRevenueAds = [...(data.ads || [])]
    .map((ad) => ({
      ...ad,
      clicks: safeNumber(ad.clicks),
      revenue:
        ad && typeof ad.earnings !== "undefined"
          ? Number(safeNumber(ad.earnings).toFixed(2))
          : Number((safeNumber(ad.clicks) * avgCpc).toFixed(2)),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const numberFormat = new Intl.NumberFormat(localeTag || "en", { maximumFractionDigits: 0 });
  const percentFormat = new Intl.NumberFormat(localeTag || "en", { style: "percent", maximumFractionDigits: 0 });
  const eligibility = monetization?.eligibility || {};
  const checks = Array.isArray(eligibility?.checks) ? eligibility.checks : [];
  const gateCheckKeys = ["video_feature_enabled", "kyc_verified", "app_linked"];
  const gateChecks = gateCheckKeys.map((key) => getCheckByKey(checks, key)).filter(Boolean);
  const thresholdKeys = ["min_followers", "min_views", "min_watch_minutes"];
  const thresholdChecks = thresholdKeys.map((key) => getCheckByKey(checks, key)).filter(Boolean);
  const thresholdPercents = thresholdChecks.map((check) => calcProgress(check?.current, check?.required));
  const overallThresholdPercent = thresholdPercents.length
    ? thresholdPercents.reduce((sum, value) => sum + value, 0) / thresholdPercents.length
    : 0;
  const checkLabels = {
    video_feature_enabled: messages?.eligibility?.labels?.video_feature_enabled || "تفعيل ميزة الربح",
    kyc_verified: messages?.eligibility?.labels?.kyc_verified || "توثيق الهوية (KYC)",
    app_linked: messages?.eligibility?.labels?.app_linked || "ربط التطبيق مع Dribads",
    min_followers: messages?.eligibility?.labels?.min_followers || "عدد المتابعين",
    min_views: messages?.eligibility?.labels?.min_views || "مشاهدات الفيديو",
    min_watch_minutes: messages?.eligibility?.labels?.min_watch_minutes || "دقائق المشاهدة",
  };

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

        <section className="dribads-card dribads-eligibility-panel">
          <div className="dribads-eligibility-head">
            <div>
              <p className="dribads-kicker">{messages?.eligibility?.kicker || "شروط الربح"}</p>
              <h2 className="dribads-section-title">{messages?.eligibility?.title || "أهلية تحقيق الربح"}</h2>
              <p className="dribads-note">
                {messages?.eligibility?.subtitle || "نفس فكرة يوتيوب: متابعون + مشاهدات + دقائق مشاهدة."}
              </p>
            </div>
            <div
              className={`dribads-eligibility-badge ${
                eligibility?.eligible ? "eligible" : "not-eligible"
              }`}
            >
              {eligibility?.eligible
                ? messages?.eligibility?.eligibleNow || "مؤهل الآن"
                : messages?.eligibility?.notEligibleYet || "غير مؤهل بعد"}
            </div>
          </div>

          <div className="dribads-eligibility-layout">
            <article className="dribads-eligibility-overall">
              <div
                className="dribads-eligibility-overall-ring"
                style={{
                  "--progress-angle": `${Math.round(clampPercent(overallThresholdPercent) * 3.6)}deg`,
                }}
              >
                <strong>{percentFormat.format(clampPercent(overallThresholdPercent) / 100)}</strong>
                <span>{messages?.eligibility?.completion || "نسبة الإنجاز"}</span>
              </div>
              <div className="dribads-eligibility-gates">
                {gateChecks.map((check) => (
                  <div key={check.key} className="dribads-eligibility-gate-row">
                    <span>{checkLabels[check.key] || check.label}</span>
                    <strong className={check.passed ? "is-pass" : "is-fail"}>
                      {check.passed
                        ? messages?.eligibility?.met || "متحقق"
                        : messages?.eligibility?.missing || "غير متحقق"}
                    </strong>
                  </div>
                ))}
              </div>
            </article>

            <div className="dribads-eligibility-rings-grid">
              {thresholdChecks.map((check) => (
                <ProgressRing
                  key={check.key}
                  label={checkLabels[check.key] || check.label}
                  current={check.current}
                  required={check.required}
                  percent={calcProgress(check.current, check.required)}
                  numberFormat={numberFormat}
                  percentFormat={percentFormat}
                />
              ))}
            </div>
          </div>
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
