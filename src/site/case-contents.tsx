import { CaseContentsSpy } from "./case-contents-spy";
import { CaseDock, type CaseDockCta } from "./case-dock";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * «У цьому кейсі» (SIGNAL case contents): a sticky column beside the chapters on wide screens, a wrapped row of
 * links above them on narrow ones, and on a phone also the dock at the bottom of the screen (CaseDock) once that
 * row is scrolled past. The chapter being read is marked by CaseContentsSpy.
 */
export function CaseContents({ label, sections, cta }: { label: string; sections: { id: string; title: string }[]; cta?: CaseDockCta }) {
  // The dock sits outside .sg-case-contents so it takes none of the row's styles; fixed, it takes no grid cell.
  return (
    <>
      <div className="sg-case-contents">
        <p aria-hidden>{label}</p>
        <nav id="case-contents" aria-label={label} data-case-contents="">
          <ol>
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`}><span>{pad(i + 1)}</span>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      {cta && <CaseDock label={label} sections={sections} cta={cta} />}
      <CaseContentsSpy ids={sections.map((s) => s.id)} />
    </>
  );
}
