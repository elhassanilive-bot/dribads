function parseHttpUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

const ALLOWED_STATUSES = new Set(["active", "paused", "draft"]);

export function validateAdInput(body) {
  const title = body?.title?.trim();
  const description = body?.description?.trim() || "";
  const mediaUrlRaw = body?.media_url?.trim();
  const targetUrlRaw = body?.target_url?.trim();
  const budget = Number(body?.budget);
  const statusRaw = body?.status?.trim();

  if (!title) return { error: "title is required" };

  const media_url = parseHttpUrl(mediaUrlRaw || "");
  if (!media_url) return { error: "media_url must be a valid http/https URL" };

  const target_url = parseHttpUrl(targetUrlRaw || "");
  if (!target_url) return { error: "target_url must be a valid http/https URL" };

  if (Number.isNaN(budget) || budget <= 0) {
    return { error: "budget must be a number greater than 0" };
  }

  if (budget > 1000000) {
    return { error: "budget is too large" };
  }

  if (description.length > 1000) {
    return { error: "description is too long (max 1000 chars)" };
  }

  const status = ALLOWED_STATUSES.has(statusRaw) ? statusRaw : "active";

  return {
    data: {
      title,
      description,
      media_url,
      target_url,
      budget: Number(budget.toFixed(2)),
      status,
    },
  };
}

export function isValidHttpUrl(value) {
  return Boolean(parseHttpUrl(value));
}

export function isValidStatus(value) {
  return ALLOWED_STATUSES.has(value);
}
