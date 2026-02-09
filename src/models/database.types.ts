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
      career_history: {
        Row: {
          created_at: string
          id: string
          position_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string
          id: string
          is_main: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_main?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_main?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dig_deeper_questions: {
        Row: {
          answer: string | null
          context: string
          created_at: string
          id: string
          question: string
          question_type: Database["public"]["Enums"]["dig_deeper_question_type"]
          status: Database["public"]["Enums"]["dig_deeper_question_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          context: string
          created_at?: string
          id?: string
          question: string
          question_type: Database["public"]["Enums"]["dig_deeper_question_type"]
          status?: Database["public"]["Enums"]["dig_deeper_question_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          context?: string
          created_at?: string
          id?: string
          question?: string
          question_type?: Database["public"]["Enums"]["dig_deeper_question_type"]
          status?: Database["public"]["Enums"]["dig_deeper_question_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          id: string
          sender: Database["public"]["Enums"]["message_sender"]
          timestamp: string
        }
        Insert: {
          chat_id: string
          content: string
          id?: string
          sender: Database["public"]["Enums"]["message_sender"]
          timestamp?: string
        }
        Update: {
          chat_id?: string
          content?: string
          id?: string
          sender?: Database["public"]["Enums"]["message_sender"]
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      user_about_you: {
        Row: {
          created_at: string
          description: string
          id: string
          section_type: Database["public"]["Enums"]["about_you_section_type"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          section_type: Database["public"]["Enums"]["about_you_section_type"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          section_type?: Database["public"]["Enums"]["about_you_section_type"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_assessments: {
        Row: {
          additional_data: Json | null
          assessment_data: Json | null
          assessment_full_text: string | null
          assessment_summary: string | null
          assessment_type: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          additional_data?: Json | null
          assessment_data?: Json | null
          assessment_full_text?: string | null
          assessment_summary?: string | null
          assessment_type: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          additional_data?: Json | null
          assessment_data?: Json | null
          assessment_full_text?: string | null
          assessment_summary?: string | null
          assessment_type?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_core_values: {
        Row: {
          created_at: string
          description: string
          id: string
          title: string
          updated_at: string
          user_id: string
          value_type: Database["public"]["Enums"]["core_value_type"]
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
          value_type?: Database["public"]["Enums"]["core_value_type"]
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          value_type?: Database["public"]["Enums"]["core_value_type"]
        }
        Relationships: []
      }
      user_inner_circle: {
        Row: {
          created_at: string
          id: string
          name: string
          relationship_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          relationship_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          relationship_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_long_term_goals: {
        Row: {
          created_at: string
          goal: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_main_interests: {
        Row: {
          created_at: string | null
          id: string
          interest: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_motivations: {
        Row: {
          created_at: string
          description: string
          id: string
          motivation_type: Database["public"]["Enums"]["motivation_type"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          motivation_type?: Database["public"]["Enums"]["motivation_type"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          motivation_type?: Database["public"]["Enums"]["motivation_type"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_professional_development: {
        Row: {
          created_at: string
          description: string
          goal_setting_style_description: string
          goal_setting_style_title: string
          id: string
          key_terms: string[]
          leadership_style_description: string
          leadership_style_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          goal_setting_style_description: string
          goal_setting_style_title: string
          id?: string
          key_terms?: string[]
          leadership_style_description: string
          leadership_style_title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          goal_setting_style_description?: string
          goal_setting_style_title?: string
          id?: string
          key_terms?: string[]
          leadership_style_description?: string
          leadership_style_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          family_story: string | null
          ftux_current_step: number | null
          full_name: string | null
          has_completed_ftux: boolean | null
          has_completed_intro: boolean | null
          id: string
          phone_number: string | null
          primary_occupation: string | null
          summary: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          family_story?: string | null
          ftux_current_step?: number | null
          full_name?: string | null
          has_completed_ftux?: boolean | null
          has_completed_intro?: boolean | null
          id: string
          phone_number?: string | null
          primary_occupation?: string | null
          summary?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          family_story?: string | null
          ftux_current_step?: number | null
          full_name?: string | null
          has_completed_ftux?: boolean | null
          has_completed_intro?: boolean | null
          id?: string
          phone_number?: string | null
          primary_occupation?: string | null
          summary?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      user_quick_insights: {
        Row: {
          created_at: string
          description: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_relationships: {
        Row: {
          attachment_style_description: string
          attachment_style_title: string
          communication_style_description: string
          communication_style_title: string
          conflict_style_description: string
          conflict_style_title: string
          created_at: string
          description: string
          id: string
          key_terms: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_style_description: string
          attachment_style_title: string
          communication_style_description: string
          communication_style_title: string
          conflict_style_description: string
          conflict_style_title: string
          created_at?: string
          description: string
          id?: string
          key_terms: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_style_description?: string
          attachment_style_title?: string
          communication_style_description?: string
          communication_style_title?: string
          conflict_style_description?: string
          conflict_style_title?: string
          created_at?: string
          description?: string
          id?: string
          key_terms?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_short_term_goals: {
        Row: {
          created_at: string
          goal: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_top_qualities: {
        Row: {
          color: string | null
          created_at: string | null
          description: string
          id: string
          level: Database["public"]["Enums"]["rating_level"]
          score: number
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description: string
          id: string
          level: Database["public"]["Enums"]["rating_level"]
          score: number
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string
          id?: string
          level?: Database["public"]["Enums"]["rating_level"]
          score?: number
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_weaknesses: {
        Row: {
          created_at: string
          description: string
          id: string
          title: string
          updated_at: string
          user_id: string
          weakness_type: Database["public"]["Enums"]["weakness_type"]
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
          weakness_type?: Database["public"]["Enums"]["weakness_type"]
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          weakness_type?: Database["public"]["Enums"]["weakness_type"]
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
      about_you_section_type:
        | "SELF_AWARENESS"
        | "RELATIONSHIPS"
        | "CAREER_DEVELOPMENT"
      core_value_type: "SYSTEM_GENERATED" | "USER_DEFINED"
      dig_deeper_question_status: "PENDING" | "ANSWERED" | "SKIPPED"
      dig_deeper_question_type: "ONBOARDING_DATA" | "PERSONALITY_INSIGHTS"
      message_sender: "user" | "assistant"
      motivation_type: "SYSTEM_GENERATED" | "USER_DEFINED"
      rating_level:
        | "Highest"
        | "Very High"
        | "High"
        | "Medium"
        | "Low"
        | "Very Low"
        | "Lowest"
      weakness_type: "SYSTEM_GENERATED" | "USER_DEFINED"
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

