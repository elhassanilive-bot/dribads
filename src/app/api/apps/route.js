import { NextResponse } from "next/server";
import { getApps } from "@/lib/dribads/repository";
import { getAuthorizedUser } from "@/lib/dribads/api-auth";

export async function GET(request) {
  try {
    const auth = await getAuthorizedUser(request);
    if (auth.error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apps = await getApps({ ownerUserId: auth.user.id });
    return NextResponse.json({ apps });
  } catch (error) {
    console.error("GET /api/apps error", error);
    if (error instanceof Error && error.message === "OWNER_SCOPE_NOT_READY") {
      return NextResponse.json({ error: "Owner scope is not ready. Run dribads_schema.sql again." }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to load apps" }, { status: 500 });
  }
}

