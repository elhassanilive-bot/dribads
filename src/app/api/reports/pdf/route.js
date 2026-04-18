import { NextResponse } from "next/server";
import { getAnalyticsData, getDashboardData } from "@/lib/dribads/repository";
import { buildSimplePdf } from "@/lib/dribads/reports";
import { getAuthorizedUser } from "@/lib/dribads/api-auth";

export async function GET(request) {
  try {
    const auth = await getAuthorizedUser(request);
    if (auth.error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dashboard = await getDashboardData({ ownerUserId: auth.user.id });
    const analytics = await getAnalyticsData(14, { ownerUserId: auth.user.id });

    const lines = [
      "Dribads Report",
      "",
      `Total Views: ${dashboard.totalViews}`,
      `Total Clicks: ${dashboard.totalClicks}`,
      `Balance: ${dashboard.balance}`,
      "",
      "Analytics (Last 14 days)",
      ...analytics.map((row) => `${row.date} | Views: ${row.views} | Clicks: ${row.clicks}`),
      "",
      "Ads",
      ...dashboard.ads.map((ad) => {
        const ctr = ad.views ? ((ad.clicks || 0) / ad.views) * 100 : 0;
        return `${ad.title} | Desc: ${(ad.description || "").slice(0, 120)} | Budget: ${Number(ad.budget || 0).toFixed(2)} | Views: ${ad.views || 0} | Clicks: ${ad.clicks || 0} | CTR: ${ctr.toFixed(2)}% | Status: ${ad.status || "active"}`;
      }),
    ];

    const pdf = buildSimplePdf({
      title: "Dribads",
      subtitle: "Ad Performance Report",
      lines,
    });

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=dribads-report.pdf",
      },
    });
  } catch (error) {
    console.error("GET /api/reports/pdf error", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}



