let cachedAdminClient = null;

export function isSupabaseAdminConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function getSupabaseAdminClient() {
  if (cachedAdminClient) return cachedAdminClient;
  if (!isSupabaseAdminConfigured()) return null;

  const { createClient } = await import("@supabase/supabase-js");

  cachedAdminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false },
    }
  );

  return cachedAdminClient;
}

