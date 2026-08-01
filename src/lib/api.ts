import { NextResponse } from "next/server";

export const DATABASE_UNAVAILABLE_MESSAGE = "The database is temporarily unavailable. Please try again shortly.";

export function jsonError(message: string, status = 500, headers?: HeadersInit) {
  return NextResponse.json({ error: message }, { status, headers });
}

export function logServerError(scope: string, error: unknown, metadata?: Record<string, unknown>) {
  const summary = getSafeErrorSummary(error);
  const payload = metadata ? { ...summary, ...metadata } : summary;
  // Use console.warn so Next.js dev overlay does not surface handled,
  // logged-for-ops events as runtime errors. Format as a single string so
  // structured fields stay readable everywhere (RSC mirroring renders the
  // second object arg as `{}` in the browser console).
  const fields = Object.entries(payload)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(" ");
  console.warn(`[${scope}] ${fields}`.trim());
}

export function isDatabaseUnavailableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const value = error as { code?: unknown; message?: unknown };
  if (value.code === "P1001" || value.code === "P1002") {
    return true;
  }

  return typeof value.message === "string" && (
    value.message.includes("Can't reach database server") ||
    value.message.includes("DATABASE_URL") ||
    value.message.includes("DIRECT_URL") ||
    value.message.includes("database")
  );
}

function getSafeErrorSummary(error: unknown) {
  if (error && typeof error === "object") {
    const value = error as { name?: unknown; code?: unknown; clientVersion?: unknown };
    return {
      name: typeof value.name === "string" ? value.name : "Error",
      code: typeof value.code === "string" ? value.code : undefined,
      clientVersion: typeof value.clientVersion === "string" ? value.clientVersion : undefined,
    };
  }

  return { name: typeof error === "string" ? "Error" : "UnknownError" };
}