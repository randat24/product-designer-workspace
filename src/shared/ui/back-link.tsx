import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/** «← Все экраны»: the way back to the list, above the page title. */
export function BackLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("mb-4 inline-flex items-center gap-1 text-meta font-semibold text-fg-secondary hover:text-fg", className)}>
      <ArrowLeft aria-hidden className="size-4" />
      {children}
    </Link>
  );
}
