import { cn } from "@/shared/lib/cn";
import type { CaseStory, Mark, StoryLabels } from "./case-story";
import { CaseContents } from "./case-contents";
import { container } from "./ui";

const pad = (n: number) => String(n).padStart(2, "0");

type Section = { id: string; title: string; body: React.ReactNode };

/**
 * Sections of a published case, in the order of the tool's chain; missing blocks are skipped. Laid out as the
 * SIGNAL case: contents in a sticky column, chapters under a rule, the accent only on codes and numbers.
 */
export function CaseStoryView({ story, labels, sticker }: { story: CaseStory; labels: StoryLabels; sticker: string }) {
  const sections: Section[] = [
    { id: "overview", title: labels.overview, body: <Overview story={story} labels={labels} /> },
    { id: "process", title: labels.process, body: <Process story={story} /> },
  ];
  if (story.research) sections.push({ id: "research", title: labels.research, body: <Research data={story.research} /> });
  if (story.insights) sections.push({ id: "insights", title: labels.insights, body: <Insights data={story.insights} /> });
  if (story.competitors)
    sections.push({ id: "competitors", title: labels.competitors, body: <Competitors data={story.competitors} labels={labels} /> });
  if (story.opportunities) sections.push({ id: "opportunities", title: labels.opportunities, body: <Opportunities data={story.opportunities} /> });
  if (story.flow) sections.push({ id: "flow", title: labels.flow, body: <Flow data={story.flow} labels={labels} /> });
  if (story.screens) sections.push({ id: "screens", title: labels.screens, body: <Screens data={story.screens} sticker={sticker} /> });
  if (story.decisions) sections.push({ id: "decisions", title: labels.decisions, body: <Decisions data={story.decisions} labels={labels} /> });
  if (story.results) sections.push({ id: "results", title: labels.results, body: <Results data={story.results} /> });

  return (
    <div className={`${container} sg-case-body`}>
      <CaseContents label={labels.contents} sections={sections} />
      <div className="min-w-0">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="sg-chapter" aria-labelledby={`${s.id}-h`}>
            <p className="sg-eyebrow text-fg-secondary"><span className="sg-section-index">{pad(i + 1)} /</span>{pad(sections.length)}</p>
            <h2 id={`${s.id}-h`}>{s.title}</h2>
            {s.body}
          </section>
        ))}
      </div>
    </div>
  );
}

function Intro({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function Overview({ story, labels }: { story: CaseStory; labels: StoryLabels }) {
  const items = [
    { title: labels.challenge, text: story.overview.challenge },
    { title: labels.solution, text: story.overview.solution },
    { title: labels.outcome, text: story.overview.outcome },
  ];
  return (
    <div className="sg-case-columns">
      {items.map((it) => (
        <div key={it.title}>
          <h3>{it.title}</h3>
          <p className="sg-case-secondary">{it.text}</p>
        </div>
      ))}
    </div>
  );
}

function Process({ story }: { story: CaseStory }) {
  return (
    <dl className="sg-case-result sg-case-result--four">
      {story.process.map((p) => (
        <div key={p.stage}><dt className="sr-only">{p.label}</dt><dd><strong>{p.value}</strong><span>{p.label}</span></dd></div>
      ))}
    </dl>
  );
}

function Research({ data }: { data: NonNullable<CaseStory["research"]> }) {
  return (
    <>
      <Intro>{data.intro}</Intro>
      <dl className="sg-case-result">
        {data.facts.map((f) => (
          <div key={f.label}><dt className="sr-only">{f.label}</dt><dd><strong>{f.value}</strong><span>{f.label}</span></dd></div>
        ))}
      </dl>
      {/* What people said, as the package's pull quotes. */}
      <ul className="grid gap-x-10 gap-y-2 md:grid-cols-2">
        {data.quotes.map((q) => (
          <li key={q.who}>
            <figure className="sg-case-quote">
              <blockquote><q>{q.text}</q></blockquote>
              <figcaption>— {q.who}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </>
  );
}

/** INS–001, OPP–02, DEC–003: the record's code, in mono and the accent. */
function Code({ code }: { code: string }) {
  return <span className="sg-case-code">{code}</span>;
}

function Insights({ data }: { data: NonNullable<CaseStory["insights"]> }) {
  return (
    <div>
      {data.map((ins) => (
        <div key={ins.code} className="sg-case-insight">
          <Code code={ins.code} />
          <div>
            <h3>{ins.title}</h3>
            <p>{ins.body}</p>
            <small>{ins.evidence}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

const MARK_CLASS: Record<Mark, string> = {
  // The accent marks the gaps of the others (the opportunity); a match is plain ink, a partial one is muted.
  yes: "bg-subtle text-fg",
  partial: "text-fg-secondary border border-dashed border-line",
  no: "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent-text",
};

function Competitors({ data, labels }: { data: NonNullable<CaseStory["competitors"]>; labels: StoryLabels }) {
  return (
    <>
      <Intro>{data.intro}</Intro>
      {/* Scrolls sideways on a phone: focusable so the keyboard can scroll it too (WCAG 2.1.1). */}
      {/* Named by its columns: the chapter around it is already the «competitors» landmark. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div tabIndex={0} role="region" aria-label={`${labels.competitors}: ${data.products.join(", ")}`} className="mt-8 overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[560px] border-collapse text-[14px]">
          <thead>
            <tr>
              <td className="p-3" />
              {data.products.map((p, i) => (
                <th key={p} className={cn("p-3 text-center font-label text-[11px] font-normal uppercase tracking-[0.06em]", i === 0 ? "text-fg" : "text-fg-secondary")}>
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.feature} className="border-t border-line">
                <th scope="row" className="p-3 text-left font-medium">{r.feature}</th>
                {r.marks.map((m, i) => (
                  <td key={i} className="p-1.5">
                    <span className={cn("flex h-9 items-center justify-center rounded-[3px] text-[12px] font-semibold", MARK_CLASS[m])}>
                      {labels.marks[m]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-2 font-label text-[11px] text-fg-secondary">
        <span className={cn("h-3 w-3 rounded-[2px]", MARK_CLASS.no)} aria-hidden="true" />
        {labels.redHint}
      </div>
    </>
  );
}

function Opportunities({ data }: { data: NonNullable<CaseStory["opportunities"]> }) {
  return (
    <ol>
      {data.map((o) => (
        <li key={o.code} className="sg-case-insight">
          <Code code={o.code} />
          <p className="sg-case-statement">{o.text}</p>
        </li>
      ))}
    </ol>
  );
}

function Flow({ data, labels }: { data: NonNullable<CaseStory["flow"]>; labels: StoryLabels }) {
  return (
    <>
      <Intro>{data.intro}</Intro>
      <ol className="sg-case-chain">
        {data.steps.map((s, i) => (
          <li key={s.label} className={cn(s.kind === "action" && "border-dashed", s.kind === "end" && "border-accent-text")}>
            <span>{pad(i + 1)}</span>{s.label}
          </li>
        ))}
      </ol>
      <div className="border-t border-line pt-6">
        <h3>{labels.edgeCases}</h3>
        <ul className="flex flex-col gap-2 text-[15px]">
          {data.edgeCases.map((e) => (
            <li key={e} className="flex gap-3">
              <span className="font-label text-accent-text" aria-hidden="true">+</span>
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
      <ul className="mt-8 grid gap-8 sm:grid-cols-3">
        {data.items.map((sc) => (
          <li key={sc.title} className="flex flex-col gap-3">
            {/* Phone mock-up placeholder until real screens are published */}
            <div className="mx-auto w-full max-w-[220px] rounded-[26px] border border-line bg-surface p-2">
              <div className="flex aspect-[9/17] flex-col gap-2 overflow-hidden rounded-[18px] p-3 text-on-sticky" style={{ background: sticker }}>
                <div className="mx-auto h-1.5 w-12 rounded-full bg-current/25" />
                <div className="mt-2 h-4 w-2/3 rounded-full bg-current/30" />
                <div className="h-20 rounded-[6px] bg-white/50" />
                <div className="h-3 w-4/5 rounded-full bg-current/20" />
                <div className="h-3 w-3/5 rounded-full bg-current/15" />
                <div className="h-14 rounded-[6px] bg-white/40" />
                <div className="mt-auto h-9 rounded-[4px] bg-current/80" />
              </div>
            </div>
            <h3 className="!mb-0">{sc.title}</h3>
            <p className="sg-case-secondary !mb-0 !text-[15px]">{sc.caption}</p>
            <ul className="flex flex-wrap gap-1.5">
              {sc.states.map((st) => (
                <li key={st} className="rounded-[3px] border border-line px-2 py-0.5 font-label text-[11px] text-fg-secondary">{st}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}

function Decisions({ data, labels }: { data: NonNullable<CaseStory["decisions"]>; labels: StoryLabels }) {
  return (
    <div className="mt-8">
      {data.map((dec, i) => (
        <details key={dec.code} className="sg-case-decision" open={i === 0}>
          <summary><span><Code code={dec.code} />{dec.title}</span></summary>
          <p><span className="font-semibold">{labels.why}: </span>{dec.why}</p>
          <p className="sg-case-rejected">
            {labels.rejected}: {dec.rejected.map((r, j) => <span key={r}>{j > 0 && "; "}<s>{r}</s></span>)}.{" "}
            {labels.evidence}: {dec.evidence.join(", ")}.
          </p>
        </details>
      ))}
    </div>
  );
}

function Results({ data }: { data: NonNullable<CaseStory["results"]> }) {
  return (
    <>
      <Intro>{data.intro}</Intro>
      <dl className="sg-case-result">
        {data.metrics.map((m) => (
          <div key={m.label}><dt className="sr-only">{m.label}</dt><dd><strong>{m.value}</strong><span>{m.label}</span></dd></div>
        ))}
      </dl>
      {data.quote && (
        <figure className="sg-case-pullquote">
          <blockquote><q>{data.quote.text}</q></blockquote>
          <figcaption>— {data.quote.who}</figcaption>
        </figure>
      )}
    </>
  );
}
