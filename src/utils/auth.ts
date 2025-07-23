import { NextRequest } from "next/server";

/**
 * Validates authorization header using a pre-shared secret token.
 * Supports both "Bearer <token>" and raw token formats.
 */
export function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CODERPUSH_PULSE_SECRET_KEY;

  if (!authHeader || !expected) return false;

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  return token === expected;
}
