function parseStripeSignature(header) {
  if (!header) return null;
  const parts = header.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const signaturePart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !signaturePart) return null;
  return {
    timestamp: timestampPart.split("=")[1],
    signature: signaturePart.split("=")[1],
  };
}

async function hmacSha256(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, payload);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Missing webhook secret", { status: 500 });
  }

  const signatureHeader = request.headers.get("stripe-signature");
  const sig = parseStripeSignature(signatureHeader);
  if (!sig) {
    return new Response("Invalid signature", { status: 400 });
  }

  const raw = await request.arrayBuffer();
  const payload = new Uint8Array(raw);
  const signedPayload = new TextEncoder().encode(`${sig.timestamp}.`);
  const combined = new Uint8Array(signedPayload.length + payload.length);
  combined.set(signedPayload);
  combined.set(payload, signedPayload.length);

  const expected = await hmacSha256(secret, combined);
  if (expected !== sig.signature) {
    return new Response("Signature mismatch", { status: 400 });
  }

  const body = JSON.parse(new TextDecoder().decode(payload));

  // Handle key events here if needed
  switch (body.type) {
    case "checkout.session.completed":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      break;
    default:
      break;
  }

  return new Response("ok", { status: 200 });
}
