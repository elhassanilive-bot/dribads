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
    const data = await getDashboardData({ appSlug });
    return corsJson(data);
  } catch (error) {
    console.error("GET /api/dashboard error", error);
    return corsJson({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
