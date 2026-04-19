import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { processPayoutWithGateway } from "@/lib/dribads/payout-gateways";

const DRIBADS_SCHEMA = "dribads";
const ESTIMATED_CPC = Number(process.env.DRIBADS_ESTIMATED_CPC || 0.05);
const DRIBADS_CLICK_PAYOUT_CPC = Number(process.env.DRIBADS_CLICK_PAYOUT_CPC || ESTIMATED_CPC || 0.05);
const ALLOWED_STATUSES = new Set(["active", "paused", "draft"]);
const SUPPORTED_PAYOUT_METHODS = new Set(["paypal", "perfect_money", "vodafone_cash"]);
const REQUIRED_TABLES = ["ads", "ad_views", "ad_clicks"];
const DEFAULT_MONETIZATION_BYPASS_USER_IDS = new Set(["62fb0b2e-8cdd-4226-878f-3eec5131952c"]);
const MIN_VIDEO_MONETIZATION_FOLLOWERS = Number(process.env.DRIBADS_MIN_VIDEO_MONETIZATION_FOLLOWERS || 10000);
const MIN_VIDEO_MONETIZATION_VIEWS = Number(process.env.DRIBADS_MIN_VIDEO_MONETIZATION_VIEWS || 100000);
const MIN_VIDEO_MONETIZATION_WATCH_MINUTES = Number(process.env.DRIBADS_MIN_VIDEO_MONETIZATION_WATCH_MINUTES || 10000);
const ALLOWED_AD_PLACEMENTS = new Set(["pre_roll", "post_roll", "both"]);
const DEFAULT_AD_PLACEMENT = "pre_roll";
const DEFAULT_SKIP_AFTER_SECONDS = 5;
const ADS_SELECT_WITH_DESCRIPTION =
  "id, title, description, media_url, target_url, budget, status, ad_placement, skippable_enabled, skip_after_seconds, created_at";
const ADS_SELECT_NO_DESCRIPTION =
  "id, title, media_url, target_url, budget, status, ad_placement, skippable_enabled, skip_after_seconds, created_at";

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

function isMissingOwnerColumnError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("owner_user_id") && message.includes("does not exist");
}

function isMissingPlacementColumnError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("ad_placement") && message.includes("does not exist");
}

function isMissingSkippableColumnsError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    (message.includes("skippable_enabled") && message.includes("does not exist")) ||
    (message.includes("skip_after_seconds") && message.includes("does not exist"))
  );
}

function isMissingTableError(error, tableName) {
  const message = String(error?.message || "").toLowerCase();
  return (
    (message.includes("relation") && message.includes("does not exist")) ||
    (tableName ? message.includes(tableName.toLowerCase()) : false)
  );
}

function mapAdRow(row) {
  const placement = ALLOWED_AD_PLACEMENTS.has(row?.ad_placement) ? row.ad_placement : DEFAULT_AD_PLACEMENT;
  const skipAfterRaw = Number(row?.skip_after_seconds);
  const skipAfterSeconds =
    Number.isFinite(skipAfterRaw) && skipAfterRaw >= 0 ? Math.min(Math.floor(skipAfterRaw), 30) : DEFAULT_SKIP_AFTER_SECONDS;
  return {
    ...row,
    description: row?.description || "",
    ad_placement: placement,
    skippable_enabled: row?.skippable_enabled !== false,
    skip_after_seconds: skipAfterSeconds,
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

function getBillableClickCpc() {
  if (!Number.isFinite(DRIBADS_CLICK_PAYOUT_CPC) || DRIBADS_CLICK_PAYOUT_CPC <= 0) {
    return Number.isFinite(ESTIMATED_CPC) && ESTIMATED_CPC > 0 ? ESTIMATED_CPC : 0.05;
  }
  return DRIBADS_CLICK_PAYOUT_CPC;
}

async function getAdEarningsMap(adIds, { ownerUserId, appId } = {}) {
  if (!ownerUserId || !Array.isArray(adIds) || !adIds.length) return {};
  const db = await getSchemaClient();
  let query = db.from("ad_earnings_ledger").select("ad_id, amount").eq("owner_user_id", ownerUserId).in("ad_id", adIds);
  if (appId) {
    query = query.eq("app_id", appId);
  }
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error, "ad_earnings_ledger")) return null;
    throw error;
  }
  return (data || []).reduce((acc, row) => {
    const adId = row?.ad_id;
    if (!adId) return acc;
    acc[adId] = roundMoney((acc[adId] || 0) + Number(row.amount || 0));
    return acc;
  }, {});
}

async function getDailyEarningsMap({ ownerUserId, appId, startIso } = {}) {
  if (!ownerUserId || !startIso) return {};
  const db = await getSchemaClient();
  let query = db
    .from("ad_earnings_ledger")
    .select("created_at, amount")
    .eq("owner_user_id", ownerUserId)
    .gte("created_at", startIso);
  if (appId) {
    query = query.eq("app_id", appId);
  }
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error, "ad_earnings_ledger")) return null;
    throw error;
  }
  return (data || []).reduce((acc, row) => {
    const key = toDateKey(new Date(row.created_at));
    acc[key] = roundMoney((acc[key] || 0) + Number(row.amount || 0));
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

async function getAdsRows(ownerUserId = null) {
  const db = await getSchemaClient();
  let withDescription = db.from("ads").select(ADS_SELECT_WITH_DESCRIPTION).order("created_at", { ascending: false });
  if (ownerUserId) {
    withDescription = withDescription.eq("owner_user_id", ownerUserId);
  }
  withDescription = await withDescription;
  if (!withDescription.error) return withDescription.data || [];
  if (!isMissingDescriptionError(withDescription.error)) throw withDescription.error;

  let fallback = db.from("ads").select(ADS_SELECT_NO_DESCRIPTION).order("created_at", { ascending: false });
  if (ownerUserId) {
    fallback = fallback.eq("owner_user_id", ownerUserId);
  }
  fallback = await fallback;
  if (fallback.error) throw fallback.error;
  return fallback.data || [];
}

async function getUserScopedAppIds(ownerUserId) {
  const db = await getSchemaClient();
  const adsRes = await db.from("ads").select("id").eq("owner_user_id", ownerUserId);
  if (adsRes.error) {
    if (isMissingOwnerColumnError(adsRes.error)) {
      throw new Error("OWNER_SCOPE_NOT_READY");
    }
    throw adsRes.error;
  }

  const adIds = (adsRes.data || []).map((row) => row.id).filter(Boolean);
  if (!adIds.length) return [];

  const [viewsRes, clicksRes] = await Promise.all([
    db.from("ad_views").select("app_id").in("ad_id", adIds).not("app_id", "is", null),
    db.from("ad_clicks").select("app_id").in("ad_id", adIds).not("app_id", "is", null),
  ]);

  if (viewsRes.error) throw viewsRes.error;
  if (clicksRes.error) throw clicksRes.error;

  const idSet = new Set();
  for (const row of viewsRes.data || []) {
    if (row.app_id) idSet.add(row.app_id);
  }
  for (const row of clicksRes.data || []) {
    if (row.app_id) idSet.add(row.app_id);
  }
  return Array.from(idSet);
}

async function getLinkedAppIds(ownerUserId) {
  const db = await getSchemaClient();
  const res = await db
    .from("publisher_app_links")
    .select("app_id")
    .eq("publisher_user_id", ownerUserId)
    .eq("link_status", "active");

  if (res.error) {
    if (isMissingTableError(res.error, "publisher_app_links")) {
      return [];
    }
    throw res.error;
  }

  return (res.data || []).map((row) => row.app_id).filter(Boolean);
}

export async function getApps(options = {}) {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const ownerUserId = options?.ownerUserId || null;

  try {
    let query = db
      .from("apps")
      .select("id, slug, name, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (ownerUserId) {
      const [usageAppIds, linkedAppIds] = await Promise.all([
        getUserScopedAppIds(ownerUserId),
        getLinkedAppIds(ownerUserId),
      ]);
      const appIds = Array.from(new Set([...usageAppIds, ...linkedAppIds]));
      if (!appIds.length) return [];
      query = query.in("id", appIds);
    }

    const { data, error } = await query;
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

export async function getPublisherAppLink(options = {}) {
  await ensureDribadsSetup();
  const ownerUserId = options?.ownerUserId || null;
  if (!ownerUserId) throw new Error("UNAUTHORIZED");

  const app = await resolveAppContext({
    appSlug: options?.appSlug,
    appKey: options?.appKey,
    requireValidAppKey: true,
  });
  if (!app?.id) throw new Error("APP_NOT_FOUND");

  const db = await getSchemaClient();
  const { data, error } = await db
    .from("publisher_app_links")
    .select("id, publisher_user_id, app_id, linked_from, link_status, created_at, updated_at")
    .eq("publisher_user_id", ownerUserId)
    .eq("app_id", app.id)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error, "publisher_app_links")) {
      throw new Error("APP_LINKS_TABLE_MISSING");
    }
    throw error;
  }

  return {
    linked: Boolean(data && data.link_status === "active"),
    app: { slug: app.slug, name: app.name },
    link: data || null,
  };
}

export async function linkPublisherApp(options = {}) {
  await ensureDribadsSetup();
  const ownerUserId = options?.ownerUserId || null;
  if (!ownerUserId) throw new Error("UNAUTHORIZED");

  const app = await resolveAppContext({
    appSlug: options?.appSlug,
    appKey: options?.appKey,
    requireValidAppKey: true,
  });
  if (!app?.id) throw new Error("APP_NOT_FOUND");

  const db = await getSchemaClient();
  const payload = {
    publisher_user_id: ownerUserId,
    app_id: app.id,
    linked_from: String(options?.linkedFrom || "mobile"),
    link_status: "active",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from("publisher_app_links")
    .upsert(payload, { onConflict: "publisher_user_id,app_id" })
    .select("id, publisher_user_id, app_id, linked_from, link_status, created_at, updated_at")
    .single();

  if (error) {
    if (isMissingTableError(error, "publisher_app_links")) {
      throw new Error("APP_LINKS_TABLE_MISSING");
    }
    throw error;
  }

  return {
    linked: true,
    app: { slug: app.slug, name: app.name },
    link: data,
  };
}

export async function unlinkPublisherApp(options = {}) {
  await ensureDribadsSetup();
  const ownerUserId = options?.ownerUserId || null;
  if (!ownerUserId) throw new Error("UNAUTHORIZED");

  const app = await resolveAppContext({
    appSlug: options?.appSlug,
    appKey: options?.appKey,
    requireValidAppKey: true,
  });
  if (!app?.id) throw new Error("APP_NOT_FOUND");

  const db = await getSchemaClient();
  const payload = {
    link_status: "revoked",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from("publisher_app_links")
    .update(payload)
    .eq("publisher_user_id", ownerUserId)
    .eq("app_id", app.id)
    .select("id, publisher_user_id, app_id, linked_from, link_status, created_at, updated_at")
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error, "publisher_app_links")) {
      throw new Error("APP_LINKS_TABLE_MISSING");
    }
    throw error;
  }

  return {
    linked: false,
    app: { slug: app.slug, name: app.name },
    link: data || null,
  };
}

async function getMonetizationBypassUserIds() {
  const envIds = String(process.env.DRIBADS_MONETIZATION_BYPASS_USER_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const ids = new Set([...DEFAULT_MONETIZATION_BYPASS_USER_IDS, ...envIds]);

  const db = await getSchemaClient();
  const overrideRes = await db
    .from("monetization_user_overrides")
    .select("user_id")
    .eq("video_monetization_bypass", true);

  if (overrideRes.error) {
    if (!isMissingTableError(overrideRes.error, "monetization_user_overrides")) {
      throw overrideRes.error;
    }
    return ids;
  }

  for (const row of overrideRes.data || []) {
    if (row?.user_id) ids.add(row.user_id);
  }
  return ids;
}

async function getPublisherEligibilityStats(ownerUserId) {
  if (!ownerUserId) {
    return {
      followers_count: 0,
      video_views_count: 0,
      watch_minutes: 0,
    };
  }

  const db = await getSchemaClient();
  const { data, error } = await db
    .from("publisher_eligibility_stats")
    .select("followers_count, video_views_count, watch_minutes")
    .eq("user_id", ownerUserId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error, "publisher_eligibility_stats")) {
      return {
        followers_count: 0,
        video_views_count: 0,
        watch_minutes: 0,
      };
    }
    throw error;
  }

  return {
    followers_count: Number(data?.followers_count || 0),
    video_views_count: Number(data?.video_views_count || 0),
    watch_minutes: Number(data?.watch_minutes || 0),
  };
}

async function buildVideoMonetizationEligibility({ appId, ownerUserId, features }) {
  if (!ownerUserId) {
    return {
      bypass: false,
      eligible: false,
      reason: "UNAUTHORIZED",
      checks: [],
      thresholds: {},
    };
  }

  const bypassUserIds = await getMonetizationBypassUserIds();
  if (bypassUserIds.has(ownerUserId)) {
    return {
      bypass: true,
      eligible: true,
      reason: "BYPASS_USER",
      checks: [
        { key: "bypass", label: "Bypass for internal testing", passed: true, current: ownerUserId, required: "n/a" },
      ],
      thresholds: {},
    };
  }

  const db = await getSchemaClient();
  const profilePromise = db
    .from("publisher_profiles")
    .select("kyc_status")
    .eq("user_id", ownerUserId)
    .maybeSingle();
  const linkPromise = appId
    ? db
        .from("publisher_app_links")
        .select("id, link_status")
        .eq("publisher_user_id", ownerUserId)
        .eq("app_id", appId)
        .eq("link_status", "active")
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [profileRes, linkRes, stats] = await Promise.all([profilePromise, linkPromise, getPublisherEligibilityStats(ownerUserId)]);

  if (profileRes.error && !isMissingTableError(profileRes.error, "publisher_profiles")) {
    throw profileRes.error;
  }
  if (linkRes.error && !isMissingTableError(linkRes.error, "publisher_app_links")) {
    throw linkRes.error;
  }

  const kycStatus = profileRes.data?.kyc_status || "pending";
  const checks = [
    {
      key: "video_feature_enabled",
      label: "Video monetization feature is enabled",
      passed: Boolean(features?.video_monetization_enabled),
      current: Boolean(features?.video_monetization_enabled),
      required: true,
    },
    {
      key: "kyc_verified",
      label: "KYC must be verified",
      passed: kycStatus === "verified",
      current: kycStatus,
      required: "verified",
    },
    {
      key: "app_linked",
      label: "App must be linked to Dribads account",
      passed: Boolean(linkRes.data?.id),
      current: Boolean(linkRes.data?.id),
      required: true,
    },
    {
      key: "min_followers",
      label: "Minimum followers",
      passed: Number(stats?.followers_count || 0) >= MIN_VIDEO_MONETIZATION_FOLLOWERS,
      current: Number(stats?.followers_count || 0),
      required: MIN_VIDEO_MONETIZATION_FOLLOWERS,
    },
    {
      key: "min_views",
      label: "Minimum video views",
      passed: Number(stats?.video_views_count || 0) >= MIN_VIDEO_MONETIZATION_VIEWS,
      current: Number(stats?.video_views_count || 0),
      required: MIN_VIDEO_MONETIZATION_VIEWS,
    },
    {
      key: "min_watch_minutes",
      label: "Minimum watch minutes",
      passed: Number(stats?.watch_minutes || 0) >= MIN_VIDEO_MONETIZATION_WATCH_MINUTES,
      current: Number(stats?.watch_minutes || 0),
      required: MIN_VIDEO_MONETIZATION_WATCH_MINUTES,
    },
  ];

  return {
    bypass: false,
    eligible: checks.every((check) => check.passed),
    reason: "RULE_BASED",
    checks,
    thresholds: {
      min_followers: MIN_VIDEO_MONETIZATION_FOLLOWERS,
      min_views: MIN_VIDEO_MONETIZATION_VIEWS,
      min_watch_minutes: MIN_VIDEO_MONETIZATION_WATCH_MINUTES,
    },
  };
}

export async function getMonetizationFeatures(appSlug, options = {}) {
  const ownerUserId = options?.ownerUserId || null;
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
      eligibility: await buildVideoMonetizationEligibility({
        appId: null,
        ownerUserId,
        features: { video_monetization_enabled: true },
        dashboard: { totalViews: 0, totalClicks: 0, ads: [] },
      }),
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

    const features = data || {
      video_monetization_enabled: true,
      rewards_enabled: true,
      subscriptions_enabled: true,
      ads_enabled: true,
      gifts_enabled: true,
      live_stream_enabled: true,
      min_payout: 10,
      payout_cycle_days: 30,
    };
    const dashboard = ownerUserId
      ? await getDashboardData({ appSlug: app.slug, ownerUserId })
      : { totalViews: 0, totalClicks: 0, ads: [] };

    return {
      app: { slug: app.slug, name: app.name },
      features,
      eligibility: await buildVideoMonetizationEligibility({
        appId: app.id,
        ownerUserId,
        features,
        dashboard,
      }),
    };
  } catch (error) {
    if (isMissingTableError(error, "app_monetization_features")) {
      const features = {
        video_monetization_enabled: true,
        rewards_enabled: true,
        subscriptions_enabled: true,
        ads_enabled: true,
        gifts_enabled: true,
        live_stream_enabled: true,
        min_payout: 10,
        payout_cycle_days: 30,
      };
      const dashboard = ownerUserId
        ? await getDashboardData({ appSlug: app.slug, ownerUserId })
        : { totalViews: 0, totalClicks: 0, ads: [] };
      return {
        app: { slug: app.slug, name: app.name },
        features,
        eligibility: await buildVideoMonetizationEligibility({
          appId: app.id,
          ownerUserId,
          features,
          dashboard,
        }),
      };
    }
    throw error;
  }
}

export async function isVideoOwnerEligibleForAds(options = {}) {
  const ownerUserId = String(options?.ownerUserId || "").trim();
  if (!ownerUserId) {
    return { eligible: false, reason: "MISSING_VIDEO_OWNER_ID", app: null };
  }

  const app = await resolveAppContext({ appSlug: options?.appSlug, appKey: options?.appKey });
  if (!app?.slug) {
    return { eligible: false, reason: "APP_NOT_FOUND", app: null };
  }

  const monetization = await getMonetizationFeatures(app.slug, { ownerUserId });
  const eligibility = monetization?.eligibility || {};
  return {
    eligible: Boolean(eligibility.eligible),
    reason: eligibility.reason || "RULE_BASED",
    app: monetization?.app || { slug: app.slug, name: app.name },
    eligibility,
  };
}

export async function getFirstAd() {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const withDescription = await db
    .from("ads")
    .select(ADS_SELECT_WITH_DESCRIPTION)
    .eq("status", "active")
    .gt("budget", 0)
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
    .gt("budget", 0)
    .order("created_at", { ascending: false })
    .limit(50);
  if (fallback.error) throw fallback.error;
  const mapped = (fallback.data || []).map(mapAdRow);
  const clean = mapped.filter(isDeliverableAdRow);
  return clean[0] || mapped[0] || null;
}

export async function getDeliverableAd(strategy = "random", options = {}) {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const placement = ALLOWED_AD_PLACEMENTS.has(String(options?.placement || "").trim().toLowerCase())
    ? String(options.placement).trim().toLowerCase()
    : null;
  const placementFilterValues =
    placement === "pre_roll"
      ? ["pre_roll", "both"]
      : placement === "post_roll"
      ? ["post_roll", "both"]
      : null;

  let withDescriptionQuery = db
    .from("ads")
    .select(ADS_SELECT_WITH_DESCRIPTION)
    .eq("status", "active")
    .gt("budget", 0)
    .order("created_at", { ascending: false })
    .limit(50);

  if (placementFilterValues) {
    withDescriptionQuery = withDescriptionQuery.in("ad_placement", placementFilterValues);
  }
  const withDescription = await withDescriptionQuery;

  let data = withDescription.data;
  let error = withDescription.error;
  if (error && (isMissingDescriptionError(error) || isMissingPlacementColumnError(error) || isMissingSkippableColumnsError(error))) {
    let fallbackQuery = db
      .from("ads")
      .select(ADS_SELECT_NO_DESCRIPTION)
      .eq("status", "active")
      .gt("budget", 0)
      .order("created_at", { ascending: false })
      .limit(50);
    if (placementFilterValues && !isMissingPlacementColumnError(error)) {
      fallbackQuery = fallbackQuery.in("ad_placement", placementFilterValues);
    }
    const fallback = await fallbackQuery;
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

export async function createAd(input, options = {}) {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const ownerUserId = options?.ownerUserId || null;
  if (!ownerUserId) {
    throw new Error("UNAUTHORIZED");
  }
  const payload = {
    title: input.title,
    description: input.description || "",
    media_url: input.media_url,
    target_url: input.target_url,
    budget: input.budget,
    status: input.status && ALLOWED_STATUSES.has(input.status) ? input.status : "active",
    ad_placement: ALLOWED_AD_PLACEMENTS.has(input.ad_placement) ? input.ad_placement : DEFAULT_AD_PLACEMENT,
    skippable_enabled: input.skippable_enabled !== false,
    skip_after_seconds: Number.isFinite(Number(input.skip_after_seconds))
      ? Math.min(Math.max(Math.floor(Number(input.skip_after_seconds)), 0), 30)
      : DEFAULT_SKIP_AFTER_SECONDS,
    owner_user_id: ownerUserId,
  };

  const withDescription = await db.from("ads").insert(payload).select(ADS_SELECT_WITH_DESCRIPTION).single();
  if (!withDescription.error) return mapAdRow(withDescription.data);
  if (isMissingOwnerColumnError(withDescription.error)) throw new Error("OWNER_SCOPE_NOT_READY");
  if (!isMissingDescriptionError(withDescription.error)) throw withDescription.error;

  const payloadFallback = {
    title: input.title,
    media_url: input.media_url,
    target_url: input.target_url,
    budget: input.budget,
    status: input.status && ALLOWED_STATUSES.has(input.status) ? input.status : "active",
    ad_placement: ALLOWED_AD_PLACEMENTS.has(input.ad_placement) ? input.ad_placement : DEFAULT_AD_PLACEMENT,
    skippable_enabled: input.skippable_enabled !== false,
    skip_after_seconds: Number.isFinite(Number(input.skip_after_seconds))
      ? Math.min(Math.max(Math.floor(Number(input.skip_after_seconds)), 0), 30)
      : DEFAULT_SKIP_AFTER_SECONDS,
    owner_user_id: ownerUserId,
  };
  const fallback = await db.from("ads").insert(payloadFallback).select(ADS_SELECT_NO_DESCRIPTION).single();
  if (fallback.error) {
    if (isMissingOwnerColumnError(fallback.error)) throw new Error("OWNER_SCOPE_NOT_READY");
    throw fallback.error;
  }
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

export async function recordAdSkip(adId, context = {}) {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const app = await resolveAppContext(context);
  const payload = {
    ad_id: adId,
    app_id: app?.id || null,
  };
  const { error } = await db.from("ad_skips").insert(payload);
  if (error) {
    if (isMissingTableError(error, "ad_skips")) {
      return { ok: true, app: app ? { slug: app.slug, name: app.name } : null, skipped: false };
    }
    throw error;
  }
  return { ok: true, app: app ? { slug: app.slug, name: app.name } : null, skipped: true };
}

export async function recordAdComplete(adId, context = {}) {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const app = await resolveAppContext(context);
  const payload = {
    ad_id: adId,
    app_id: app?.id || null,
  };
  const { error } = await db.from("ad_completions").insert(payload);
  if (error) {
    if (isMissingTableError(error, "ad_completions")) {
      return { ok: true, app: app ? { slug: app.slug, name: app.name } : null, completed: false };
    }
    throw error;
  }
  return { ok: true, app: app ? { slug: app.slug, name: app.name } : null, completed: true };
}

export async function recordAdClick(adId, context = {}) {
  await ensureDribadsSetup();
  const db = await getSchemaClient();
  const app = await resolveAppContext(context);
  const payload = {
    ad_id: adId,
    app_id: app?.id || null,
  };
  const clickInsert = await db.from("ad_clicks").insert(payload).select("id, created_at").single();
  if (clickInsert.error) throw clickInsert.error;

  const clickId = clickInsert.data?.id || null;
  const clickCreatedAt = clickInsert.data?.created_at || new Date().toISOString();
  const clickCpc = Number(getBillableClickCpc().toFixed(4));

  // Real earnings mode: charge advertiser budget on valid clicks and store immutable earning event.
  // If schema is not migrated yet, click tracking still works and dashboard falls back to estimated CPC mode.
  if (clickCpc > 0) {
    const adRes = await db.from("ads").select("id, owner_user_id, budget, status").eq("id", adId).maybeSingle();
    if (adRes.error && !isMissingOwnerColumnError(adRes.error)) {
      throw adRes.error;
    }

    const adRow = adRes.data;
    if (adRow && adRow.owner_user_id && adRow.status === "active") {
      const currentBudget = Number(adRow.budget || 0);
      if (currentBudget >= clickCpc) {
        const nextBudgetRaw = currentBudget - clickCpc;
        const nextBudget = roundMoney(nextBudgetRaw < 0 ? 0 : nextBudgetRaw);
        const nextStatus = nextBudget <= 0 ? "paused" : "active";

        const budgetUpdate = await db
          .from("ads")
          .update({ budget: nextBudget, status: nextStatus })
          .eq("id", adId)
          .eq("status", "active")
          .eq("budget", adRow.budget)
          .gte("budget", clickCpc)
          .select("id")
          .maybeSingle();

        if (budgetUpdate.error && !isMissingOwnerColumnError(budgetUpdate.error)) {
          throw budgetUpdate.error;
        }

        if (budgetUpdate.data) {
          const earningPayload = {
            ad_id: adId,
            ad_click_id: clickId,
            owner_user_id: adRow.owner_user_id,
            app_id: app?.id || null,
            amount: clickCpc,
            created_at: clickCreatedAt,
          };
          const earningInsert = await db.from("ad_earnings_ledger").insert(earningPayload);
          if (earningInsert.error && !isMissingTableError(earningInsert.error, "ad_earnings_ledger")) {
            throw earningInsert.error;
          }
        }
      }
    }
  }

  return { ok: true, app: app ? { slug: app.slug, name: app.name } : null };
}

async function getDashboardAds(appId = null, ownerUserId = null) {
  const db = await getSchemaClient();
  const ads = await getAdsRows(ownerUserId);

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
  const earningsMap = await getAdEarningsMap(adIds, { ownerUserId, appId });
  const hasRealEarnings = earningsMap !== null;

  return ads.map((ad) => ({
    ...mapAdRow(ad),
    views: viewMap[ad.id] || 0,
    clicks: clickMap[ad.id] || 0,
    usesEstimatedEarnings: !hasRealEarnings,
    earnings: hasRealEarnings
      ? roundMoney(earningsMap[ad.id] || 0)
      : roundMoney((clickMap[ad.id] || 0) * ESTIMATED_CPC),
  }));
}

export async function getDashboardData(options = {}) {
  await ensureDribadsSetup();
  const ownerUserId = options?.ownerUserId || null;
  if (!ownerUserId) {
    throw new Error("UNAUTHORIZED");
  }
  const app = await resolveAppContext({ appSlug: options?.appSlug, appKey: options?.appKey });
  const appId = app?.id || null;
  const adsWithStats = await getDashboardAds(appId, ownerUserId);

  let totalViews = 0;
  let totalClicks = 0;
  let totalBalance = 0;
  for (const ad of adsWithStats) {
    totalViews += Number(ad.views || 0);
    totalClicks += Number(ad.clicks || 0);
    totalBalance += Number(ad.earnings || 0);
  }
  const safeBalance = roundMoney(totalBalance);
  const effectiveCpc = totalClicks > 0 ? Number((safeBalance / totalClicks).toFixed(4)) : getBillableClickCpc();
  const isEstimatedBalance = adsWithStats.length > 0 && adsWithStats.every((ad) => ad.usesEstimatedEarnings === true);

  return {
    totalViews,
    totalClicks,
    balance: safeBalance,
    estimatedCpc: effectiveCpc,
    isEstimatedBalance,
    ads: adsWithStats,
    app: app ? { slug: app.slug, name: app.name } : null,
  };
}

export async function getAnalyticsData(days = 14, options = {}) {
  await ensureDribadsSetup();
  const ownerUserId = options?.ownerUserId || null;
  if (!ownerUserId) {
    throw new Error("UNAUTHORIZED");
  }
  const app = await resolveAppContext({ appSlug: options?.appSlug, appKey: options?.appKey });
  const appId = app?.id || null;
  const db = await getSchemaClient();

  const buckets = buildDateBuckets(days);
  const start = new Date(buckets[0].date);
  start.setHours(0, 0, 0, 0);
  const startIso = start.toISOString();

  let ownedAdIds = null;
  if (ownerUserId) {
    const adsRes = await db.from("ads").select("id").eq("owner_user_id", ownerUserId);
    if (adsRes.error) {
      if (isMissingOwnerColumnError(adsRes.error)) throw new Error("OWNER_SCOPE_NOT_READY");
      throw adsRes.error;
    }
    ownedAdIds = (adsRes.data || []).map((row) => row.id).filter(Boolean);
    if (!ownedAdIds.length) {
      return buckets.map((bucket) => ({
        date: bucket.key,
        views: 0,
        clicks: 0,
      }));
    }
  }

  let viewsQuery = db.from("ad_views").select("created_at").gte("created_at", startIso);
  let clicksQuery = db.from("ad_clicks").select("created_at").gte("created_at", startIso);

  if (ownedAdIds) {
    viewsQuery = viewsQuery.in("ad_id", ownedAdIds);
    clicksQuery = clicksQuery.in("ad_id", ownedAdIds);
  }

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
  const earningsMap = await getDailyEarningsMap({ ownerUserId, appId, startIso });
  const hasRealDailyEarnings = earningsMap !== null;

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
    earnings: hasRealDailyEarnings
      ? roundMoney(earningsMap[bucket.key] || 0)
      : roundMoney((clickMap[bucket.key] || 0) * ESTIMATED_CPC),
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
  const ownerUserId = options?.ownerUserId || null;
  if (!ownerUserId) {
    throw new Error("UNAUTHORIZED");
  }
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
    getDashboardData({ appSlug: app.slug, ownerUserId: options?.ownerUserId || null }),
    getMonetizationFeatures(app.slug),
    db
      .from("payout_requests")
      .select(
        "id, amount, status, note, payout_method, payout_destination, provider_ref, provider_status, error_message, requested_at, processed_at"
      )
      .eq("app_id", app.id)
      .eq("requester_user_id", ownerUserId)
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
  const availableToWithdraw = Math.max(0, totalEarned - totalPending - totalPaid);

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
  const ownerUserId = input?.ownerUserId || null;
  if (!ownerUserId) throw new Error("UNAUTHORIZED");
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

  const payoutData = await getPayoutsData({ appSlug: app.slug, ownerUserId });
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
    requester_user_id: ownerUserId,
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
