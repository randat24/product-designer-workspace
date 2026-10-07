"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/** Inline, runs before paint: applies a saved theme so there is no flash of the other one. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

/**
 * Flips light ↔ dark on <html data-theme> and remembers it (one choice for the site and the tool: same key).
 * Until someone picks, both follow the system setting. Returns the theme now on.
 */
export function toggleTheme(): "light" | "dark" {
  const root = document.documentElement;
  const current = root.dataset.theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // private mode: the choice lasts until reload
  }
  return next;
}

/**
 * The tool's theme switch. Which icon and label show is decided by CSS (globals.css: .theme-icon-*, .theme-label-*),
 * so server and client render the same markup. `labelLight` / `labelDark` name the theme the button switches TO.
 * Without `showLabel` the label is for screen readers only.
 */
export function ThemeSwitch({ labelLight, labelDark, showLabel, className }: {
  labelLight: string;
  labelDark: string;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <button type="button" onClick={toggleTheme} className={cn("inline-flex items-center gap-2", className)}>
      <Moon aria-hidden className="theme-icon-moon size-4 shrink-0" />
      <Sun aria-hidden className="theme-icon-sun size-4 shrink-0" />
      <span className={cn("theme-label-dark", !showLabel && "sr-only")}>{labelDark}</span>
      <span className={cn("theme-label-light", !showLabel && "sr-only")}>{labelLight}</span>
    </button>
  );
}
