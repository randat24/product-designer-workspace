import { cn } from "@/shared/lib/cn";

/** The «hf.» monogram of the SIGNAL header: initials in a square outline. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-9 place-items-center border border-fg pr-[3px] text-[18px] font-medium tracking-[-0.12em] sm:size-10 sm:text-[20px]", className)}>
      hf.
    </span>
  );
}
