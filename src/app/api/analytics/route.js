import { getAnalyticsData, getDashboardData } from "@/lib/dribads/repository";
import { corsJson, corsOptionsResponse } from "@/lib/dribads/cors";

function safePercent(clicks, views) {
  if (!views) return 0;
  return (clicks / views) * 100;
}

function calcCpm(earnings, views) {
  if (!views) return 0;
  return (earnings / views) * 1000;
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
    const days = Math.min(Math.max(Number(searchParams.get("days") || 14), 1), 90);

    const [dashboard, trend] = await Promise.all([
      getDashboardData({ appSlug, appKey }),
      getAnalyticsData(days, { appSlug, appKey }),
    ]);

    const ctr = safePercent(Number(dashboard.totalClicks || 0), Number(dashboard.totalViews || 0));
    const cpm = calcCpm(Number(dashboard.balance || 0), Number(dashboard.totalViews || 0));

    return corsJson({
      app: dashboard.app || null,
      summary: {
        totalViews: Number(dashboard.totalViews || 0),
        totalClicks: Number(dashboard.totalClicks || 0),
        balance: Number(dashboard.balance || 0),
        estimatedCpc: Number(dashboard.estimatedCpc || 0.05),
        ctr,
        cpm,
      },
      trend,
    });
  } catch (error) {
    console.error("GET /api/analytics error", error);
    return corsJson({ error: "Failed to load analytics" }, { status: 500 });
  }
}
