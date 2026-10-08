// Portfolio analytics events (GA4). The single list of names and parameters; see docs/ANALYTICS.md.
// Parameters never carry personal data: no emails, names, user ids or query strings.

export type AnalyticsEvent =
  | "contact_menu_open"
  | "contact_email_click"
  | "telegram_click"
  | "linkedin_click"
  | "dribbble_click"
  | "resume_download"
  | "case_open"
  | "case_next"
  | "case_live_open"
  | "case_prototype_open"
  | "case_gallery_open"
  | "case_figma_load"
  | "case_figma_open"
  | "certificate_open"
  | "language_switch"
  | "theme_switch"
  | "portfolio_cta_click"
  // Project request funnel: step numbers and coarse buckets only, never the answers.
  | "project_request_cta"
  | "project_request_started"
  | "project_request_step_completed"
  | "project_request_reviewed"
  | "project_request_submitted"
  | "project_request_failed"
  | "project_brief_downloaded";

/** Where on the page the interaction happened. */
export type AnalyticsLocation = "header" | "hero" | "contact" | "footer" | "about" | "case" | "cases" | "home" | "not_found" | "confirmation";

export type AnalyticsParams = Partial<{
  location: AnalyticsLocation;
  case_slug: string;
  next_slug: string;
  from: string;
  to: string;
  cta: string;
  theme: "light" | "dark";
  provider: string;
  page: number;
  step: number;
  step_id: string;
  project_types_count: number;
  has_existing: boolean;
  budget_band: string;
  reason: string;
}>;
