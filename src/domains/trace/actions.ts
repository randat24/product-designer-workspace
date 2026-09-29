"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { isEntityType } from "@/shared/entities";

const linkSchema = z.object({
  projectId: z.uuid(),
  sourceType: z.string().refine(isEntityType),
  sourceId: z.uuid(),
  targetType: z.string().refine(isEntityType),
  targetId: z.uuid(),
  relation: z.string().regex(/^[a-z_]+$/),
});

/** Create a trace link. The database checks the rule and that both ends are in the project. */
export async function linkEntities(input: z.input<typeof linkSchema>) {
  const parsed = linkSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  const l = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("trace_links").insert({
    project_id: l.projectId, source_type: l.sourceType, source_id: l.sourceId,
    target_type: l.targetType, target_id: l.targetId, relation: l.relation,
  });
  // 23505: already linked — treat as success.
  if (error && error.code !== "23505") return { ok: false as const };
  revalidatePath("/w/[ws]/p/[project]", "layout");
  return { ok: true as const };
}

export async function unlinkEntities(linkId: string) {
  if (!z.uuid().safeParse(linkId).success) return { ok: false as const };
  const supabase = await createClient();
  const { error } = await supabase.from("trace_links").delete().eq("id", linkId);
  if (error) return { ok: false as const };
  revalidatePath("/w/[ws]/p/[project]", "layout");
  return { ok: true as const };
}
