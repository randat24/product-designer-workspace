import { z } from "zod";

/**
 * Postel's law (docs/UX_LAWS.md, UX-28): accept "figma.com/file/…" or " example.com " and store
 * a full https URL. A value that already has a scheme ("https:", "mailto:") is kept as typed.
 * "example.com:8080/path" is a host with a port, not a scheme.
 */
export function withScheme(value: string): string {
  const v = value.trim();
  if (!v) return v;
  const hostWithPort = /^[^\s/:]+:\d+(?:[/?#]|$)/.test(v);
  return hostWithPort || !/^[a-z][a-z0-9+.-]*:/i.test(v) ? `https://${v}` : v;
}

export const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

/** A link from outside the app (an imported file): a full http(s) URL, or null when it is anything else. */
export function httpUrlOrNull(value: string | null | undefined): string | null {
  const v = withScheme(value ?? "");
  return v && v.length <= 2000 && isHttpUrl(v) ? v : null;
}

/**
 * An optional link field: "example.com" gets https://, an empty value becomes null, and schemes other than
 * http(s) (javascript:, data:, file:) are rejected. One definition for every form that stores a link.
 */
export const optionalHttpUrl = (message = "url") =>
  z.string().trim().max(2000).nullish()
    .transform((v) => (v ? withScheme(v) : null))
    .refine((v) => v === null || isHttpUrl(v), { message });
