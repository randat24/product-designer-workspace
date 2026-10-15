"use client";

import { useEffect } from "react";

/**
 * On a phone the site header (two rows) slides away while the visitor reads down and comes back on any scroll
 * up, so the text gets the whole screen and navigation is one gesture away. It never hides near the top of the
 * page or while something in it has keyboard focus (CSS: :focus-within). Wide screens keep it in place
 * (signal.css, `header[data-autohide]`). Writes one attribute; the page does not re-render while it scrolls.
 */
export function HeaderAutoHide() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("header[data-autohide]");
    if (!header) return;
    let last = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - last;
      if (Math.abs(delta) < 8) return; // ignore jitter
      const hide = delta > 0 && y > header.offsetHeight;
      if (hide) header.setAttribute("data-hidden", "");
      else header.removeAttribute("data-hidden");
      last = y;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      header.removeAttribute("data-hidden");
    };
  }, []);
  return null;
}
