import { withScheme } from "./url";

const FIGMA_PATH = /^\/(design|file|proto|board|slides|deck)\/[A-Za-z0-9]+/;

/**
 * A Figma link to a file, prototype or board: "figma.com/design/KEY/…" with or without https:// and www.
 * Returns the normalised https URL, or null for anything else (other hosts, figma.com pages without a file).
 */
export function figmaFileUrl(value: string): string | null {
  const raw = withScheme(value);
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !/^(www\.)?figma\.com$/i.test(url.hostname) || !FIGMA_PATH.test(url.pathname)) return null;
  url.hostname = "www.figma.com";
  return url.toString();
}

/** Figma's embed player for a file link (https://www.figma.com/developers/embed). */
export function figmaEmbedUrl(fileUrl: string): string {
  return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(fileUrl)}`;
}
