"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { t } from "@/shared/i18n/uk";
import { Button, IconButton } from "@/shared/ui/button";
import { Input, Select, Textarea } from "@/shared/ui/field";
import type { ProductSection, ProductStory } from "@/site/product-story";
import { ImageField } from "./image-field";
import { BLOCK_KINDS, BLOCKS, emptyBlock, emptyRow, emptyStory, type BlockKind, type Column, type Field } from "./product-blocks";
import type { CaseImage } from "./schema";

const p = t.caseEditor.product;
const label = (key: string) => p.fields[key] ?? key;
const muted = "text-meta font-semibold text-fg-secondary";

type Record_ = Record<string, unknown>;

/**
 * The product story of one language (docs/HANDOFF_TRIAGE.md, variant A): the long case page built from blocks —
 * how the project started, the roles and flows, the logo and colours, the outcome. Every block is a form made
 * from its description in product-blocks.ts; the whole story saves with the rest of the draft.
 */
export function ProductEditor({ idPrefix, projectId, value, contentsLabel, readOnly, onChange }: {
  idPrefix: string;
  projectId: string;
  value: ProductStory | null;
  /** Default caption of the contents in this language. */
  contentsLabel: string;
  readOnly: boolean;
  onChange: (next: ProductStory | null) => void;
}) {
  const [armed, setArmed] = useState(false);
  const [kind, setKind] = useState<BlockKind>("overview");
  // A block added in this visit opens right away; the ones already written stay folded.
  const [opened, setOpened] = useState<string | null>(null);

  if (!value) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="max-w-prose text-fg-secondary">{p.none}</p>
        {!readOnly && <Button variant="secondary" onClick={() => onChange(emptyStory(contentsLabel))}><Plus aria-hidden className="size-4" />{p.create}</Button>}
      </div>
    );
  }

  const story = value;
  const set = (patch: Partial<ProductStory>) => onChange({ ...story, ...patch });
  const setBlock = (i: number, next: ProductSection) => set({ sections: story.sections.map((s, j) => (j === i ? next : s)) });
  const move = (i: number, by: number) => {
    const next = [...story.sections];
    const [moved] = next.splice(i, 1);
    if (moved) next.splice(i + by, 0, moved);
    set({ sections: next });
  };
  const add = () => {
    const block = emptyBlock(kind, story.sections.map((s) => s.id));
    setOpened(block.id);
    set({ sections: [...story.sections, block] });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <CommaList id={`${idPrefix}disciplines`} label={p.disciplines} hint={p.disciplinesHint} value={story.disciplines} readOnly={readOnly}
          onChange={(disciplines) => set({ disciplines })} />
        <LineInput id={`${idPrefix}contents`} label={p.contents} value={story.contents} readOnly={readOnly} onChange={(contents) => set({ contents })} />
      </div>
      <LongText id={`${idPrefix}note`} label={p.note} hint={p.noteHint} value={story.note ?? ""} readOnly={readOnly}
        onChange={(note) => onChange(note ? { ...story, note } : withoutKey(story, "note"))} />

      <div className="flex flex-col gap-3">
        <h3 className="text-body font-semibold">{p.blocks}</h3>
        <ol className="flex flex-col gap-3">
          {story.sections.map((block, i) => (
            <li key={block.id}>
              <details open={opened === block.id} className="group rounded-panel border border-line bg-surface">
                <summary className="flex cursor-pointer list-none items-baseline gap-2 px-4 py-3 marker:hidden">
                  <span className={muted}>{p.block(i + 1, p.kinds[block.kind] ?? block.kind)}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{block.title}</span>
                </summary>
                <div className="flex flex-col gap-4 border-t border-line p-4">
                  {!readOnly && (
                    <div className="flex gap-1 self-end">
                      <IconButton size="sm" label={`${p.moveUp}: ${p.block(i + 1, "")}`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></IconButton>
                      <IconButton size="sm" label={`${p.moveDown}: ${p.block(i + 1, "")}`} disabled={i === story.sections.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></IconButton>
                      <IconButton size="sm" tone="danger" label={`${p.removeBlock}: ${p.block(i + 1, "")}`}
                        onClick={() => set({ sections: story.sections.filter((_, j) => j !== i) })}><X className="size-4" /></IconButton>
                    </div>
                  )}
                  <BlockForm id={`${idPrefix}b-${block.id}-`} projectId={projectId} block={block} readOnly={readOnly} onChange={(next) => setBlock(i, next)} />
                </div>
              </details>
            </li>
          ))}
        </ol>
        {!readOnly && story.sections.length < 40 && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1.5">
              <span className={muted}>{p.addBlockLabel}</span>
              <Select value={kind} onChange={(ev) => setKind(ev.target.value as BlockKind)} className="w-auto">
                {BLOCK_KINDS.map((k) => <option key={k} value={k}>{p.kinds[k]}</option>)}
              </Select>
            </label>
            <Button variant="secondary" onClick={add}><Plus aria-hidden className="size-4" />{p.addBlock}</Button>
          </div>
        )}
      </div>

      {!readOnly && (
        <button type="button" onBlur={() => setArmed(false)}
          onClick={() => { if (!armed) return setArmed(true); setArmed(false); onChange(null); }}
          className={armed
            ? "inline-flex h-9 items-center self-start rounded-control border-[1.5px] border-danger bg-danger px-3.5 text-sm font-semibold text-on-status"
            : "inline-flex h-9 items-center self-start rounded-control border-[1.5px] border-line px-3.5 text-sm font-semibold text-danger hover:border-danger"}>
          {armed ? p.removeConfirm : p.remove}
        </button>
      )}
    </div>
  );
}

function withoutKey<T extends object>(o: T, key: string): T {
  const { [key]: _drop, ...rest } = o as Record_;
  return rest as T;
}

/** One block: its title and intro, then the fields of its kind. */
function BlockForm({ id, projectId, block, readOnly, onChange }: {
  id: string; projectId: string; block: ProductSection; readOnly: boolean; onChange: (next: ProductSection) => void;
}) {
  const data = block as unknown as Record_;
  const set = (key: string, v: unknown) => {
    const next = { ...data, [key]: v };
    if (v === undefined || (key === "lede" && v === "")) delete next[key];
    onChange(next as unknown as ProductSection);
  };
  return (
    <>
      <LineInput id={`${id}title`} label={p.blockTitle} value={block.title} readOnly={readOnly} onChange={(v) => set("title", v)} />
      <LongText id={`${id}lede`} label={p.blockLede} value={block.lede ?? ""} readOnly={readOnly} onChange={(v) => set("lede", v)} />
      {(BLOCKS[block.kind] as readonly Field[]).map((f) => (
        <FieldInput key={f.key} id={`${id}${f.key}`} projectId={projectId} field={f} value={data[f.key]} readOnly={readOnly} onChange={(v) => set(f.key, v)} />
      ))}
    </>
  );
}

function FieldInput({ id, projectId, field, value, readOnly, onChange }: {
  id: string; projectId: string; field: Field; value: unknown; readOnly: boolean; onChange: (v: unknown) => void;
}) {
  const name = label(field.key);
  switch (field.type) {
    case "line": return <LineInput id={id} label={name} value={str(value)} readOnly={readOnly} onChange={onChange} />;
    case "text": return <LongText id={id} label={name} value={str(value)} readOnly={readOnly} onChange={onChange} />;
    case "paragraphs": return <ListText id={id} label={name} hint={p.paragraphsHint} separator={"\n\n"} value={list(value)} readOnly={readOnly} onChange={onChange} />;
    case "lines": return <ListText id={id} label={name} hint={p.linesHint} separator={"\n"} value={list(value)} readOnly={readOnly} onChange={onChange} />;
    case "select": return <Choice id={id} label={name} options={field.options} value={str(value)} readOnly={readOnly} onChange={onChange} />;
    case "image": return (
      <div className="flex flex-col gap-1.5">
        <span className={muted}>{name}</span>
        <ImageField projectId={projectId} id={id} value={(value as CaseImage | undefined) ?? null} readOnly={readOnly} onChange={(v) => onChange(v ?? undefined)} />
      </div>
    );
    case "images": return <Images id={id} projectId={projectId} label={name} value={(value as CaseImage[] | undefined) ?? []} readOnly={readOnly} onChange={onChange} />;
    case "rows": return <Rows id={id} label={name} columns={field.columns} value={(value as Record_[] | undefined) ?? []} readOnly={readOnly} onChange={onChange} />;
  }
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** A list of small records, one card per row, each column a field. */
function Rows({ id, label: name, columns, value, readOnly, onChange }: {
  id: string; label: string; columns: readonly Column[]; value: Record_[]; readOnly: boolean; onChange: (v: Record_[]) => void;
}) {
  const setRow = (i: number, key: string, v: unknown) => onChange(value.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
  const move = (i: number, by: number) => {
    const next = [...value];
    const [moved] = next.splice(i, 1);
    if (moved) next.splice(i + by, 0, moved);
    onChange(next);
  };
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={`${muted} mb-1.5`}>{name}</legend>
      <ol className="flex flex-col gap-2">
        {value.map((row, i) => (
          <li key={i} className="flex flex-col gap-3 rounded-control border border-line p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-caption font-semibold text-fg-secondary">{name} · {i + 1}</span>
              {!readOnly && (
                <div className="flex gap-1">
                  <IconButton size="sm" label={`${p.moveUp}: ${name} ${i + 1}`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></IconButton>
                  <IconButton size="sm" label={`${p.moveDown}: ${name} ${i + 1}`} disabled={i === value.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></IconButton>
                  <IconButton size="sm" tone="danger" label={`${p.removeRow}: ${name} ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))}><X className="size-4" /></IconButton>
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {columns.map((c) => {
                const cid = `${id}-${i}-${c.key}`;
                const v = row[c.key];
                const wide = c.type !== "line" && c.type !== "select" ? "sm:col-span-2" : "";
                return (
                  <div key={c.key} className={wide}>
                    {c.type === "line" && <LineInput id={cid} label={label(c.key)} value={str(v)} readOnly={readOnly} onChange={(x) => setRow(i, c.key, x)} />}
                    {c.type === "text" && <LongText id={cid} label={label(c.key)} value={str(v)} readOnly={readOnly} onChange={(x) => setRow(i, c.key, x)} />}
                    {c.type === "lines" && <ListText id={cid} label={label(c.key)} hint={p.linesHint} separator={"\n"} value={list(v)} readOnly={readOnly} onChange={(x) => setRow(i, c.key, x)} />}
                    {c.type === "select" && <Choice id={cid} label={label(c.key)} options={c.options} value={str(v)} readOnly={readOnly} onChange={(x) => setRow(i, c.key, x)} />}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      {!readOnly && value.length < 60 && (
        <Button variant="secondary" size="sm" className="self-start" onClick={() => onChange([...value, emptyRow(columns)])}>
          <Plus aria-hidden className="size-4" />{p.addRow}
        </Button>
      )}
    </fieldset>
  );
}

/** Pictures of a block: each with its description and caption; the empty slot at the end adds one more. */
function Images({ id, projectId, label: name, value, readOnly, onChange }: {
  id: string; projectId: string; label: string; value: CaseImage[]; readOnly: boolean; onChange: (v: CaseImage[]) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className={`${muted} mb-1.5`}>{name}</legend>
      {value.map((im, i) => (
        <div key={`${i}-${im.src}`} className="flex flex-col gap-2 rounded-control border border-line p-3">
          <ImageField projectId={projectId} id={`${id}-${i}`} value={im} readOnly={readOnly}
            onChange={(v) => onChange(v ? value.map((x, j) => (j === i ? v : x)) : value.filter((_, j) => j !== i))} />
          <LineInput id={`${id}-${i}-caption`} label={label("caption")} value={im.caption ?? ""} readOnly={readOnly}
            onChange={(caption) => onChange(value.map((x, j) => (j === i ? (caption ? { ...x, caption } : withoutKey(x, "caption")) : x)))} />
        </div>
      ))}
      {!readOnly && value.length < 40 && (
        <ImageField projectId={projectId} id={`${id}-new`} value={null} readOnly={false} onChange={(v) => v && onChange([...value, v])} />
      )}
    </fieldset>
  );
}

function LineInput({ id, label: name, value, readOnly, onChange }: { id: string; label: string; value: string; readOnly: boolean; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={muted}>{name}</label>
      <Input id={id} value={value} readOnly={readOnly} maxLength={300} onChange={(ev) => onChange(ev.target.value)} />
    </div>
  );
}

function LongText({ id, label: name, hint, value, readOnly, onChange }: {
  id: string; label: string; hint?: string; value: string; readOnly: boolean; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={muted}>{name}</label>
      <Textarea id={id} value={value} readOnly={readOnly} maxLength={5000} rows={2} placeholder={hint}
        onChange={(ev) => onChange(ev.target.value)} className="resize-y [field-sizing:content]" />
    </div>
  );
}

function Choice({ id, label: name, options, value, readOnly, onChange }: {
  id: string; label: string; options: readonly string[]; value: string; readOnly: boolean; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={muted}>{name}</label>
      <Select id={id} value={value} disabled={readOnly} onChange={(ev) => onChange(ev.target.value)}>
        {options.map((o) => <option key={o} value={o}>{p.options[o] ?? o}</option>)}
      </Select>
    </div>
  );
}

/** "Product Design, UI/UX, Brand Identity" as one line; the list is what gets saved. */
function CommaList({ id, label: name, hint, value, readOnly, onChange }: {
  id: string; label: string; hint: string; value: string[]; readOnly: boolean; onChange: (v: string[]) => void;
}) {
  const [text, setText] = useSynced(value, (v) => v.join(", "), (s) => s.split(",").map((x) => x.trim()).filter(Boolean));
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={muted}>{name}</label>
      <Input id={id} value={text} readOnly={readOnly} maxLength={400} placeholder={hint}
        onChange={(ev) => onChange(setText(ev.target.value))} />
    </div>
  );
}

/**
 * A list typed as text: paragraphs separated by an empty line, or one item per line. The text being typed stays
 * as typed (a fresh empty line is not lost); the cleaned list is what gets saved.
 */
function ListText({ id, label: name, hint, separator, value, readOnly, onChange }: {
  id: string; label: string; hint: string; separator: "\n" | "\n\n"; value: string[]; readOnly: boolean; onChange: (v: string[]) => void;
}) {
  const split = (s: string) => s.split(separator === "\n" ? /\n/ : /\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const [text, setText] = useSynced(value, (v) => v.join(separator), split);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={muted}>{name}</label>
      <Textarea id={id} value={text} readOnly={readOnly} rows={separator === "\n" ? 3 : 4} aria-describedby={`${id}-hint`}
        onChange={(ev) => onChange(setText(ev.target.value))} className="resize-y [field-sizing:content]" />
      <p id={`${id}-hint`} className="text-caption text-fg-secondary">{hint}</p>
    </div>
  );
}

/**
 * Local text for a list value. The text follows the list when it changes from outside (a row moved or removed),
 * and keeps the user's own spacing while they type.
 */
function useSynced(value: string[], toText: (v: string[]) => string, toList: (s: string) => string[]) {
  const [text, setTextState] = useState(() => toText(value));
  const emitted = useRef(value);
  if (value !== emitted.current) {
    emitted.current = value;
    const next = toText(value);
    if (next !== toText(toList(text))) setTextState(next);
  }
  const setText = (s: string) => {
    setTextState(s);
    const next = toList(s);
    emitted.current = next;
    return next;
  };
  return [text, setText] as const;
}
