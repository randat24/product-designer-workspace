"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";

export type CommandItem = { id: string; label: string; href: string; group: string; hint?: string; keywords?: string };

/**
 * ⌘K / Ctrl+K palette (docs/DESIGN-SYSTEM.md §3): sections and actions at once; entities (codes and
 * titles) from `load`, fetched on first open so the page itself does not pay for them.
 */
export function CommandPalette({ items: staticItems, load, triggerClassName }: {
  items: CommandItem[];
  load?: () => Promise<CommandItem[]>;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState<CommandItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const requested = useRef(false);
  const items = useMemo(() => (loaded ? [...staticItems.filter((i) => i.group !== t.palette.actions), ...loaded, ...staticItems.filter((i) => i.group === t.palette.actions)] : staticItems), [staticItems, loaded]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => `${i.label} ${i.keywords ?? ""} ${i.group}`.toLowerCase().includes(q));
  }, [items, query]);

  const open = () => {
    setQuery("");
    setActive(0);
    dialog.current?.showModal();
    // Loaded once per page visit; a ref, because the Ctrl+K listener keeps the first `open`.
    if (load && !requested.current) {
      requested.current = true;
      setLoading(true);
      load().then(setLoaded, () => setLoaded([])).finally(() => setLoading(false));
    }
  };
  const openRef = useRef(open);
  openRef.current = open;

  // The shell re-renders (new props) when a name it shows changes: reload entities on next open.
  useEffect(() => {
    requested.current = false;
    setLoaded(null);
  }, [staticItems]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else openRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (item: CommandItem | undefined) => {
    if (!item) return;
    dialog.current?.close();
    router.push(item.href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = results.length;
      if (n) setActive((a) => (a + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  };

  useEffect(() => {
    document.getElementById(`cmd-${results[active]?.id}`)?.scrollIntoView({ block: "nearest" });
  }, [active, results]);

  let lastGroup = "";

  return (
    <>
      <button type="button" onClick={open}
        className={cn("flex h-11 w-full items-center md:h-8 justify-between gap-2 rounded-control border border-line bg-canvas px-2.5 text-meta text-fg-secondary hover:bg-subtle hover:text-fg", triggerClassName)}>
        {t.palette.open}
        <kbd className="hidden font-sans text-caption md:inline">⌘K</kbd>
      </button>

      {/* Clicking the backdrop closes it for mouse users; the keyboard has Esc (native <dialog>). */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog ref={dialog} aria-label={t.palette.open}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="mx-auto mt-[12vh] w-[min(560px,calc(100vw-32px))] rounded-panel border border-line bg-surface p-0 text-fg shadow-xl backdrop:bg-black/30">
        <input autoFocus value={query} placeholder={t.palette.placeholder}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={onInputKey}
          role="combobox" aria-expanded aria-controls="cmd-list" aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
          className="h-11 w-full border-b border-line bg-transparent px-4 text-sm outline-none placeholder:text-fg-secondary" />
        <ul id="cmd-list" role="listbox" aria-label={t.palette.open} className="max-h-[50vh] overflow-y-auto p-1">
          {results.length === 0 && !loading && <li className="px-3 py-6 text-center text-fg-secondary">{t.palette.empty}</li>}
          {loading && <li role="status" className="px-3 py-2 text-caption text-fg-secondary">{t.status.loading}</li>}
          {results.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <li key={item.id} role="presentation">
                {header && <p role="presentation" className="px-3 pt-2 pb-1 text-caption font-medium text-fg-secondary">{header}</p>}
                {/* Combobox pattern: focus stays in the input (arrows, Enter); options are for the mouse. */}
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus */}
                <div id={`cmd-${item.id}`} role="option" aria-selected={i === active}
                  onMouseMove={() => setActive(i)} onClick={() => go(item)}
                  className={cn("flex h-9 cursor-pointer items-center justify-between gap-3 rounded-control px-3 font-medium", i === active && "bg-subtle")}>
                  <span className="truncate">{item.label}</span>
                  {item.hint && <span className="shrink-0 text-caption text-fg-secondary">{item.hint}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </dialog>
    </>
  );
}
