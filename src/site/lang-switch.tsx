"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { LOCALES, type Locale } from "./content";

/** UK / EN switch that keeps the current page. */
export function LangSwitch({ current }: { current: Locale }) {
  const pathname = usePathname() ?? `/${current}`;
  const rest = pathname.replace(/^\/(uk|en)(?=\/|$)/, "");
  return (
    <div className="flex rounded-full border-[1.5px] border-fg p-0.5 text-[12px] font-bold uppercase">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest}`}
          hrefLang={l}
          aria-current={l === current ? "true" : undefined}
          className={cn(
            "rounded-full px-2.5 py-1 transition-colors",
            l === current
              ? "bg-fg text-canvas"
              : "text-fg-secondary hover:text-fg",
          )}
        >
          {l === "uk" ? "UA" : "EN"}
        </Link>
      ))}
    </div>
  );
}
