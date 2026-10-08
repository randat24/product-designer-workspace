import { CaseContentsSpy } from "./case-contents-spy";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * «У цьому кейсі» (SIGNAL case contents): a sticky column beside the chapters on wide screens, a wrapped row of
 * links above them on narrow ones. The chapter being read is marked by CaseContentsSpy.
 */
export function CaseContents({ label, sections }: { label: string; sections: { id: string; title: string }[] }) {
  return (
    <div className="sg-case-contents">
      <p aria-hidden>{label}</p>
      <nav id="case-contents" aria-label={label}>
        <ol>
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`}><span>{pad(i + 1)}</span>{s.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      <CaseContentsSpy ids={sections.map((s) => s.id)} navId="case-contents" />
    </div>
  );
}
