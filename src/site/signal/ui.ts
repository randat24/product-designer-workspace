import { cn } from "@/shared/lib/cn";

/**
 * The site's controls, as SIGNAL classes (signal.css, @layer components). Every button, chip, field and menu on the
 * public pages takes its class from here, so they share one height, radius, type size and set of states.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "dashed" | "on-dark";

export function button({ variant = "primary", size, icon, block }: {
  variant?: ButtonVariant;
  /** 44 px instead of 48: compact rows (header, filters, dialogs on a phone). */
  size?: "sm";
  /** Square, icon only: give it an aria-label. */
  icon?: boolean;
  /** Full width of its container. */
  block?: boolean;
} = {}, className?: string) {
  return cn("sg-button", `sg-button--${variant}`, size === "sm" && "sg-button--sm", icon && "sg-button--icon", block && "sg-button--block", className);
}

export const sg = {
  link: "sg-link",
  chip: "sg-chip",
  chipCount: "sg-chip-count",
  segmented: "sg-segmented",
  input: "sg-input",
  field: "sg-field",
  label: "sg-label",
  hint: "sg-field-hint",
  error: "sg-field-error",
  panel: "sg-panel",
  menu: "sg-menu",
  menuItem: "sg-menu-item",
  alert: "sg-alert",
  tag: "sg-tag",
  badge: "sg-badge",
  eyebrow: "sg-eyebrow",
} as const;
