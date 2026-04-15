import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dribads/repository";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appSlug = searchParams.get("app") || null;
    const data = await getDashboardData({ appSlug });
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/dashboard error", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
