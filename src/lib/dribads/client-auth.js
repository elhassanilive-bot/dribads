"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export async function getBrowserAccessToken() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { token: "", user: null, error: "SUPABASE_NOT_CONFIGURED" };

  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.access_token || !data.session.user) {
    return { token: "", user: null, error: "UNAUTHORIZED" };
  }

  return {
    token: data.session.access_token,
    user: data.session.user,
    error: null,
  };
}

export async function authJsonFetch(url) {
  const auth = await getBrowserAccessToken();
  if (auth.error) {
    return { ok: false, status: 401, data: null, authError: auth.error };
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
    cache: "no-store",
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    authError: null,
    user: auth.user,
  };
}

export async function authFetch(url, options = {}) {
  const auth = await getBrowserAccessToken();
  if (auth.error) {
    return {
      ok: false,
      status: 401,
      authError: auth.error,
      response: null,
    };
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${auth.token}`);

  const response = await fetch(url, {
    ...options,
    headers,
    cache: options.cache || "no-store",
  });

  return {
    ok: response.ok,
    status: response.status,
    authError: null,
    response,
    user: auth.user,
  };
}
