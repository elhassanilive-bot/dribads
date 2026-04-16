import { getDashboardData } from "@/lib/dribads/repository";
import { corsJson, corsOptionsResponse } from "@/lib/dribads/cors";

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
    const data = await getDashboardData({ appSlug, appKey });
    return corsJson(data);
  } catch (error) {
    console.error("GET /api/dashboard error", error);
    return corsJson({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
