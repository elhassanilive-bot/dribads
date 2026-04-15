"use client";

import { useState } from "react";

export function BillingPortalCard({ messages }) {
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    if (!customerId.trim()) {
      setStatus({ type: "error", message: messages.validation });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customerId.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || messages.error);
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setStatus({ type: "error", message: messages.error });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : messages.error,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="dribads-card dribads-stack">
      <div className="dribads-stack-xs">
        <h2 className="dribads-section-title">{messages.title}</h2>
        <p className="dribads-note">{messages.note}</p>
      </div>

      <label className="dribads-label dribads-stack-xs">
        <span>{messages.inputLabel}</span>
        <input
          className="dribads-input"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
          placeholder={messages.placeholder}
        />
      </label>

      <div className="dribads-toolbar-actions">
        <button
          type="button"
          className="dribads-btn dribads-btn-primary"
          onClick={openPortal}
          disabled={loading}
        >
          {loading ? messages.loading : messages.button}
        </button>
      </div>

      {status.message ? (
        <p className={`dribads-feedback ${status.type === "error" ? "dribads-feedback-error" : ""}`}>
          {status.message}
        </p>
      ) : null}
    </section>
  );
}
