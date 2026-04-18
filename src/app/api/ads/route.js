import { revalidatePath } from "next/cache";
import { createAd, getDeliverableAd } from "@/lib/dribads/repository";
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
    const ad = await getDeliverableAd(strategy);
    const adPayload = ad
      ? {
          ...ad,
          mediaUrl: ad.media_url,
          targetUrl: ad.target_url,
          createdAt: ad.created_at,
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

