import { cn } from "@/shared/lib/cn";

// Award icons: vector traces (public/awards/*.svg) of the stylised medal artwork, one tone on transparent.
// The file is used as a mask, so the medal is drawn in the text colour (SIGNAL ink in light, paper in dark)
// instead of the lavender of the source files.

export const AWARD_ICONS = [
  "defence-of-ukraine",
  "defence-of-mykolaiv",
  "marine-brigade-36",
  "honour-and-loyalty",
  "veteran-of-war",
  "military-service-veteran",
] as const;
export type AwardIcon = (typeof AWARD_ICONS)[number];

/** The medal in `currentColor`; size it by height (the drawing is 840 × 1350). */
export function AwardSvg({ icon, className }: { icon: AwardIcon; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("award-icon", className)}
      style={{ "--award": `url(/awards/${icon}.svg)` } as React.CSSProperties} />
  );
}
