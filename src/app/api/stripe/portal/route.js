import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const customerId = body?.customerId;

    if (!customerId) {
      return NextResponse.json({ error: "customerId is required" }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Stripe secret key is missing" }, { status: 500 });
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const params = new URLSearchParams();
    params.append("customer", customerId);
    params.append("return_url", `${origin}/dashboard?portal=return`);

    const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
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
    console.error("POST /api/stripe/portal error", error);
    return NextResponse.json({ error: "Failed to create billing portal session" }, { status: 500 });
  }
}
