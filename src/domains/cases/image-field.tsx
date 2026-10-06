"use client";

import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { t } from "@/shared/i18n/uk";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/field";
import { CASE_MEDIA_MAX_BYTES, CASE_MEDIA_MIME, type CaseImage } from "./schema";

const e = t.caseEditor;
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

/** Size of a picture before it is uploaded: the site reserves its space, so the page does not jump. */
async function imageSize(file: File) {
  const bitmap = await createImageBitmap(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

/**
 * One picture of the case. The browser uploads straight to the public `case-media` bucket
 * (row-level security checks the project from the path); the editor keeps its address, size and description.
 */
export function ImageField({ projectId, id, value, readOnly, onChange }: {
  projectId: string; id: string; value: CaseImage | null; readOnly: boolean; onChange: (v: CaseImage | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setFailed(null);
    if (!(CASE_MEDIA_MIME as readonly string[]).includes(file.type) || file.size > CASE_MEDIA_MAX_BYTES) {
      setFailed(e.image.failed(file.name));
      return;
    }
    setBusy(true);
    try {
      const { width, height } = await imageSize(file);
      const { createBrowserSupabase } = await import("@/shared/lib/supabase/browser");
      const storage = createBrowserSupabase().storage.from("case-media");
      const path = `${projectId}/case/${crypto.randomUUID()}.${EXT[file.type]}`;
      const { error } = await storage.upload(path, file, { contentType: file.type, cacheControl: "31536000" });
      if (error) throw error;
      onChange({ src: storage.getPublicUrl(path).data.publicUrl, alt: value?.alt ?? "", width, height });
    } catch {
      setFailed(e.image.failed(file.name));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {value ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- public Storage or built-in case image */}
          <img src={value.src} alt="" width={value.width} height={value.height} loading="lazy"
            className="h-auto w-full rounded-control border border-line bg-subtle sm:w-56" />
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor={`${id}-alt`} className="text-meta font-semibold text-fg-secondary">{e.image.alt}</label>
            <Input id={`${id}-alt`} value={value.alt} readOnly={readOnly} maxLength={300} placeholder={e.image.altHint}
              onChange={(ev) => onChange({ ...value, alt: ev.target.value })} />
            {!readOnly && (
              <div className="mt-1 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => input.current?.click()}>
                  {busy ? e.image.uploading : e.image.replace}
                </Button>
                <Button variant="danger" size="sm" disabled={busy} onClick={() => onChange(null)}>{e.image.remove}</Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        !readOnly && (
          <Button variant="secondary" size="sm" className="self-start" disabled={busy} onClick={() => input.current?.click()}>
            <ImagePlus aria-hidden className="size-4" />{busy ? e.image.uploading : e.image.add}
          </Button>
        )
      )}
      {!readOnly && (
        <>
          <input ref={input} id={id} type="file" accept={CASE_MEDIA_MIME.join(",")} hidden
            onChange={(ev) => { upload(ev.target.files?.[0]); ev.target.value = ""; }} />
          <p className="text-caption text-fg-secondary">{e.image.hint}</p>
        </>
      )}
      {failed && <p role="alert" className="text-meta text-danger">{failed}</p>}
    </div>
  );
}
