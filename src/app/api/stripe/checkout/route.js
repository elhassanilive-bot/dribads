import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const priceId = body?.priceId;

    if (!priceId) {
      return NextResponse.json({ error: "priceId is required" }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Stripe secret key is missing" }, { status: 500 });
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${origin}/dashboard?payment=success`;
    const cancelUrl = `${origin}/pricing?payment=cancel`;

    const params = new URLSearchParams();
    params.append("success_url", successUrl);
    params.append("cancel_url", cancelUrl);
    params.append("mode", "subscription");
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || "Stripe error" }, { status: 500 });
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error("POST /api/stripe/checkout error", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
