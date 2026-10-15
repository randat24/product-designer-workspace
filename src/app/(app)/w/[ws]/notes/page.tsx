import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getMyRole, getWorkspaceBySlug } from "@/domains/projects";
import { isSiteWorkspace, listNotes } from "@/domains/notes";
import { NoteComposer } from "@/domains/notes/composer";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import { WorkspaceHeader, WorkspaceTabs } from "../workspace-header";

export const metadata: Metadata = { title: t.notes.title };

const date = (iso: string) => new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

export default async function NotesPage({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  if (!workspace) notFound();
  const isOwner = (await getMyRole(workspace.id)) === "owner";
  const [notes, isSite] = isOwner ? await Promise.all([listNotes(workspace.id), isSiteWorkspace(workspace.id)]) : [[], false];
  const n = t.notes;

  return (
    <div className="min-h-screen">
      <WorkspaceHeader current={workspace.slug} />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-[clamp(18px,4vw,56px)] py-10">
        <WorkspaceTabs wsSlug={workspace.slug} workspaceId={workspace.id} current="notes" />
        <div className="flex flex-col gap-2">
          <h1 className="page-title">{n.title}</h1>
          <p className="max-w-prose text-fg-secondary">{n.lede}</p>
          <Link href="/uk/notes" target="_blank" className="inline-flex w-fit items-center gap-1.5 text-meta font-semibold underline underline-offset-4">
            {n.view}<ExternalLink aria-hidden className="size-4" />
          </Link>
        </div>
        {!isOwner ? (
          <p className="rounded-panel border border-dashed border-line p-7 text-center text-fg-secondary">{n.ownerOnly}</p>
        ) : (
          <>
            {!isSite && <p role="note" className="max-w-prose rounded-panel border border-warning p-4 text-meta">{n.notSite}</p>}
            <NoteComposer workspaceId={workspace.id} wsSlug={ws} />
            {notes.length === 0 ? (
              <p className="rounded-panel border border-dashed border-line p-7 text-center text-fg-secondary">{n.listEmpty}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {notes.map((note) => {
                  const parent = note.parent_id ? notes.find((x) => x.id === note.parent_id) : null;
                  return (
                    <li key={note.id} className="enter">
                      <Link href={`/w/${ws}/notes/${note.number}`}
                        className="grid gap-x-6 gap-y-2 rounded-panel border border-line bg-surface p-4 transition-colors hover:border-fg md:grid-cols-[120px_minmax(0,1fr)_auto] md:items-start">
                        <span className="flex flex-col">
                          <span className="font-mono text-sm font-semibold">N-{note.number}</span>
                          <span className="text-meta text-fg-secondary">{date(note.published_at ?? note.created_at)}</span>
                        </span>
                        <span className="flex min-w-0 flex-col gap-1">
                          <span className="line-clamp-3 whitespace-pre-line">{note.body_uk || "—"}</span>
                          <span className="text-sm text-fg-secondary">
                            {[parent && n.continues(parent.number), !note.body_en && n.noEn, note.tags.length > 0 && note.tags.map((x) => `#${x}`).join(" ")]
                              .filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <span className={cn("inline-flex h-6 items-center self-start rounded-[4px] px-2.5 text-[0.75rem] font-semibold whitespace-nowrap",
                          note.status === "published" ? "bg-success/15 text-success" : "bg-subtle text-fg-secondary")}>
                          {n.status[note.status]}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
