"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/shared/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
const VARIANTS: Record<Variant, string> = {
  primary: "border-[1.5px] border-accent bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border-[1.5px] border-fg bg-transparent text-fg hover:bg-subtle",
  ghost: "hover:bg-subtle text-fg-secondary hover:text-fg",
};

/**
 * A submit button is disabled while its form's server action runs, so a second click
 * cannot create the same thing twice (e.g. several demo projects).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  function Button({ className, variant = "primary", type = "button", disabled, ...props }, ref) {
    const { pending } = useFormStatus();
    const busy = type === "submit" && pending;
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        className={cn(
          "inline-flex h-9 items-center justify-center gap-1.5 rounded-control px-3.5 text-sm font-semibold transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-50",
          busy && "cursor-progress",
          VARIANTS[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
