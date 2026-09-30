"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/shared/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";
const SIZES: Record<Size, string> = {
  md: "h-9 px-3.5 text-sm",
  // Secondary actions inside panels and lists («+ Добавить цель», «Связать…»): control-sm, 32 px.
  sm: "h-8 px-3 text-meta",
};
const VARIANTS: Record<Variant, string> = {
  primary: "border-[1.5px] border-accent bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border-[1.5px] border-fg bg-transparent text-fg hover:bg-subtle",
  ghost: "hover:bg-subtle text-fg-secondary hover:text-fg",
  // Removal that is safe to do in one step (easy to redo); otherwise ConfirmDelete / ConfirmIconButton.
  danger: "border-[1.5px] border-line bg-transparent text-danger hover:border-danger",
};

/**
 * A submit button is disabled while its form's server action runs, so a second click
 * cannot create the same thing twice (e.g. several demo projects).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }>(
  function Button({ className, variant = "primary", size = "md", type = "button", disabled, ...props }, ref) {
    const { pending } = useFormStatus();
    const busy = type === "submit" && pending;
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-control font-semibold whitespace-nowrap transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-50",
          SIZES[size],
          busy && "cursor-progress",
          VARIANTS[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

/**
 * A square button with a single glyph («×», «✎», «↑»). The label is required: it is the only name a screen
 * reader gets. 36 px (32 px with size="sm"); `.hit` keeps a 44 px touch target. tone="danger" for removal.
 */
export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string; size?: Size; tone?: "default" | "danger";
}>(function IconButton({ label, size = "md", tone = "default", className, type = "button", children, ...props }, ref) {
  return (
    <button ref={ref} type={type} aria-label={label} title={label}
      className={cn(
        "hit grid shrink-0 place-items-center rounded-control text-fg-secondary transition-colors duration-[120ms] hover:bg-subtle disabled:pointer-events-none disabled:opacity-50",
        size === "md" ? "size-9 text-body" : "size-8 text-meta",
        tone === "danger" ? "hover:text-danger" : "hover:text-fg",
        className,
      )}
      {...props}>
      <span aria-hidden>{children}</span>
    </button>
  );
});
