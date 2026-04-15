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

    const [{ count: adsCount, error: adsCountError }, { data: adsRows, error: adsRowsError }] =
      await Promise.all([
        db.from("ads").select("id", { count: "exact", head: true }),
        db.from("ads").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

    if (adsCountError || adsRowsError) {
      const error = adsCountError || adsRowsError;
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

    return NextResponse.json({
      ok: true,
      adsCount: adsCount || 0,
      sampleAds: adsRows || [],
      activeInSample: activeCount,
      projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "UNEXPECTED_ERROR", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
