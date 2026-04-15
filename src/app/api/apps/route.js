import { NextResponse } from "next/server";
import { getApps } from "@/lib/dribads/repository";

export async function GET() {
  try {
    const apps = await getApps();
    return NextResponse.json({ apps });
  } catch (error) {
    console.error("GET /api/apps error", error);
    return NextResponse.json({ error: "Failed to load apps" }, { status: 500 });
  }
}
