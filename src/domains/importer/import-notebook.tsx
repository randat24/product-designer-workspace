"use client";

import { useActionState, useRef } from "react";
import { t } from "@/shared/i18n/ru";
import { importNotebook, type ImportState } from "./actions";

/** Upload a notebook export (JSON) into the current project. */
export function ImportNotebook({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importNotebook, undefined);
  const form = useRef<HTMLFormElement>(null);
  return (
    <section aria-labelledby="import-h" className="flex flex-col gap-3 rounded-[14px] border-[1.5px] border-dashed border-line p-5">
      <h2 id="import-h" className="text-heading font-semibold">{t.research.import.title}</h2>
      <p className="max-w-[62ch] text-[13px] text-fg-secondary">{t.research.import.lede}</p>
      <form ref={form} action={action}>
        <input type="hidden" name="projectId" value={projectId} />
        <label className="inline-flex cursor-pointer items-center rounded-[9px] border-[1.5px] border-fg px-3.5 py-1.5 text-sm font-semibold hover:bg-subtle has-[:disabled]:opacity-50">
          {pending ? t.research.import.importing : t.research.import.button}
          <input type="file" name="file" accept="application/json,.json" className="sr-only" disabled={pending}
            onChange={() => form.current?.requestSubmit()} />
        </label>
      </form>
      <p role="status" aria-live="polite" className={state?.error ? "text-[13px] font-semibold text-danger" : "text-[13px] font-semibold text-success"}>
        {state?.error ?? state?.ok ?? ""}
      </p>
    </section>
  );
}
