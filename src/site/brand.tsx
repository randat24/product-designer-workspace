import { cn } from "@/shared/lib/cn";
import { FedoMark } from "@/shared/ui/fedo-mark";

/**
 * The site's mark in the header: the FEDO sign (an F with a cursor in its notch), the same one the tool uses.
 * Inside a `.group` link the cursor taps once on hover.
 */
export function BrandMark({ className }: { className?: string }) {
  return <FedoMark tap className={cn("size-9 sm:size-10", className)} />;
}
