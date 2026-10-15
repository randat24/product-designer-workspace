export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          changed_keys: string[] | null
          created_at: string
          entity_id: string
          entity_type: string
          id: number
          project_id: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          changed_keys?: string[] | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: never
          project_id?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          changed_keys?: string[] | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: never
          project_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          file_name: string
          id: string
          mime_type: string
          position: number
          project_id: string
          size_bytes: number
          storage_path: string
          workspace_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          file_name: string
          id?: string
          mime_type: string
          position?: number
          project_id: string
          size_bytes: number
          storage_path: string
          workspace_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string
          id?: string
          mime_type?: string
          position?: number
          project_id?: string
          size_bytes?: number
          storage_path?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_entity_type_fkey"
            columns: ["entity_type"]
            isOneToOne: false
            referencedRelation: "entity_types"
            referencedColumns: ["type"]
          },
          {
            foreignKeyName: "attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      case_studies: {
        Row: {
          content: Json
          content_updated_at: string | null
          created_at: string
          draft: Json
          id: string
          position: number
          project_id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["case_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          content?: Json
          content_updated_at?: string | null
          created_at?: string
          draft?: Json
          id?: string
          position?: number
          project_id: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          content?: Json
          content_updated_at?: string | null
          created_at?: string
          draft?: Json
          id?: string
          position?: number
          project_id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_studies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          auth_user_id: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          preferred_channel: string
          preferred_channel_note: string | null
          role: string | null
          telegram: string | null
          updated_at: string
          website: string | null
          workspace_id: string
        }
        Insert: {
          auth_user_id?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          preferred_channel?: string
          preferred_channel_note?: string | null
          role?: string | null
          telegram?: string | null
          updated_at?: string
          website?: string | null
          workspace_id: string
        }
        Update: {
          auth_user_id?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          preferred_channel?: string
          preferred_channel_note?: string | null
          role?: string | null
          telegram?: string | null
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_features: {
        Row: {
          created_at: string
          created_by: string | null
          group_name: string | null
          id: string
          kind: string
          name: string
          position: number
          project_id: string
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          group_name?: string | null
          id?: string
          kind?: string
          name: string
          position?: number
          project_id: string
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          group_name?: string | null
          id?: string
          kind?: string
          name?: string
          position?: number
          project_id?: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_features_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_features_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_features_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_features_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_feature_values: {
        Row: {
          comparison_feature_id: string
          competitor_id: string
          note: string | null
          note_done: boolean
          project_id: string
          updated_at: string
          updated_by: string | null
          value: Database["public"]["Enums"]["feature_value"]
          workspace_id: string
        }
        Insert: {
          comparison_feature_id: string
          competitor_id: string
          note?: string | null
          note_done?: boolean
          project_id: string
          updated_at?: string
          updated_by?: string | null
          value?: Database["public"]["Enums"]["feature_value"]
          workspace_id: string
        }
        Update: {
          comparison_feature_id?: string
          competitor_id?: string
          note?: string | null
          note_done?: boolean
          project_id?: string
          updated_at?: string
          updated_by?: string | null
          value?: Database["public"]["Enums"]["feature_value"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_feature_values_comparison_feature_id_fkey"
            columns: ["comparison_feature_id"]
            isOneToOne: false
            referencedRelation: "comparison_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_feature_values_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_feature_values_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_feature_values_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_feature_values_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          archived_at: string | null
          borrow: string | null
          code: string | null
          created_at: string
          created_by: string | null
          id: string
          is_own_product: boolean
          kind: Database["public"]["Enums"]["competitor_kind"]
          name: string
          navigation_notes: string | null
          onboarding_notes: string | null
          opportunities: string | null
          origin: string
          position: number
          positioning: string | null
          pricing: string | null
          project_id: string
          reviews_summary: string | null
          strengths: string | null
          target_audience: string | null
          ui_patterns: string | null
          updated_at: string
          updated_by: string | null
          url: string | null
          ux_patterns: string | null
          weaknesses: string | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          borrow?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_own_product?: boolean
          kind?: Database["public"]["Enums"]["competitor_kind"]
          name: string
          navigation_notes?: string | null
          onboarding_notes?: string | null
          opportunities?: string | null
          origin?: string
          position?: number
          positioning?: string | null
          pricing?: string | null
          project_id: string
          reviews_summary?: string | null
          strengths?: string | null
          target_audience?: string | null
          ui_patterns?: string | null
          updated_at?: string
          updated_by?: string | null
          url?: string | null
          ux_patterns?: string | null
          weaknesses?: string | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          borrow?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_own_product?: boolean
          kind?: Database["public"]["Enums"]["competitor_kind"]
          name?: string
          navigation_notes?: string | null
          onboarding_notes?: string | null
          opportunities?: string | null
          origin?: string
          position?: number
          positioning?: string | null
          pricing?: string | null
          project_id?: string
          reviews_summary?: string | null
          strengths?: string | null
          target_audience?: string | null
          ui_patterns?: string | null
          updated_at?: string
          updated_by?: string | null
          url?: string | null
          ux_patterns?: string | null
          weaknesses?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitors_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitors_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      design_decisions: {
        Row: {
          alternatives: Json
          archived_at: string | null
          author_id: string | null
          code: string | null
          context: string | null
          created_at: string
          created_by: string | null
          decided_at: string | null
          decision: string | null
          id: string
          project_id: string
          reason: string | null
          status: Database["public"]["Enums"]["decision_status"]
          superseded_by_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          alternatives?: Json
          archived_at?: string | null
          author_id?: string | null
          code?: string | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decision?: string | null
          id?: string
          project_id: string
          reason?: string | null
          status?: Database["public"]["Enums"]["decision_status"]
          superseded_by_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          alternatives?: Json
          archived_at?: string | null
          author_id?: string | null
          code?: string | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decision?: string | null
          id?: string
          project_id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["decision_status"]
          superseded_by_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_decisions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_decisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_decisions_superseded_by_id_fkey"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "design_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_decisions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_decisions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_types: {
        Row: {
          code_pad: number
          code_sep: string
          domain: string
          phase: number
          prefix: string
          table_name: string
          type: string
        }
        Insert: {
          code_pad?: number
          code_sep?: string
          domain: string
          phase: number
          prefix: string
          table_name: string
          type: string
        }
        Update: {
          code_pad?: number
          code_sep?: string
          domain?: string
          phase?: number
          prefix?: string
          table_name?: string
          type?: string
        }
        Relationships: []
      }
      flow_edge_cases: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          flow_id: string
          id: string
          kind: Database["public"]["Enums"]["edge_case_kind"]
          node_id: string | null
          position: number
          project_id: string
          status: Database["public"]["Enums"]["edge_case_status"]
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          flow_id: string
          id?: string
          kind: Database["public"]["Enums"]["edge_case_kind"]
          node_id?: string | null
          position?: number
          project_id: string
          status?: Database["public"]["Enums"]["edge_case_status"]
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          flow_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["edge_case_kind"]
          node_id?: string | null
          position?: number
          project_id?: string
          status?: Database["public"]["Enums"]["edge_case_status"]
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_edge_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_edge_cases_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "user_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_edge_cases_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "flow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_edge_cases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_edge_cases_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_edge_cases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_edges: {
        Row: {
          branch: Database["public"]["Enums"]["flow_edge_branch"]
          condition: string | null
          created_at: string
          created_by: string | null
          flow_id: string
          id: string
          label: string | null
          project_id: string
          source_node_id: string
          target_node_id: string
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          branch?: Database["public"]["Enums"]["flow_edge_branch"]
          condition?: string | null
          created_at?: string
          created_by?: string | null
          flow_id: string
          id?: string
          label?: string | null
          project_id: string
          source_node_id: string
          target_node_id: string
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          branch?: Database["public"]["Enums"]["flow_edge_branch"]
          condition?: string | null
          created_at?: string
          created_by?: string | null
          flow_id?: string
          id?: string
          label?: string | null
          project_id?: string
          source_node_id?: string
          target_node_id?: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_edges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_edges_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "user_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_edges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "flow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "flow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_edges_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_edges_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_nodes: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          flow_id: string
          id: string
          kind: Database["public"]["Enums"]["flow_node_kind"]
          label: string
          pos_x: number
          pos_y: number
          project_id: string
          screen_id: string | null
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          flow_id: string
          id?: string
          kind: Database["public"]["Enums"]["flow_node_kind"]
          label?: string
          pos_x?: number
          pos_y?: number
          project_id: string
          screen_id?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          flow_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["flow_node_kind"]
          label?: string
          pos_x?: number
          pos_y?: number
          project_id?: string
          screen_id?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_nodes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_nodes_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "user_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_nodes_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_nodes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_nodes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          archived_at: string | null
          code: string | null
          confidence: Database["public"]["Enums"]["confidence_level"]
          created_at: string
          created_by: string | null
          id: string
          origin: Database["public"]["Enums"]["trace_origin"]
          project_id: string
          statement: string | null
          status: Database["public"]["Enums"]["insight_status"]
          title: string
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          code?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          created_by?: string | null
          id?: string
          origin?: Database["public"]["Enums"]["trace_origin"]
          project_id: string
          statement?: string | null
          status?: Database["public"]["Enums"]["insight_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          code?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          created_by?: string | null
          id?: string
          origin?: Database["public"]["Enums"]["trace_origin"]
          project_id?: string
          statement?: string | null
          status?: Database["public"]["Enums"]["insight_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_settings: {
        Row: {
          enabled: boolean
          privacy_policy_version: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          enabled?: boolean
          privacy_policy_version?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          enabled?: boolean
          privacy_policy_version?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_answers: {
        Row: {
          body_text: string
          code: string | null
          created_at: string
          created_by: string | null
          id: string
          interview_id: string
          position: number
          project_id: string
          question_id: string | null
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          body_text?: string
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          interview_id: string
          position?: number
          project_id: string
          question_id?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          body_text?: string
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          interview_id?: string
          position?: number
          project_id?: string
          question_id?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_answers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_answers_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_answers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_answers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_answers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_guides: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          intro: string | null
          outro: string | null
          project_id: string
          research_plan_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          intro?: string | null
          outro?: string | null
          project_id: string
          research_plan_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          intro?: string | null
          outro?: string | null
          project_id?: string
          research_plan_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_guides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_guides_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_guides_research_plan_id_fkey"
            columns: ["research_plan_id"]
            isOneToOne: false
            referencedRelation: "research_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_guides_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_guides_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          created_at: string
          created_by: string | null
          guide_id: string
          id: string
          is_key: boolean
          position: number
          probes: string[]
          project_id: string
          section: Database["public"]["Enums"]["guide_section"]
          text: string
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          guide_id: string
          id?: string
          is_key?: boolean
          position?: number
          probes?: string[]
          project_id: string
          section?: Database["public"]["Enums"]["guide_section"]
          text: string
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          guide_id?: string
          id?: string
          is_key?: boolean
          position?: number
          probes?: string[]
          project_id?: string
          section?: Database["public"]["Enums"]["guide_section"]
          text?: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_questions_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "interview_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_questions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_questions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_questions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          code: string | null
          conducted_at: string | null
          created_at: string
          created_by: string | null
          duration_min: number | null
          guide_id: string | null
          id: string
          interviewer_id: string | null
          mode: Database["public"]["Enums"]["interview_mode"]
          notes: string | null
          participant_id: string
          project_id: string
          research_plan_id: string | null
          status: Database["public"]["Enums"]["interview_status"]
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          code?: string | null
          conducted_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_min?: number | null
          guide_id?: string | null
          id?: string
          interviewer_id?: string | null
          mode?: Database["public"]["Enums"]["interview_mode"]
          notes?: string | null
          participant_id: string
          project_id: string
          research_plan_id?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          code?: string | null
          conducted_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_min?: number | null
          guide_id?: string | null
          id?: string
          interviewer_id?: string | null
          mode?: Database["public"]["Enums"]["interview_mode"]
          notes?: string | null
          participant_id?: string
          project_id?: string
          research_plan_id?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "interview_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_research_plan_id_fkey"
            columns: ["research_plan_id"]
            isOneToOne: false
            referencedRelation: "research_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          body_text: string
          code: string | null
          created_at: string
          created_by: string | null
          id: string
          interview_id: string | null
          kind: Database["public"]["Enums"]["observation_kind"]
          participant_id: string | null
          pattern_id: string | null
          position: number
          project_id: string
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          body_text: string
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          interview_id?: string | null
          kind?: Database["public"]["Enums"]["observation_kind"]
          participant_id?: string | null
          pattern_id?: string | null
          position?: number
          project_id: string
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          body_text?: string
          code?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          interview_id?: string | null
          kind?: Database["public"]["Enums"]["observation_kind"]
          participant_id?: string | null
          pattern_id?: string | null
          position?: number
          project_id?: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          archived_at: string | null
          code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          effort: Database["public"]["Enums"]["confidence_level"]
          hmw: string | null
          id: string
          impact: Database["public"]["Enums"]["confidence_level"]
          project_id: string
          status: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          effort?: Database["public"]["Enums"]["confidence_level"]
          hmw?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["confidence_level"]
          project_id: string
          status?: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          effort?: Database["public"]["Enums"]["confidence_level"]
          hmw?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["confidence_level"]
          project_id?: string
          status?: Database["public"]["Enums"]["opportunity_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pain_points: {
        Row: {
          archived_at: string | null
          code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          project_id: string
          segment_label: string | null
          severity: Database["public"]["Enums"]["severity_level"]
          title: string
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id: string
          segment_label?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          title: string
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id?: string
          segment_label?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pain_points_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pain_points_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pain_points_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pain_points_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          age_range: string | null
          archived_at: string | null
          code: string | null
          consent_at: string | null
          contact: string | null
          context: string | null
          created_at: string
          created_by: string | null
          display_name: string | null
          id: string
          notes: string | null
          project_id: string
          role: string | null
          segment_label: string | null
          tags: string[]
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          age_range?: string | null
          archived_at?: string | null
          code?: string | null
          consent_at?: string | null
          contact?: string | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          notes?: string | null
          project_id: string
          role?: string | null
          segment_label?: string | null
          tags?: string[]
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          age_range?: string | null
          archived_at?: string | null
          code?: string | null
          consent_at?: string | null
          contact?: string | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          role?: string | null
          segment_label?: string | null
          tags?: string[]
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      patterns: {
        Row: {
          code: string | null
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          position: number
          project_id: string
          title: string
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          code?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          position?: number
          project_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          code?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          position?: number
          project_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patterns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patterns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patterns_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patterns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          locale: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_briefs: {
        Row: {
          business: string | null
          business_requirements: string | null
          client_input: Json
          constraints: string | null
          created_at: string
          created_by: string | null
          existing_product: string | null
          goals: Json
          id: string
          kpis: Json
          links: Json
          problem: string | null
          product_description: string | null
          project_id: string
          target_audience: string | null
          team: Json
          technical_constraints: string | null
          timeline_end: string | null
          timeline_start: string | null
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          business?: string | null
          business_requirements?: string | null
          client_input?: Json
          constraints?: string | null
          created_at?: string
          created_by?: string | null
          existing_product?: string | null
          goals?: Json
          id?: string
          kpis?: Json
          links?: Json
          problem?: string | null
          product_description?: string | null
          project_id: string
          target_audience?: string | null
          team?: Json
          technical_constraints?: string | null
          timeline_end?: string | null
          timeline_start?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          business?: string | null
          business_requirements?: string | null
          client_input?: Json
          constraints?: string | null
          created_at?: string
          created_by?: string | null
          existing_product?: string | null
          goals?: Json
          id?: string
          kpis?: Json
          links?: Json
          problem?: string | null
          product_description?: string | null
          project_id?: string
          target_audience?: string | null
          team?: Json
          technical_constraints?: string | null
          timeline_end?: string | null
          timeline_start?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_briefs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_briefs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_briefs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_briefs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_counters: {
        Row: {
          entity_type: string
          last_value: number
          project_id: string
        }
        Insert: {
          entity_type: string
          last_value?: number
          project_id: string
        }
        Update: {
          entity_type?: string
          last_value?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_counters_entity_type_fkey"
            columns: ["entity_type"]
            isOneToOne: false
            referencedRelation: "entity_types"
            referencedColumns: ["type"]
          },
          {
            foreignKeyName: "project_counters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_request_competitors: {
        Row: {
          dislikes: string | null
          id: string
          likes: string | null
          name: string
          position: number
          request_id: string
          url: string | null
          why: string | null
          workspace_id: string
        }
        Insert: {
          dislikes?: string | null
          id?: string
          likes?: string | null
          name: string
          position?: number
          request_id: string
          url?: string | null
          why?: string | null
          workspace_id: string
        }
        Update: {
          dislikes?: string | null
          id?: string
          likes?: string | null
          name?: string
          position?: number
          request_id?: string
          url?: string | null
          why?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_request_competitors_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "project_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_request_competitors_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_request_documents: {
        Row: {
          content: Json
          created_by: string | null
          document_type: Database["public"]["Enums"]["request_document_type"]
          generated_at: string
          id: string
          locale: string
          request_id: string
          template_version: number
          version: number
          workspace_id: string
        }
        Insert: {
          content: Json
          created_by?: string | null
          document_type: Database["public"]["Enums"]["request_document_type"]
          generated_at?: string
          id?: string
          locale: string
          request_id: string
          template_version?: number
          version: number
          workspace_id: string
        }
        Update: {
          content?: Json
          created_by?: string | null
          document_type?: Database["public"]["Enums"]["request_document_type"]
          generated_at?: string
          id?: string
          locale?: string
          request_id?: string
          template_version?: number
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_request_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_request_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "project_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_request_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_request_links: {
        Row: {
          id: string
          kind: string
          link_group: string
          position: number
          request_id: string
          url: string
          workspace_id: string
        }
        Insert: {
          id?: string
          kind: string
          link_group: string
          position?: number
          request_id: string
          url: string
          workspace_id: string
        }
        Update: {
          id?: string
          kind?: string
          link_group?: string
          position?: number
          request_id?: string
          url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_request_links_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "project_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_request_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_request_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          request_id: string
          workspace_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          request_id: string
          workspace_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          request_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_request_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_request_notes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "project_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_request_notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_request_references: {
        Row: {
          id: string
          note: string | null
          position: number
          request_id: string
          url: string
          workspace_id: string
        }
        Insert: {
          id?: string
          note?: string | null
          position?: number
          request_id: string
          url: string
          workspace_id: string
        }
        Update: {
          id?: string
          note?: string | null
          position?: number
          request_id?: string
          url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_request_references_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "project_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_request_references_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_requests: {
        Row: {
          additional_info: string | null
          archived_at: string | null
          audience: string | null
          budget_currency: string | null
          budget_max: number | null
          budget_min: number | null
          budget_note: string | null
          budget_range: string | null
          client_id: string
          client_token_expires_at: string | null
          client_token_hash: string | null
          code: string
          consent_at: string
          created_at: string
          deadline_date: string | null
          deadline_reason: string | null
          demographics: string | null
          existing_description: string | null
          existing_dislikes: string | null
          existing_must_change: string | null
          existing_url: string | null
          existing_works_well: string | null
          form_version: number
          geography: string | null
          goal_other: string | null
          goals: string[]
          has_deadline: boolean
          has_existing: boolean
          id: string
          idempotency_key: string
          locale: string
          market: string | null
          materials: string[]
          pain_points: string | null
          primary_users: string | null
          privacy_policy_version: string
          problem: string | null
          project_name: string | null
          project_name_unknown: boolean
          project_type_other: string | null
          project_types: string[]
          scope: string[]
          scope_needs_advice: boolean
          start_preference: string | null
          status: Database["public"]["Enums"]["request_status"]
          submitted_at: string
          summary: string
          updated_at: string
          what_it_does: string | null
          why_now: string | null
          workspace_id: string
        }
        Insert: {
          additional_info?: string | null
          archived_at?: string | null
          audience?: string | null
          budget_currency?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_note?: string | null
          budget_range?: string | null
          client_id: string
          client_token_expires_at?: string | null
          client_token_hash?: string | null
          code: string
          consent_at: string
          created_at?: string
          deadline_date?: string | null
          deadline_reason?: string | null
          demographics?: string | null
          existing_description?: string | null
          existing_dislikes?: string | null
          existing_must_change?: string | null
          existing_url?: string | null
          existing_works_well?: string | null
          form_version?: number
          geography?: string | null
          goal_other?: string | null
          goals?: string[]
          has_deadline?: boolean
          has_existing?: boolean
          id?: string
          idempotency_key: string
          locale: string
          market?: string | null
          materials?: string[]
          pain_points?: string | null
          primary_users?: string | null
          privacy_policy_version: string
          problem?: string | null
          project_name?: string | null
          project_name_unknown?: boolean
          project_type_other?: string | null
          project_types?: string[]
          scope?: string[]
          scope_needs_advice?: boolean
          start_preference?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          submitted_at?: string
          summary: string
          updated_at?: string
          what_it_does?: string | null
          why_now?: string | null
          workspace_id: string
        }
        Update: {
          additional_info?: string | null
          archived_at?: string | null
          audience?: string | null
          budget_currency?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_note?: string | null
          budget_range?: string | null
          client_id?: string
          client_token_expires_at?: string | null
          client_token_hash?: string | null
          code?: string
          consent_at?: string
          created_at?: string
          deadline_date?: string | null
          deadline_reason?: string | null
          demographics?: string | null
          existing_description?: string | null
          existing_dislikes?: string | null
          existing_must_change?: string | null
          existing_url?: string | null
          existing_works_well?: string | null
          form_version?: number
          geography?: string | null
          goal_other?: string | null
          goals?: string[]
          has_deadline?: boolean
          has_existing?: boolean
          id?: string
          idempotency_key?: string
          locale?: string
          market?: string | null
          materials?: string[]
          pain_points?: string | null
          primary_users?: string | null
          privacy_policy_version?: string
          problem?: string | null
          project_name?: string | null
          project_name_unknown?: boolean
          project_type_other?: string | null
          project_types?: string[]
          scope?: string[]
          scope_needs_advice?: boolean
          start_preference?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          submitted_at?: string
          summary?: string
          updated_at?: string
          what_it_does?: string | null
          why_now?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          current_stage: string | null
          description: string | null
          id: string
          name: string
          platforms: string[]
          slug: string
          source_request_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          current_stage?: string | null
          description?: string | null
          id?: string
          name: string
          platforms?: string[]
          slug: string
          source_request_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          current_stage?: string | null
          description?: string | null
          id?: string
          name?: string
          platforms?: string[]
          slug?: string
          source_request_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_source_request_id_fkey"
            columns: ["source_request_id"]
            isOneToOne: true
            referencedRelation: "project_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          answer_id: string | null
          code: string | null
          created_at: string
          created_by: string | null
          end_offset: number | null
          id: string
          interview_id: string
          participant_id: string | null
          pattern_id: string | null
          position: number
          project_id: string
          start_offset: number | null
          text: string
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          answer_id?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          end_offset?: number | null
          id?: string
          interview_id: string
          participant_id?: string | null
          pattern_id?: string | null
          position?: number
          project_id: string
          start_offset?: number | null
          text: string
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          answer_id?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          end_offset?: number | null
          id?: string
          interview_id?: string
          participant_id?: string | null
          pattern_id?: string | null
          position?: number
          project_id?: string
          start_offset?: number | null
          text?: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "interview_answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      request_counters: {
        Row: {
          last_value: number
          workspace_id: string
          year: number
        }
        Insert: {
          last_value?: number
          workspace_id: string
          year: number
        }
        Update: {
          last_value?: number
          workspace_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "request_counters_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      research_plans: {
        Row: {
          archived_at: string | null
          audience: string | null
          code: string | null
          created_at: string
          created_by: string | null
          goal: string | null
          hypotheses_text: string | null
          id: string
          method: Database["public"]["Enums"]["research_method"]
          participants_target: number | null
          project_id: string
          questions: Json
          status: Database["public"]["Enums"]["research_status"]
          success_criteria: string | null
          title: string
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          audience?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          goal?: string | null
          hypotheses_text?: string | null
          id?: string
          method?: Database["public"]["Enums"]["research_method"]
          participants_target?: number | null
          project_id: string
          questions?: Json
          status?: Database["public"]["Enums"]["research_status"]
          success_criteria?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          audience?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          goal?: string | null
          hypotheses_text?: string | null
          id?: string
          method?: Database["public"]["Enums"]["research_method"]
          participants_target?: number | null
          project_id?: string
          questions?: Json
          status?: Database["public"]["Enums"]["research_status"]
          success_criteria?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_plans_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      screen_states: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          figma_url: string | null
          id: string
          kind: Database["public"]["Enums"]["screen_state_kind"]
          position: number
          project_id: string
          screen_id: string
          status: Database["public"]["Enums"]["screen_state_status"]
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          figma_url?: string | null
          id?: string
          kind: Database["public"]["Enums"]["screen_state_kind"]
          position?: number
          project_id: string
          screen_id: string
          status?: Database["public"]["Enums"]["screen_state_status"]
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          figma_url?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["screen_state_kind"]
          position?: number
          project_id?: string
          screen_id?: string
          status?: Database["public"]["Enums"]["screen_state_status"]
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screen_states_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screen_states_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screen_states_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screen_states_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screen_states_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      screens: {
        Row: {
          analytics_events: Json
          api_data_requirements: string | null
          archived_at: string | null
          code: string | null
          content_hierarchy: Json
          created_at: string
          created_by: string | null
          entry_points: string | null
          figma_node_id: string | null
          figma_url: string | null
          id: string
          name: string
          permissions: string | null
          primary_action: string | null
          project_id: string
          purpose: string | null
          secondary_actions: string | null
          status: Database["public"]["Enums"]["screen_status"]
          thumbnail_path: string | null
          updated_at: string
          updated_by: string | null
          user_goal: string | null
          workspace_id: string
        }
        Insert: {
          analytics_events?: Json
          api_data_requirements?: string | null
          archived_at?: string | null
          code?: string | null
          content_hierarchy?: Json
          created_at?: string
          created_by?: string | null
          entry_points?: string | null
          figma_node_id?: string | null
          figma_url?: string | null
          id?: string
          name: string
          permissions?: string | null
          primary_action?: string | null
          project_id: string
          purpose?: string | null
          secondary_actions?: string | null
          status?: Database["public"]["Enums"]["screen_status"]
          thumbnail_path?: string | null
          updated_at?: string
          updated_by?: string | null
          user_goal?: string | null
          workspace_id: string
        }
        Update: {
          analytics_events?: Json
          api_data_requirements?: string | null
          archived_at?: string | null
          code?: string | null
          content_hierarchy?: Json
          created_at?: string
          created_by?: string | null
          entry_points?: string | null
          figma_node_id?: string | null
          figma_url?: string | null
          id?: string
          name?: string
          permissions?: string | null
          primary_action?: string | null
          project_id?: string
          purpose?: string | null
          secondary_actions?: string | null
          status?: Database["public"]["Enums"]["screen_status"]
          thumbnail_path?: string | null
          updated_at?: string
          updated_by?: string | null
          user_goal?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screens_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screens_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_allowlist: {
        Row: {
          created_at: string
          email: string
          note: string | null
        }
        Insert: {
          created_at?: string
          email: string
          note?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          note?: string | null
        }
        Relationships: []
      }
      site_notes: {
        Row: {
          body_en: string | null
          body_uk: string
          created_at: string
          created_by: string | null
          id: string
          image: Json | null
          number: number
          parent_id: string | null
          published_at: string | null
          status: string
          tags: string[]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          body_en?: string | null
          body_uk?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image?: Json | null
          number?: number
          parent_id?: string | null
          published_at?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          body_en?: string | null
          body_uk?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image?: Json | null
          number?: number
          parent_id?: string | null
          published_at?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_notes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "site_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      site_profile: {
        Row: {
          content: Json
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          content?: Json
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          content?: Json
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_profile_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_profile_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      trace_links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          origin: Database["public"]["Enums"]["trace_origin"]
          project_id: string
          relation: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          origin?: Database["public"]["Enums"]["trace_origin"]
          project_id: string
          relation: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          origin?: Database["public"]["Enums"]["trace_origin"]
          project_id?: string
          relation?: string
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trace_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trace_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trace_links_rule_fk"
            columns: ["source_type", "target_type", "relation"]
            isOneToOne: false
            referencedRelation: "trace_relation_rules"
            referencedColumns: ["source_type", "target_type", "relation"]
          },
          {
            foreignKeyName: "trace_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      trace_relation_rules: {
        Row: {
          relation: string
          source_type: string
          target_type: string
        }
        Insert: {
          relation: string
          source_type: string
          target_type: string
        }
        Update: {
          relation?: string
          source_type?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trace_relation_rules_relation_fkey"
            columns: ["relation"]
            isOneToOne: false
            referencedRelation: "trace_relations"
            referencedColumns: ["relation"]
          },
          {
            foreignKeyName: "trace_relation_rules_source_type_fkey"
            columns: ["source_type"]
            isOneToOne: false
            referencedRelation: "entity_types"
            referencedColumns: ["type"]
          },
          {
            foreignKeyName: "trace_relation_rules_target_type_fkey"
            columns: ["target_type"]
            isOneToOne: false
            referencedRelation: "entity_types"
            referencedColumns: ["type"]
          },
        ]
      }
      trace_relations: {
        Row: {
          label_backward: string
          label_forward: string
          relation: string
        }
        Insert: {
          label_backward: string
          label_forward: string
          relation: string
        }
        Update: {
          label_backward?: string
          label_forward?: string
          relation?: string
        }
        Relationships: []
      }
      user_flows: {
        Row: {
          archived_at: string | null
          code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          project_id: string
          status: Database["public"]["Enums"]["flow_status"]
          updated_at: string
          updated_by: string | null
          viewport: Json | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          project_id: string
          status?: Database["public"]["Enums"]["flow_status"]
          updated_at?: string
          updated_by?: string | null
          viewport?: Json | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          status?: Database["public"]["Enums"]["flow_status"]
          updated_at?: string
          updated_by?: string | null
          viewport?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_flows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flows_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flows_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          is_personal: boolean
          name: string
          owner_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_personal?: boolean
          name: string
          owner_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_personal?: boolean
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attach_domain_table: {
        Args: { p_entity: string; p_table: unknown }
        Returns: undefined
      }
      attach_project_table: {
        Args: { p_activity_type: string; p_table: unknown }
        Returns: undefined
      }
      can_access_project_file: {
        Args: {
          p_min_role: Database["public"]["Enums"]["workspace_role"]
          p_name: string
        }
        Returns: boolean
      }
      can_write_note_file: { Args: { p_name: string }; Returns: boolean }
      convert_project_request: {
        Args: {
          p_brief: Json
          p_name: string
          p_platforms: string[]
          p_request: string
          p_slug: string
        }
        Returns: string
      }
      create_demo_project: { Args: { p_workspace: string }; Returns: string }
      decision_stats: {
        Args: { p_project: string }
        Returns: {
          decision_id: string
          evidence: number
          targets: number
        }[]
      }
      flow_stats: {
        Args: { p_project: string }
        Returns: {
          flow_id: string
          missing_cases: number
          node_count: number
          screen_count: number
        }[]
      }
      get_request_brief: { Args: { p_token: string }; Returns: Json }
      is_workspace_member: {
        Args: {
          min_role?: Database["public"]["Enums"]["workspace_role"]
          ws: string
        }
        Returns: boolean
      }
      next_code: {
        Args: { p_entity: string; p_project: string }
        Returns: string
      }
      note_react: {
        Args: {
          p_kind: string
          p_number: number
          p_on: boolean
          p_secret: string
          p_voter_hash: string
        }
        Returns: Json
      }
      open_demo_project: { Args: { p_workspace: string }; Returns: string }
      project_request_snapshot: { Args: { p_request: string }; Returns: Json }
      project_stage_counts: { Args: { p_project: string }; Returns: Json }
      restore_insert: {
        Args: { p_row: Json; p_table: string }
        Returns: undefined
      }
      restore_project: {
        Args: { p_export: Json; p_workspace: string }
        Returns: Json
      }
      restore_remap: { Args: { p_map: Json; p_value: Json }; Returns: Json }
      restore_row: {
        Args: {
          p_map: Json
          p_project: string
          p_row: Json
          p_table: string
          p_workspace: string
        }
        Returns: Json
      }
      role_rank: {
        Args: { r: Database["public"]["Enums"]["workspace_role"] }
        Returns: number
      }
      screen_stats: {
        Args: { p_project: string }
        Returns: {
          decisions: number
          flows: string[]
          missing_states: number
          screen_id: string
          upstream: number
        }[]
      }
      seed_demo_competitors: { Args: { p_project: string }; Returns: undefined }
      seed_demo_content: { Args: { p_project: string }; Returns: undefined }
      seed_demo_design: { Args: { p_project: string }; Returns: undefined }
      seed_demo_flows: { Args: { p_project: string }; Returns: undefined }
      seed_demo_research: { Args: { p_project: string }; Returns: undefined }
      seed_demo_review: { Args: { p_project: string }; Returns: undefined }
      seed_demo_synthesis: { Args: { p_project: string }; Returns: undefined }
      site_notes: { Args: never; Returns: Json }
      site_profile: { Args: never; Returns: Json }
      submit_project_request: {
        Args: {
          p_idempotency_key: string
          p_ip_hash: string
          p_payload: Json
          p_secret: string
        }
        Returns: Json
      }
      synthesis_stats: {
        Args: { p_project: string }
        Returns: {
          entity_id: string
          entity_type: string
          participant_count: number
          source_count: number
        }[]
      }
      trace_graph: {
        Args: {
          p_direction?: string
          p_id: string
          p_max_depth?: number
          p_type: string
        }
        Returns: {
          depth: number
          direction: string
          link_id: string
          origin: Database["public"]["Enums"]["trace_origin"]
          relation: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
        }[]
      }
      upstream_participants: {
        Args: { p_id: string; p_type: string }
        Returns: {
          participant_id: string
        }[]
      }
    }
    Enums: {
      case_status: "draft" | "review" | "published"
      competitor_kind: "direct" | "indirect" | "substitute"
      confidence_level: "low" | "medium" | "high"
      decision_status: "proposed" | "accepted" | "superseded" | "rejected"
      edge_case_kind:
        | "payment_failed"
        | "no_internet"
        | "unavailable"
        | "session_expired"
        | "empty"
        | "permission_denied"
        | "timeout"
        | "validation"
        | "custom"
      edge_case_status: "missing" | "covered" | "not_applicable"
      feature_value: "yes" | "partial" | "no" | "unknown"
      flow_edge_branch: "default" | "yes" | "no" | "error" | "back"
      flow_node_kind:
        | "start"
        | "screen"
        | "action"
        | "decision"
        | "system"
        | "error"
        | "success"
        | "end"
      flow_status: "draft" | "review" | "final"
      guide_section:
        | "intro"
        | "context"
        | "current_behavior"
        | "problems"
        | "motivation"
        | "experience"
        | "expectations"
        | "closing"
      insight_status: "draft" | "validated" | "rejected"
      interview_mode: "in_person" | "remote" | "phone"
      interview_status: "planned" | "in_progress" | "done" | "synthesized"
      observation_kind:
        | "pain"
        | "need"
        | "behavior"
        | "emotion"
        | "fact"
        | "workaround"
      opportunity_status: "open" | "in_design" | "addressed" | "dropped"
      project_status: "active" | "paused" | "done" | "archived"
      request_document_type:
        | "project_brief"
        | "discovery_summary"
        | "project_scope"
        | "proposal"
        | "estimate"
        | "statement_of_work"
        | "design_brief"
      request_status:
        | "submitted"
        | "reviewing"
        | "qualified"
        | "accepted"
        | "declined"
        | "converted"
      research_method: "interview" | "usability" | "survey" | "diary" | "other"
      research_status: "draft" | "active" | "done"
      screen_state_kind:
        | "default"
        | "loading"
        | "empty"
        | "error"
        | "success"
        | "disabled"
        | "permission_denied"
        | "offline"
        | "partial"
      screen_state_status: "missing" | "designed" | "n_a"
      screen_status: "sketch" | "wireframe" | "prototype" | "tested" | "ready"
      severity_level: "critical" | "high" | "medium" | "low"
      trace_origin: "manual" | "ai_accepted" | "system"
      workspace_role: "owner" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      case_status: ["draft", "review", "published"],
      competitor_kind: ["direct", "indirect", "substitute"],
      confidence_level: ["low", "medium", "high"],
      decision_status: ["proposed", "accepted", "superseded", "rejected"],
      edge_case_kind: [
        "payment_failed",
        "no_internet",
        "unavailable",
        "session_expired",
        "empty",
        "permission_denied",
        "timeout",
        "validation",
        "custom",
      ],
      edge_case_status: ["missing", "covered", "not_applicable"],
      feature_value: ["yes", "partial", "no", "unknown"],
      flow_edge_branch: ["default", "yes", "no", "error", "back"],
      flow_node_kind: [
        "start",
        "screen",
        "action",
        "decision",
        "system",
        "error",
        "success",
        "end",
      ],
      flow_status: ["draft", "review", "final"],
      guide_section: [
        "intro",
        "context",
        "current_behavior",
        "problems",
        "motivation",
        "experience",
        "expectations",
        "closing",
      ],
      insight_status: ["draft", "validated", "rejected"],
      interview_mode: ["in_person", "remote", "phone"],
      interview_status: ["planned", "in_progress", "done", "synthesized"],
      observation_kind: [
        "pain",
        "need",
        "behavior",
        "emotion",
        "fact",
        "workaround",
      ],
      opportunity_status: ["open", "in_design", "addressed", "dropped"],
      project_status: ["active", "paused", "done", "archived"],
      request_document_type: [
        "project_brief",
        "discovery_summary",
        "project_scope",
        "proposal",
        "estimate",
        "statement_of_work",
        "design_brief",
      ],
      request_status: [
        "submitted",
        "reviewing",
        "qualified",
        "accepted",
        "declined",
        "converted",
      ],
      research_method: ["interview", "usability", "survey", "diary", "other"],
      research_status: ["draft", "active", "done"],
      screen_state_kind: [
        "default",
        "loading",
        "empty",
        "error",
        "success",
        "disabled",
        "permission_denied",
        "offline",
        "partial",
      ],
      screen_state_status: ["missing", "designed", "n_a"],
      screen_status: ["sketch", "wireframe", "prototype", "tested", "ready"],
      severity_level: ["critical", "high", "medium", "low"],
      trace_origin: ["manual", "ai_accepted", "system"],
      workspace_role: ["owner", "editor", "viewer"],
    },
  },
} as const
