import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

export async function getAuthorizedUser(request) {
  const token = getBearerToken(request);
  if (!token) {
    return { user: null, error: "UNAUTHORIZED" };
  }

  const supabase = await getSupabaseAdminClient();
  if (!supabase) {
    return { user: null, error: "AUTH_NOT_CONFIGURED" };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, error: "UNAUTHORIZED" };
  }

  return { user: data.user, error: null };
}

