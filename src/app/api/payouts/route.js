import { NextResponse } from "next/server";
import { createPayoutRequest, getPayoutsData } from "@/lib/dribads/repository";

function mapPayoutError(error) {
  const code = error instanceof Error ? error.message : String(error || "");
  if (code === "PAYOUT_BELOW_MINIMUM") return { status: 400, error: "Payout amount is below minimum" };
  if (code === "PAYOUT_EXCEEDS_AVAILABLE") return { status: 400, error: "Payout amount exceeds available balance" };
  if (code === "INVALID_PAYOUT_AMOUNT") return { status: 400, error: "Invalid payout amount" };
  if (code === "APP_NOT_FOUND") return { status: 404, error: "App not found" };
  if (code === "INVALID_APP_KEY" || code === "APP_KEY_SLUG_MISMATCH") {
    return { status: 401, error: "Invalid app credentials" };
  }
  if (code === "PAYOUTS_TABLE_MISSING") {
    return { status: 500, error: "Payouts table is missing. Run dribads_schema.sql again." };
  }
  return { status: 500, error: "Failed to process payout request" };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appSlug = searchParams.get("app") || null;
    const data = await getPayoutsData({ appSlug });
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/payouts error", error);
    return NextResponse.json({ error: "Failed to load payouts" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const appSlug = body?.app_slug || body?.app || null;
    const appKey = request.headers.get("x-dribads-app-key") || body?.app_key || "";
    const amount = body?.amount;
    const note = body?.note || "";

    const data = await createPayoutRequest({ appSlug, appKey, amount, note });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST /api/payouts error", error);
    const mapped = mapPayoutError(error);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
