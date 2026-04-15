export function formatDribadsError(error, fallback) {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error?.message === "string") return error.message;
  if (typeof error?.details === "string") return error.details;
  return fallback;
}

export function normalizeDribadsError(error, messages) {
  const raw = formatDribadsError(error, messages.loadError);
  const lower = String(raw).toLowerCase();

  if (raw === "DRIBADS_SCHEMA_MISSING" || raw === "DRIBADS_TABLES_MISSING") {
    return messages.schemaMissing;
  }

  if (raw === "SUPABASE_NOT_CONFIGURED") {
    return messages.authMissing;
  }

  if (lower.includes("schema") || lower.includes("relation") || lower.includes("does not exist")) {
    return messages.schemaMissing;
  }

  if (lower.includes("permission") || lower.includes("jwt") || lower.includes("apikey")) {
    return messages.authMissing;
  }

  return raw;
}
