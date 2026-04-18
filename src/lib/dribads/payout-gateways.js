const PAYPAL_ENV = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();
const PAYPAL_BASE =
  PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

function requireEnv(name) {
  const value = (process.env[name] || "").trim();
  if (!value) throw new Error(`MISSING_ENV_${name}`);
  return value;
}

function maskText(text = "") {
  if (!text) return "";
  if (text.length <= 6) return "*".repeat(text.length);
  return `${text.slice(0, 2)}***${text.slice(-2)}`;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const raw = await res.text();
  let json = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = { raw };
  }
  return { ok: res.ok, status: res.status, json };
}

async function paypalAccessToken() {
  const clientId = requireEnv("PAYPAL_CLIENT_ID");
  const clientSecret = requireEnv("PAYPAL_CLIENT_SECRET");
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetchJson(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!tokenRes.ok || !tokenRes.json?.access_token) {
    throw new Error("PAYPAL_AUTH_FAILED");
  }
  return tokenRes.json.access_token;
}

async function processPaypalPayout({ requestId, amount, destination, note }) {
  const token = await paypalAccessToken();
  const senderBatchId = `dribads-${requestId}-${Date.now()}`.slice(0, 120);

  const payoutRes = await fetchJson(`${PAYPAL_BASE}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: senderBatchId,
        email_subject: "You have a payout from Dribads",
        email_message: "Your payout request has been processed.",
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value: Number(amount).toFixed(2),
            currency: "USD",
          },
          receiver: destination,
          note: note || "Dribads payout",
          sender_item_id: requestId,
        },
      ],
    }),
  });

  if (!payoutRes.ok) {
    return {
      success: false,
      providerStatus: "failed",
      errorMessage: "PAYPAL_PAYOUT_FAILED",
      providerResponse: payoutRes.json,
    };
  }

  const batchHeader = payoutRes.json?.batch_header || {};
  return {
    success: true,
    providerStatus: String(batchHeader.batch_status || "PENDING").toLowerCase(),
    providerRef: batchHeader.payout_batch_id || senderBatchId,
    providerResponse: {
      batch_status: batchHeader.batch_status || "PENDING",
      payout_batch_id: batchHeader.payout_batch_id || null,
      receiver: maskText(destination),
    },
  };
}

async function processWebhookPayout({
  endpointEnv,
  tokenEnv,
  method,
  requestId,
  appSlug,
  amount,
  destination,
  note,
}) {
  const endpoint = requireEnv(endpointEnv);
  const token = requireEnv(tokenEnv);
  const webhookRes = await fetchJson(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      request_id: requestId,
      app_slug: appSlug,
      method,
      amount: Number(amount).toFixed(2),
      currency: "USD",
      destination,
      note: note || "",
    }),
  });

  if (!webhookRes.ok) {
    return {
      success: false,
      providerStatus: "failed",
      errorMessage: `${method.toUpperCase()}_PAYOUT_FAILED`,
      providerResponse: webhookRes.json,
    };
  }

  return {
    success: true,
    providerStatus: "submitted",
    providerRef:
      webhookRes.json?.transaction_id || webhookRes.json?.id || `${method}-${requestId}-${Date.now()}`,
    providerResponse: webhookRes.json,
  };
}

export async function processPayoutWithGateway({
  method,
  requestId,
  appSlug,
  amount,
  destination,
  note,
}) {
  if (method === "paypal") {
    return processPaypalPayout({ requestId, amount, destination, note });
  }
  if (method === "perfect_money") {
    return processWebhookPayout({
      endpointEnv: "PERFECT_MONEY_PAYOUT_ENDPOINT",
      tokenEnv: "PERFECT_MONEY_PAYOUT_TOKEN",
      method,
      requestId,
      appSlug,
      amount,
      destination,
      note,
    });
  }
  if (method === "vodafone_cash") {
    return processWebhookPayout({
      endpointEnv: "VODAFONE_CASH_PAYOUT_ENDPOINT",
      tokenEnv: "VODAFONE_CASH_PAYOUT_TOKEN",
      method,
      requestId,
      appSlug,
      amount,
      destination,
      note,
    });
  }

  throw new Error("UNSUPPORTED_PAYOUT_METHOD");
}

