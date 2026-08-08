// ============================================================================
// Browser-side API client — consistent response envelope handling.
// ============================================================================

import type { ApiResponse } from "./api";

export class ClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "ClientError";
  }
}

export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ClientError("NETWORK", "Can't reach SkillSwap right now. Check your connection.");
  }

  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    // ignore non-JSON responses
  }

  if (!body || body.success === undefined) {
    throw new ClientError("UNKNOWN", res.ok ? "Unexpected response." : "Something went wrong. Please try again.", res.status);
  }

  if (!body.success) {
    throw new ClientError(body.error.code, body.error.message, res.status);
  }
  return body.data;
}

export const get = <T = unknown>(url: string) => api<T>(url);
export const post = <T = unknown>(url: string, data?: unknown) =>
  api<T>(url, { method: "POST", body: data === undefined ? undefined : JSON.stringify(data) });
export const patch = <T = unknown>(url: string, data?: unknown) =>
  api<T>(url, { method: "PATCH", body: data === undefined ? undefined : JSON.stringify(data) });
export const del = <T = unknown>(url: string) => api<T>(url, { method: "DELETE" });
