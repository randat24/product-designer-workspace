// Shape of the «project_brief» document content, as written by project_request_snapshot() in the database.

type Link = { kind: string; url: string };

export type BriefSnapshot = {
  code: string;
  submitted_at: string;
  locale: "uk" | "en";
  form_version: number;
  client: {
    name: string; email: string; company: string | null; role: string | null; phone: string | null;
    telegram: string | null; website: string | null; preferred_channel: string; preferred_channel_note: string | null;
  };
  project: { types: string[]; type_other: string | null; name: string | null; name_unknown: boolean };
  existing: {
    has: boolean; url: string | null; description: string | null; dislikes: string | null; works_well: string | null;
    must_change: string | null; links: Link[];
  };
  about: { summary: string; what_it_does: string | null; problem: string | null; why_now: string | null; goals: string[]; goal_other: string | null };
  audience: {
    audience: string | null; primary_users: string | null; geography: string | null; market: string | null;
    demographics: string | null; pain_points: string | null;
  };
  competitors: { name: string; url: string | null; likes: string | null; dislikes: string | null; why: string | null }[];
  references: { url: string; note: string | null }[];
  scope: { items: string[]; needs_advice: boolean };
  materials: { items: string[]; links: Link[] };
  budget: { range: string | null; min: number | null; max: number | null; currency: string | null; note: string | null };
  timeline: { start: string | null; has_deadline: boolean; deadline_date: string | null; deadline_reason: string | null };
  additional_info: string | null;
  consent: { at: string; privacy_policy_version: string };
};

export type BriefDocument = {
  code: string;
  version: number;
  generated_at: string;
  template_version: number;
  content: BriefSnapshot;
};
