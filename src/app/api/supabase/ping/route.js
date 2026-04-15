import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return { url, anonKey };
}

export async function GET() {
  const { url, anonKey } = getEnv();

  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, configured: false, error: "Missing Supabase env vars" },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const healthUrl = new URL("/auth/v1/health", url);
    const res = await fetch(healthUrl, {
      method: "GET",
      headers: {
        apikey: anonKey,
      },
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await res.text().catch(() => "");

    return NextResponse.json({
      ok: res.ok,
      configured: true,
      status: res.status,
      body: text.slice(0, 500),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}

