import { NextResponse } from "next/server";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

const DRIBADS_SCHEMA = "dribads";

function normalizeDbError(error) {
  return {
    message: error?.message || "",
    code: error?.code || "",
    details: error?.details || "",
    hint: error?.hint || "",
  };
}

export async function GET() {
  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          reason: "SUPABASE_NOT_CONFIGURED",
          hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
          hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        },
        { status: 500 }
      );
    }

    const supabase = await getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, reason: "SUPABASE_CLIENT_NULL" }, { status: 500 });
    }

    const db = supabase.schema(DRIBADS_SCHEMA);

    const [totalRes, activeRes, sampleRes] = await Promise.all([
      db.from("ads").select("id", { count: "exact", head: true }),
      db.from("ads").select("id", { count: "exact", head: true }).eq("status", "active"),
      db
        .from("ads")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (totalRes.error || activeRes.error || sampleRes.error) {
      const dbError = totalRes.error || activeRes.error || sampleRes.error;
      const restProbe = await probeRestApi();
      return NextResponse.json(
        {
          ok: false,
          reason: "DB_QUERY_ERROR",
          error: normalizeDbError(dbError),
          restProbe,
        },
        { status: 500 }
      );
    }

    const restProbe = await probeRestApi();

    return NextResponse.json({
      ok: true,
      totalAds: totalRes.count || 0,
      activeAds: activeRes.count || 0,
      hasActiveAds: Number(activeRes.count || 0) > 0,
      sampleAds: sampleRes.data || [],
      projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      restProbe,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: "UNEXPECTED_ERROR",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function probeRestApi() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) {
    return { ok: false, reason: "MISSING_ENV" };
  }

  try {
    const endpoint = new URL("/rest/v1/ads?select=id,status&limit=1", url);
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Accept-Profile": "dribads",
      },
      cache: "no-store",
    });

    const text = await response.text().catch(() => "");
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      body: text.slice(0, 500),
    };
  } catch (error) {
    return {
      ok: false,
      reason: "FETCH_FAILED",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
