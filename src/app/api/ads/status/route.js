import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { updateAdStatus } from "@/lib/dribads/repository";

export async function PATCH(request) {
  try {
    const body = await request.json();
    const adId = body?.ad_id;
    const status = body?.status;

    if (!adId || !status) {
      return NextResponse.json({ error: "ad_id and status are required" }, { status: 400 });
    }

    const updated = await updateAdStatus(adId, status);

    revalidatePath("/dashboard");
    revalidatePath("/");

    return NextResponse.json({ ad: updated });
  } catch (error) {
    console.error("PATCH /api/ads/status error", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
