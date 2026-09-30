"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { track } from "./analytics/track";
import { LOCALES, type Locale } from "./content";

const NAMES: Record<Locale, string> = { uk: "Українська", en: "English" };

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
          lang={l}
          aria-label={NAMES[l]}
          aria-current={l === current ? "true" : undefined}
          onClick={() => l !== current && track("language_switch", { from: current, to: l })}
          className={cn(
            "hit rounded-full px-2.5 py-1 transition-colors",
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
