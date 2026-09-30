"use client";

import { track } from "./analytics/track";

/** Inline, runs before paint: applies a saved theme so there is no flash of the other one. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

/**
 * Light / dark switch. Until the visitor picks one, the site follows the system setting.
 * Which icon shows is decided by CSS (globals.css), so server and client render the same markup.
 */
export function ThemeToggle({ labelLight, labelDark }: { labelLight: string; labelDark: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const current = root.dataset.theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // private mode: the choice lasts until reload
    }
    track("theme_switch", { theme: next });
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line text-fg transition-colors hover:border-fg"
    >
      <span className="theme-icon-moon" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      </span>
      <span className="theme-icon-sun" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </span>
      <span className="theme-label-dark sr-only">{labelDark}</span>
      <span className="theme-label-light sr-only">{labelLight}</span>
    </button>
  );
}
