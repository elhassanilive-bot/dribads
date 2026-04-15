"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ensureIdentityMetadata } from "@/lib/dribads/identity";

export function LoginForm({ messages }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!supabase) return undefined;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data?.session) {
        router.replace("/account");
      }
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/account");
      }
    });

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
    };
  }, [router, supabase]);

  async function syncIdentity(user) {
    const normalized = ensureIdentityMetadata(user);
    if (normalized.changed) {
      await supabase.auth.updateUser({ data: normalized.metadata });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!supabase) {
      setStatus({
        type: "error",
        message: messages.notConfigured,
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: "", message: "" });

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data?.user) {
          await syncIdentity(data.user);
        }
        setStatus({ type: "success", message: messages.successLogin });
        router.replace("/account");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim() || email.split("@")[0],
              avatar_url: avatarUrl.trim() || null,
            },
          },
        });
        if (error) throw error;
        if (data?.user) {
          await syncIdentity(data.user);
        }
        setStatus({ type: "success", message: messages.successSignup });
        if (data?.session) {
          router.replace("/account");
        }
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : messages.fallbackError,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="dribads-card dribads-auth-card">
      <p className="dribads-kicker">{messages.kicker}</p>
      <h1 className="dribads-section-title">{messages.title}</h1>
      <p className="dribads-note">{messages.note}</p>

      <div className="dribads-auth-toggle">
        <button type="button" onClick={() => setMode("login")} data-active={mode === "login"}>
          {messages.modeLogin}
        </button>
        <button type="button" onClick={() => setMode("signup")} data-active={mode === "signup"}>
          {messages.modeSignup}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="dribads-stack">
        {mode === "signup" ? (
          <>
            <label className="dribads-label">
              {messages.fullName}
              <input
                type="text"
                className="dribads-input"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                minLength={2}
                required
              />
            </label>

            <label className="dribads-label">
              {messages.avatarUrl}
              <input
                type="url"
                className="dribads-input"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://..."
              />
            </label>
          </>
        ) : null}

        <label className="dribads-label">
          {messages.email}
          <input
            type="email"
            className="dribads-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="dribads-label">
          {messages.password}
          <input
            type="password"
            className="dribads-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
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

        <button type="submit" className="dribads-btn dribads-btn-primary" disabled={isLoading}>
          {isLoading ? messages.submitting : mode === "login" ? messages.submitLogin : messages.submitSignup}
        </button>
      </form>
    </section>
  );
}
