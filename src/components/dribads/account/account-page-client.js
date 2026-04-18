"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ensureIdentityMetadata } from "@/lib/dribads/identity";

function getInitials(name, email) {
  const source = (name || email || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

const EMPTY_FORM = {
  fullName: "",
  merchantId: "",
  country: "",
  companyName: "",
  paymentMethod: "bank_transfer",
  payoutEmail: "",
  publisherType: "individual",
  kycStatus: "pending",
};

export function AccountPageClient({ messages }) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setStatus({ type: "error", message: messages.notConfigured });
      return;
    }

    let mounted = true;

    async function bootstrap() {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;

      if (error || !data?.user) {
        router.replace("/login");
        return;
      }

      const normalized = ensureIdentityMetadata(data.user);
      if (normalized.changed) {
        await supabase.auth.updateUser({ data: normalized.metadata });
      }

      const { data: fresh } = await supabase.auth.getUser();
      const currentUser = fresh?.user || data.user;
      const metadata = currentUser.user_metadata || {};

      const db = supabase.schema("dribads");
      const { data: profile } = await db
        .from("publisher_profiles")
        .select("full_name, country, company_name, payment_method, payout_email, publisher_type, kyc_status")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!profile) {
        await db.from("publisher_profiles").upsert(
          {
            user_id: currentUser.id,
            full_name: metadata.full_name || "",
            payout_email: currentUser.email || "",
            payment_method: "bank_transfer",
            publisher_type: "individual",
            kyc_status: metadata.kyc_status || "pending",
          },
          { onConflict: "user_id" }
        );
      }

      const resolvedProfile = profile || {};
      setUser(currentUser);
      setForm({
        fullName: resolvedProfile.full_name || metadata.full_name || "",
        merchantId: metadata.merchant_id || "",
        country: resolvedProfile.country || "",
        companyName: resolvedProfile.company_name || "",
        paymentMethod: resolvedProfile.payment_method || "bank_transfer",
        payoutEmail: resolvedProfile.payout_email || currentUser.email || "",
        publisherType: resolvedProfile.publisher_type || "individual",
        kycStatus: resolvedProfile.kyc_status || metadata.kyc_status || "pending",
      });
      setIsLoading(false);
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [messages.notConfigured, router, supabase]);

  async function handleSave(event) {
    event.preventDefault();
    if (!supabase || !user) return;

    setIsSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const currentMeta = user.user_metadata || {};
      const metadataPayload = {
        ...currentMeta,
        full_name: form.fullName.trim(),
        merchant_id: form.merchantId.trim() || currentMeta.merchant_id,
      };

      const { error: authError } = await supabase.auth.updateUser({ data: metadataPayload });
      if (authError) throw authError;

      const db = supabase.schema("dribads");
      const { error: profileError } = await db.from("publisher_profiles").upsert(
        {
          user_id: user.id,
          full_name: form.fullName.trim(),
          country: form.country.trim(),
          company_name: form.companyName.trim(),
          payment_method: form.paymentMethod,
          payout_email: form.payoutEmail.trim(),
          publisher_type: form.publisherType,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (profileError) throw profileError;

      const { data: fresh } = await supabase.auth.getUser();
      setUser(fresh?.user || user);
      setStatus({ type: "success", message: messages.saved });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : messages.saveError,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <section className="dribads-card dribads-account-card">
        <p className="dribads-note">{messages.loading}</p>
      </section>
    );
  }

  if (!user) return null;

  const metadata = user.user_metadata || {};
  const avatar = metadata.avatar_url || "";
  const publisherId = metadata.publisher_id || "-";
  const merchantId = form.merchantId || metadata.merchant_id || "-";
  const fullName = form.fullName || metadata.full_name || "";
  const kycKey = form.kycStatus in messages.kyc ? form.kycStatus : "pending";

  return (
    <section className="dribads-card dribads-account-card">
      <p className="dribads-kicker">{messages.kicker}</p>
      <h1 className="dribads-section-title">{messages.title}</h1>
      <p className="dribads-note">{messages.note}</p>

      <div className="dribads-account-head">
        {avatar ? (
          <img src={avatar} alt={fullName || user.email || "avatar"} className="dribads-account-avatar" />
        ) : (
          <div className="dribads-account-avatar dribads-account-avatar-fallback">
            {getInitials(fullName, user.email)}
          </div>
        )}

        <div className="dribads-stack">
          <p className="dribads-account-name">{fullName || messages.noName}</p>
          <p className="dribads-muted">{user.email}</p>
          <p className="dribads-muted">
            {messages.kycLabel}: {messages.kyc[kycKey]}
          </p>
        </div>
      </div>

      <div className="dribads-account-ids">
        <article className="dribads-card">
          <p className="dribads-muted">{messages.publisherId}</p>
          <p className="dribads-account-id">{publisherId}</p>
        </article>
        <article className="dribads-card">
          <p className="dribads-muted">{messages.merchantId}</p>
          <p className="dribads-account-id">{merchantId}</p>
        </article>
      </div>

      <form onSubmit={handleSave} className="dribads-stack">
        <label className="dribads-label">
          {messages.fullName}
          <input
            type="text"
            className="dribads-input"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            minLength={2}
            required
          />
        </label>

        <label className="dribads-label">
          {messages.merchantId}
          <input
            type="text"
            className="dribads-input"
            value={form.merchantId}
            onChange={(event) => setForm((prev) => ({ ...prev, merchantId: event.target.value }))}
          />
        </label>

        <label className="dribads-label">
          {messages.country}
          <input
            type="text"
            className="dribads-input"
            value={form.country}
            onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
          />
        </label>

        <label className="dribads-label">
          {messages.company}
          <input
            type="text"
            className="dribads-input"
            value={form.companyName}
            onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
          />
        </label>

        <label className="dribads-label">
          {messages.publisherType}
          <select
            className="dribads-select"
            value={form.publisherType}
            onChange={(event) => setForm((prev) => ({ ...prev, publisherType: event.target.value }))}
          >
            <option value="individual">{messages.publisherTypes.individual}</option>
            <option value="company">{messages.publisherTypes.company}</option>
          </select>
        </label>

        <label className="dribads-label">
          {messages.paymentMethod}
          <select
            className="dribads-select"
            value={form.paymentMethod}
            onChange={(event) => setForm((prev) => ({ ...prev, paymentMethod: event.target.value }))}
          >
            <option value="bank_transfer">{messages.paymentMethods.bank_transfer}</option>
            <option value="paypal">{messages.paymentMethods.paypal}</option>
            <option value="payoneer">{messages.paymentMethods.payoneer}</option>
            <option value="crypto">{messages.paymentMethods.crypto}</option>
          </select>
        </label>

        <label className="dribads-label">
          {messages.payoutEmail}
          <input
            type="email"
            className="dribads-input"
            value={form.payoutEmail}
            onChange={(event) => setForm((prev) => ({ ...prev, payoutEmail: event.target.value }))}
            required
          />
        </label>

        {status.message ? (
          <p
            className={`dribads-feedback ${
              status.type === "error" ? "dribads-feedback-error" : "dribads-feedback-success"
            }`}
          >
            {status.message}
          </p>
        ) : null}

        <div className="dribads-toolbar-actions">
          <button type="submit" className="dribads-btn dribads-btn-primary" disabled={isSaving}>
            {isSaving ? messages.saving : messages.save}
          </button>
          <button type="button" className="dribads-btn dribads-btn-ghost" onClick={handleLogout}>
            {messages.logout}
          </button>
        </div>
      </form>
    </section>
  );
}
