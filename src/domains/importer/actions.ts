"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import type { Database } from "@/types/database";
import { t } from "@/shared/i18n/ru";

// Shape of the "Рабочая тетрадь дизайнера" export (v1). Unknown keys are ignored.
const str = z.string().catch("").transform((s) => s.trim());
const notebookSchema = z.object({
  brief: z.object({ name: str, product: str, goal: str, audience: str, metric: str, deadline: str, notes: str }).partial().catch({}),
  competitors: z.array(z.object({ name: str, kind: str, url: str, strengths: str, weaknesses: str, borrow: str }).partial()).catch([]),
  interview: z.object({
    intro: str,
    outro: str,
    questions: z.array(z.object({ id: z.string(), text: str })).catch([]),
  }).partial().catch({}),
  respondents: z.array(z.object({ id: z.string(), name: str, role: str }).partial({ name: true, role: true })).catch([]),
  answers: z.record(z.string(), z.record(z.string(), z.string().catch(""))).catch({}),
  insights: z.array(z.unknown()).catch([]),
  flow: z.array(z.unknown()).catch([]),
  screens: z.array(z.unknown()).catch([]),
});

export type ImportState = { ok?: string; error?: string } | undefined;

/**
 * Imports a notebook JSON into the current project: brief (fills empty fields only),
 * competitors, one interview guide, participants with done interviews and their answers.
 * Insights, flows and screens wait for their phases and are reported as skipped.
 */
export async function importNotebook(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const projectId = z.uuid().safeParse(formData.get("projectId"));
  const file = formData.get("file");
  if (!projectId.success || !(file instanceof File) || file.size === 0 || file.size > 2_000_000) return { error: t.research.import.failed };

  let parsed: z.output<typeof notebookSchema>;
  try {
    const raw = JSON.parse(await file.text());
    if (!raw || typeof raw !== "object" || !("brief" in raw)) return { error: t.research.import.failed };
    parsed = notebookSchema.parse(raw);
  } catch {
    return { error: t.research.import.failed };
  }

  const pid = projectId.data;
  const supabase = await createClient();
  const done: string[] = [];

  // Brief: only fill what is still empty, never overwrite.
  const { data: brief } = await supabase.from("project_briefs")
    .select("product_description, target_audience, goals, kpis, constraints").eq("project_id", pid).maybeSingle();
  if (brief) {
    const b = parsed.brief;
    const patch: Database["public"]["Tables"]["project_briefs"]["Update"] = {};
    if (!brief.product_description && b.product) patch.product_description = b.product;
    if (!brief.target_audience && b.audience) patch.target_audience = b.audience;
    if (Array.isArray(brief.goals) && brief.goals.length === 0 && b.goal) patch.goals = [b.goal.slice(0, 300)];
    if (Array.isArray(brief.kpis) && brief.kpis.length === 0 && b.metric) patch.kpis = [{ name: b.metric.slice(0, 200), target: "", current: "" }];
    const notes = [b.notes, b.deadline && `Дедлайн: ${b.deadline}`].filter(Boolean).join("\n");
    if (!brief.constraints && notes) patch.constraints = notes;
    if (Object.keys(patch).length) {
      const { error } = await supabase.from("project_briefs").update(patch).eq("project_id", pid);
      if (error) return { error: t.research.import.failed };
      done.push("бриф");
    }
  }

  // Competitors
  const competitors = parsed.competitors.filter((c) => c.name);
  if (competitors.length) {
    const kind = (k?: string) => (k === "Косвенный" ? "indirect" : "direct") as "direct" | "indirect";
    const { error } = await supabase.from("competitors").insert(competitors.map((c, i) => ({
      project_id: pid, name: c.name!.slice(0, 120), kind: kind(c.kind), url: c.url || null,
      strengths: c.strengths || null, weaknesses: c.weaknesses || null, borrow: c.borrow || null, position: 100 + i,
    })));
    if (error) return { error: t.research.import.failed };
    done.push(`конкуренты: ${competitors.length}`);
  }

  // Guide + questions
  const questions = (parsed.interview.questions ?? []).filter((q) => q.text);
  const questionIds = new Map<string, string>();
  let guideId: string | null = null;
  if (questions.length) {
    const { data: guide, error } = await supabase.from("interview_guides").insert({
      project_id: pid, title: "Импорт из тетради", intro: parsed.interview.intro || null, outro: parsed.interview.outro || null,
    }).select("id").single();
    if (error) return { error: t.research.import.failed };
    guideId = guide.id;
    const { data: rows, error: e2 } = await supabase.from("interview_questions").insert(questions.map((q, i) => ({
      project_id: pid, guide_id: guide.id, section: "current_behavior" as const, position: i + 1, text: q.text.slice(0, 1000),
    }))).select("id, position");
    if (e2 || !rows) return { error: t.research.import.failed };
    for (const r of rows) questionIds.set(questions[r.position - 1]!.id, r.id);
    done.push(`вопросы: ${questions.length}`);
  }

  // Respondents → participants + done interviews + answers
  let answerCount = 0;
  for (const r of parsed.respondents) {
    const generic = !r.name || /^(Юзер|Респондент|User)\s*\d+$/i.test(r.name);
    const { data: p, error } = await supabase.from("participants").insert({
      project_id: pid, display_name: generic ? null : r.name!.slice(0, 120), role: r.role?.slice(0, 200) || (generic ? r.name : null) || null,
    }).select("id").single();
    if (error) return { error: t.research.import.failed };
    const { data: iv, error: e2 } = await supabase.from("interviews")
      .insert({ project_id: pid, participant_id: p.id, guide_id: guideId, status: "done" }).select("id").single();
    if (e2) return { error: t.research.import.failed };
    const rows = Object.entries(parsed.answers[r.id] ?? {})
      .filter(([qid, text]) => questionIds.has(qid) && text.trim())
      .map(([qid, text], i) => ({ project_id: pid, interview_id: iv.id, question_id: questionIds.get(qid)!, body_text: text.slice(0, 20000), position: i + 1 }));
    if (rows.length) {
      const { error: e3 } = await supabase.from("interview_answers").insert(rows);
      if (e3) return { error: t.research.import.failed };
      answerCount += rows.length;
    }
  }
  if (parsed.respondents.length) done.push(`участники: ${parsed.respondents.length}`, `ответы: ${answerCount}`);

  const skipped = [
    parsed.insights.length && `инсайты (${parsed.insights.length})`,
    parsed.flow.length && `шаги сценария (${parsed.flow.length})`,
    parsed.screens.length && `экраны (${parsed.screens.length})`,
  ].filter(Boolean);

  revalidatePath("/w/[ws]/p/[project]", "layout");
  const summary = done.length ? done.join(", ") : "нечего переносить";
  return { ok: t.research.import.done(summary) + (skipped.length ? `. ${t.research.import.skipped(skipped.join(", "))}` : "") };
}
