"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { track } from "./analytics/track";
import { LOCALES, type Locale } from "./content";
import { sg } from "./signal/ui";

const NAMES: Record<Locale, string> = { uk: "Українська", en: "English" };

/** UK / EN switch that keeps the current page. */
export function LangSwitch({ current }: { current: Locale }) {
  const pathname = usePathname() ?? `/${current}`;
  const rest = pathname.replace(/^\/(uk|en)(?=\/|$)/, "");
  return (
    <div className={sg.segmented}>
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest}`}
          hrefLang={l}
          lang={l}
          aria-label={NAMES[l]}
          aria-current={l === current ? "true" : undefined}
          onClick={() => l !== current && track("language_switch", { from: current, to: l })}
        >
          {l === "uk" ? "UA" : "EN"}
        </Link>
      ))}
    </div>
  );
}
