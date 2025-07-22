const rawDomains = process.env.ALLOWED_CORS_DOMAINS || ".coderbase.dev";
const ALLOWED_DOMAINS = rawDomains
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

/**
 * Checks if the given origin is allowed based on domain suffix or exact match.
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  try {
    const { hostname } = new URL(origin);

    return ALLOWED_DOMAINS.some((domain) => {
      if (domain.startsWith(".")) {
        const base = domain.slice(1);
        return hostname === base || hostname.endsWith(`.${base}`);
      }

      try {
        const allowedHostname = new URL(domain).hostname;
        return hostname === allowedHostname;
      } catch {
        return hostname === domain;
      }
    });
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
      "Access-Control-Allow-Origin": origin!,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
  }
  return {};
}
