import "server-only";
import { cache } from "react";
import { createClient } from "@/shared/lib/supabase/server";
import { briefSchema, EMPTY_BRIEF, type Brief } from "./schema";

/** The project's brief, normalised through the schema (jsonb lists are untyped in the DB types). */
export const getBrief = cache(async (projectId: string): Promise<Brief & { updatedAt: string | null }> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_briefs")
    .select(
      "product_description, existing_product, business, business_requirements, target_audience, problem, goals, kpis, constraints, technical_constraints, timeline_start, timeline_end, team, links, updated_at",
    )
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ...EMPTY_BRIEF, updatedAt: null };

  const { updated_at, ...fields } = data;
  // Stored data passed the same schema on write. Throw rather than show an empty
  // brief that autosave would then write back over the real one.
  return { ...briefSchema.parse(fields), updatedAt: updated_at };
});
