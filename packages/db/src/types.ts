export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      daily_card_items: {
        Row: {
          auto_detected: boolean
          auto_target: Json | null
          daily_card_id: string
          id: string
          kind: string
          note: string | null
          slot_key: string
          status: string
          status_changed_at: string
          title: string
          url: string | null
        }
        Insert: {
          auto_detected?: boolean
          auto_target?: Json | null
          daily_card_id: string
          id?: string
          kind: string
          note?: string | null
          slot_key: string
          status?: string
          status_changed_at?: string
          title: string
          url?: string | null
        }
        Update: {
          auto_detected?: boolean
          auto_target?: Json | null
          daily_card_id?: string
          id?: string
          kind?: string
          note?: string | null
          slot_key?: string
          status?: string
          status_changed_at?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_card_items_daily_card_id_fkey"
            columns: ["daily_card_id"]
            isOneToOne: false
            referencedRelation: "daily_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_cards: {
        Row: {
          card_raw: Json | null
          coach_comment: string | null
          date_kst: string
          fallback_used: boolean
          generated_at: string
          generation_meta: Json
          id: string
          sprint_id: string
          user_id: string
        }
        Insert: {
          card_raw?: Json | null
          coach_comment?: string | null
          date_kst: string
          fallback_used?: boolean
          generated_at?: string
          generation_meta?: Json
          id?: string
          sprint_id: string
          user_id: string
        }
        Update: {
          card_raw?: Json | null
          coach_comment?: string | null
          date_kst?: string
          fallback_used?: boolean
          generated_at?: string
          generation_meta?: Json
          id?: string
          sprint_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_cards_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_backbone_items: {
        Row: {
          content: Json
          created_at: string
          day_of_week_mask: number
          effective_from: string
          effective_until: string | null
          id: string
          order_in_week: number
          slot_key: string
          sprint_id: string
          week_index: number
        }
        Insert: {
          content: Json
          created_at?: string
          day_of_week_mask: number
          effective_from: string
          effective_until?: string | null
          id?: string
          order_in_week?: number
          slot_key: string
          sprint_id: string
          week_index: number
        }
        Update: {
          content?: Json
          created_at?: string
          day_of_week_mask?: number
          effective_from?: string
          effective_until?: string | null
          id?: string
          order_in_week?: number
          slot_key?: string
          sprint_id?: string
          week_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "sprint_backbone_items_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          end_date_kst: string
          evergreen_targets: string[]
          frontier_targets: string[]
          id: string
          name: string
          source_md_path: string | null
          start_date_kst: string
          status: string
          toy_project_repo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date_kst: string
          evergreen_targets?: string[]
          frontier_targets?: string[]
          id?: string
          name: string
          source_md_path?: string | null
          start_date_kst: string
          status?: string
          toy_project_repo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date_kst?: string
          evergreen_targets?: string[]
          frontier_targets?: string[]
          id?: string
          name?: string
          source_md_path?: string | null
          start_date_kst?: string
          status?: string
          toy_project_repo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          discord_webhook_url: string | null
          github_username: string | null
          monitored_repos: string[]
          notify_schedule: Json
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discord_webhook_url?: string | null
          github_username?: string | null
          monitored_repos?: string[]
          notify_schedule?: Json
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discord_webhook_url?: string | null
          github_username?: string | null
          monitored_repos?: string[]
          notify_schedule?: Json
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      yesterday_signals: {
        Row: {
          blog_new_posts: number
          date_kst: string
          fetch_error: string | null
          fetch_status: string
          fetched_at: string
          github_events_count: number
          id: string
          rate_limit_remaining: number | null
          raw: Json | null
          repo_commits: Json
          user_id: string
        }
        Insert: {
          blog_new_posts?: number
          date_kst: string
          fetch_error?: string | null
          fetch_status: string
          fetched_at?: string
          github_events_count?: number
          id?: string
          rate_limit_remaining?: number | null
          raw?: Json | null
          repo_commits?: Json
          user_id: string
        }
        Update: {
          blog_new_posts?: number
          date_kst?: string
          fetch_error?: string | null
          fetch_status?: string
          fetched_at?: string
          github_events_count?: number
          id?: string
          rate_limit_remaining?: number | null
          raw?: Json | null
          repo_commits?: Json
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

