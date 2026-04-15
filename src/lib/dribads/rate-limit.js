const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 120;
const store = new Map();

export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function allowRequest(request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = store.get(ip) || { count: 0, resetAt: now + WINDOW_MS };

  if (entry.resetAt < now) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }

  entry.count += 1;
  store.set(ip, entry);

  return entry.count <= MAX_REQUESTS;
}
