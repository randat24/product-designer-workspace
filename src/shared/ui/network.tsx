"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";

const subscribe = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

/** Whether the browser has a connection; the server render assumes it does. */
export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

/** Calls `fn` when the connection comes back (autosave retries then, not on a timer). */
export function useOnReconnect(fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const on = () => ref.current();
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, []);
}

/**
 * A strip under the top bar while there is no connection, and a short «back online» note after it returns.
 * Work goes on offline: autosave keeps the edits and sends them once the connection is back.
 */
export function NetworkBanner() {
  const online = useOnline();
  const [back, setBack] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setBack(false);
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    setBack(true);
    const timer = setTimeout(() => setBack(false), 4000);
    return () => clearTimeout(timer);
  }, [online]);

  const text = !online ? t.network.offline : back ? t.network.back : "";
  return (
    <p role="status" aria-live="polite"
      className={cn(
        "sticky top-0 z-50 px-4 text-center text-sm font-semibold",
        text ? "py-2" : "sr-only",
        !online && "bg-danger text-on-status",
        back && "bg-fg text-canvas",
      )}>
      {text}
    </p>
  );
}
