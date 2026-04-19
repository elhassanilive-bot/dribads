"use client";

import { useEffect, useMemo, useState } from "react";
import { isValidHttpUrl, isValidStatus } from "@/lib/dribads/validators";
import { tokenizeTextWithLinks } from "@/lib/dribads/text";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AuthRequiredCard } from "@/components/dribads/auth-required-card";

const initialForm = {
  title: "",
  description: "",
  media_url: "",
  target_url: "",
  budget: "",
  status: "active",
  ad_placement: "pre_roll",
  skippable_enabled: true,
  skip_after_seconds: "5",
};

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

export function CreateAdForm({ messages }) {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaPath, setMediaPath] = useState("");

  const errors = useMemo(() => {
    const next = {};

    if (!form.media_url) {
      next.media_url = messages.validation.mediaRequired;
    } else if (!isValidHttpUrl(form.media_url)) {
      next.media_url = messages.validation.invalidMediaUrl;
    }

    if (form.target_url && !isValidHttpUrl(form.target_url)) {
      next.target_url = messages.validation.invalidTargetUrl;
    }

    if (form.budget && Number(form.budget) <= 0) {
      next.budget = messages.validation.invalidBudget;
    }

    if (form.status && !isValidStatus(form.status)) {
      next.status = messages.validation.invalidStatus;
    }

    return next;
  }, [form, messages]);

  const hasClientErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    async function syncAuthState() {
      if (!supabase) {
        if (mounted) {
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthenticated(Boolean(data?.session));
      setIsCheckingAuth(false);
    }

    syncAuthState();

    const { data: authSub } =
      supabase?.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(Boolean(session));
      }) || {};

    return () => {
      mounted = false;
      authSub?.subscription?.unsubscribe?.();
    };
  }, []);

  function onChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function onToggleSkippable(event) {
    const enabled = Boolean(event.target.checked);
    setForm((current) => ({ ...current, skippable_enabled: enabled }));
  }

  async function getAuthHeader() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return {};
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function removeUploadedMedia(showMessage = true) {
    if (!mediaPath) {
      setForm((current) => ({ ...current, media_url: "" }));
      return true;
    }

    setIsUploading(true);
    if (showMessage) {
      setStatus({ type: "", message: messages.upload.removing });
    }

    try {
      const authHeader = await getAuthHeader();
      const response = await fetch("/api/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ path: mediaPath }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || messages.upload.removeFailed);
      }

      setForm((current) => ({ ...current, media_url: "" }));
      setMediaPath("");

      if (showMessage) {
        setStatus({ type: "success", message: messages.upload.removed });
      }
      return true;
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : messages.upload.removeFailed,
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleMediaUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setStatus({ type: "error", message: messages.upload.typeError });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setStatus({ type: "error", message: messages.upload.sizeError });
      return;
    }

    setIsUploading(true);
    setStatus({ type: "", message: mediaPath ? messages.upload.replacing : "" });

    try {
      if (mediaPath) {
        const removed = await removeUploadedMedia(false);
        if (!removed) return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const authHeader = await getAuthHeader();
      const response = await fetch("/api/media/upload", {
        method: "POST",
        headers: authHeader,
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || messages.upload.failed);
      }

      setForm((current) => ({ ...current, media_url: payload.url || "" }));
      setMediaPath(payload.path || "");
      setStatus({ type: "success", message: messages.upload.done });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : messages.upload.failed,
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (hasClientErrors) {
      setStatus({ type: "error", message: messages.validation.fixErrors });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const authHeader = await getAuthHeader();
      const response = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          ...form,
          budget: Number(form.budget),
          skip_after_seconds: Number(form.skip_after_seconds || 5),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || messages.fallbackError);
      }

      setStatus({ type: "success", message: messages.success });
      setForm(initialForm);
      setMediaPath("");
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : messages.fallbackError,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingAuth) {
    return (
      <section className="dribads-card dribads-panel">
        <p className="dribads-note">{messages.loading || "Loading..."}</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthRequiredCard
        title={messages.title}
        message={messages.authRequired || "يجب تسجيل الدخول أولا لإنشاء إعلان."}
        loginLabel={messages.loginNow || "تسجيل الدخول"}
        signupLabel={messages.signupNow || "إنشاء حساب"}
        bullets={[
          messages.previewBenefit1 || "أنشئ حملاتك بسرعة وارفع الفيديو أو الصورة مباشرة.",
          messages.previewBenefit2 || "تابع النتائج من لوحة التحكم والأرباح في مكان واحد.",
        ]}
      />
    );
  }

  return (
    <section className="dribads-card dribads-panel">
      <p className="dribads-kicker">{messages.kicker}</p>
      <h1 className="dribads-section-title">{messages.title}</h1>

      <form onSubmit={handleSubmit} className="dribads-stack">
        <div className="dribads-form-grid">
          <label className="dribads-label">
            {messages.fields.title}
            <input name="title" value={form.title} onChange={onChange} required className="dribads-input" />
          </label>

          <label className="dribads-label">
            {messages.fields.description}
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              className="dribads-textarea"
              placeholder={messages.fields.descriptionPlaceholder}
              rows={4}
            />
          </label>

          <label className="dribads-label">
            {messages.fields.mediaFile}
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaUpload}
              className="dribads-input"
              disabled={isUploading || isSubmitting}
            />
            <span className="dribads-muted">{messages.upload.hint}</span>
            {form.media_url ? <span className="dribads-muted">{messages.upload.replaceHint}</span> : null}
            {form.media_url ? (
              <button
                type="button"
                className="dribads-btn dribads-btn-ghost dribads-btn-sm"
                onClick={() => removeUploadedMedia(true)}
                disabled={isUploading || isSubmitting}
              >
                {messages.upload.remove}
              </button>
            ) : null}
          </label>

          <label className="dribads-label">
            {messages.fields.mediaUrl}
            <input
              name="media_url"
              value={form.media_url}
              readOnly
              placeholder={messages.placeholder}
              className="dribads-input"
              disabled
            />
            {errors.media_url ? <span className="dribads-input-error">{errors.media_url}</span> : null}
          </label>

          <label className="dribads-label">
            {messages.fields.targetUrl}
            <input
              name="target_url"
              value={form.target_url}
              onChange={onChange}
              placeholder={messages.placeholder}
              required
              className="dribads-input"
            />
            <span className="dribads-muted">{messages.hints.targetUrl}</span>
            {errors.target_url ? <span className="dribads-input-error">{errors.target_url}</span> : null}
          </label>

          <label className="dribads-label">
            {messages.fields.budget}
            <input
              type="number"
              min="1"
              step="0.01"
              name="budget"
              value={form.budget}
              onChange={onChange}
              required
              className="dribads-input"
            />
            {errors.budget ? <span className="dribads-input-error">{errors.budget}</span> : null}
          </label>

          <label className="dribads-label">
            {messages.fields.status}
            <select
              name="status"
              value={form.status}
              onChange={onChange}
              className="dribads-select"
            >
              <option value="active">{messages.status.active}</option>
              <option value="paused">{messages.status.paused}</option>
              <option value="draft">{messages.status.draft}</option>
            </select>
            {errors.status ? <span className="dribads-input-error">{errors.status}</span> : null}
          </label>

          <label className="dribads-label">
            {messages.fields.placement || "موضع الإعلان"}
            <select name="ad_placement" value={form.ad_placement} onChange={onChange} className="dribads-select">
              <option value="pre_roll">{messages.fields.preRoll || "قبل تشغيل الفيديو"}</option>
              <option value="post_roll">{messages.fields.postRoll || "نهاية الفيديو"}</option>
              <option value="both">{messages.fields.bothRolls || "قبل + نهاية"}</option>
            </select>
          </label>

          <label className="dribads-label">
            {messages.fields.skipAfterSeconds || "تخطي بعد (ثانية)"}
            <input
              type="number"
              min="0"
              max="30"
              step="1"
              name="skip_after_seconds"
              value={form.skip_after_seconds}
              onChange={onChange}
              className="dribads-input"
              disabled={!form.skippable_enabled}
            />
          </label>

          <label className="dribads-label">
            {messages.fields.skippable || "الإعلان قابل للتخطي"}
            <input
              type="checkbox"
              checked={Boolean(form.skippable_enabled)}
              onChange={onToggleSkippable}
              className="dribads-checkbox"
            />
          </label>
        </div>

        <div className="dribads-ad-preview">
          <p className="dribads-kicker">{messages.preview.kicker}</p>
          <h3 className="dribads-ad-title">{form.title || messages.preview.defaultTitle}</h3>
          {form.description ? <DescriptionText text={form.description} /> : null}
          {form.media_url && isValidHttpUrl(form.media_url) ? (
            isVideo(form.media_url) ? (
              <video className="dribads-ad-media" controls playsInline preload="metadata">
                <source src={form.media_url} />
              </video>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.media_url} alt={form.title || "Ad preview"} className="dribads-ad-media" loading="lazy" />
            )
          ) : (
            <p className="dribads-muted">{messages.preview.hint}</p>
          )}
        </div>

        {status.message ? (
          <p
            className={`dribads-feedback ${
              status.type === "error" ? "dribads-feedback-error" : "dribads-feedback-success"
            }`}
          >
            {status.message}
          </p>
        ) : null}

        <button
          type="submit"
          className="dribads-btn dribads-btn-primary"
          disabled={isSubmitting || hasClientErrors || isUploading}
        >
          {isUploading ? messages.upload.uploading : isSubmitting ? messages.publishing : messages.publish}
        </button>
      </form>
    </section>
  );
}
