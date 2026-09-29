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
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
