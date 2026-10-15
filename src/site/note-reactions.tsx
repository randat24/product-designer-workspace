"use client";

import { useEffect, useState } from "react";
import { reactToNote } from "@/domains/notes/public-actions";
import { REACTIONS, type Reaction } from "@/domains/notes/schema";
import { track } from "./analytics/track";
import { sg } from "./signal/ui";
import type { NoteReactions as Counts } from "./notes-source";

const KEY = "notes.reactions";

/** The reactions this browser has set: a convenience only, the database counts each visitor once anyway. */
function readMine(): Record<string, Reaction[]> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
function writeMine(number: number, kinds: Reaction[]) {
  try {
    const all = readMine();
    if (kinds.length) all[number] = kinds; else delete all[number];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* private window: the pressed state is just not remembered */ }
}

/**
 * «Згоден · Сперечаюсь · Не знав»: one click sets a reaction, another takes it back. The count changes at once
 * and is corrected by what the database answers; a refused click is undone and says why.
 */
export function NoteReactions({ number, initial, labels, groupLabel, failed }: {
  number: number;
  initial: Counts;
  labels: Record<Reaction, string>;
  groupLabel: string;
  failed: string;
}) {
  const [counts, setCounts] = useState<Counts>(initial);
  // Reactions this visitor changed on this page: only their numbers animate.
  const [touched, setTouched] = useState<Reaction[]>([]);
  const [mine, setMine] = useState<Reaction[]>([]);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<Reaction | null>(null);
  useEffect(() => setMine(readMine()[number] ?? []), [number]);

  const shown = (kind: Reaction) => Math.max(counts[kind] ?? 0, mine.includes(kind) ? 1 : 0);

  async function toggle(kind: Reaction) {
    const on = !mine.includes(kind);
    const nextMine = on ? [...mine, kind] : mine.filter((k) => k !== kind);
    const before = { counts, mine };
    setError(false);
    setBusy(kind);
    setTouched((t) => (t.includes(kind) ? t : [...t, kind]));
    setMine(nextMine);
    setCounts({ ...counts, [kind]: Math.max(0, (counts[kind] ?? 0) + (on ? 1 : -1)) });
    try {
      const res = await reactToNote(number, kind, on);
      if (!res.ok) throw new Error(res.error);
      setCounts(res.counts);
      writeMine(number, nextMine);
      if (on) track("note_reaction", { note_number: number, reaction: kind });
    } catch {
      setCounts(before.counts);
      setMine(before.mine);
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div role="group" aria-label={groupLabel} className="flex flex-wrap gap-2">
        {REACTIONS.map((kind) => (
          <button key={kind} type="button" aria-pressed={mine.includes(kind)} disabled={busy === kind}
            onClick={() => void toggle(kind)} className={sg.chip}>
            {/* The page is cached for up to a minute: its count may not have this visitor's reaction yet. */}
            {labels[kind]}{" "}
            {/* A new key per value: the number pops each time it changes (sg-bump), not on the first paint. */}
            <span key={shown(kind)} className={`${sg.chipCount} ${touched.includes(kind) ? "sg-bump" : ""}`}>{shown(kind)}</span>
          </button>
        ))}
      </div>
      <p role="status" className={error ? `${sg.error} basis-full` : "sr-only"}>{error ? failed : ""}</p>
    </>
  );
}
