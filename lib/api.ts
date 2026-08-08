// ============================================================================
// SkillSwap — shared response envelope
//   success: { success: true,  data: {...} }
//   failure: { success: false, error: { code, message } }
// ============================================================================

export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string };
}

export interface ApiOkBody<T = unknown> {
  success: true;
  data: T;
}

export type ApiResponse<T = unknown> = ApiOkBody<T> | ApiErrorBody;

export function ok<T>(data: T, init?: ResponseInit): Response {
  return json({ success: true, data } satisfies ApiOkBody<T>, init);
}

export function fail(code: string, message: string, status = 400, extra?: Record<string, unknown>): Response {
  return json(
    { success: false, error: { code, message, ...extra } } satisfies ApiErrorBody,
    { status },
  );
}

export function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Read and parse a JSON request body safely. */
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    throw new ApiError("INVALID_BODY", "The request body could not be read.", 400);
  }
}
