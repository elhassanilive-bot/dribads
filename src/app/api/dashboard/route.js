import { getDashboardData } from "@/lib/dribads/repository";
import { corsJson, corsOptionsResponse } from "@/lib/dribads/cors";
import { getAuthorizedUser } from "@/lib/dribads/api-auth";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request) {
  try {
    const auth = await getAuthorizedUser(request);
    if (auth.error) {
      return corsJson({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const appSlug = searchParams.get("app") || searchParams.get("app_slug") || null;
    const data = await getDashboardData({ appSlug, ownerUserId: auth.user.id });
    return corsJson(data);
  } catch (error) {
    console.error("GET /api/dashboard error", error);
    if (error instanceof Error && error.message === "OWNER_SCOPE_NOT_READY") {
      return corsJson({ error: "Owner scope is not ready. Run dribads_schema.sql again." }, { status: 500 });
    }
    return corsJson({ error: "Failed to load dashboard" }, { status: 500 });
  }
}

