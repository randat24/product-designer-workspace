import { cn } from "@/shared/lib/cn";

/** The FEDO mark: an F built from rounded blocks, and a cursor in the notch of the F (geometry of the owner's logo). */
export const FEDO_F = "M96.0781 56.042C73.951 56.0422 56.0137 74.167 56.0137 96.5244V295.561C56.0138 317.918 73.9511 336.042 96.0781 336.042L132.643 336C154.77 336 172.708 317.876 172.708 295.519V195.793C172.708 182.803 183.241 172.274 196.233 172.273H240.364C262.492 172.273 280.43 154.149 280.43 131.791V96.4814C280.429 74.1242 262.491 56.0001 240.364 56L96.0781 56.042Z";
export const FEDO_CURSOR = "M229.918 203.496C211.855 196.841 202.824 193.514 198.169 198.169C193.514 202.824 196.841 211.855 203.496 229.918L214.622 260.115C217.958 269.169 219.625 273.697 223.292 274.502C226.959 275.307 230.37 271.896 237.193 265.073L243.858 258.408L265.683 280.232C267.942 282.492 269.073 283.622 270.333 284.145C272.014 284.841 273.902 284.841 275.583 284.145C276.843 283.622 277.973 282.492 280.232 280.232C282.492 277.973 283.622 276.843 284.145 275.583C284.841 273.902 284.841 272.014 284.145 270.333C283.622 269.073 282.493 267.943 280.233 265.684L258.408 243.858L265.072 237.193C271.895 230.37 275.307 226.959 274.502 223.292C273.697 219.625 269.169 217.958 260.115 214.622L229.918 203.496Z";

/**
 * The square mark. Colours follow the theme (ink square, paper symbol); set --fedo-box / --fedo-sym to invert it on
 * a dark rail. With `tap`, the cursor taps once when a `.group` around it is hovered.
 */
export function FedoMark({ className, title, tap }: { className?: string; title?: string; tap?: boolean }) {
  return (
    <svg viewBox="0 0 392 392" className={cn("fedo-mark shrink-0", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <rect width="392" height="392" rx="64" className="fedo-box" />
      <g transform="translate(28 0)" className="fedo-sym">
        <path d={FEDO_F} />
        <path d={FEDO_CURSOR} className={tap ? "fedo-tap" : undefined} />
      </g>
    </svg>
  );
}

/** The cursor of the mark alone, in the current text colour: the site's sign for «open». */
export function CursorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="192 192 96 96" fill="currentColor" aria-hidden className={cn("shrink-0", className)}>
      <path d={FEDO_CURSOR} />
    </svg>
  );
}
