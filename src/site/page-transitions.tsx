"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/** The old page never stays frozen longer than this, however slow the next one is. */
const MAX_WAIT_MS = 600;

type Doc = Document & { startViewTransition?: (update: () => Promise<void>) => unknown };

/**
 * Site pages change with a short cross-fade instead of a cut, and a case cover moves from its card into the case
 * (both carry `view-transition-name: case-<slug>`). Next's own view transitions need an experimental React build,
 * which the patched one is not, so this runs the browser API around router.push itself: a click on an in-site
 * link is taken over (Link skips a click already handled), and the transition ends when the new path renders.
 * Without the API, or under reduced motion, links work as they always do.
 */
export function PageTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const arrived = useRef<(() => void) | null>(null);

  useEffect(() => {
    arrived.current?.();
    arrived.current = null;
  }, [pathname]);

  useEffect(() => {
    const doc = document as Doc;
    if (!doc.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement) || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return;
      // Same page (a hash, a filter in the query): no page change to animate.
      if (url.pathname === location.pathname) return;
      // The tool lives in another layout: leave it to a normal navigation.
      if (!/^\/(uk|en)(\/|$)/.test(url.pathname)) return;
      e.preventDefault();
      doc.startViewTransition!(() => new Promise<void>((resolve) => {
        arrived.current = resolve;
        setTimeout(resolve, MAX_WAIT_MS);
        router.push(url.pathname + url.search + url.hash);
      }));
    };
    // Capture phase: before Link's own handler, which then sees the click as handled.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
