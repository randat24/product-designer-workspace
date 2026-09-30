"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";

const statusSchema = z.enum(["draft", "review", "published"]);

/** Creates a draft case for a project; the site address follows the project slug. */
export async function createCaseStudy(formData: FormData) {
  const projectId = z.string().uuid().parse(formData.get("projectId"));
  const supabase = await createClient();
  const { data: project, error } = await supabase.from("projects").select("slug").eq("id", projectId).single();
  if (error) throw error;

  // Slugs are unique across the whole site: slug, slug-2, slug-3…
  for (let attempt = 1; attempt <= 20; attempt++) {
    const slug = attempt === 1 ? project.slug : `${project.slug.slice(0, 55)}-${attempt}`;
    const { error: insertError } = await supabase.from("case_studies").insert({ project_id: projectId, slug });
    if (!insertError) break;
    if (insertError.code !== "23505") throw insertError;
    // One case per project: a duplicate project_id also raises 23505 — nothing to create then.
    const { count } = await supabase.from("case_studies").select("id", { count: "exact", head: true }).eq("project_id", projectId);
    if (count) break;
  }
  revalidatePath("/w", "layout");
}

export async function setCaseStatus(formData: FormData) {
  const caseId = z.string().uuid().parse(formData.get("caseId"));
  const status = statusSchema.parse(formData.get("caseStatus"));
  const supabase = await createClient();
  const { error } = await supabase.from("case_studies").update({ status }).eq("id", caseId);
  if (error) throw error;
  revalidatePath("/w", "layout");
  // The public site re-reads cases on its own (revalidate = 60); refresh it now:
  // the "cases" data cache and the pages built from it.
  revalidateTag("cases");
  revalidatePath("/[locale]", "layout");
}
