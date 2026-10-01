import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, Mail, Send } from "lucide-react";
import { getCurrentUser, getMyRole, getWorkspaceBySlug } from "@/domains/projects";
import { getRequest } from "@/domains/requests/queries";
import { budgetLabel, label, labels } from "@/domains/requests/labels";
import { StatusBadge } from "@/domains/requests/status-badge";
import {
  addRequestNote, convertRequest, deleteRequest, deleteRequestNote, setRequestArchived, setRequestStatus,
} from "@/domains/requests/workspace-actions";
import { Button } from "@/shared/ui/button";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import { Panel, Select, Textarea } from "@/shared/ui/field";
import { t } from "@/shared/i18n/ru";
import { WorkspaceHeader } from "../../workspace-header";

type Params = Promise<{ ws: string; code: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { code } = await params;
  return { title: `${code} · ${t.requests.title}` };
}

const r = t.requests;
const dt = (iso: string, time = false) =>
  new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", ...(time ? { hour: "2-digit", minute: "2-digit" } : {}) })
    .format(new Date(iso));

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  const shown = rows.filter(([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0));
  if (!shown.length) return <p className="text-fg-secondary">{r.none}</p>;
  return (
    <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-[200px_1fr]">
      {shown.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-sm font-semibold text-fg-secondary">{k}</dt>
          <dd className="whitespace-pre-line break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-5">
      <h2 className="text-heading font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const ext = (url: string) => <a href={url} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2">{url}</a>;

export default async function RequestPage({ params }: { params: Params }) {
  const { ws, code } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  if (!workspace) notFound();
  const [req, role, user] = await Promise.all([getRequest(workspace.id, code), getMyRole(workspace.id), getCurrentUser()]);
  if (!req || !req.snapshot) notFound();
  const s = req.snapshot;
  const canEdit = role === "owner" || role === "editor";
  const client = s.client;
  const contactHref = client.preferred_channel === "telegram" && client.telegram
    ? `https://t.me/${client.telegram.replace(/^@/, "")}`
    : `mailto:${client.email}?subject=${encodeURIComponent(`${s.project.name ?? r.noName} (${req.code})`)}`;
  const links = (ls: { kind: string; url: string }[]) =>
    ls.length ? <ul className="flex flex-col gap-1">{ls.map((l) => <li key={l.url}>{label("linkKinds", l.kind, "ru")}: {ext(l.url)}</li>)}</ul> : null;

  return (
    <div className="min-h-screen">
      <WorkspaceHeader current={workspace.slug} />
      <main className="mx-auto grid max-w-6xl gap-10 px-[clamp(18px,4vw,56px)] py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="flex min-w-0 flex-col gap-6">
          <Link href={`/w/${ws}/requests`} className="text-sm font-semibold text-fg-secondary hover:text-fg">{r.back}</Link>
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm font-semibold">{req.code}</span>
              <StatusBadge status={req.status} />
              {req.archived_at && <span className="text-meta text-fg-secondary">{r.archived}</span>}
            </div>
            <h1 className="page-title">{s.project.name ?? r.noName}</h1>
            <p className="text-fg-secondary">{dt(s.submitted_at, true)} · {r.rows.locale}: {s.locale.toUpperCase()}</p>
            <p className="rounded-control bg-subtle px-4 py-2.5 text-sm text-fg-secondary">{r.clientInput}</p>
          </header>

          <Block title={r.sections.client}>
            <Rows rows={[
              [r.rows.name, client.name], [r.rows.company, client.company], [r.rows.role, client.role],
              [r.rows.email, <a key="e" href={`mailto:${client.email}`} className="underline underline-offset-2">{client.email}</a>],
              [r.rows.phone, client.phone], [r.rows.telegram, client.telegram], [r.rows.website, client.website ? ext(client.website) : null],
              [r.rows.channel, client.preferred_channel === "other" ? client.preferred_channel_note : label("channels", client.preferred_channel, "ru")],
            ]} />
          </Block>
          <Block title={r.sections.project}>
            <Rows rows={[
              [r.rows.types, [...labels("types", s.project.types.filter((x) => x !== "other"), "ru"), s.project.type_other].filter(Boolean).join(", ")],
            ]} />
          </Block>
          <Block title={r.sections.overview}>
            <Rows rows={[
              [r.rows.summary, s.about.summary], [r.rows.whatItDoes, s.about.what_it_does], [r.rows.problem, s.about.problem],
              [r.rows.whyNow, s.about.why_now],
              [r.rows.goals, [...labels("goals", s.about.goals.filter((g) => g !== "other"), "ru"), s.about.goal_other].filter(Boolean).join(", ")],
            ]} />
          </Block>
          <Block title={r.sections.existing}>
            {s.existing.has ? (
              <Rows rows={[
                [r.rows.url, s.existing.url ? ext(s.existing.url) : null], [r.rows.description, s.existing.description],
                [r.rows.worksWell, s.existing.works_well], [r.rows.dislikes, s.existing.dislikes], [r.rows.mustChange, s.existing.must_change],
                [r.rows.links, links(s.existing.links)],
              ]} />
            ) : <p>{r.noExisting}</p>}
          </Block>
          <Block title={r.sections.audience}>
            <Rows rows={[
              [r.rows.audience, s.audience.audience], [r.rows.primaryUsers, s.audience.primary_users], [r.rows.geography, s.audience.geography],
              [r.rows.market, label("markets", s.audience.market, "ru")], [r.rows.demographics, s.audience.demographics],
              [r.rows.painPoints, s.audience.pain_points],
            ]} />
          </Block>
          <Block title={r.sections.competitors}>
            {s.competitors.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {s.competitors.map((c, i) => (
                  <li key={i} className="flex flex-col gap-1.5 rounded-control border border-line p-3.5">
                    <p className="font-semibold">{c.name}</p>
                    {c.url && <p className="text-sm">{ext(c.url)}</p>}
                    {c.likes && <p className="text-sm"><span className="font-semibold text-fg-secondary">{r.rows.likes}: </span>{c.likes}</p>}
                    {c.dislikes && <p className="text-sm"><span className="font-semibold text-fg-secondary">{r.rows.dislikes}: </span>{c.dislikes}</p>}
                    {c.why && <p className="text-sm"><span className="font-semibold text-fg-secondary">{r.rows.why}: </span>{c.why}</p>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-fg-secondary">{r.none}</p>}
          </Block>
          <Block title={r.sections.references}>
            {s.references.length ? (
              <ul className="flex flex-col gap-2">
                {s.references.map((x, i) => <li key={i}>{ext(x.url)}{x.note && <span className="text-fg-secondary"> — {x.note}</span>}</li>)}
              </ul>
            ) : <p className="text-fg-secondary">{r.none}</p>}
          </Block>
          <Block title={r.sections.scope}>
            <Rows rows={[
              [r.rows.items, labels("scope", s.scope.items, "ru").join(", ")],
              ["", s.scope.needs_advice ? r.advice : null],
            ]} />
          </Block>
          <Block title={r.sections.materials}>
            <Rows rows={[[r.rows.items, labels("materials", s.materials.items, "ru").join(", ")], [r.rows.links, links(s.materials.links)]]} />
          </Block>
          <Block title={r.sections.budget}>
            <Rows rows={[[r.rows.range, budgetLabel(s.budget, "ru")], [r.rows.note, s.budget.note]]} />
          </Block>
          <Block title={r.sections.timeline}>
            <Rows rows={[
              [r.rows.start, label("start", s.timeline.start, "ru")],
              [r.rows.deadlineDate, s.timeline.has_deadline && s.timeline.deadline_date ? dt(`${s.timeline.deadline_date}T12:00:00Z`) : null],
              [r.rows.reason, s.timeline.has_deadline ? s.timeline.deadline_reason : null],
            ]} />
          </Block>
          <Block title={r.sections.additional}>
            <p className="whitespace-pre-line break-words">{s.additional_info || r.none}</p>
          </Block>
          <p className="text-meta text-fg-secondary">{r.rows.consent}: {dt(s.consent.at, true)} · {s.consent.privacy_policy_version}</p>
        </article>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
          {req.project ? (
            <Panel className="flex flex-col gap-2">
              <p className="text-sm text-fg-secondary">{r.converted}</p>
              <p className="font-semibold">{req.project.name}</p>
              <Link href={`/w/${ws}/p/${req.project.slug}/brief`} className="font-semibold underline underline-offset-4">{r.openProject}</Link>
            </Panel>
          ) : canEdit && req.status !== "declined" && (
            <Panel className="flex flex-col gap-3">
              <form action={convertRequest}>
                <input type="hidden" name="requestId" value={req.id} />
                <Button type="submit" className="w-full">{r.convert}</Button>
              </form>
              <p className="text-meta text-fg-secondary">{r.convertHint}</p>
            </Panel>
          )}

          {canEdit && req.status !== "converted" && (
            <Panel>
              <form action={setRequestStatus} className="flex items-end gap-2">
                <input type="hidden" name="requestId" value={req.id} />
                <label className="flex flex-1 flex-col gap-1.5 text-sm font-semibold">
                  {r.statusLabel}
                  <Select name="status" defaultValue={req.status}>
                    {(["submitted", "reviewing", "qualified", "accepted", "declined"] as const).map((st) => (
                      <option key={st} value={st}>{r.status[st]}</option>
                    ))}
                  </Select>
                </label>
                <Button type="submit" variant="secondary">{r.saveStatus}</Button>
              </form>
            </Panel>
          )}

          <Panel className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-fg-secondary">{r.sections.documents}</h2>
            {req.documents.map((d) => (
              <div key={d.id} className="flex flex-col gap-1.5">
                <p className="text-sm">{r.docVersion(d.version, dt(d.generated_at))}</p>
                <div className="flex flex-wrap gap-3 text-sm font-semibold">
                  {(["uk", "en"] as const).map((l) => (
                    <a key={l} href={`/w/${ws}/requests/${req.code}/brief?locale=${l}&v=${d.version}`}
                      className="inline-flex items-center gap-1.5 underline underline-offset-4">
                      <FileDown aria-hidden className="size-4" />{r.pdf(l.toUpperCase())}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </Panel>

          <Panel className="flex flex-col gap-2">
            <a href={contactHref} target={contactHref.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
              className="inline-flex items-center gap-2 font-semibold underline underline-offset-4">
              {client.preferred_channel === "telegram" && client.telegram ? <Send aria-hidden className="size-4" /> : <Mail aria-hidden className="size-4" />}
              {r.contact}
            </a>
            <p className="text-meta text-fg-secondary">{r.contactHint}</p>
          </Panel>

          <Panel className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-fg-secondary">{r.sections.notes}</h2>
            {canEdit && (
              <form action={addRequestNote} className="flex flex-col gap-2">
                <input type="hidden" name="requestId" value={req.id} />
                <Textarea name="body" required maxLength={4000} rows={3} placeholder={r.notePlaceholder} aria-label={r.addNote} />
                <Button type="submit" variant="secondary">{r.addNote}</Button>
              </form>
            )}
            {req.notes.length === 0 ? <p className="text-sm text-fg-secondary">{r.noNotes}</p> : (
              <ul className="flex flex-col gap-3">
                {req.notes.map((n) => (
                  <li key={n.id} className="flex flex-col gap-1.5 border-t border-line pt-3">
                    <p className="whitespace-pre-line break-words text-sm">{n.body}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-meta text-fg-secondary">{dt(n.created_at, true)}</span>
                      {(n.author_id === user?.id || role === "owner") && (
                        <ConfirmDelete action={deleteRequestNote} fields={{ id: n.id }} label={r.deleteNote} confirm={t.status.confirmDelete} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {canEdit && (
            <form action={setRequestArchived}>
              <input type="hidden" name="requestId" value={req.id} />
              <input type="hidden" name="archive" value={req.archived_at ? "0" : "1"} />
              <Button type="submit" variant="secondary" className="w-full">{req.archived_at ? r.unarchive : r.archive}</Button>
            </form>
          )}
          {role === "owner" && (req.status === "converted"
            ? <p className="text-meta text-fg-secondary">{r.deleteConverted}</p>
            : <ConfirmDelete action={deleteRequest} fields={{ id: req.id }} label={r.delete} confirm={r.deleteConfirm(req.code)} />)}
        </aside>
      </main>
    </div>
  );
}
