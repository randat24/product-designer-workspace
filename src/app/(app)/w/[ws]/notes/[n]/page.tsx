import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMyRole, getWorkspaceBySlug } from "@/domains/projects";
import { getNote, listNotes } from "@/domains/notes";
import { deleteNote } from "@/domains/notes/actions";
import { NoteEditor, NotePublish, type NoteDraft } from "@/domains/notes/note-editor";
import { BackLink } from "@/shared/ui/back-link";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import { t } from "@/shared/i18n/uk";
import { WorkspaceHeader, WorkspaceTabs } from "../../workspace-header";

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  return { title: `N-${n} · ${t.notes.title}` };
}

export default async function NotePage({ params }: { params: Promise<{ ws: string; n: string }> }) {
  const { ws, n: raw } = await params;
  const number = Number(raw);
  if (!Number.isInteger(number) || number < 1) notFound();
  const workspace = await getWorkspaceBySlug(ws);
  if (!workspace || (await getMyRole(workspace.id)) !== "owner") notFound();
  const [note, all] = await Promise.all([getNote(workspace.id, number), listNotes(workspace.id)]);
  if (!note) notFound();
  const image = note.image as NoteDraft["image"];
  const initial: NoteDraft = { body_uk: note.body_uk, body_en: note.body_en ?? "", image, tags: note.tags, parent_id: note.parent_id };
  const parents = all.filter((x) => x.id !== note.id)
    .map((x) => ({ id: x.id, number: x.number, excerpt: x.body_uk.replace(/\s+/g, " ").slice(0, 60) }));
  const s = t.notes;

  return (
    <div className="min-h-screen">
      <WorkspaceHeader current={workspace.slug} />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-[clamp(18px,4vw,56px)] py-10">
        <WorkspaceTabs wsSlug={workspace.slug} workspaceId={workspace.id} current="notes" />
        <div className="flex flex-col gap-2">
          <BackLink href={`/w/${ws}/notes`} className="mb-2">{s.back}</BackLink>
          <h1 className="page-title"><span className="font-mono">N-{note.number}</span> · {s.status[note.status]}</h1>
          <p className="max-w-prose text-fg-secondary">{s.editorLede}</p>
        </div>
        <NotePublish noteId={note.id} number={note.number} published={note.status === "published"} />
        <NoteEditor noteId={note.id} workspaceId={workspace.id} initial={initial} parents={parents} />
        <div className="border-t border-line pt-6">
          <ConfirmDelete action={deleteNote} fields={{ id: note.id, ws }} label={s.remove} confirm={s.removeConfirm} />
        </div>
      </main>
    </div>
  );
}
