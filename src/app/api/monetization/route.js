import { NextResponse } from "next/server";
import { getMonetizationFeatures } from "@/lib/dribads/repository";
import { getAuthorizedUser } from "@/lib/dribads/api-auth";

export async function GET(request) {
  try {
    const auth = await getAuthorizedUser(request);
    if (auth.error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const appSlug = searchParams.get("app") || null;
    const data = await getMonetizationFeatures(appSlug, { ownerUserId: auth.user.id });
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/monetization error", error);
    return NextResponse.json({ error: "Failed to load monetization settings" }, { status: 500 });
  }
}
