"use client";

// A date field in the design-system look. The native picker of <input type="date"> cannot be styled (its
// popup is drawn by the browser), so this is a text field for typing (дд.мм.рррр) plus our own calendar:
// a dialog with a month grid, keyboard navigation (arrows, PageUp/PageDown, Home/End, Enter, Esc),
// «Сьогодні» and «Очистити». The value stays an ISO date (YYYY-MM-DD) or "" — the same as the old input.

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { addDays, addMonths, formatDateInput, fromIso, iso, parseDateInput, type DateLocale } from "@/shared/lib/date-input";

export type { DateLocale };

const TEXT: Record<DateLocale, { placeholder: string; open: string; prev: string; next: string; today: string; clear: string; tag: string; bad: string }> = {
  uk: { placeholder: "дд.мм.рррр", open: "Вибрати дату", prev: "Попередній місяць", next: "Наступний місяць", today: "Сьогодні", clear: "Очистити", tag: "uk-UA", bad: "Це не схоже на дату. Введіть у форматі дд.мм.рррр або виберіть у календарі." },
  en: { placeholder: "dd/mm/yyyy", open: "Choose a date", prev: "Previous month", next: "Next month", today: "Today", clear: "Clear", tag: "en-GB", bad: "That doesn't look like a date. Type it as dd/mm/yyyy or pick one in the calendar." },
};

export function DateField({
  id, value, onChange, locale = "uk", readOnly, invalid, describedBy, className, size = "md",
}: {
  id: string;
  /** ISO date (YYYY-MM-DD) or "". */
  value: string;
  onChange: (v: string) => void;
  locale?: DateLocale;
  readOnly?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
  /** md: 36 px, the tool's fields. lg: 48 px with a 1.5 px border, the site's form. */
  size?: "md" | "lg";
}) {
  const tx = TEXT[locale];
  const [text, setText] = useState(() => formatDateInput(value, locale));
  const [open, setOpen] = useState(false);
  const [badText, setBadText] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const dialogId = useId();

  // Follow the value when it changes from outside (autosave reload, «Сегодня»).
  useEffect(() => { setText(formatDateInput(value, locale)); setBadText(false); }, [value, locale]);

  const commitText = () => {
    if (!text.trim()) { if (value) onChange(""); setBadText(false); return; }
    const v = parseDateInput(text);
    if (v) { setBadText(false); if (v !== value) onChange(v); else setText(formatDateInput(v, locale)); }
    else setBadText(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const close = (focusButton = true) => { setOpen(false); if (focusButton) button.current?.focus(); };

  return (
    <div ref={wrap} className={cn("relative", className)}>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={tx.placeholder}
          value={text}
          readOnly={readOnly}
          aria-invalid={invalid || badText || undefined}
          aria-describedby={[describedBy, badText && `${id}-bad`].filter(Boolean).join(" ") || undefined}
          onChange={(e) => { setText(e.target.value); setBadText(false); }}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commitText(); }
            if (e.key === "ArrowDown" && e.altKey && !readOnly) { e.preventDefault(); setOpen(true); }
          }}
          className={cn(
            "w-full text-fg placeholder:font-normal placeholder:text-fg-secondary focus:outline-none",
            size === "md"
              ? "h-9 rounded-control border border-transparent bg-subtle pr-10 pl-3 text-body font-medium hover:border-line focus:border-fg focus:bg-surface aria-[invalid=true]:border-danger"
              : "h-12 rounded-[10px] border-[1.5px] border-line bg-surface pr-12 pl-3.5 text-[16px] transition-colors duration-[120ms] hover:border-fg-secondary focus:border-fg aria-[invalid=true]:border-danger",
          )}
        />
        {!readOnly && (
          <button
            ref={button}
            type="button"
            aria-label={tx.open}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? dialogId : undefined}
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "absolute top-1/2 right-1 grid -translate-y-1/2 place-items-center rounded-control text-fg-secondary hover:bg-subtle hover:text-fg focus-visible:outline-2 focus-visible:outline-fg",
              size === "md" ? "size-8" : "right-1.5 size-10",
            )}
          >
            <Calendar aria-hidden className="size-4" />
          </button>
        )}
      </div>
      {badText && <p id={`${id}-bad`} role="alert" className="mt-1 text-meta text-danger">{tx.bad}</p>}
      {open && (
        <CalendarPopover
          id={dialogId}
          locale={locale}
          value={value}
          onPick={(v) => { onChange(v); setText(formatDateInput(v, locale)); setBadText(false); close(); }}
          onClose={close}
        />
      )}
    </div>
  );
}

function CalendarPopover({ id, locale, value, onPick, onClose }: {
  id: string; locale: DateLocale; value: string; onPick: (v: string) => void; onClose: (focusButton?: boolean) => void;
}) {
  const tx = TEXT[locale];
  const today = useMemo(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }, []);
  const selected = fromIso(value);
  const [focus, setFocus] = useState<Date>(selected ?? today);
  const grid = useRef<HTMLDivElement>(null);
  const titleId = `${id}-title`;
  const weekStart = locale === "en" ? 0 : 1;

  // Keep the keyboard focus on the focused day as it moves.
  useEffect(() => {
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${iso(focus)}"]`)?.focus();
  }, [focus]);

  const month = new Date(focus.getFullYear(), focus.getMonth(), 1);
  const lead = (month.getDay() - weekStart + 7) % 7;
  const start = addDays(month, -lead);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7));
  const fmtTitle = new Intl.DateTimeFormat(tx.tag, { month: "long", year: "numeric" });
  const fmtDay = new Intl.DateTimeFormat(tx.tag, { day: "numeric", month: "long", year: "numeric", weekday: "long" });
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i);
    return { short: new Intl.DateTimeFormat(tx.tag, { weekday: "short" }).format(d), long: new Intl.DateTimeFormat(tx.tag, { weekday: "long" }).format(d) };
  });
  const title = fmtTitle.format(month);

  const onKey = (e: React.KeyboardEvent) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      PageUp: () => addMonths(focus, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, e.shiftKey ? 12 : 1),
      Home: () => addDays(focus, -((focus.getDay() - weekStart + 7) % 7)),
      End: () => addDays(focus, 6 - ((focus.getDay() - weekStart + 7) % 7)),
    };
    const move = moves[e.key];
    if (move) { e.preventDefault(); setFocus(move()); }
  };

  // Esc closes from anywhere in the calendar (day grid or the month buttons) and returns focus to the button.
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); } };
    document.addEventListener("keydown", onEsc, true);
    return () => document.removeEventListener("keydown", onEsc, true);
  }, [onClose]);

  return (
    <div
      id={id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="absolute top-full left-0 z-50 mt-1.5 w-[min(296px,calc(100vw-32px))] rounded-panel border border-line bg-surface p-3 text-fg shadow-lg"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" aria-label={tx.prev} onClick={() => setFocus(addMonths(focus, -1))}
          className="grid size-8 place-items-center rounded-control text-fg-secondary hover:bg-subtle hover:text-fg focus-visible:outline-2 focus-visible:outline-fg">
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        <h2 id={titleId} aria-live="polite" className="text-body font-semibold first-letter:uppercase">{title}</h2>
        <button type="button" aria-label={tx.next} onClick={() => setFocus(addMonths(focus, 1))}
          className="grid size-8 place-items-center rounded-control text-fg-secondary hover:bg-subtle hover:text-fg focus-visible:outline-2 focus-visible:outline-fg">
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>
      <div ref={grid} role="grid" tabIndex={-1} aria-labelledby={titleId} onKeyDown={onKey} className="focus:outline-none">
        <div role="row" className="grid grid-cols-7">
          {weekdays.map((w) => (
            <div key={w.long} role="columnheader" aria-label={w.long}
              className="grid h-8 place-items-center text-caption font-semibold text-fg-secondary uppercase">
              {w.short.replace(".", "")}
            </div>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={iso(week[0]!)} role="row" className="grid grid-cols-7">
            {week.map((d) => {
              const key = iso(d);
              const inMonth = d.getMonth() === month.getMonth();
              const isSel = selected && key === iso(selected);
              const isToday = key === iso(today);
              const isFocus = key === iso(focus);
              return (
                <div key={key} role="gridcell" aria-selected={isSel || undefined}>
                  <button
                    type="button"
                    data-day={key}
                    tabIndex={isFocus ? 0 : -1}
                    aria-label={fmtDay.format(d)}
                    aria-current={isToday ? "date" : undefined}
                    onClick={() => onPick(key)}
                    className={cn(
                      "grid h-9 w-full place-items-center rounded-control text-body tabular-nums focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg",
                      isSel ? "bg-fg font-semibold text-canvas" : "hover:bg-subtle",
                      !isSel && !inMonth && "text-fg-secondary/60",
                      !isSel && isToday && "font-semibold ring-1 ring-fg-secondary ring-inset",
                    )}
                  >
                    {d.getDate()}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
        <button type="button" onClick={() => onPick("")}
          className="rounded-control px-2 py-1 text-meta font-semibold text-fg-secondary hover:bg-subtle hover:text-fg focus-visible:outline-2 focus-visible:outline-fg">
          {tx.clear}
        </button>
        <button type="button" onClick={() => onPick(iso(today))}
          className="rounded-control px-2 py-1 text-meta font-semibold hover:bg-subtle focus-visible:outline-2 focus-visible:outline-fg">
          {tx.today}
        </button>
      </div>
    </div>
  );
}
