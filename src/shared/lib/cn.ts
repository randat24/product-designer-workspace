import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge must know the design-system scales (src/app/globals.css @theme). Without this it read
// text-body / text-meta / text-caption as colours: `cn("text-on-accent", "text-body")` dropped the colour
// (an invisible button label), `cn("text-meta", "text-danger")` dropped the size, and radius overrides
// such as rounded-control → rounded-panel both stayed. docs/DESIGN-SYSTEM.md «Токены».
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["caption", "meta", "body", "heading", "title", "display-xs", "display-sm", "display-md", "display-lg"],
      radius: ["chip", "control", "panel", "hero"],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
