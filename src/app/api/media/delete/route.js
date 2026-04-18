import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthorizedUser } from "@/lib/dribads/api-auth";

const BUCKET = "dribads-media";

function isSafePath(path) {
  return typeof path === "string" && path.startsWith("ads/") && !path.includes("..");
}

export async function POST(request) {
  try {
    const auth = await getAuthorizedUser(request);
    if (auth.error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase admin client is not configured" }, { status: 500 });
    }

    const body = await request.json();
    const path = body?.path;

    if (!isSafePath(path)) {
      return NextResponse.json({ error: "invalid media path" }, { status: 400 });
    }

    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      return NextResponse.json({ error: error.message || "Failed to delete media" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/media/delete error", error);
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}
