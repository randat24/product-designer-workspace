"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import { deleteScreenshot, registerScreenshot } from "./actions";
import { ATTACHMENT_MAX_BYTES, ATTACHMENT_MIME } from "./schema";
import type { Screenshot } from "./queries";

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

/**
 * Screenshot gallery. The browser uploads straight to the private Storage bucket
 * (RLS checks the project from the path), then the server registers the attachment.
 */
export function Screenshots({ projectId, entityId, items, canEdit, entityType = "competitor", title = t.competitors.sections.screenshots, emptyText = t.competitors.screenshotsEmpty }: {
  projectId: string; entityId: string; items: Screenshot[]; canEdit: boolean;
  entityType?: "competitor" | "screen"; title?: string; emptyText?: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [, startTransition] = useTransition();

  async function upload(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    setErrors([]);
    // Loaded on demand: the Supabase browser client is only needed for uploads.
    const { createBrowserSupabase } = await import("@/shared/lib/supabase/browser");
    const supabase = createBrowserSupabase();
    const failed: string[] = [];
    for (const file of files) {
      if (!(ATTACHMENT_MIME as readonly string[]).includes(file.type) || file.size > ATTACHMENT_MAX_BYTES) {
        failed.push(file.name);
        continue;
      }
      const path = `${projectId}/${entityType}/${crypto.randomUUID()}.${EXT[file.type]}`;
      const { error } = await supabase.storage.from("attachments").upload(path, file, { contentType: file.type });
      const res = error ? { ok: false } : await registerScreenshot({
        entityType, projectId, entityId, storagePath: path, fileName: file.name, mimeType: file.type as (typeof ATTACHMENT_MIME)[number], sizeBytes: file.size,
      });
      if (!res.ok) failed.push(file.name);
    }
    setErrors(failed.map(t.competitors.uploadFailed));
    setBusy(false);
    startTransition(() => router.refresh());
  }

  async function remove(id: string) {
    await deleteScreenshot(id);
    startTransition(() => router.refresh());
  }

  return (
    <section aria-labelledby="screenshots-h" className="flex flex-col gap-3"
      onDragOver={(e) => { if (canEdit) { e.preventDefault(); setDragging(true); } }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { if (!canEdit) return; e.preventDefault(); setDragging(false); upload([...e.dataTransfer.files]); }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="screenshots-h" className="text-heading font-semibold">{title}</h2>
        {canEdit && (
          <>
            <input ref={input} type="file" accept={ATTACHMENT_MIME.join(",")} multiple hidden
              onChange={(e) => { upload([...(e.target.files ?? [])]); e.target.value = ""; }} />
            <button type="button" disabled={busy} onClick={() => input.current?.click()}
              className="rounded-control border-[1.5px] border-fg px-3.5 py-1.5 text-sm font-semibold hover:bg-subtle disabled:opacity-50">
              {busy ? t.competitors.uploading : t.competitors.upload}
            </button>
          </>
        )}
      </div>
      <div className={cn("rounded-panel border border-line bg-surface p-5", dragging && "border-[1.5px] border-dashed border-fg")}>
        {items.length === 0 ? (
          <p className="text-center text-fg-secondary">
            {emptyText} {canEdit && t.competitors.uploadHint}
          </p>
        ) : (
          <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
            {items.map((s) => (
              <li key={s.id} className="group relative overflow-hidden rounded-control border border-line bg-subtle">
                {s.url && (
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed Storage URL */}
                    <img src={s.url} alt={s.caption ?? s.fileName} className="aspect-[9/16] w-full object-cover object-top" loading="lazy" />
                  </a>
                )}
                {canEdit && (
                  <button type="button" onClick={() => remove(s.id)} aria-label={`${t.competitors.removeScreenshot}: ${s.fileName}`}
                    className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-control bg-surface/90 text-fg-secondary [@media(hover:hover)]:opacity-0 shadow group-hover:opacity-100 focus:opacity-100 hover:text-danger">
                    <span aria-hidden>×</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {canEdit && items.length > 0 && <p className="mt-3 text-caption text-fg-secondary">{t.competitors.uploadHint}</p>}
        {errors.map((e) => <p key={e} role="alert" className="mt-2 text-meta text-danger">{e}</p>)}
      </div>
    </section>
  );
}
