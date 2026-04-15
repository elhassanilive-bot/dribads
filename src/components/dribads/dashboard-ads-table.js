"use client";

import { useMemo, useState } from "react";

function safeNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function calcCtr(clicks, views) {
  if (!views) return 0;
  return (clicks / views) * 100;
}

function getQualityLabel(ctr, messages) {
  if (ctr >= 5) return { label: messages.quality.high, className: "quality-high" };
  if (ctr >= 2) return { label: messages.quality.medium, className: "quality-medium" };
  return { label: messages.quality.low, className: "quality-low" };
}

export function DashboardAdsTable({ ads, messages }) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(ads);
  const [busyId, setBusyId] = useState(null);

  const filteredAds = useMemo(() => {
    const q = query.trim().toLowerCase();
    let next = q ? rows.filter((ad) => ad.title.toLowerCase().includes(q)) : [...rows];

    if (statusFilter !== "all") {
      next = next.filter((ad) => (ad.status || "active") === statusFilter);
    }

    next.sort((a, b) => {
      if (sortBy === "views") return safeNumber(b.views) - safeNumber(a.views);
      if (sortBy === "clicks") return safeNumber(b.clicks) - safeNumber(a.clicks);
      if (sortBy === "budget") return safeNumber(b.budget) - safeNumber(a.budget);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return next;
  }, [rows, query, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAds.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedAds = filteredAds.slice(start, start + pageSize);

  async function toggleStatus(ad) {
    const nextStatus = (ad.status || "active") === "active" ? "paused" : "active";
    setBusyId(ad.id);

    try {
      const response = await fetch("/api/ads/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad_id: ad.id, status: nextStatus }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update status");
      }

      setRows((prev) => prev.map((row) => (row.id === ad.id ? { ...row, status: nextStatus } : row)));
    } catch {
      // no-op
    } finally {
      setBusyId(null);
    }
  }

  if (!rows.length) {
    return <p className="dribads-muted">{messages.noAds}</p>;
  }

  return (
    <div className="dribads-stack">
      <div className="dribads-table-controls">
        <input
          className="dribads-input"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder={messages.controls.searchPlaceholder}
        />

        <label className="dribads-label dribads-inline-label">
          <span>{messages.controls.filterStatus}</span>
          <select
            className="dribads-select"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">{messages.controls.filterAll}</option>
            <option value="active">{messages.controls.filterActive}</option>
            <option value="paused">{messages.controls.filterPaused}</option>
            <option value="draft">{messages.controls.filterDraft}</option>
          </select>
        </label>

        <label className="dribads-label dribads-inline-label">
          <span>{messages.controls.sortBy}</span>
          <select
            className="dribads-select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="newest">{messages.controls.sortNewest}</option>
            <option value="views">{messages.controls.sortMostViews}</option>
            <option value="clicks">{messages.controls.sortMostClicks}</option>
            <option value="budget">{messages.controls.sortHighestBudget}</option>
          </select>
        </label>

        <label className="dribads-label dribads-inline-label">
          <span>{messages.pagination.pageSize}</span>
          <select
            className="dribads-select"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </label>
      </div>

      {filteredAds.length === 0 ? (
        <p className="dribads-muted">{messages.noResults}</p>
      ) : (
        <>
          <div className="dribads-table-wrap">
            <table className="dribads-table">
              <thead>
                <tr>
                  <th>{messages.columns.title}</th>
                  <th>{messages.columns.description}</th>
                  <th>{messages.columns.budget}</th>
                  <th>{messages.columns.views}</th>
                  <th>{messages.columns.clicks}</th>
                  <th>{messages.columns.ctr}</th>
                  <th>{messages.columns.quality}</th>
                  <th>{messages.columns.target}</th>
                  <th>{messages.columns.status}</th>
                  <th>{messages.columns.actions}</th>
                  <th>{messages.columns.created}</th>
                </tr>
              </thead>
              <tbody>
                {pagedAds.map((ad) => {
                  const ctr = calcCtr(safeNumber(ad.clicks), safeNumber(ad.views));
                  const isBusy = busyId === ad.id;
                  const isActive = (ad.status || "active") === "active";
                  const quality = getQualityLabel(ctr, messages);

                  return (
                    <tr key={ad.id}>
                      <td>{ad.title}</td>
                      <td className="dribads-muted">{ad.description || "-"}</td>
                      <td>${safeNumber(ad.budget).toFixed(2)}</td>
                      <td>{safeNumber(ad.views)}</td>
                      <td>{safeNumber(ad.clicks)}</td>
                      <td>{ctr.toFixed(2)}%</td>
                      <td>
                        <span className={`dribads-quality-pill ${quality.className}`}>{quality.label}</span>
                      </td>
                      <td>
                        <a
                          href={ad.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dribads-link"
                        >
                          {messages.openTarget}
                        </a>
                      </td>
                      <td>
                        <span className={`dribads-status-pill status-${ad.status || "active"}`}>
                          {messages.status[ad.status || "active"]}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="dribads-btn dribads-btn-ghost dribads-btn-sm"
                          onClick={() => toggleStatus(ad)}
                          disabled={isBusy}
                        >
                          {isActive ? messages.status.pause : messages.status.activate}
                        </button>
                      </td>
                      <td>{new Date(ad.created_at).toLocaleDateString(messages.localeTag)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="dribads-pagination">
            <span>
              {messages.pagination.label} {currentPage} / {totalPages}
            </span>
            <div className="dribads-pagination-actions">
              <button
                type="button"
                className="dribads-btn dribads-btn-ghost dribads-btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                {messages.pagination.prev}
              </button>
              <button
                type="button"
                className="dribads-btn dribads-btn-ghost dribads-btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                {messages.pagination.next}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
