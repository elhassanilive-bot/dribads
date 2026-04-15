import { NextResponse } from "next/server";
import { getMonetizationFeatures } from "@/lib/dribads/repository";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appSlug = searchParams.get("app") || null;
    const data = await getMonetizationFeatures(appSlug);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/monetization error", error);
    return NextResponse.json({ error: "Failed to load monetization settings" }, { status: 500 });
  }
}
