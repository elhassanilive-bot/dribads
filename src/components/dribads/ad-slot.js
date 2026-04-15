"use client";

import { useEffect, useMemo, useState } from "react";
import { tokenizeTextWithLinks } from "@/lib/dribads/text";

function isVideo(mediaUrl) {
  return /\.(mp4|webm|ogg)$/i.test(mediaUrl || "");
}

function DescriptionText({ text }) {
  const tokens = tokenizeTextWithLinks(text);
  if (!tokens.length) return null;

  return (
    <p className="dribads-ad-description">
      {tokens.map((token, index) =>
        token.type === "link" ? (
          <a
            key={`link-${index}`}
            href={token.value}
            target="_blank"
            rel="noopener noreferrer"
            className="dribads-inline-link"
          >
            {token.value}
          </a>
        ) : (
          <span key={`txt-${index}`}>{token.value}</span>
        )
      )}
    </p>
  );
}

export function AdSlot({ messages }) {
  const [ad, setAd] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAd() {
      try {
        const response = await fetch("/api/ads", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(messages.loadError);
        }

        if (!payload?.ad) {
          if (isMounted) {
            setAd(null);
            setError(messages.empty);
          }
          return;
        }

        if (isMounted) {
          setAd(payload.ad);
          setError("");
        }

        fetch("/api/ad-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ad_id: payload.ad.id, app_slug: "web" }),
        }).catch(() => null);
      } catch (loadError) {
        if (isMounted) {
          const message = loadError instanceof Error ? loadError.message : "";
          if (!message || message.toLowerCase().includes("failed to fetch ad")) {
            setError(messages.loadError);
          } else {
            setError(message);
          }
        }
      }
    }

    loadAd();

    return () => {
      isMounted = false;
    };
  }, [messages]);

  const mediaNode = useMemo(() => {
    if (!ad?.media_url) {
      return <div className="dribads-media-placeholder">{messages.missingMedia}</div>;
    }

    if (isVideo(ad.media_url)) {
      return (
        <video className="dribads-ad-media" controls playsInline preload="metadata">
          <source src={ad.media_url} />
        </video>
      );
    }

    // eslint-disable-next-line @next/next/no-img-element
    return <img src={ad.media_url} alt={ad.title} className="dribads-ad-media" loading="lazy" />;
  }, [ad, messages.missingMedia]);

  async function handleAdClick() {
    if (!ad) return;

    try {
      await fetch("/api/ad-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad_id: ad.id, app_slug: "web" }),
      });
    } catch {
      // Tracking failure should never block navigation.
    }

    window.open(ad.target_url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="dribads-card dribads-live-ad">
      <p className="dribads-kicker">{messages.kicker}</p>
      <h3 className="dribads-section-title">{messages.title}</h3>

      {error ? <p className="dribads-muted">{error}</p> : null}
      {!ad && !error ? <p className="dribads-muted">{messages.loading}</p> : null}

      {ad ? (
        <>
          <div className="dribads-ad-meta">
            <h4 className="dribads-ad-title">{ad.title}</h4>
            {ad.description ? <DescriptionText text={ad.description} /> : null}
            <p>
              {messages.budget}: ${Number(ad.budget || 0).toFixed(2)}
            </p>
          </div>
          <div className="dribads-ad-media-wrap">{mediaNode}</div>
          <button type="button" className="dribads-btn dribads-btn-primary" onClick={handleAdClick}>
            {messages.open}
          </button>
        </>
      ) : null}
    </section>
  );
}
