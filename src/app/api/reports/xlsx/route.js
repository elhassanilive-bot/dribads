import { NextResponse } from "next/server";
import { getAnalyticsData, getDashboardData } from "@/lib/dribads/repository";
import { buildSpreadsheetXml } from "@/lib/dribads/reports";
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
      ["Total Views", String(dashboard.totalViews)],
      ["Total Clicks", String(dashboard.totalClicks)],
      ["Balance", String(dashboard.balance)],
      [""],
      ["Analytics (Last 14 days)"],
      ["Date", "Views", "Clicks"],
      ...analytics.map((row) => [row.date, String(row.views), String(row.clicks)]),
      [""],
      ["Ads"],
      ["Title", "Description", "Budget", "Views", "Clicks", "CTR", "Status", "Created"],
      ...dashboard.ads.map((ad) => {
        const ctr = ad.views ? ((ad.clicks || 0) / ad.views) * 100 : 0;
        return [
          ad.title,
          ad.description || "",
          Number(ad.budget || 0).toFixed(2),
          String(ad.views || 0),
          String(ad.clicks || 0),
          ctr.toFixed(2) + "%",
          ad.status || "active",
          ad.created_at,
        ];
      }),
    ];

    const xml = buildSpreadsheetXml({ sheetName: "Dribads", rows });

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": "attachment; filename=dribads-report.xls",
      },
    });
  } catch (error) {
    console.error("GET /api/reports/xlsx error", error);
    return NextResponse.json({ error: "Failed to generate Excel" }, { status: 500 });
  }
}


