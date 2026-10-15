"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Faster pages never show the bar: no flash on a click that answers at once. */
const SHOW_AFTER_MS = 120;
/** A navigation that never lands (a file served as an attachment, a failed request) still lets the bar go. */
const GIVE_UP_MS = 10_000;

/** A click the App Router turns into an in-app navigation to another page, as opposed to a file, a new tab or a hash. */
function isPageNavigation(e: MouseEvent): boolean {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = (e.target as Element | null)?.closest?.("a[href]");
  if (!(a instanceof HTMLAnchorElement)) return false;
  if (a.target && a.target !== "_self") return false;
  if (a.hasAttribute("download") || a.hasAttribute("data-no-progress")) return false;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return false;
  // A file (rss.xml, a PDF) is not a page.
  if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) return false;
  return url.pathname !== location.pathname || url.search !== location.search;
}

/**
 * A thin accent bar at the top of the window while the next page loads, so a click is answered at once
 * even when the server takes a second. It runs from the click until the URL changes. Decorative: the page
 * itself announces what it is once it is there.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const timers = useRef<number[]>([]);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isPageNavigation(e)) return;
      clear();
      timers.current.push(
        window.setTimeout(() => setState("loading"), SHOW_AFTER_MS),
        window.setTimeout(() => setState("idle"), GIVE_UP_MS),
      );
    };
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("click", onClick); clear(); };
  }, []);

  // The new page is here: finish the bar if it was showing, and let it fade.
  useEffect(() => {
    clear();
    setState((s) => (s === "loading" ? "done" : "idle"));
    timers.current.push(window.setTimeout(() => setState("idle"), 400));
  }, [pathname, search]);

  return <div aria-hidden className="nav-progress" data-state={state} />;
}
