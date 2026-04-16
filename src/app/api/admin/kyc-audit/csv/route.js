import { NextResponse } from "next/server";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { buildCsv } from "@/lib/dribads/reports";

function normalizeDateInput(value) {
  const v = String(value || "").trim();
  if (!v) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
}

function getQueryString(searchParams, key, fallback = "") {
  const value = searchParams.get(key);
  if (value == null) return fallback;
  return String(value);
}

export async function GET(request) {
  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ error: "Supabase admin is not configured" }, { status: 500 });
    }

    const expectedToken = process.env.KYC_ADMIN_TOKEN || process.env.BLOG_ADMIN_TOKEN || "";
    const { searchParams } = new URL(request.url);
    const providedToken = getQueryString(searchParams, "adminToken", "");
    if (expectedToken && providedToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auditUserId = getQueryString(searchParams, "auditUserId", "").trim();
    const auditActor = getQueryString(searchParams, "auditActor", "").trim();
    const auditFrom = normalizeDateInput(getQueryString(searchParams, "auditFrom", ""));
    const auditTo = normalizeDateInput(getQueryString(searchParams, "auditTo", ""));

    const admin = await getSupabaseAdminClient();
    let query = admin
      .schema("dribads")
      .from("kyc_audit_logs")
      .select("profile_user_id, previous_status, new_status, reason, actor_label, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (auditUserId) {
      query = query.eq("profile_user_id", auditUserId);
    }
    if (auditActor) {
      query = query.ilike("actor_label", `%${auditActor}%`);
    }
    if (auditFrom) {
      query = query.gte("created_at", `${auditFrom}T00:00:00.000Z`);
    }
    if (auditTo) {
      query = query.lte("created_at", `${auditTo}T23:59:59.999Z`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message || "Failed to fetch logs" }, { status: 500 });
    }

    const rows = [
      ["KYC Audit Logs"],
      ["Generated At", new Date().toISOString()],
      [""],
      ["Created At", "User ID", "From", "To", "Reason", "Actor"],
      ...(data || []).map((log) => [
        log.created_at || "",
        log.profile_user_id || "",
        log.previous_status || "",
        log.new_status || "",
        log.reason || "",
        log.actor_label || "",
      ]),
    ];

    const csv = buildCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=dribads-kyc-audit.csv",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Unexpected error" }, { status: 500 });
  }
}
