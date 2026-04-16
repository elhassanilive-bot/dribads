import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, x-dribads-app-key, x-dribads-app, x-dribads-app-slug, Authorization",
};

export function addCorsHeaders(headers = {}) {
  return {
    ...headers,
    ...CORS_HEADERS,
  };
}

export function corsJson(body, init = {}) {
  const status = init.status || 200;
  const headers = addCorsHeaders(init.headers || {});
  return NextResponse.json(body, { ...init, status, headers });
}

export function corsOptionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: addCorsHeaders(),
  });
}
