import { NextResponse } from "next/server";
import { getAuthorizedUser } from "@/lib/dribads/api-auth";
import { getPublisherAppLink, linkPublisherApp, unlinkPublisherApp } from "@/lib/dribads/repository";

function parseAppContext(request, body = null) {
  const { searchParams } = new URL(request.url);
  const appSlug =
    body?.app_slug ||
    body?.appSlug ||
    body?.app ||
    searchParams.get("app") ||
    searchParams.get("app_slug") ||
    null;
  const appKey =
    request.headers.get("x-dribads-app-key") ||
    body?.app_key ||
    body?.appKey ||
    searchParams.get("app_key") ||
    "";

  return { appSlug, appKey };
}

function mapError(error) {
  const code = error instanceof Error ? error.message : String(error || "");
  if (code === "UNAUTHORIZED") return { status: 401, error: "Unauthorized" };
  if (code === "INVALID_APP_KEY" || code === "APP_KEY_SLUG_MISMATCH") {
    return { status: 401, error: "Invalid app credentials" };
  }
  if (code === "APP_NOT_FOUND") return { status: 404, error: "App not found" };
  if (code === "APP_LINKS_TABLE_MISSING") {
    return { status: 500, error: "App links table is missing. Run dribads_schema.sql again." };
  }
  return { status: 500, error: "Failed to process app link" };
}

export async function GET(request) {
  try {
    const auth = await getAuthorizedUser(request);
    if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { appSlug, appKey } = parseAppContext(request);
    const data = await getPublisherAppLink({
      ownerUserId: auth.user.id,
      appSlug,
      appKey,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/mobile/link-app error", error);
    const mapped = mapError(error);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthorizedUser(request);
    if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { appSlug, appKey } = parseAppContext(request, body);
    const data = await linkPublisherApp({
      ownerUserId: auth.user.id,
      appSlug,
      appKey,
      linkedFrom: body?.linked_from || body?.linkedFrom || "mobile",
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST /api/mobile/link-app error", error);
    const mapped = mapError(error);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}

export async function DELETE(request) {
  try {
    const auth = await getAuthorizedUser(request);
    if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { appSlug, appKey } = parseAppContext(request);
    const data = await unlinkPublisherApp({
      ownerUserId: auth.user.id,
      appSlug,
      appKey,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("DELETE /api/mobile/link-app error", error);
    const mapped = mapError(error);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
