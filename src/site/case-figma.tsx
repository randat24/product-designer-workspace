"use client";

import { ArrowUpRight, Play } from "lucide-react";
import { useState } from "react";
import { figmaEmbedUrl } from "@/shared/lib/figma";
import { track } from "./analytics/track";
import { button } from "./signal/ui";

type Labels = { figmaLoad: string; figmaOpen: string; figmaFrame: string };

/**
 * The project's Figma file in a browser-like window. Figma's player is heavy and sets its own cookies, so it
 * loads only on click; until then the window shows the case cover. «Відкрити у Figma» always opens the file in a new tab.
 */
export function CaseFigma({ url, poster, labels, caseSlug }: {
  url: string;
  poster?: string;
  labels: Labels;
  caseSlug: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const fileName = decodeURIComponent(new URL(url).pathname.split("/")[3] ?? "").replace(/-/g, " ") || "Figma";

  return (
    <div className="sg-panel overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          <i className="size-2.5 rounded-full bg-line" />
          <i className="size-2.5 rounded-full bg-line" />
          <i className="size-2.5 rounded-full bg-line" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-fg-secondary">{fileName}</span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("case_figma_open", { case_slug: caseSlug, location: "case" })}
          className="sg-link shrink-0"
        >
          {labels.figmaOpen}
          <ArrowUpRight aria-hidden className="size-4" />
        </a>
      </div>
      <div className="relative aspect-[4/5] bg-subtle sm:aspect-[16/10]">
        {loaded ? (
          <iframe
            src={figmaEmbedUrl(url)}
            title={labels.figmaFrame}
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : (
          <>
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element -- the case cover, already on the page
              <img src={poster} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover object-left-top opacity-40 blur-[2px]" />
            )}
            <div className="absolute inset-0 grid place-items-center p-4">
              <button
                type="button"
                onClick={() => {
                  setLoaded(true);
                  track("case_figma_load", { case_slug: caseSlug });
                }}
                className={button({ variant: "primary" })}
              >
                <Play aria-hidden className="size-4" />
                {labels.figmaLoad}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
