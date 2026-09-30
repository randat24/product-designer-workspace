/**
 * Postel's law (docs/UX_LAWS.md, UX-28): accept "figma.com/file/…" or " example.com " and store
 * a full https URL. A value that already has a scheme ("https:", "mailto:") is kept as typed.
 */
export function withScheme(value: string): string {
  const v = value.trim();
  return v && !/^[a-z][a-z0-9+.-]*:/i.test(v) ? `https://${v}` : v;
}

export const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);
