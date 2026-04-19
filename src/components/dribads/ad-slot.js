"use client";

import { useEffect, useState } from "react";
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
  const [placement, setPlacement] = useState("pre_roll");
  const [canSkip, setCanSkip] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let skipTimer = null;

    async function loadAd(nextPlacement = "pre_roll") {
      try {
        const response = await fetch(`/api/ads?placement=${encodeURIComponent(nextPlacement)}`, { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(messages.loadError);
        }

        if (!payload?.ad) {
          if (isMounted) {
            setAd(null);
            setError(messages.empty);
            setCanSkip(false);
            setSkipCountdown(0);
          }
          return;
        }

        if (isMounted) {
          setAd(payload.ad);
          setPlacement(nextPlacement);
          setError("");
          const adCanSkip = Boolean(payload.ad?.playback?.skippable);
          const adSkipAfter = Number(payload.ad?.playback?.skipAfterSeconds || 0);
          setCanSkip(!adCanSkip || adSkipAfter <= 0);
          setSkipCountdown(adCanSkip ? adSkipAfter : 0);

          if (skipTimer) clearInterval(skipTimer);
          if (adCanSkip && adSkipAfter > 0) {
            skipTimer = setInterval(() => {
              setSkipCountdown((prev) => {
                if (prev <= 1) {
                  setCanSkip(true);
                  if (skipTimer) clearInterval(skipTimer);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }
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
      if (skipTimer) clearInterval(skipTimer);
    };
  }, [messages]);

  let mediaNode = <div className="dribads-media-placeholder">{messages.missingMedia}</div>;
  if (ad?.media_url) {
    if (isVideo(ad.media_url)) {
      mediaNode = (
        <video className="dribads-ad-media" controls playsInline preload="metadata" onEnded={handleVideoEnded}>
          <source src={ad.media_url} />
        </video>
      );
    } else {
      // eslint-disable-next-line @next/next/no-img-element
      mediaNode = <img src={ad.media_url} alt={ad.title} className="dribads-ad-media" loading="lazy" />;
    }
  }

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

  async function handleSkip() {
    if (!ad || !canSkip) return;
    try {
      await fetch("/api/ad-skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad_id: ad.id, app_slug: "web" }),
      });
    } catch {
      // Skip tracking failure should not break UX.
    }
    setAd(null);
    setError("");
  }

  async function handleVideoEnded() {
    if (!ad) return;
    try {
      await fetch("/api/ad-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad_id: ad.id, app_slug: "web" }),
      });
    } catch {
      // Completion tracking failure should not break UX.
    }

    if (placement === "pre_roll") {
      try {
        const response = await fetch("/api/ads?placement=post_roll", { cache: "no-store" });
        const payload = await response.json();
        if (response.ok && payload?.ad) {
          setAd(payload.ad);
          setPlacement("post_roll");
          const adCanSkip = Boolean(payload.ad?.playback?.skippable);
          const adSkipAfter = Number(payload.ad?.playback?.skipAfterSeconds || 0);
          setCanSkip(!adCanSkip || adSkipAfter <= 0);
          setSkipCountdown(adCanSkip ? adSkipAfter : 0);
          return;
        }
      } catch {
        // Ignore and close ad slot.
      }
    }

    setAd(null);
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
          {ad?.playback?.skippable ? (
            <button
              type="button"
              className="dribads-btn dribads-btn-ghost dribads-btn-sm"
              onClick={handleSkip}
              disabled={!canSkip}
            >
              {canSkip
                ? messages.skipNow || "تخطي الإعلان"
                : `${messages.skipIn || "تخطي خلال"} ${skipCountdown}s`}
            </button>
          ) : null}
          <button type="button" className="dribads-btn dribads-btn-primary" onClick={handleAdClick}>
            {messages.open}
          </button>
        </>
      ) : null}
    </section>
  );
}
