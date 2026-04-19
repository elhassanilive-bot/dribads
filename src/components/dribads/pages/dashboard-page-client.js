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

function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function toNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function calcProgress(current, required) {
  const safeRequired = toNumber(required);
  if (safeRequired <= 0) return 100;
  return clampPercent((toNumber(current) / safeRequired) * 100);
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
          {numberFormat.format(toNumber(current))} / {numberFormat.format(toNumber(required))}
        </span>
      </div>
    </article>
  );
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
  const [monetization, setMonetization] = useState({ app: null, features: {}, eligibility: { checks: [] } });

  const loginRequiredText = useMemo(
    () => messages?.authRequired || "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ø¹Ø±Ø¶ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… ÙˆØ§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª.",
    [messages]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setNeedsLogin(false);

      const appQuery = selectedApp && selectedApp !== "all" ? `?app=${encodeURIComponent(selectedApp)}` : "";

      const [dashboardRes, analyticsRes, appsRes, monetizationRes] = await Promise.all([
        authJsonFetch(`/api/dashboard${appQuery}`),
        authJsonFetch(`/api/analytics?days=14${appQuery ? `&${appQuery.slice(1)}` : ""}`),
        authJsonFetch("/api/apps"),
        authJsonFetch(`/api/monetization${appQuery}`),
      ]);

      if (cancelled) return;

      if (dashboardRes.status === 401 || analyticsRes.status === 401 || appsRes.status === 401 || monetizationRes.status === 401) {
        setNeedsLogin(true);
        setLoading(false);
        return;
      }

      if (!dashboardRes.ok || !analyticsRes.ok || !appsRes.ok || !monetizationRes.ok) {
        setError(messages.loadError || "Failed to load dashboard.");
        setLoading(false);
        return;
      }

      setData(dashboardRes.data || { totalViews: 0, totalClicks: 0, balance: 0, estimatedCpc: 0.05, ads: [] });
      setAnalytics(Array.isArray(analyticsRes.data?.trend) ? analyticsRes.data.trend : []);
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
            loginLabel={messages.loginNow || "ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„"}
            signupLabel={messages.signupNow || "Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨"}
            bullets={[
              messages.previewBenefit1 || "Ø´Ø§Ù‡Ø¯ Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ© Ù„Ø­Ù…Ù„Ø§ØªÙƒ Ù„Ø­Ø¸Ø© Ø¨Ù„Ø­Ø¸Ø©.",
              messages.previewBenefit2 || "ØªØªØ¨Ù‘Ø¹ Ø§Ù„Ù†Ù‚Ø±Ø§Øª ÙˆØ§Ù„Ù…Ø´Ø§Ù‡Ø¯Ø§Øª ÙˆØ§Ù„Ø£Ø±Ø¨Ø§Ø­ Ù…Ù† Ù„ÙˆØ­Ø© ÙˆØ§Ø­Ø¯Ø©.",
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
            <StatCard
              label={messages.statViews}
              value={numberFormat.format(toNumber(data.totalViews))}
              sub={growthLabel(viewsLast, viewsPrev, messages)}
            />
            <StatCard
              label={messages.statClicks}
              value={numberFormat.format(toNumber(data.totalClicks))}
              sub={growthLabel(clicksLast, clicksPrev, messages)}
            />
            <StatCard label={messages.statBalance} value={`$${Number(data.balance || 0).toFixed(2)}`} />
            <StatCard label={messages.statCtr} value={`${ctr.toFixed(2)}%`} />
            <StatCard label={messages.statConversion} value={`${conversion.toFixed(2)}%`} />
          </div>
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

        <BillingPortalCard messages={messages.billing} />

        <section className="dribads-card">
          <h2 className="dribads-section-title">{messages.adsList}</h2>
          <div className="dribads-toolbar">
            <p className="dribads-note">
              {messages.totalAds}: {Array.isArray(data.ads) ? data.ads.length : 0}
            </p>
            {needsLogin ? (
              <p className="dribads-muted">{messages.loginRequiredExport}</p>
            ) : null}
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
