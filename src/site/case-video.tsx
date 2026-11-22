"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "./content";
import type { CaseVideo as Video } from "./case-videos";
import { button } from "./signal/ui";

type Labels = { videoPlay: string; videoPause: string };

/**
 * A silent screen recording in the case figure frame. It loads nothing until it is near the screen, plays in a loop
 * while it is in view and stops when it scrolls away. Visitors who prefer less motion see the poster and start it
 * themselves; everyone has the pause button (WCAG 2.2.2: moving content longer than 5 s can be stopped).
 */
export function CaseVideo({ video, labels, locale }: { video: Video; labels: Labels; locale: Locale }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  // Paused by the visitor (or never started under reduced motion): scrolling back does not restart it.
  const held = useRef(false);
  const captionId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    held.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      if (entry.isIntersecting && !held.current) el.play().catch(() => {});
      else if (!entry.isIntersecting) el.pause();
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) { held.current = false; el.play().catch(() => {}); } else { held.current = true; el.pause(); }
  };

  return (
    <figure className="sg-case-figure">
      <video
        ref={ref}
        poster={video.poster}
        width={video.width}
        height={video.height}
        muted
        loop
        playsInline
        preload="none"
        aria-describedby={captionId}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="block h-auto w-full rounded-[0.1875rem] border border-line bg-subtle"
      >
        <source src={video.mp4} type="video/mp4" />
        <source src={video.webm} type="video/webm" />
      </video>
      {/* The control sits under the frame, not on it: on a phone a 44 px button would cover a third of the clip. */}
      <figcaption className="sg-case-caption items-center">
        <span id={captionId} className="min-w-0 flex-1">{video.caption[locale]}</span>
        <button type="button" onClick={toggle} aria-label={playing ? labels.videoPause : labels.videoPlay}
          className={button({ variant: "secondary", size: "sm", icon: true }, "shrink-0")}>
          {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
        </button>
      </figcaption>
    </figure>
  );
}
