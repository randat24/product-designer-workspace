// Hand-written for Phase 1 to match supabase/migrations.
// Regenerate with `npm run db:types` once the local stack is running;
// the generated file replaces this one 1:1.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Row<T> = T;
type Insert<T, Required extends keyof T> = Partial<T> & Pick<T, Required>;

type ProfileRow = {
  id: string; full_name: string | null; avatar_url: string | null; locale: string;
  created_at: string; updated_at: string;
};
type WorkspaceRow = {
  id: string; name: string; slug: string; owner_id: string; is_personal: boolean;
  created_at: string; updated_at: string;
};
type WorkspaceMemberRow = {
  workspace_id: string; user_id: string; role: Database["public"]["Enums"]["workspace_role"];
  invited_by: string | null; joined_at: string;
};
type ProjectRow = {
  id: string; workspace_id: string; name: string; slug: string; description: string | null;
  status: Database["public"]["Enums"]["project_status"]; platforms: string[]; current_stage: string | null;
  created_by: string | null; updated_by: string | null; created_at: string; updated_at: string;
  archived_at: string | null;
};
type EntityTypeRow = {
  type: string; table_name: string; prefix: string; code_sep: string; code_pad: number; domain: string; phase: number;
};
type ProjectBriefRow = {
  id: string; workspace_id: string; project_id: string;
  product_description: string | null; business: string | null; target_audience: string | null; problem: string | null;
  goals: Json; kpis: Json; constraints: string | null;
  timeline_start: string | null; timeline_end: string | null;
  team: Json; links: Json;
  existing_product: string | null; business_requirements: string | null; technical_constraints: string | null;
  created_by: string | null; updated_by: string | null; created_at: string; updated_at: string;
};
type CompetitorRow = {
  id: string; workspace_id: string; project_id: string; code: string;
  name: string; url: string | null; kind: Database["public"]["Enums"]["competitor_kind"]; is_own_product: boolean;
  positioning: string | null; target_audience: string | null; pricing: string | null;
  onboarding_notes: string | null; navigation_notes: string | null; ux_patterns: string | null; ui_patterns: string | null;
  strengths: string | null; weaknesses: string | null; reviews_summary: string | null;
  opportunities: string | null; borrow: string | null; position: number;
  created_by: string | null; updated_by: string | null; created_at: string; updated_at: string; archived_at: string | null;
};
type ComparisonFeatureRow = {
  id: string; workspace_id: string; project_id: string; name: string; group_name: string | null; position: number;
  created_by: string | null; updated_by: string | null; created_at: string; updated_at: string;
};
type FeatureValueRow = {
  competitor_id: string; comparison_feature_id: string; workspace_id: string; project_id: string;
  value: Database["public"]["Enums"]["feature_value"]; note: string | null; updated_by: string | null; updated_at: string;
};
type AttachmentRow = {
  id: string; workspace_id: string; project_id: string; entity_type: string; entity_id: string;
  storage_path: string; file_name: string; mime_type: string; size_bytes: number; caption: string | null;
  position: number; created_by: string | null; created_at: string;
};
type Base = { id: string; workspace_id: string; project_id: string; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string };
type ResearchPlanRow = Base & {
  code: string; title: string; goal: string | null; questions: Json; hypotheses_text: string | null; audience: string | null;
  method: Database["public"]["Enums"]["research_method"]; participants_target: number | null; success_criteria: string | null;
  status: Database["public"]["Enums"]["research_status"]; archived_at: string | null;
};
type InterviewGuideRow = Base & { research_plan_id: string | null; title: string; intro: string | null; outro: string | null };
type InterviewQuestionRow = Base & {
  guide_id: string; section: Database["public"]["Enums"]["guide_section"]; position: number; text: string; probes: string[]; is_key: boolean;
};
type ParticipantRow = Base & {
  code: string; display_name: string | null; role: string | null; segment_label: string | null; age_range: string | null;
  context: string | null; contact: string | null; consent_at: string | null; tags: string[]; notes: string | null; archived_at: string | null;
};
type InterviewRow = Base & {
  code: string; participant_id: string; guide_id: string | null; research_plan_id: string | null; conducted_at: string | null;
  duration_min: number | null; interviewer_id: string | null; mode: Database["public"]["Enums"]["interview_mode"];
  status: Database["public"]["Enums"]["interview_status"]; notes: string | null;
};
type InterviewAnswerRow = Base & { code: string; interview_id: string; question_id: string | null; body_text: string; position: number };
type E = Database["public"]["Enums"];
type PatternRow = Base & { code: string; title: string; description: string | null; color: string | null; position: number };
type QuoteRow = Base & {
  code: string; interview_id: string; answer_id: string | null; participant_id: string | null; text: string;
  start_offset: number | null; end_offset: number | null; pattern_id: string | null; position: number;
};
type ObservationRow = Base & {
  code: string; interview_id: string | null; participant_id: string | null; kind: E["observation_kind"]; body_text: string;
  pattern_id: string | null; position: number;
};
type InsightRow = Base & {
  code: string; title: string; statement: string | null; confidence: E["confidence_level"]; status: E["insight_status"];
  origin: E["trace_origin"]; archived_at: string | null;
};
type PainPointRow = Base & {
  code: string; title: string; description: string | null; severity: E["severity_level"]; segment_label: string | null; archived_at: string | null;
};
type OpportunityRow = Base & {
  code: string; title: string; description: string | null; hmw: string | null; impact: E["confidence_level"];
  effort: E["confidence_level"]; status: E["opportunity_status"]; archived_at: string | null;
};
type ScreenRow = Base & {
  code: string; name: string; purpose: string | null; user_goal: string | null; entry_points: string | null;
  primary_action: string | null; secondary_actions: string | null; content_hierarchy: Json; permissions: string | null;
  analytics_events: Json; api_data_requirements: string | null; status: E["screen_status"]; figma_url: string | null;
  figma_node_id: string | null; thumbnail_path: string | null; archived_at: string | null;
};
type UserFlowRow = Base & {
  code: string; name: string; description: string | null; status: E["flow_status"]; viewport: Json | null; archived_at: string | null;
};
type FlowNodeRow = Base & {
  flow_id: string; kind: E["flow_node_kind"]; label: string; screen_id: string | null; pos_x: number; pos_y: number; data: Json;
};
type FlowEdgeRow = Base & {
  flow_id: string; source_node_id: string; target_node_id: string; label: string | null; branch: E["flow_edge_branch"]; condition: string | null;
};
type FlowEdgeCaseRow = Base & {
  flow_id: string; kind: E["edge_case_kind"]; description: string | null; status: E["edge_case_status"]; node_id: string | null; position: number;
};
type Ins<T, R extends keyof T> = Partial<Omit<T, "id" | "workspace_id" | "code">> & Pick<T, R>;
type Upd<T> = Partial<Omit<T, "id" | "workspace_id" | "project_id" | "code">>;
type ProjectCounterRow = { project_id: string; entity_type: string; last_value: number };
type TraceRelationRow = { relation: string; label_forward: string; label_backward: string };
type TraceRuleRow = { source_type: string; target_type: string; relation: string };
type TraceLinkRow = {
  id: string; workspace_id: string; project_id: string; source_type: string; source_id: string;
  target_type: string; target_id: string; relation: string; note: string | null;
  origin: Database["public"]["Enums"]["trace_origin"]; created_by: string | null; created_at: string;
};
type ActivityRow = {
  id: number; workspace_id: string; project_id: string | null; actor_id: string | null; entity_type: string;
  entity_id: string; action: string; changed_keys: string[] | null; created_at: string;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      profiles: { Row: Row<ProfileRow>; Insert: Insert<ProfileRow, "id">; Update: Partial<ProfileRow>; Relationships: [] };
      workspaces: { Row: WorkspaceRow; Insert: Insert<WorkspaceRow, "name" | "slug" | "owner_id">; Update: Partial<WorkspaceRow>; Relationships: [] };
      workspace_members: {
        Row: WorkspaceMemberRow; Insert: Insert<WorkspaceMemberRow, "workspace_id" | "user_id">;
        Update: Partial<WorkspaceMemberRow>;
        Relationships: [
          { foreignKeyName: "workspace_members_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] },
        ];
      };
      projects: {
        Row: ProjectRow; Insert: Insert<ProjectRow, "workspace_id" | "name" | "slug">; Update: Partial<ProjectRow>;
        Relationships: [
          { foreignKeyName: "projects_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] },
        ];
      };
      project_briefs: {
        Row: ProjectBriefRow; Insert: never; Update: Partial<Omit<ProjectBriefRow, "id" | "workspace_id" | "project_id">>;
        Relationships: [
          { foreignKeyName: "project_briefs_project_id_fkey"; columns: ["project_id"]; isOneToOne: true; referencedRelation: "projects"; referencedColumns: ["id"] },
        ];
      };
      competitors: {
        Row: CompetitorRow; Insert: Insert<CompetitorRow, "project_id" | "name">;
        Update: Partial<Omit<CompetitorRow, "id" | "workspace_id" | "project_id" | "code">>; Relationships: [];
      };
      comparison_features: {
        Row: ComparisonFeatureRow; Insert: Insert<ComparisonFeatureRow, "project_id" | "name">;
        Update: Partial<Omit<ComparisonFeatureRow, "id" | "workspace_id" | "project_id">>; Relationships: [];
      };
      competitor_feature_values: {
        Row: FeatureValueRow; Insert: Insert<FeatureValueRow, "competitor_id" | "comparison_feature_id">;
        Update: Partial<Pick<FeatureValueRow, "value" | "note">>; Relationships: [];
      };
      attachments: {
        Row: AttachmentRow;
        Insert: Insert<AttachmentRow, "project_id" | "entity_type" | "entity_id" | "storage_path" | "file_name" | "mime_type" | "size_bytes">;
        Update: Partial<Pick<AttachmentRow, "caption" | "position">>; Relationships: [];
      };
      research_plans: { Row: ResearchPlanRow; Insert: Ins<ResearchPlanRow, "project_id" | "title">; Update: Upd<ResearchPlanRow>; Relationships: [] };
      interview_guides: { Row: InterviewGuideRow; Insert: Ins<InterviewGuideRow, "project_id" | "title">; Update: Upd<InterviewGuideRow>; Relationships: [] };
      interview_questions: {
        Row: InterviewQuestionRow; Insert: Ins<InterviewQuestionRow, "guide_id" | "project_id" | "text">; Update: Upd<InterviewQuestionRow>;
        Relationships: [];
      };
      participants: { Row: ParticipantRow; Insert: Ins<ParticipantRow, "project_id">; Update: Upd<ParticipantRow>; Relationships: [] };
      interviews: {
        Row: InterviewRow; Insert: Ins<InterviewRow, "project_id" | "participant_id">; Update: Upd<InterviewRow>;
        Relationships: [
          { foreignKeyName: "interviews_participant_id_fkey"; columns: ["participant_id"]; isOneToOne: false; referencedRelation: "participants"; referencedColumns: ["id"] },
          { foreignKeyName: "interviews_guide_id_fkey"; columns: ["guide_id"]; isOneToOne: false; referencedRelation: "interview_guides"; referencedColumns: ["id"] },
        ];
      };
      interview_answers: {
        Row: InterviewAnswerRow; Insert: Ins<InterviewAnswerRow, "project_id" | "interview_id">; Update: Upd<InterviewAnswerRow>;
        Relationships: [];
      };
      patterns: { Row: PatternRow; Insert: Ins<PatternRow, "project_id" | "title">; Update: Upd<PatternRow>; Relationships: [] };
      quotes: {
        Row: QuoteRow; Insert: Ins<QuoteRow, "project_id" | "interview_id" | "text">; Update: Upd<QuoteRow>;
        Relationships: [{ foreignKeyName: "quotes_participant_id_fkey"; columns: ["participant_id"]; isOneToOne: false; referencedRelation: "participants"; referencedColumns: ["id"] }, { foreignKeyName: "quotes_interview_id_fkey"; columns: ["interview_id"]; isOneToOne: false; referencedRelation: "interviews"; referencedColumns: ["id"] }];
      };
      observations: {
        Row: ObservationRow; Insert: Ins<ObservationRow, "project_id" | "body_text">; Update: Upd<ObservationRow>;
        Relationships: [{ foreignKeyName: "observations_participant_id_fkey"; columns: ["participant_id"]; isOneToOne: false; referencedRelation: "participants"; referencedColumns: ["id"] }, { foreignKeyName: "observations_interview_id_fkey"; columns: ["interview_id"]; isOneToOne: false; referencedRelation: "interviews"; referencedColumns: ["id"] }];
      };
      insights: { Row: InsightRow; Insert: Ins<InsightRow, "project_id" | "title">; Update: Upd<InsightRow>; Relationships: [] };
      pain_points: { Row: PainPointRow; Insert: Ins<PainPointRow, "project_id" | "title">; Update: Upd<PainPointRow>; Relationships: [] };
      opportunities: { Row: OpportunityRow; Insert: Ins<OpportunityRow, "project_id" | "title">; Update: Upd<OpportunityRow>; Relationships: [] };
      screens: { Row: ScreenRow; Insert: Ins<ScreenRow, "project_id" | "name">; Update: Upd<ScreenRow>; Relationships: [] };
      user_flows: { Row: UserFlowRow; Insert: Ins<UserFlowRow, "project_id" | "name">; Update: Upd<UserFlowRow>; Relationships: [] };
      flow_nodes: {
        Row: FlowNodeRow; Insert: Ins<FlowNodeRow, "project_id" | "flow_id" | "kind">; Update: Upd<FlowNodeRow>;
        Relationships: [{ foreignKeyName: "flow_nodes_screen_id_fkey"; columns: ["screen_id"]; isOneToOne: false; referencedRelation: "screens"; referencedColumns: ["id"] }];
      };
      flow_edges: { Row: FlowEdgeRow; Insert: Ins<FlowEdgeRow, "project_id" | "flow_id" | "source_node_id" | "target_node_id">; Update: Upd<FlowEdgeRow>; Relationships: [] };
      flow_edge_cases: { Row: FlowEdgeCaseRow; Insert: Ins<FlowEdgeCaseRow, "project_id" | "flow_id" | "kind">; Update: Upd<FlowEdgeCaseRow>; Relationships: [] };
      entity_types: { Row: EntityTypeRow; Insert: EntityTypeRow; Update: Partial<EntityTypeRow>; Relationships: [] };
      project_counters: { Row: ProjectCounterRow; Insert: Insert<ProjectCounterRow, "project_id" | "entity_type">; Update: Partial<ProjectCounterRow>; Relationships: [] };
      trace_relations: { Row: TraceRelationRow; Insert: TraceRelationRow; Update: Partial<TraceRelationRow>; Relationships: [] };
      trace_relation_rules: { Row: TraceRuleRow; Insert: TraceRuleRow; Update: Partial<TraceRuleRow>; Relationships: [] };
      trace_links: {
        Row: TraceLinkRow;
        Insert: Insert<TraceLinkRow, "project_id" | "source_type" | "source_id" | "target_type" | "target_id" | "relation">;
        Update: Partial<TraceLinkRow>; Relationships: [];
      };
      activity_log: { Row: ActivityRow; Insert: never; Update: never; Relationships: [] };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_workspace_member: {
        Args: { ws: string; min_role?: Database["public"]["Enums"]["workspace_role"] };
        Returns: boolean;
      };
      create_demo_project: { Args: { p_workspace: string }; Returns: string };
      synthesis_stats: {
        Args: { p_project: string };
        Returns: { entity_type: string; entity_id: string; source_count: number; participant_count: number }[];
      };
      flow_stats: {
        Args: { p_project: string };
        Returns: { flow_id: string; node_count: number; screen_count: number; missing_cases: number }[];
      };
      upstream_participants: { Args: { p_type: string; p_id: string }; Returns: { participant_id: string }[] };
      next_code: { Args: { p_project: string; p_entity: string }; Returns: string };
      trace_graph: {
        Args: { p_type: string; p_id: string; p_direction?: string; p_max_depth?: number };
        Returns: {
          link_id: string; direction: string; depth: number; relation: string;
          source_type: string; source_id: string; target_type: string; target_id: string;
          origin: Database["public"]["Enums"]["trace_origin"];
        }[];
      };
    };
    Enums: {
      workspace_role: "owner" | "editor" | "viewer";
      project_status: "active" | "paused" | "done" | "archived";
      trace_origin: "manual" | "ai_accepted" | "system";
      competitor_kind: "direct" | "indirect" | "substitute";
      feature_value: "yes" | "partial" | "no" | "unknown";
      research_method: "interview" | "usability" | "survey" | "diary" | "other";
      research_status: "draft" | "active" | "done";
      guide_section: "intro" | "context" | "current_behavior" | "problems" | "motivation" | "experience" | "expectations" | "closing";
      interview_mode: "in_person" | "remote" | "phone";
      interview_status: "planned" | "in_progress" | "done" | "synthesized";
      observation_kind: "pain" | "need" | "behavior" | "emotion" | "fact" | "workaround";
      confidence_level: "low" | "medium" | "high";
      insight_status: "draft" | "validated" | "rejected";
      severity_level: "critical" | "high" | "medium" | "low";
      opportunity_status: "open" | "in_design" | "addressed" | "dropped";
      flow_status: "draft" | "review" | "final";
      flow_node_kind: "start" | "screen" | "action" | "decision" | "system" | "error" | "success" | "end";
      flow_edge_branch: "default" | "yes" | "no" | "error" | "back";
      edge_case_kind: "payment_failed" | "no_internet" | "unavailable" | "session_expired" | "empty" | "permission_denied" | "timeout" | "validation" | "custom";
      edge_case_status: "missing" | "covered" | "not_applicable";
      screen_status: "sketch" | "wireframe" | "prototype" | "tested" | "ready";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
