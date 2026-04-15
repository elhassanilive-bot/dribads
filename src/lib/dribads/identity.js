export function buildPublisherId(userId) {
  const raw = String(userId || "").replace(/-/g, "").toUpperCase();
  const seed = raw.slice(0, 10).padEnd(10, "0");
  return `PUB-${seed}`;
}

export function buildMerchantId(userId) {
  const raw = String(userId || "").replace(/-/g, "").toUpperCase();
  const seed = raw.slice(-10).padStart(10, "0");
  return `MRC-${seed}`;
}

export function ensureIdentityMetadata(user) {
  const metadata = { ...(user?.user_metadata || {}) };
  const userId = user?.id || "";
  let changed = false;

  if (!metadata.publisher_id) {
    metadata.publisher_id = buildPublisherId(userId);
    changed = true;
  }

  if (!metadata.merchant_id) {
    metadata.merchant_id = buildMerchantId(userId);
    changed = true;
  }

  if (!metadata.full_name && user?.email) {
    metadata.full_name = String(user.email).split("@")[0];
    changed = true;
  }

  return { metadata, changed };
}
