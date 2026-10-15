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
  primary: "border border-accent-text bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border border-control bg-transparent text-fg hover:bg-subtle",
  ghost: "hover:bg-subtle text-fg-secondary hover:text-fg",
  // Removal that is safe to do in one step (easy to redo); otherwise ConfirmDelete / ConfirmIconButton.
  danger: "border border-line bg-transparent text-danger hover:border-danger",
};

/** A ring in the button's text colour while its action runs; still under reduced motion (it is a state, not a flourish). */
function Spinner() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="size-4 shrink-0 animate-spin motion-reduce:animate-none">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * A submit button is disabled while its form's server action runs, so a second click
 * cannot create the same thing twice (e.g. several demo projects). `busy` says the same for an action run from
 * the button itself (useAction's `pending`). Busy, it keeps its colour and shows a spinner instead of fading out;
 * pressed, it gives a little under the finger.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; busy?: boolean }>(
  function Button({ className, variant = "primary", size = "md", type = "button", disabled, busy: running, children, ...props }, ref) {
    const { pending } = useFormStatus();
    const busy = !!running || (type === "submit" && pending);
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-control font-semibold whitespace-nowrap transition-[color,background-color,border-color,transform] duration-(--duration-fast) ease-standard active:translate-y-px disabled:pointer-events-none disabled:not-aria-busy:opacity-50",
          SIZES[size],
          busy && "cursor-progress",
          VARIANTS[variant],
          className,
        )}
        {...props}
      >
        {busy && <Spinner />}
        {children}
      </button>
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
        "hit grid shrink-0 place-items-center rounded-control text-fg-secondary transition-[color,background-color,transform] duration-(--duration-fast) ease-standard hover:bg-subtle active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        size === "md" ? "size-9 text-body" : "size-8 text-meta",
        tone === "danger" ? "hover:text-danger" : "hover:text-fg",
        className,
      )}
      {...props}>
      <span aria-hidden>{children}</span>
    </button>
  );
});
