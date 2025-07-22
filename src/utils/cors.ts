const ALLOWED_CORS_DOMAIN_SUFFIX = process.env.ALLOWED_CORS_DOMAIN_SUFFIX || '.coderbase.dev';

/**
 * Checks if the given origin is allowed (matches *<ALLOWED_CORS_DOMAIN_SUFFIX> or the base domain).
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (ALLOWED_CORS_DOMAIN_SUFFIX === '*') return true;
  if (!origin) return false;
  try {
    const { hostname } = new URL(origin);
    const baseDomain = ALLOWED_CORS_DOMAIN_SUFFIX.startsWith('.')
      ? ALLOWED_CORS_DOMAIN_SUFFIX.slice(1)
      : ALLOWED_CORS_DOMAIN_SUFFIX;
    return hostname.endsWith(ALLOWED_CORS_DOMAIN_SUFFIX) || hostname === baseDomain;
  } catch {
    return false;
  }
}

/**
 * Returns CORS headers if the origin is allowed, otherwise returns an empty object.
 */
export function corsHeaders(origin: string | null): Record<string, string> {
  if (ALLOWED_CORS_DOMAIN_SUFFIX === '*') {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
  }
  if (isAllowedOrigin(origin)) {
    return {
      'Access-Control-Allow-Origin': origin!,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
  }
  return {};
}
