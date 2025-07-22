/**
 * Checks if the given origin is allowed (matches *.coderbase.dev or coderbase.dev).
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.coderbase.dev') || hostname === 'coderbase.dev';
  } catch {
    return false;
  }
}

/**
 * Returns CORS headers if the origin is allowed, otherwise returns an empty object.
 */
export function corsHeaders(origin: string | null): Record<string, string> {
  if (isAllowedOrigin(origin)) {
    return {
      'Access-Control-Allow-Origin': origin!,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
  }
  return {};
} 