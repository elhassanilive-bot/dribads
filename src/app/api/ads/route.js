import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAd, getDeliverableAd } from "@/lib/dribads/repository";
import { validateAdInput } from "@/lib/dribads/validators";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get("strategy") === "latest" ? "latest" : "random";
    const ad = await getDeliverableAd(strategy);

    return NextResponse.json(
      { ad, reason: ad ? null : "no_active_ad" },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/ads error", error);
    return NextResponse.json(
      { ad: null, reason: "backend_error" },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validation = validateAdInput(body);

    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const ad = await createAd(validation.data);

    revalidatePath("/");
    revalidatePath("/dashboard");

    return NextResponse.json({ ad }, { status: 201 });
  } catch (error) {
    console.error("POST /api/ads error", error);
    return NextResponse.json({ error: "Failed to create ad" }, { status: 500 });
  }
}
