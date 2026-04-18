import { createPayoutRequest, getPayoutsData } from "@/lib/dribads/repository";
import { corsJson, corsOptionsResponse } from "@/lib/dribads/cors";

function mapPayoutError(error) {
  const code = error instanceof Error ? error.message : String(error || "");
  if (code === "PAYOUT_BELOW_MINIMUM") return { status: 400, error: "Payout amount is below minimum" };
  if (code === "PAYOUT_EXCEEDS_AVAILABLE") return { status: 400, error: "Payout amount exceeds available balance" };
  if (code === "INVALID_PAYOUT_AMOUNT") return { status: 400, error: "Invalid payout amount" };
  if (code === "INVALID_PAYOUT_METHOD") return { status: 400, error: "Invalid payout method" };
  if (code === "INVALID_PAYOUT_DESTINATION") return { status: 400, error: "Invalid payout destination" };
  if (code.startsWith("MISSING_ENV_")) return { status: 500, error: "Payout gateway is not configured" };
  if (code === "PAYPAL_AUTH_FAILED") return { status: 500, error: "PayPal authentication failed" };
  if (code === "PAYPAL_PAYOUT_FAILED") return { status: 502, error: "PayPal payout request failed" };
  if (code.endsWith("_PAYOUT_FAILED")) return { status: 502, error: "Payout provider request failed" };
  if (code === "APP_NOT_FOUND") return { status: 404, error: "App not found" };
  if (code === "INVALID_APP_KEY" || code === "APP_KEY_SLUG_MISMATCH") {
    return { status: 401, error: "Invalid app credentials" };
  }
  if (code === "PAYOUTS_TABLE_MISSING") {
    return { status: 500, error: "Payouts table is missing. Run dribads_schema.sql again." };
  }
  return { status: 500, error: "Failed to process payout request" };
}

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appSlug = searchParams.get("app") || searchParams.get("app_slug") || null;
    const appKey =
      request.headers.get("x-dribads-app-key") ||
      searchParams.get("app_key") ||
      searchParams.get("appKey") ||
      "";
    const data = await getPayoutsData({ appSlug, appKey });
    return corsJson(data);
  } catch (error) {
    console.error("GET /api/payouts error", error);
    return corsJson({ error: "Failed to load payouts" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const appSlug = body?.app_slug || body?.app || null;
    const appKey = request.headers.get("x-dribads-app-key") || body?.app_key || "";
    const amount = body?.amount;
    const note = body?.note || "";
    const payoutMethod = body?.payout_method || body?.payoutMethod || body?.method || "";
    const payoutDestination =
      body?.payout_destination || body?.payoutDestination || body?.destination || body?.payout_email || "";

    const data = await createPayoutRequest({
      appSlug,
      appKey,
      amount,
      note,
      payoutMethod,
      payoutDestination,
    });
    if (!data?.gateway?.success) {
      const mapped = mapPayoutError(data?.gateway?.errorMessage || "PAYOUT_GATEWAY_ERROR");
      return corsJson(
        {
          error: mapped.error,
          request: data?.request || null,
          providerStatus: data?.gateway?.providerStatus || "failed",
        },
        { status: mapped.status }
      );
    }
    return corsJson(data, { status: 201 });
  } catch (error) {
    console.error("POST /api/payouts error", error);
    const mapped = mapPayoutError(error);
    return corsJson({ error: mapped.error }, { status: mapped.status });
  }
}
