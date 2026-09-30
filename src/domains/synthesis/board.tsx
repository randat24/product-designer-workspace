"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldAutosave } from "@/shared/ui/autosave";
import { Input, Select } from "@/shared/ui/field";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { ConfirmIconButton } from "@/shared/ui/confirm-delete";
import { ActionError, useAction } from "@/shared/ui/use-action";
import { createInsightFromPattern, createObservation, createPattern, deletePattern, moveCard, renamePattern } from "./actions";
import { kindOf, OBSERVATION_KINDS, participantColor, type ObservationKind } from "./schema";
import type { BoardCard } from "./queries";

const b = t.synthesis.board;
type Pattern = { id: string; code: string; title: string; color: string | null };
const NONE = "__none__";

/**
 * Synthesis board (docs/IA.md /synthesis): pattern columns with observation and quote
 * cards in participant colours. Drag and drop, or "Переместить в…" from the keyboard.
 */
export function SynthesisBoard({ projectId, base, patterns, cards: initialCards, participants, canEdit }: {
  projectId: string;
  base: string;
  patterns: Pattern[];
  cards: BoardCard[];
  participants: { id: string; code: string; role: string | null }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const columnsAction = useAction();
  const [newPattern, setNewPattern] = useState("");

  const move = (card: BoardCard, patternId: string | null) => {
    if (card.patternId === patternId) return;
    const position = Math.max(0, ...cards.filter((c) => c.patternId === patternId).map((c) => c.position)) + 1;
    setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, patternId, position } : c)));
    startTransition(async () => {
      const res = await moveCard(card.kind, card.id, patternId, position);
      if (!res.ok) setCards((cs) => cs.map((c) => (c.id === card.id ? card : c)));
    });
  };

  const columns: (Pattern | null)[] = [null, ...patterns];

  return (
    <div className="flex flex-col gap-4">
      {canEdit && <p className="text-meta text-fg-secondary">{b.dragHint}</p>}
      <ActionError error={columnsAction.error} />
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {columns.map((p) => {
          const key = p?.id ?? NONE;
          const list = cards.filter((c) => (c.patternId ?? NONE) === key).sort((a, z) => a.position - z.position);
          return (
            <section key={key} id={p?.code} aria-label={p?.title ?? b.unclustered}
              onDragOver={(e) => { if (canEdit && dragging) { e.preventDefault(); setOver(key); } }}
              onDragLeave={() => setOver((o) => (o === key ? null : o))}
              onDrop={(e) => {
                e.preventDefault(); setOver(null);
                const card = cards.find((c) => c.id === dragging);
                if (card) move(card, p?.id ?? null);
              }}
              className={cn(
                "flex w-[290px] shrink-0 flex-col gap-2.5 rounded-panel border bg-surface/60 p-3 transition-colors duration-[120ms]",
                over === key ? "border-[1.5px] border-dashed border-fg bg-subtle" : "border-line",
                !p && "bg-transparent",
              )}>
              <ColumnHeader pattern={p} count={list.length} canEdit={canEdit}
                onDelete={() => p && columnsAction.run(() => deletePattern(p.id))} />

              {!p && canEdit && <AddObservation projectId={projectId} participants={participants} onAdded={() => router.refresh()} />}

              <ul className="flex min-h-16 flex-col gap-2">
                {list.length === 0 && <li className="rounded-control border-[1.5px] border-dashed border-line p-4 text-center text-meta text-fg-secondary">{b.empty}</li>}
                {list.map((c) => (
                  <Card key={c.id} card={c} base={base} canEdit={canEdit} patterns={patterns}
                    onDragStart={() => setDragging(c.id)} onDragEnd={() => { setDragging(null); setOver(null); }}
                    onMove={(pid) => move(c, pid)} dragging={dragging === c.id} />
                ))}
              </ul>
            </section>
          );
        })}

        {canEdit && (
          <form className="flex w-[260px] shrink-0 flex-col gap-2 rounded-panel border-[1.5px] border-dashed border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              columnsAction.run(() => createPattern(projectId, newPattern), () => setNewPattern(""));
            }}>
            <Input aria-label={b.addPattern} value={newPattern} maxLength={200} placeholder={b.patternPlaceholder} onChange={(e) => setNewPattern(e.target.value)} />
            <Button type="submit" variant="secondary" disabled={pending || columnsAction.pending}>{b.addPattern}</Button>
          </form>
        )}
      </div>
    </div>
  );
}

function ColumnHeader({ pattern, count, canEdit, onDelete }: { pattern: Pattern | null; count: number; canEdit: boolean; onDelete: () => void }) {
  const title = useFieldAutosave(pattern?.title ?? "", (v) => (pattern && v.trim() ? renamePattern(pattern.id, v) : Promise.resolve({ ok: true as const })), canEdit && !!pattern);
  if (!pattern) {
    return (
      <header className="flex items-baseline justify-between gap-2 px-1">
        <h2 className="font-bold">{b.unclustered}</h2>
        <span className="text-caption font-semibold text-fg-secondary tabular-nums">{b.cards(count)}</span>
      </header>
    );
  }
  return (
    <header className="flex flex-col gap-2 rounded-control p-2.5 text-on-sticky" style={{ background: `var(--${pattern.color ?? "s1"})` }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption font-bold opacity-80">{pattern.code} · {b.cards(count)}</span>
        {canEdit && (
          <ConfirmIconButton label={`${b.deletePattern}: ${pattern.title}`} confirm={t.status.confirmDelete} onConfirm={onDelete}
            className="hit grid size-6 place-items-center rounded-chip text-on-sticky/80 hover:bg-white/40 hover:text-on-sticky" />
        )}
      </div>
      <input aria-label={`${b.patternPlaceholder} ${pattern.code}`} value={title.value} readOnly={!canEdit} maxLength={200}
        onChange={(e) => title.onChange(e.target.value)} onBlur={title.onBlur}
        className="w-full rounded-chip border border-transparent bg-transparent px-1 py-0.5 text-body font-bold text-on-sticky focus:bg-white/55 focus:outline-none" />
      {canEdit && (
        <form action={createInsightFromPattern}>
          <input type="hidden" name="patternId" value={pattern.id} />
          <Button type="submit" variant="ghost" disabled={count === 0}
            className="h-auto w-full rounded-control bg-on-sticky px-2.5 py-1.5 text-meta font-bold text-white hover:bg-on-sticky hover:text-white disabled:opacity-40">
            {b.formulate} →
          </Button>
        </form>
      )}
    </header>
  );
}

function Card({ card, base, canEdit, patterns, onDragStart, onDragEnd, onMove, dragging }: {
  card: BoardCard;
  base: string;
  canEdit: boolean;
  patterns: Pattern[];
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (patternId: string | null) => void;
  dragging: boolean;
}) {
  const k = card.kind === "observation" ? kindOf(card.obsKind ?? "behavior") : null;
  const href = `${base}/synthesis/${card.kind === "quote" ? "quotes" : "observations"}/${card.code}`;
  return (
    <li draggable={canEdit} onDragEnd={onDragEnd}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        // Firefox starts a drag only when some data is set.
        e.dataTransfer.setData("text/plain", card.code);
        onDragStart();
      }}
      className={cn(
        "flex flex-col gap-1.5 rounded-control border border-line bg-surface p-2.5 shadow-[0_1px_2px_rgba(0,0,0,.04)]",
        canEdit && "cursor-grab active:cursor-grabbing", dragging && "opacity-40",
      )}
      style={{ borderLeft: `5px solid ${participantColor(card.participant?.code)}` }}>
      <div className="flex items-center justify-between gap-2 text-caption font-semibold">
        <span className="flex items-center gap-1.5">
          {k ? (
            <span className="flex items-center gap-1"><span aria-hidden className="size-2 rounded-full" style={{ background: k.color }} />{k.label}</span>
          ) : <span>“ {b.quote}</span>}
        </span>
        <Link href={href} className="text-fg-secondary tabular-nums hover:text-fg hover:underline">{card.code}</Link>
      </div>
      <p className={cn("text-meta leading-snug", card.kind === "quote" && "italic")}>{card.kind === "quote" ? `«${card.text}»` : card.text}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-caption text-fg-secondary">
          {card.participant ? `${card.participant.code} · ${card.participant.role ?? ""}` : b.noParticipant}
        </span>
        {canEdit && (
          <Select aria-label={`${b.moveTo} ${card.code}`} value={card.patternId ?? NONE}
            onChange={(e) => onMove(e.target.value === NONE ? null : e.target.value)}
            size="sm" className="w-auto max-w-36 text-fg-secondary">
            <option value={NONE}>{b.unclustered}</option>
            {patterns.map((p) => <option key={p.id} value={p.id}>{p.code} {p.title}</option>)}
          </Select>
        )}
      </div>
    </li>
  );
}

function AddObservation({ projectId, participants, onAdded }: {
  projectId: string;
  participants: { id: string; code: string; role: string | null }[];
  onAdded: () => void;
}) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState<ObservationKind>("behavior");
  const [participantId, setParticipantId] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form className="flex flex-col gap-1.5 rounded-control border border-line bg-surface p-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        startTransition(async () => {
          const res = await createObservation({ projectId, interviewId: null, participantId: participantId || null, kind, text });
          if (res.ok) { setText(""); onAdded(); }
        });
      }}>
      <textarea aria-label={b.addObservation} value={text} maxLength={2000} rows={2} placeholder={b.observationPlaceholder}
        onChange={(e) => setText(e.target.value)}
        className="w-full resize-none rounded-control bg-subtle px-2 py-1.5 text-meta focus:bg-surface focus:outline-2 focus:outline-fg" />
      <div className="flex gap-1.5">
        <Select aria-label={b.kind} value={kind} onChange={(e) => setKind(e.target.value as ObservationKind)}
          size="sm" className="flex-1">
          {OBSERVATION_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </Select>
        <Select aria-label={b.participant} value={participantId} onChange={(e) => setParticipantId(e.target.value)}
          size="sm" className="flex-1">
          <option value="">{b.noParticipant}</option>
          {participants.map((p) => <option key={p.id} value={p.id}>{p.code} {p.role ?? ""}</option>)}
        </Select>
      </div>
      <Button type="submit" disabled={pending || !text.trim()} className="h-8">{b.addObservation}</Button>
    </form>
  );
}
