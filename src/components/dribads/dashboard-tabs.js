"use client";

import { useState } from "react";
import { DashboardAdsTable } from "@/components/dribads/dashboard-ads-table";
import { DashboardAnalytics } from "@/components/dribads/dashboard-analytics";

export function DashboardTabs({ data, messages }) {
  const [tab, setTab] = useState("overview");

  return (
    <div className="dribads-stack">
      <div className="dribads-tabs">
        <button
          type="button"
          className={`dribads-tab ${tab === "overview" ? "is-active" : ""}`}
          onClick={() => setTab("overview")}
        >
          {messages.tabs.overview}
        </button>
        <button
          type="button"
          className={`dribads-tab ${tab === "analytics" ? "is-active" : ""}`}
          onClick={() => setTab("analytics")}
        >
          {messages.tabs.analytics}
        </button>
      </div>

      {tab === "overview" ? (
        <DashboardAdsTable
          ads={data.ads}
          messages={{
            ...messages,
            localeTag: messages.localeTag,
          }}
        />
      ) : (
        <DashboardAnalytics data={data.analytics} messages={messages} />
      )}
    </div>
  );
}
