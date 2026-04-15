import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { recordAdClick } from "@/lib/dribads/repository";
import { allowRequest } from "@/lib/dribads/rate-limit";

export async function POST(request) {
  try {
    if (!allowRequest(request)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const adId = body?.ad_id;
    const appSlug = body?.app_slug;
    const appKey = request.headers.get("x-dribads-app-key") || body?.app_key || "";

    if (!adId) {
      return NextResponse.json({ error: "ad_id is required" }, { status: 400 });
    }

    await recordAdClick(adId, { appSlug, appKey });
    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    revalidatePath("/earnings");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/ad-click error", error);
    return NextResponse.json({ error: "Failed to record ad click" }, { status: 500 });
  }
}
