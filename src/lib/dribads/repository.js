import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { processPayoutWithGateway } from "@/lib/dribads/payout-gateways";

const DRIBADS_SCHEMA = "dribads";
const ESTIMATED_CPC = Number(process.env.DRIBADS_ESTIMATED_CPC || 0.05);
const ALLOWED_STATUSES = new Set(["active", "paused", "draft"]);
const SUPPORTED_PAYOUT_METHODS = new Set(["paypal", "perfect_money", "vodafone_cash"]);
const REQUIRED_TABLES = ["ads", "ad_views", "ad_clicks"];
const ADS_SELECT_WITH_DESCRIPTION = "id, title, description, media_url, target_url, budget, status, created_at";
const ADS_SELECT_NO_DESCRIPTION = "id, title, media_url, target_url, budget, status, created_at";

let schemaCache = {
  ok: false,
  checkedAt: 0,
};

function normalizeAppSlug(value) {
  if (!value || typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "all") return null;
  return normalized;
}

function toDateKey(date) {
  const iso = date.toISOString();
  return iso.slice(0, 10);
}

function buildDateBuckets(days) {
  const today = new Date();
  const buckets = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets.push({ key: toDateKey(d), date: d });
  }

  return buckets;
}

function isMissingDescriptionError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("description") && message.includes("does not exist");
}

function isMissingTableError(error, tableName) {
  const message = String(error?.message || "").toLowerCase();
  return (
    (message.includes("relation") && message.includes("does not exist")) ||
    (tableName ? message.includes(tableName.toLowerCase()) : false)
  );
}

function mapAdRow(row) {
  return {
    ...row,
    description: row?.description || "",
  };
}

function hasLikelyEncodingCorruption(text) {
  const value = String(text || "");
  if (!value) return false;

  const questionMarks = (value.match(/\?/g) || []).length;
  const ratio = questionMarks / Math.max(value.length, 1);
  const mojibakeChars = (value.match(/[ØÙÃÂ]/g) || []).length;
  const mojibakeRatio = mojibakeChars / Math.max(value.length, 1);

  // Heuristic: "????" bursts, high "?" ratio, or common UTF8->latin1 mojibake chars.
  return value.includes("????") || ratio >= 0.35 || mojibakeRatio >= 0.08 || mojibakeChars >= 4;
}

function isDeliverableAdRow(row) {
  if (!row) return false;
  return !hasLikelyEncodingCorruption(row.title) && !hasLikelyEncodingCorruption(row.description);
}

function buildCountMap(rows) {
  return (rows || []).reduce((acc, row) => {
    const adId = row.ad_id;
    if (!adId) return acc;
    acc[adId] = (acc[adId] || 0) + 1;
    return acc;
  }, {});
}

async function ensureDribadsSetup() {
  const now = Date.now();
  if (schemaCache.ok && now - schemaCache.checkedAt < 5 * 60 * 1000) {
    return;
  }

  const supabase = await getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const db = supabase.schema(DRIBADS_SCHEMA);

  for (const table of REQUIRED_TABLES) {
    const { error } = await db.from(table).select("id", { count: "exact", head: true });

    if (error) {
      const message = String(error.message || "").toLowerCase();

      if (
        message.includes("schema must be one of") ||
        message.includes("relation") ||
        message.includes("does not exist")
      ) {
        throw new Error("DRIBADS_TABLES_MISSING");
      }

      if (message.includes("permission") || message.includes("jwt") || message.includes("apikey")) {
        throw new Error("SUPABASE_NOT_CONFIGURED");
      }

      throw error;
    }
  }

  schemaCache = { ok: true, checkedAt: now };
}

async function getSchemaClient() {
  const supabase = await getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin client is not configured");
  }
  return supabase.schema(DRIBADS_SCHEMA);
}

async function resolveAppContext({ appSlug, appKey, requireValidAppKey = false } = {}) {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const normalizedSlug = normalizeAppSlug(appSlug);
  const normalizedKey = typeof appKey === "string" ? appKey.trim() : "";

  try {
    if (normalizedKey) {
      const { data, error } = await db
        .from("apps")
        .select("id, slug, name, api_key, is_active")
        .eq("api_key", normalizedKey)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        if (normalizedSlug && !requireValidAppKey) {
          // Fallback to slug when app key is stale/missing on client integrations.
          // This keeps ad delivery and tracking working for app-specific analytics.
          const { data: slugData, error: slugError } = await db
            .from("apps")
            .select("id, slug, name, api_key, is_active")
            .eq("slug", normalizedSlug)
            .eq("is_active", true)
            .maybeSingle();
          if (slugError) throw slugError;
          if (slugData) return slugData;
        }
        throw new Error("INVALID_APP_KEY");
      }
      if (normalizedSlug && data.slug !== normalizedSlug) {
        if (!requireValidAppKey) {
          const { data: slugData, error: slugError } = await db
            .from("apps")
            .select("id, slug, name, api_key, is_active")
            .eq("slug", normalizedSlug)
            .eq("is_active", true)
            .maybeSingle();
          if (slugError) throw slugError;
          if (slugData) return slugData;
        }
        throw new Error("APP_KEY_SLUG_MISMATCH");
      }
      return data;
    }

    if (!normalizedSlug) {
      return null;
    }

    const { data, error } = await db
      .from("apps")
      .select("id, slug, name, api_key, is_active")
      .eq("slug", normalizedSlug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("APP_NOT_FOUND");
    return data;
  } catch (error) {
    if (isMissingTableError(error, "apps")) {
      if (normalizedSlug) {
        return { id: null, slug: normalizedSlug, name: normalizedSlug, api_key: null, is_active: true };
      }
      return null;
    }
    throw error;
  }
}

async function getAdsRows() {
  const db = await getSchemaClient();
  const withDescription = await db.from("ads").select(ADS_SELECT_WITH_DESCRIPTION).order("created_at", { ascending: false });
  if (!withDescription.error) return withDescription.data || [];
  if (!isMissingDescriptionError(withDescription.error)) throw withDescription.error;

  const fallback = await db.from("ads").select(ADS_SELECT_NO_DESCRIPTION).order("created_at", { ascending: false });
  if (fallback.error) throw fallback.error;
  return fallback.data || [];
}

export async function getApps() {
  await ensureDribadsSetup();
  const db = await getSchemaClient();

  try {
    const { data, error } = await db
      .from("apps")
      .select("id, slug, name, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) throw error;
    return (data || [])
      .filter((app) => app.slug !== "web")
      .map((app) => ({
        ...app,
        name: app.slug === "dixard" ? "Dexard" : app.name,
      }));
  } catch (error) {
    if (isMissingTableError(error, "apps")) {
      return [];
    }
    throw error;
  }
}

export async function getMonetizationFeatures(appSlug) {
  const app = await resolveAppContext({ appSlug });
  if (!app?.id) {
    return {
      app: app ? { slug: app.slug, name: app.name } : null,
      features: {
        video_monetization_enabled: true,
        rewards_enabled: true,
        subscriptions_enabled: true,
        ads_enabled: true,
        gifts_enabled: true,
        live_stream_enabled: true,
      },
    };
  }

  const db = await getSchemaClient();
  try {
    const { data, error } = await db
      .from("app_monetization_features")
      .select(
        "video_monetization_enabled, rewards_enabled, subscriptions_enabled, ads_enabled, gifts_enabled, live_stream_enabled, min_payout, payout_cycle_days"
      )
      .eq("app_id", app.id)
      .maybeSingle();
    if (error) throw error;

    return {
      app: { slug: app.slug, name: app.name },
      features: data || {
        video_monetization_enabled: true,
        rewards_enabled: true,
        subscriptions_enabled: true,
        ads_enabled: true,
        gifts_enabled: true,
        live_stream_enabled: true,
        min_payout: 10,
        payout_cycle_days: 30,
      },
    };
  } catch (error) {
    if (isMissingTableError(error, "app_monetization_features")) {
      return {
        app: { slug: app.slug, name: app.name },
        features: {
          video_monetization_enabled: true,
          rewards_enabled: true,
          subscriptions_enabled: true,
          ads_enabled: true,
          gifts_enabled: true,
          live_stream_enabled: true,
          min_payout: 10,
          payout_cycle_days: 30,
        },
      };
    }
    throw error;
  }
}

export async function getFirstAd() {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const withDescription = await db
    .from("ads")
    .select(ADS_SELECT_WITH_DESCRIPTION)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!withDescription.error) {
    const mapped = (withDescription.data || []).map(mapAdRow);
    const clean = mapped.filter(isDeliverableAdRow);
    return clean[0] || mapped[0] || null;
  }
  if (!isMissingDescriptionError(withDescription.error)) throw withDescription.error;

  const fallback = await db
    .from("ads")
    .select(ADS_SELECT_NO_DESCRIPTION)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);
  if (fallback.error) throw fallback.error;
  const mapped = (fallback.data || []).map(mapAdRow);
  const clean = mapped.filter(isDeliverableAdRow);
  return clean[0] || mapped[0] || null;
}

export async function getDeliverableAd(strategy = "random") {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const withDescription = await db
    .from("ads")
    .select(ADS_SELECT_WITH_DESCRIPTION)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);

  let data = withDescription.data;
  let error = withDescription.error;
  if (error && isMissingDescriptionError(error)) {
    const fallback = await db
      .from("ads")
      .select(ADS_SELECT_NO_DESCRIPTION)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50);
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  if (!data?.length) return null;
  const mapped = data.map(mapAdRow);
  const clean = mapped.filter(isDeliverableAdRow);
  const candidates = clean.length ? clean : mapped;
  if (!candidates.length) return null;
  if (strategy !== "random") return candidates[0];

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

export async function createAd(input) {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const payload = {
    title: input.title,
    description: input.description || "",
    media_url: input.media_url,
    target_url: input.target_url,
    budget: input.budget,
    status: input.status && ALLOWED_STATUSES.has(input.status) ? input.status : "active",
  };

  const withDescription = await db.from("ads").insert(payload).select(ADS_SELECT_WITH_DESCRIPTION).single();
  if (!withDescription.error) return mapAdRow(withDescription.data);
  if (!isMissingDescriptionError(withDescription.error)) throw withDescription.error;

  const payloadFallback = {
    title: input.title,
    media_url: input.media_url,
    target_url: input.target_url,
    budget: input.budget,
    status: input.status && ALLOWED_STATUSES.has(input.status) ? input.status : "active",
  };
  const fallback = await db.from("ads").insert(payloadFallback).select(ADS_SELECT_NO_DESCRIPTION).single();
  if (fallback.error) throw fallback.error;
  return mapAdRow(fallback.data);
}

export async function updateAdStatus(adId, status) {
  if (!ALLOWED_STATUSES.has(status)) {
    throw new Error("Invalid status");
  }

  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const { data, error } = await db
    .from("ads")
    .update({ status })
    .eq("id", adId)
    .select("id, status")
    .single();

  if (error) throw error;
  return data;
}

export async function recordAdView(adId, context = {}) {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const app = await resolveAppContext(context);
  const payload = {
    ad_id: adId,
    app_id: app?.id || null,
  };
  const { error } = await db.from("ad_views").insert(payload);
  if (error) throw error;
  return { ok: true, app: app ? { slug: app.slug, name: app.name } : null };
}

export async function recordAdClick(adId, context = {}) {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const app = await resolveAppContext(context);
  const payload = {
    ad_id: adId,
    app_id: app?.id || null,
  };
  const { error } = await db.from("ad_clicks").insert(payload);
  if (error) throw error;
  return { ok: true, app: app ? { slug: app.slug, name: app.name } : null };
}

async function getDashboardAds(appId = null) {
  const db = await getSchemaClient();
  const ads = await getAdsRows();

  const adIds = ads.map((ad) => ad.id);
  if (!adIds.length) return [];

  let viewsQuery = db.from("ad_views").select("ad_id").in("ad_id", adIds);
  let clicksQuery = db.from("ad_clicks").select("ad_id").in("ad_id", adIds);

  if (appId) {
    viewsQuery = viewsQuery.eq("app_id", appId);
    clicksQuery = clicksQuery.eq("app_id", appId);
  }

  const [{ data: viewRows, error: viewsError }, { data: clickRows, error: clicksError }] =
    await Promise.all([viewsQuery, clicksQuery]);

  if (viewsError) throw viewsError;
  if (clicksError) throw clicksError;

  const viewMap = buildCountMap(viewRows);
  const clickMap = buildCountMap(clickRows);

  return ads.map((ad) => ({
    ...mapAdRow(ad),
    views: viewMap[ad.id] || 0,
    clicks: clickMap[ad.id] || 0,
  }));
}

export async function getDashboardData(options = {}) {
  await ensureDribadsSetup();
  const app = await resolveAppContext({ appSlug: options?.appSlug, appKey: options?.appKey });
  const appId = app?.id || null;
  const adsWithStats = await getDashboardAds(appId);

  let totalViews = 0;
  let totalClicks = 0;
  for (const ad of adsWithStats) {
    totalViews += Number(ad.views || 0);
    totalClicks += Number(ad.clicks || 0);
  }

  return {
    totalViews,
    totalClicks,
    balance: Number((totalClicks * ESTIMATED_CPC).toFixed(2)),
    estimatedCpc: ESTIMATED_CPC,
    ads: adsWithStats,
    app: app ? { slug: app.slug, name: app.name } : null,
  };
}

export async function getAnalyticsData(days = 14, options = {}) {
  await ensureDribadsSetup();
  const app = await resolveAppContext({ appSlug: options?.appSlug, appKey: options?.appKey });
  const appId = app?.id || null;
  const db = await getSchemaClient();

  const buckets = buildDateBuckets(days);
  const start = new Date(buckets[0].date);
  start.setHours(0, 0, 0, 0);

  let viewsQuery = db.from("ad_views").select("created_at").gte("created_at", start.toISOString());
  let clicksQuery = db.from("ad_clicks").select("created_at").gte("created_at", start.toISOString());

  if (appId) {
    viewsQuery = viewsQuery.eq("app_id", appId);
    clicksQuery = clicksQuery.eq("app_id", appId);
  }

  const [{ data: views, error: viewsError }, { data: clicks, error: clicksError }] = await Promise.all([
    viewsQuery,
    clicksQuery,
  ]);

  if (viewsError) throw viewsError;
  if (clicksError) throw clicksError;

  const viewMap = {};
  const clickMap = {};

  for (const row of views || []) {
    const key = toDateKey(new Date(row.created_at));
    viewMap[key] = (viewMap[key] || 0) + 1;
  }

  for (const row of clicks || []) {
    const key = toDateKey(new Date(row.created_at));
    clickMap[key] = (clickMap[key] || 0) + 1;
  }

  return buckets.map((bucket) => ({
    date: bucket.key,
    views: viewMap[bucket.key] || 0,
    clicks: clickMap[bucket.key] || 0,
  }));
}

function roundMoney(value) {
  return Number((Number(value || 0)).toFixed(2));
}

function normalizePayoutMethod(value) {
  const method = String(value || "").trim().toLowerCase();
  if (!SUPPORTED_PAYOUT_METHODS.has(method)) {
    throw new Error("INVALID_PAYOUT_METHOD");
  }
  return method;
}

function normalizePayoutDestination(value) {
  const destination = String(value || "").trim();
  if (!destination || destination.length < 3 || destination.length > 160) {
    throw new Error("INVALID_PAYOUT_DESTINATION");
  }
  return destination;
}

export async function getPayoutsData(options = {}) {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const app = await resolveAppContext({ appSlug: options?.appSlug, appKey: options?.appKey });

  if (!app?.id) {
    return {
      app: app ? { slug: app.slug, name: app.name } : null,
      overview: {
        minPayout: 10,
        payoutCycleDays: 30,
        totalEarned: 0,
        totalPaid: 0,
        totalPending: 0,
        availableToWithdraw: 0,
      },
      requests: [],
    };
  }

  const [dashboard, monetization, requestsRes] = await Promise.all([
    getDashboardData({ appSlug: app.slug }),
    getMonetizationFeatures(app.slug),
    db
      .from("payout_requests")
      .select(
        "id, amount, status, note, payout_method, payout_destination, provider_ref, provider_status, error_message, requested_at, processed_at"
      )
      .eq("app_id", app.id)
      .order("requested_at", { ascending: false })
      .limit(30),
  ]);

  if (requestsRes.error) {
    if (!isMissingTableError(requestsRes.error, "payout_requests")) {
      throw requestsRes.error;
    }
  }

  const rows = requestsRes.data || [];
  const totalPending = rows
    .filter((row) => row.status === "pending" || row.status === "approved")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalPaid = rows
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const totalEarned = Number(dashboard.balance || 0);
  const availableToWithdraw = Math.max(0, totalEarned - totalPending);

  return {
    app: { slug: app.slug, name: app.name },
    overview: {
      minPayout: Number(monetization.features?.min_payout || 10),
      payoutCycleDays: Number(monetization.features?.payout_cycle_days || 30),
      totalEarned: roundMoney(totalEarned),
      totalPaid: roundMoney(totalPaid),
      totalPending: roundMoney(totalPending),
      availableToWithdraw: roundMoney(availableToWithdraw),
    },
    requests: rows,
  };
}

export async function createPayoutRequest(input = {}) {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const app = await resolveAppContext({
    appSlug: input?.appSlug,
    appKey: input?.appKey,
    requireValidAppKey: true,
  });
  if (!app?.id) throw new Error("APP_NOT_FOUND");

  const amount = Number(input?.amount || 0);
  const payoutMethod = normalizePayoutMethod(input?.payoutMethod || input?.method);
  const payoutDestination = normalizePayoutDestination(
    input?.payoutDestination || input?.destination || input?.payoutEmail || ""
  );
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("INVALID_PAYOUT_AMOUNT");
  }

  const payoutData = await getPayoutsData({ appSlug: app.slug });
  const minPayout = Number(payoutData.overview.minPayout || 10);
  const available = Number(payoutData.overview.availableToWithdraw || 0);

  if (amount < minPayout) {
    throw new Error("PAYOUT_BELOW_MINIMUM");
  }
  if (amount > available) {
    throw new Error("PAYOUT_EXCEEDS_AVAILABLE");
  }

  const payload = {
    app_id: app.id,
    amount: roundMoney(amount),
    status: "pending",
    note: String(input?.note || "").slice(0, 500),
    payout_method: payoutMethod,
    payout_destination: payoutDestination,
    provider_status: "queued",
  };

  const { data, error } = await db
    .from("payout_requests")
    .insert(payload)
    .select(
      "id, amount, status, note, payout_method, payout_destination, provider_ref, provider_status, error_message, requested_at, processed_at"
    )
    .single();

  if (error) {
    if (isMissingTableError(error, "payout_requests")) {
      throw new Error("PAYOUTS_TABLE_MISSING");
    }
    throw error;
  }

  let gatewayResult = null;
  try {
    gatewayResult = await processPayoutWithGateway({
      method: payoutMethod,
      requestId: data.id,
      appSlug: app.slug,
      amount: payload.amount,
      destination: payoutDestination,
      note: payload.note,
    });
  } catch (gatewayError) {
    gatewayResult = {
      success: false,
      providerStatus: "failed",
      errorMessage: gatewayError instanceof Error ? gatewayError.message : "PAYOUT_GATEWAY_ERROR",
    };
  }

  const updatePayload = gatewayResult?.success
    ? {
        status: "approved",
        provider_ref: gatewayResult.providerRef || null,
        provider_status: gatewayResult.providerStatus || "submitted",
        error_message: "",
        processed_at: new Date().toISOString(),
      }
    : {
        status: "rejected",
        provider_status: gatewayResult?.providerStatus || "failed",
        error_message: String(gatewayResult?.errorMessage || "PAYOUT_GATEWAY_ERROR").slice(0, 500),
        processed_at: new Date().toISOString(),
      };

  const { data: updatedRequest, error: updateError } = await db
    .from("payout_requests")
    .update(updatePayload)
    .eq("id", data.id)
    .select(
      "id, amount, status, note, payout_method, payout_destination, provider_ref, provider_status, error_message, requested_at, processed_at"
    )
    .single();

  if (updateError) throw updateError;

  return {
    app: { slug: app.slug, name: app.name },
    request: updatedRequest,
    gateway: {
      success: Boolean(gatewayResult?.success),
      providerStatus: gatewayResult?.providerStatus || "unknown",
      providerRef: gatewayResult?.providerRef || null,
      errorMessage: gatewayResult?.errorMessage || null,
    },
  };
}
