import { NextResponse } from "next/server";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export async function GET() {
  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error: "SUPABASE_NOT_CONFIGURED",
          hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
          hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        },
        { status: 500 }
      );
    }

    const supabase = await getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "SUPABASE_CLIENT_NULL" }, { status: 500 });
    }

    const db = supabase.schema("dribads");

    const [{ count: adsCount, error: adsCountError }, { data: adsRows, error: adsRowsError }, { data: appsRows, error: appsError }] =
      await Promise.all([
        db.from("ads").select("id", { count: "exact", head: true }),
        db.from("ads").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(10),
        db.from("apps").select("id, slug, name, is_active, api_key").order("slug", { ascending: true }),
      ]);

    if (adsCountError || adsRowsError || appsError) {
      const error = adsCountError || adsRowsError || appsError;
      return NextResponse.json(
        {
          ok: false,
          error: "DRIBADS_QUERY_ERROR",
          details: {
            message: error?.message || "",
            code: error?.code || "",
            hint: error?.hint || "",
            details: error?.details || "",
          },
        },
        { status: 500 }
      );
    }

    const activeCount = (adsRows || []).filter((ad) => (ad.status || "active") === "active").length;
    const dribdoApp = (appsRows || []).find((app) => app.slug === "dribdo");

    let dribdoMetrics = null;
    if (dribdoApp?.id) {
      const [{ count: viewsCount }, { count: clicksCount }] = await Promise.all([
        db.from("ad_views").select("id", { count: "exact", head: true }).eq("app_id", dribdoApp.id),
        db.from("ad_clicks").select("id", { count: "exact", head: true }).eq("app_id", dribdoApp.id),
      ]);
      dribdoMetrics = {
        appId: dribdoApp.id,
        views: viewsCount || 0,
        clicks: clicksCount || 0,
      };
    }

    return NextResponse.json({
      ok: true,
      adsCount: adsCount || 0,
      sampleAds: adsRows || [],
      activeInSample: activeCount,
      apps: (appsRows || []).map((app) => ({
        id: app.id,
        slug: app.slug,
        name: app.name,
        isActive: app.is_active,
        hasApiKey: Boolean(app.api_key),
      })),
      dribdoMetrics,
      projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "UNEXPECTED_ERROR", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
