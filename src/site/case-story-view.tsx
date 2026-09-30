import { cn } from "@/shared/lib/cn";
import { STAGE_COLOR, type CaseStory, type Mark, type Stage, type StoryLabels } from "./case-story";
import { CaseContentsSpy } from "./case-contents-spy";
import { container } from "./ui";

const STICKERS = ["var(--s3)", "var(--s7)", "var(--s5)", "var(--s1)", "var(--s6)", "var(--s4)"];
const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

type Section = { id: string; title: string; stage?: Stage; body: React.ReactNode };

/** Sections of a published case, in the order of the tool's chain; missing blocks are skipped. */
export function CaseStoryView({ story, labels, sticker }: { story: CaseStory; labels: StoryLabels; sticker: string }) {
  const sections: Section[] = [
    { id: "overview", title: labels.overview, body: <Overview story={story} labels={labels} /> },
    { id: "process", title: labels.process, body: <Process story={story} /> },
  ];
  if (story.research) sections.push({ id: "research", title: labels.research, stage: "research", body: <Research data={story.research} /> });
  if (story.insights) sections.push({ id: "insights", title: labels.insights, stage: "synthesis", body: <Insights data={story.insights} /> });
  if (story.competitors)
    sections.push({ id: "competitors", title: labels.competitors, stage: "competitors", body: <Competitors data={story.competitors} labels={labels} /> });
  if (story.opportunities)
    sections.push({ id: "opportunities", title: labels.opportunities, stage: "opportunities", body: <Opportunities data={story.opportunities} /> });
  if (story.flow) sections.push({ id: "flow", title: labels.flow, stage: "flows", body: <Flow data={story.flow} labels={labels} /> });
  if (story.screens) sections.push({ id: "screens", title: labels.screens, stage: "screens", body: <Screens data={story.screens} sticker={sticker} /> });
  if (story.decisions)
    sections.push({ id: "decisions", title: labels.decisions, stage: "decisions", body: <Decisions data={story.decisions} labels={labels} /> });
  if (story.results) sections.push({ id: "results", title: labels.results, body: <Results data={story.results} /> });

  return (
    <>
      <nav id="case-contents" aria-label={labels.contents} className="z-10 border-y border-line bg-canvas/90 backdrop-blur lg:sticky lg:top-16">
        <ol className={`${container} flex gap-1 overflow-x-auto py-2.5 text-[13px] font-semibold`}>
          {sections.map((s, i) => (
            <li key={s.id} className="shrink-0">
              <a href={`#${s.id}`} className="hit flex items-center gap-1.5 rounded-full px-3 py-1.5 text-fg-secondary hover:bg-subtle hover:text-fg aria-[current]:bg-subtle aria-[current]:text-fg">
                <span className="display-num text-[11px]">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
        <CaseContentsSpy ids={sections.map((s) => s.id)} navId="case-contents" />
      </nav>

      <div className={`${container} mt-12 flex flex-col gap-20`}>
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="grid scroll-mt-32 gap-6 md:grid-cols-[220px_1fr]">
            <header className="flex items-baseline gap-3 md:sticky md:top-32 md:self-start">
              <span className="display-num text-[14px] text-fg-secondary">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="flex items-center gap-2 font-display text-[28px] font-bold uppercase leading-none">
                {s.stage && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STAGE_COLOR[s.stage] }} aria-hidden="true" />}
                {s.title}
              </h2>
            </header>
            <div className="min-w-0">{s.body}</div>
          </section>
        ))}
      </div>
    </>
  );
}

function Intro({ children }: { children: React.ReactNode }) {
  return <p className="mb-6 max-w-[680px] text-[18px] leading-[1.6]">{children}</p>;
}

function Overview({ story, labels }: { story: CaseStory; labels: StoryLabels }) {
  const items = [
    { title: labels.challenge, text: story.overview.challenge, color: "var(--entity-problem)" },
    { title: labels.solution, text: story.overview.solution, color: "var(--entity-design)" },
    { title: labels.outcome, text: story.overview.outcome, color: "var(--success)" },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {items.map((it) => (
        <div key={it.title} className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-5" style={{ borderTop: `4px solid ${it.color}` }}>
          <p className="font-display text-[18px] font-bold uppercase leading-none">{it.title}</p>
          <p className="leading-[1.6]">{it.text}</p>
        </div>
      ))}
    </div>
  );
}

function Process({ story }: { story: CaseStory }) {
  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
      {story.process.map((p, i) => (
        <li
          key={p.stage}
          className="relative flex flex-col gap-1 rounded-[12px] border border-line bg-surface p-4"
          style={{ background: tint(STAGE_COLOR[p.stage], 8) }}
        >
          <span className="display-num text-[11px] text-fg-secondary">{String(i + 1).padStart(2, "0")}</span>
          <span className="display-num text-[34px] leading-none" style={{ color: STAGE_COLOR[p.stage] }}>
            {p.value}
          </span>
          <span className="text-[13px] leading-snug text-fg-secondary">{p.label}</span>
        </li>
      ))}
    </ol>
  );
}

function Research({ data }: { data: NonNullable<CaseStory["research"]> }) {
  return (
    <>
      <Intro>{data.intro}</Intro>
      <dl className="mb-8 flex flex-wrap gap-x-10 gap-y-4">
        {data.facts.map((f) => (
          <div key={f.label}>
            <dt className="sr-only">{f.label}</dt>
            <dd className="display-num text-[40px] leading-none">{f.value}</dd>
            <dd className="mt-1 text-[13px] text-fg-secondary">{f.label}</dd>
          </div>
        ))}
      </dl>
      {/* Quotes as sticky notes from the research board */}
      <ul className="grid gap-5 sm:grid-cols-2">
        {data.quotes.map((q, i) => (
          <li
            key={q.who}
            className="flex flex-col justify-between gap-4 rounded-[4px] p-5 text-on-sticky shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
            style={{ background: STICKERS[i % STICKERS.length], transform: `rotate(${i % 2 ? 1 : -1}deg)` }}
          >
            <p className="text-[17px] font-semibold leading-snug">«{q.text}»</p>
            <p className="text-[13px] opacity-70">— {q.who}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

function Code({ code, color }: { code: string; color: string }) {
  return (
    <span className="display-num w-fit shrink-0 whitespace-nowrap rounded-[6px] px-1.5 py-0.5 text-[12px]" style={{ color, background: tint(color, 14) }}>
      {code}
    </span>
  );
}

function Insights({ data }: { data: NonNullable<CaseStory["insights"]> }) {
  const color = STAGE_COLOR.synthesis;
  return (
    <ul className="grid gap-4 lg:grid-cols-3">
      {data.map((ins) => (
        <li key={ins.code} className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-5">
          <Code code={ins.code} color={color} />
          <p className="font-display text-[22px] font-bold uppercase leading-[1.05]">{ins.title}</p>
          <p className="leading-[1.6] text-fg-secondary">{ins.body}</p>
          <p className="mt-auto border-t border-line pt-3 text-[13px] font-semibold" style={{ color }}>
            {ins.evidence}
          </p>
        </li>
      ))}
    </ul>
  );
}

const MARK_STYLE: Record<Mark, { bg: string; fg: string }> = {
  yes: { bg: tint("var(--success)", 22), fg: "var(--success)" },
  partial: { bg: tint("var(--warning)", 24), fg: "var(--warning)" },
  no: { bg: tint("var(--danger)", 24), fg: "var(--danger)" },
};

function Competitors({ data, labels }: { data: NonNullable<CaseStory["competitors"]>; labels: StoryLabels }) {
  return (
    <>
      <Intro>{data.intro}</Intro>
      <div className="overflow-x-auto rounded-[14px] border border-line bg-surface">
        <table className="w-full min-w-[560px] border-collapse text-[14px]">
          <thead>
            <tr>
              <th className="p-3 text-left" />
              {data.products.map((p, i) => (
                <th key={p} className={cn("p-3 text-center font-semibold", i === 0 && "text-fg", i > 0 && "text-fg-secondary")}>
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.feature} className="border-t border-line">
                <th scope="row" className="p-3 text-left font-semibold">
                  {r.feature}
                </th>
                {r.marks.map((m, i) => (
                  <td key={i} className={cn("p-1.5", i === 0 && "bg-subtle")}>
                    <span
                      className="flex h-9 items-center justify-center rounded-[8px] text-[12px] font-bold"
                      style={{ background: MARK_STYLE[m].bg, color: MARK_STYLE[m].fg }}
                    >
                      {labels.marks[m]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex items-center gap-2 text-[13px] text-fg-secondary">
        <span className="h-3 w-3 rounded-[3px]" style={{ background: MARK_STYLE.no.bg }} aria-hidden="true" />
        {labels.redHint}
      </p>
    </>
  );
}

function Opportunities({ data }: { data: NonNullable<CaseStory["opportunities"]> }) {
  const color = STAGE_COLOR.opportunities;
  return (
    <ol className="flex flex-col">
      {data.map((o) => (
        <li key={o.code} className="flex flex-col gap-2 border-t border-line py-5 sm:flex-row sm:items-baseline sm:gap-6">
          <Code code={o.code} color={color} />
          <p className="font-display text-[clamp(22px,2.6vw,30px)] font-bold uppercase leading-[1.05]">{o.text}</p>
        </li>
      ))}
    </ol>
  );
}

function Flow({ data, labels }: { data: NonNullable<CaseStory["flow"]>; labels: StoryLabels }) {
  const color = STAGE_COLOR.flows;
  return (
    <>
      <Intro>{data.intro}</Intro>
      <ol className="flex flex-col items-stretch gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        {data.steps.map((s, i) => (
          <li key={s.label} className="flex flex-col items-center gap-2 lg:flex-row">
            <span
              className={cn(
                "w-full border-[1.5px] px-4 py-3 text-center text-[14px] font-semibold lg:w-auto",
                s.kind === "start" || s.kind === "end" ? "rounded-full" : "rounded-[10px]",
                s.kind === "action" && "border-dashed",
              )}
              style={{
                borderColor: color,
                background: s.kind === "screen" ? tint(color, 12) : s.kind === "end" ? color : "transparent",
                color: s.kind === "end" ? "var(--on-accent)" : undefined,
              }}
            >
              {s.label}
            </span>
            {i < data.steps.length - 1 && (
              <span className="text-[18px] text-fg-secondary" aria-hidden="true">
                <span className="lg:hidden">↓</span>
                <span className="hidden lg:inline">→</span>
              </span>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-8 rounded-[14px] border border-dashed border-line p-5">
        <p className="mb-3 font-display text-[18px] font-bold uppercase leading-none">{labels.edgeCases}</p>
        <ul className="flex flex-col gap-2">
          {data.edgeCases.map((e) => (
            <li key={e} className="flex gap-2">
              <span style={{ color }} aria-hidden="true">
                ◆
              </span>
              {e}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function Screens({ data, sticker }: { data: NonNullable<CaseStory["screens"]>; sticker: string }) {
  return (
    <>
      <Intro>{data.intro}</Intro>
      <ul className="grid gap-8 sm:grid-cols-3">
        {data.items.map((sc) => (
          <li key={sc.title} className="flex flex-col gap-3">
            {/* Phone mock-up placeholder until real screens are published */}
            <div className="mx-auto w-full max-w-[240px] rounded-[30px] border-[6px] border-fg bg-surface p-2 shadow-[0_12px_30px_rgba(0,0,0,0.15)]">
              <div className="flex aspect-[9/17] flex-col gap-2 overflow-hidden rounded-[20px] p-3 text-on-sticky" style={{ background: sticker }}>
                <div className="mx-auto h-1.5 w-12 rounded-full bg-current/25" />
                <div className="mt-2 h-4 w-2/3 rounded-full bg-current/30" />
                <div className="h-20 rounded-[12px] bg-white/50" />
                <div className="h-3 w-4/5 rounded-full bg-current/20" />
                <div className="h-3 w-3/5 rounded-full bg-current/15" />
                <div className="h-14 rounded-[12px] bg-white/40" />
                <div className="mt-auto h-9 rounded-[10px] bg-current/80" />
              </div>
            </div>
            <p className="font-display text-[22px] font-bold uppercase leading-none">{sc.title}</p>
            <p className="text-fg-secondary">{sc.caption}</p>
            <ul className="flex flex-wrap gap-1.5">
              {sc.states.map((st) => (
                <li key={st} className="rounded-full border border-line px-2.5 py-0.5 text-[12px] text-fg-secondary">
                  {st}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}

function Decisions({ data, labels }: { data: NonNullable<CaseStory["decisions"]>; labels: StoryLabels }) {
  const color = STAGE_COLOR.decisions;
  return (
    <ul className="flex flex-col gap-4">
      {data.map((dec) => (
        <li key={dec.code} className="grid gap-5 rounded-[14px] border border-line bg-surface p-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-3">
            <Code code={dec.code} color={color} />
            <p className="font-display text-[24px] font-bold uppercase leading-[1.05]">{dec.title}</p>
            <p className="leading-[1.6]">
              <span className="font-semibold">{labels.why}: </span>
              {dec.why}
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:border-l lg:border-line lg:pl-5">
            <div>
              <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-fg-secondary">{labels.rejected}</p>
              <ul className="flex flex-col gap-1">
                {dec.rejected.map((r) => (
                  <li key={r} className="text-fg-secondary line-through decoration-danger/70">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-fg-secondary">{labels.evidence}</p>
              <ul className="flex flex-wrap gap-1.5">
                {dec.evidence.map((e) => (
                  <li key={e}>
                    <Code code={e} color={STAGE_COLOR.synthesis} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Results({ data }: { data: NonNullable<CaseStory["results"]> }) {
  return (
    <>
      <Intro>{data.intro}</Intro>
      <ul className="grid gap-4 sm:grid-cols-3">
        {data.metrics.map((m) => (
          <li key={m.label} className="rounded-[14px] border border-line bg-surface p-5">
            <p className="display-num text-[48px] leading-none" style={{ color: "var(--success)" }}>
              {m.value}
            </p>
            <p className="mt-2 text-[14px] text-fg-secondary">{m.label}</p>
          </li>
        ))}
      </ul>
      {data.quote && (
        <figure className="mt-8 rounded-[18px] bg-rail p-6 text-rail-fg sm:p-10">
          <blockquote className="font-display text-[clamp(24px,3vw,36px)] font-bold uppercase leading-[1.1]">«{data.quote.text}»</blockquote>
          <figcaption className="mt-4 text-[14px] opacity-70">— {data.quote.who}</figcaption>
        </figure>
      )}
    </>
  );
}
