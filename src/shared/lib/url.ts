import { z } from "zod";

/**
 * Postel's law (docs/UX_LAWS.md, UX-28): accept "figma.com/file/…" or " example.com " and store
 * a full https URL. A value that already has a scheme ("https:", "mailto:") is kept as typed.
 * "example.com:8080/path" is a host with a port, not a scheme; a host has a dot or is localhost, so
 * "tel:0501234567" or "skype:12345" stays a scheme (and a link field rejects it) instead of becoming https://tel:….
 */
export function withScheme(value: string): string {
  const v = value.trim();
  if (!v) return v;
  const hostWithPort = /^(?:localhost|[^\s/:]*\.[^\s/:]+):\d+(?:[/?#]|$)/i.test(v);
  return hostWithPort || !/^[a-z][a-z0-9+.-]*:/i.test(v) ? `https://${v}` : v;
}

export const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

/** A host a link can point to: a name with a dot (example.com, 127.0.0.1) or localhost. */
function hasRealHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || (host.includes(".") && !host.startsWith(".") && !host.endsWith("."));
  } catch {
    return false;
  }
}

/**
 * A link from outside the app (an imported file): a full http(s) URL, or null when it is anything else. Placeholder
 * cells ("n/a", "—", "см. сайт") are not links: no spaces and a real host, or null.
 */
export function httpUrlOrNull(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw || /\s/.test(raw)) return null;
  const v = withScheme(raw);
  return v.length <= 2000 && isHttpUrl(v) && hasRealHost(v) ? v : null;
}

/**
 * An optional link field: "example.com" gets https://, an empty value becomes null, and schemes other than
 * http(s) (javascript:, data:, file:) are rejected. One definition for every form that stores a link.
 */
export const optionalHttpUrl = (message = "url") =>
  z.string().trim().max(2000).nullish()
    // "http:", "https:/" are a scheme being typed by hand, not a wrong link: treated as still empty.
    .transform((v) => (v && !/^https?:\/{0,2}$/i.test(v) ? withScheme(v) : null))
    .refine((v) => v === null || isHttpUrl(v), { message });
