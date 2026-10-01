"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { Button } from "@/shared/ui/button";
import { useOnline } from "@/shared/ui/network";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";

/**
 * A page that failed to load (docs/UX_LAWS.md UX-27, UX-28): plain words, a retry that really refetches
 * the page, and a way back. Without a connection it says so and retries by itself once the connection returns.
 */
export function ErrorState({ error, reset, back, className }: {
  error: Error & { digest?: string };
  reset: () => void;
  back: { href: string; label: string };
  className?: string;
}) {
  const router = useRouter();
  const online = useOnline();
  const [pending, startTransition] = useTransition();
  useEffect(() => console.error(error), [error]);

  // reset() alone re-renders the cached result; refresh() asks the server for the page again.
  const retry = () => startTransition(() => {
    router.refresh();
    reset();
  });

  const retryRef = useRef(retry);
  retryRef.current = retry;
  const wasOffline = useRef(false);
  useEffect(() => {
    if (!online) wasOffline.current = true;
    else if (wasOffline.current) {
      wasOffline.current = false;
      retryRef.current();
    }
  }, [online]);

  return (
    <div role="alert" className={cn("flex max-w-xl flex-col gap-4", className)}>
      <h1 className="page-title">{online ? t.status.errorTitle : t.status.offlineTitle}</h1>
      <p className="text-fg-secondary">{online ? t.status.errorBody : t.status.offlineBody}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={retry} disabled={pending}>{t.status.retry}</Button>
        <Link href={back.href} className="inline-flex h-9 items-center px-2 text-sm font-semibold underline underline-offset-4">
          {back.label}
        </Link>
      </div>
      {error.digest && <p className="text-caption text-fg-secondary">ID: {error.digest}</p>}
    </div>
  );
}

/** A record or project that is gone or closed to this account: say so and offer the way back. */
export function NotFoundState({ back, className }: { back: { href: string; label: string }; className?: string }) {
  return (
    <div className={cn("flex max-w-xl flex-col gap-4", className)}>
      <h1 className="page-title">{t.status.notFoundTitle}</h1>
      <p className="text-fg-secondary">{t.status.notFoundBody}</p>
      <Link href={back.href} className="inline-flex h-9 items-center self-start text-sm font-semibold underline underline-offset-4">
        {back.label}
      </Link>
    </div>
  );
}
