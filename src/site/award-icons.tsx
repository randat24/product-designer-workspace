// Award icons: vector traces (public/awards/*.svg) of the stylised medal artwork —
// one light tone on transparent, shown on a dark tile in both themes.

/** Tile colour behind the icons. */
export const AWARD_TILE = "#1d2447";

export const AWARD_ICONS = [
  "defence-of-ukraine",
  "defence-of-mykolaiv",
  "marine-brigade-36",
  "honour-and-loyalty",
  "veteran-of-war",
  "military-service-veteran",
] as const;
export type AwardIcon = (typeof AWARD_ICONS)[number];

export function AwardSvg({ icon, className }: { icon: AwardIcon; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- static SVG files
  return <img src={`/awards/${icon}.svg`} alt="" aria-hidden="true" className={className} loading="lazy" />;
}
