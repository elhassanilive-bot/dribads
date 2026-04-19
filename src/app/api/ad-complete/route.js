import { revalidatePath } from "next/cache";
import { recordAdComplete } from "@/lib/dribads/repository";
import { allowRequest } from "@/lib/dribads/rate-limit";
import { corsJson, corsOptionsResponse } from "@/lib/dribads/cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request) {
  try {
    if (!allowRequest(request)) {
      return corsJson({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const adId = body?.ad_id || body?.adId || body?.id;
    const appSlug =
      body?.app_slug ||
      body?.appSlug ||
      body?.app ||
      request.headers.get("x-dribads-app") ||
      request.headers.get("x-dribads-app-slug") ||
      null;
    const appKey =
      request.headers.get("x-dribads-app-key") ||
      body?.app_key ||
      body?.appKey ||
      body?.api_key ||
      "";

    if (!adId) {
      return corsJson({ error: "ad_id is required" }, { status: 400 });
    }

    const result = await recordAdComplete(adId, { appSlug, appKey });
    revalidatePath("/analytics");

    return corsJson({ ok: true, app: result?.app || null, completed: result?.completed !== false });
  } catch (error) {
    console.error("POST /api/ad-complete error", error);
    return corsJson(
      { error: "Failed to record ad complete", code: error instanceof Error ? error.message : "unknown_error" },
      { status: 500 }
    );
  }
}

