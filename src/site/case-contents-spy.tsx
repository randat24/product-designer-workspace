"use client";

import { useEffect } from "react";

/**
 * Goal-gradient (docs/UX_LAWS.md, UX-22): marks the section being read in the case contents
 * with aria-current, so the reader sees where they are and how much is left. No UI of its own.
 */
export function CaseContentsSpy({ ids, navId }: { ids: string[]; navId: string }) {
  useEffect(() => {
    const nav = document.getElementById(navId);
    const sections = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!nav || !sections.length) return;
    const links = new Map(ids.map((id) => [id, nav.querySelector<HTMLAnchorElement>(`a[href="#${id}"]`)]));
    const visible = new Set<string>();

    const mark = () => {
      // The first section on screen (in document order) is the current one.
      const current = ids.find((id) => visible.has(id));
      if (!current) return;
      links.forEach((a, id) => {
        if (id === current) a?.setAttribute("aria-current", "location");
        else a?.removeAttribute("aria-current");
      });
      const a = links.get(current);
      const list = a?.closest("ol");
      if (a && list && list.scrollWidth > list.clientWidth) {
        list.scrollTo({ left: a.offsetLeft - list.clientWidth / 2 + a.offsetWidth / 2, behavior: "smooth" });
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id));
        mark();
      },
      // A section counts while it crosses the upper third of the screen (below the sticky header).
      { rootMargin: "-120px 0px -60% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [ids, navId]);
  return null;
}
