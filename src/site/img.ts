/**
 * Case pictures through the Next.js image optimizer: the browser gets WebP/AVIF at the width it actually shows,
 * not the original (an uploaded 1672 px PNG cover weighed 1.4 MB on a 600 px card). Works for files in /public and
 * for case media in Supabase Storage (next.config.ts, images.remotePatterns). SVG and data URLs are left as they are.
 */
const WIDTHS = [640, 828, 1200, 1920] as const; // all in Next's default deviceSizes

const url = (src: string, w: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;

/** What the optimizer accepts (next.config.ts): a path on this site, or a public file in Supabase Storage. */
const OPTIMIZABLE = /^(\/(?!\/)|https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/)/i;

/** `src`, `srcSet` and `sizes` for an <img>; `sizes` says how wide the picture is laid out. */
export function responsive(src: string, intrinsicWidth: number, sizes: string): { src: string; srcSet?: string; sizes?: string } {
  // Anything else (another host, a protocol-relative URL, an SVG) keeps its original address: the optimizer
  // would answer 400 and the picture would disappear.
  if (!OPTIMIZABLE.test(src) || /\.svg(\?|#|$)/i.test(src) || /\/svg|svg\+xml/i.test(src)) return { src };
  // No upscaling: stop at the first step that covers the original.
  const last = WIDTHS.findIndex((w) => w >= intrinsicWidth);
  const widths = last === -1 ? [...WIDTHS] : WIDTHS.slice(0, last + 1);
  return { src: url(src, widths[widths.length - 1]!), srcSet: widths.map((w) => `${url(src, w)} ${w}w`).join(", "), sizes };
}

/** How wide the pictures are laid out, by place. */
export const SIZES = {
  card: "(max-width: 640px) 100vw, (max-width: 1440px) 70vw, 1000px",
  cover: "(max-width: 1440px) 100vw, 1344px",
  figure: "(max-width: 1024px) 100vw, 960px",
  thumb: "(max-width: 640px) 50vw, 420px",
} as const;
