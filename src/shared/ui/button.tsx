import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
const VARIANTS: Record<Variant, string> = {
  primary: "border-[1.5px] border-accent bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border-[1.5px] border-fg bg-transparent text-fg hover:bg-subtle",
  ghost: "hover:bg-subtle text-fg-secondary hover:text-fg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  function Button({ className, variant = "primary", type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex h-9 items-center justify-center gap-1.5 rounded-[9px] px-3.5 text-sm font-semibold transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-50",
          VARIANTS[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
