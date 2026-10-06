import "server-only";
import { z } from "zod";
import { createClient } from "./server";

/** The `requestId` an ActionForm sends (src/shared/ui/action-form.tsx), if any. */
export const requestIdOf = (formData: FormData) => z.uuid().safeParse(formData.get("requestId")).data;

/**
 * Creates a row whose id is the form's request id. When the person presses again because the first answer
 * never arrived, the row from that first press is returned instead of a second one (docs/HANDOFF_TRIAGE.md, F03).
 * `null` means nothing was created: refused by row-level security or a failed insert.
 */
export async function insertOnce(
  table: "screens" | "design_decisions" | "user_flows",
  row: Record<string, unknown>,
  requestId: string | undefined,
): Promise<{ id: string; code: string } | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- three tables share id + code; callers build the row
  const from = () => supabase.from(table) as any;
  const { data, error } = await from().insert({ ...row, ...(requestId && { id: requestId }) }).select("id, code").single();
  if (!error) return data;
  if (!requestId || error.code !== "23505") return null;
  const { data: existing } = await from().select("id, code").eq("id", requestId).maybeSingle();
  return existing ?? null;
}
