import { NextResponse } from "next/server";
import { getAnalyticsData, getDashboardData } from "@/lib/dribads/repository";
import { buildCsv } from "@/lib/dribads/reports";
import { getAuthorizedUser } from "@/lib/dribads/api-auth";

export async function GET(request) {
  try {
    const auth = await getAuthorizedUser(request);
    if (auth.error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dashboard = await getDashboardData();
    const analytics = await getAnalyticsData(14);

    const rows = [
      ["Dribads Report"],
      ["Total Views", dashboard.totalViews],
      ["Total Clicks", dashboard.totalClicks],
      ["Balance", dashboard.balance],
      [""],
      ["Analytics (Last 14 days)"],
      ["Date", "Views", "Clicks"],
      ...analytics.map((row) => [row.date, row.views, row.clicks]),
      [""],
      ["Ads"],
      ["Title", "Description", "Budget", "Views", "Clicks", "CTR", "Status", "Created"],
      ...dashboard.ads.map((ad) => {
        const ctr = ad.views ? ((ad.clicks || 0) / ad.views) * 100 : 0;
        return [
          ad.title,
          ad.description || "",
          Number(ad.budget || 0).toFixed(2),
          ad.views || 0,
          ad.clicks || 0,
          ctr.toFixed(2) + "%",
          ad.status || "active",
          ad.created_at,
        ];
      }),
    ];

    const csv = buildCsv(rows);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=dribads-report.csv",
      },
    });
  } catch (error) {
    console.error("GET /api/reports/csv error", error);
    return NextResponse.json({ error: "Failed to generate CSV" }, { status: 500 });
  }
}


