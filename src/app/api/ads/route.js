import { revalidatePath } from "next/cache";
import { createAd, getDeliverableAd, isVideoOwnerEligibleForAds } from "@/lib/dribads/repository";
import { validateAdInput } from "@/lib/dribads/validators";
import { corsJson, corsOptionsResponse } from "@/lib/dribads/cors";
import { getAuthorizedUser } from "@/lib/dribads/api-auth";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get("strategy") === "latest" ? "latest" : "random";
    const placementRaw = String(searchParams.get("placement") || "").trim().toLowerCase();
    const placement = placementRaw === "pre_roll" || placementRaw === "post_roll" ? placementRaw : null;
    const appSlug =
      searchParams.get("app") ||
      searchParams.get("app_slug") ||
      request.headers.get("x-dribads-app") ||
      request.headers.get("x-dribads-app-slug") ||
      null;
    const appKey =
      request.headers.get("x-dribads-app-key") ||
      searchParams.get("app_key") ||
      searchParams.get("api_key") ||
      "";
    const videoOwnerId =
      searchParams.get("video_owner_id") ||
      searchParams.get("owner_user_id") ||
      request.headers.get("x-dribads-video-owner-id") ||
      "";

    if (videoOwnerId) {
      const eligibility = await isVideoOwnerEligibleForAds({
        ownerUserId: videoOwnerId,
        appSlug,
        appKey,
      });

      if (!eligibility.eligible) {
        return corsJson(
          {
            ad: null,
            reason: "video_owner_not_eligible",
            eligibility: {
              eligible: false,
              reason: eligibility.reason || "RULE_BASED",
              checks: eligibility.eligibility?.checks || [],
            },
          },
          {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            },
          }
        );
      }
    }

    const ad = await getDeliverableAd(strategy, { placement });
    const adPayload = ad
      ? {
          ...ad,
          mediaUrl: ad.media_url,
          targetUrl: ad.target_url,
          createdAt: ad.created_at,
          placement: ad.ad_placement || "pre_roll",
          playback: {
            skippable: ad.skippable_enabled !== false,
            skipAfterSeconds: Number(ad.skip_after_seconds || 5),
            clickable: true,
          },
        }
      : null;

    return corsJson(
      { ad: adPayload, reason: adPayload ? null : "no_active_ad" },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/ads error", error);
    return corsJson(
      { ad: null, reason: "backend_error" },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthorizedUser(request);
    if (auth.error) {
      return corsJson({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateAdInput(body);

    if (validation.error) {
      return corsJson({ error: validation.error }, { status: 400 });
    }

    const ad = await createAd(validation.data, { ownerUserId: auth.user.id });

    revalidatePath("/");
    revalidatePath("/dashboard");

    return corsJson({ ad }, { status: 201 });
  } catch (error) {
    console.error("POST /api/ads error", error);
    if (error instanceof Error && error.message === "OWNER_SCOPE_NOT_READY") {
      return corsJson({ error: "Owner scope is not ready. Run dribads_schema.sql again." }, { status: 500 });
    }
    return corsJson({ error: "Failed to create ad" }, { status: 500 });
  }
}

