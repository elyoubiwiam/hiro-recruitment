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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      candidates: {
        Row: {
          created_at: string
          education: Json
          email: string
          experience: Json
          headline: string
          id: string
          location: string
          name: string
          owner_id: string
          phone: string
          raw_text: string
          skills: string[]
          summary: string
        }
        Insert: {
          created_at?: string
          education?: Json
          email?: string
          experience?: Json
          headline?: string
          id?: string
          location?: string
          name: string
          owner_id?: string
          phone?: string
          raw_text?: string
          skills?: string[]
          summary?: string
        }
        Update: {
          created_at?: string
          education?: Json
          email?: string
          experience?: Json
          headline?: string
          id?: string
          location?: string
          name?: string
          owner_id?: string
          phone?: string
          raw_text?: string
          skills?: string[]
          summary?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          contact_email: string
          contact_name: string
          created_at: string
          id: string
          industry: string
          name: string
          owner_id: string
        }
        Insert: {
          contact_email?: string
          contact_name?: string
          created_at?: string
          id?: string
          industry?: string
          name: string
          owner_id?: string
        }
        Update: {
          contact_email?: string
          contact_name?: string
          created_at?: string
          id?: string
          industry?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          client_id: string
          created_at: string
          currency: string
          department: string
          description: string
          id: string
          location: string
          must_have: string[]
          owner_id: string
          salary_max: number
          salary_min: number
          soft_factors: string[]
          stage: string
          title: string
          work_mode: string
        }
        Insert: {
          client_id: string
          created_at?: string
          currency?: string
          department?: string
          description?: string
          id?: string
          location?: string
          must_have?: string[]
          owner_id?: string
          salary_max?: number
          salary_min?: number
          soft_factors?: string[]
          stage?: string
          title: string
          work_mode?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          currency?: string
          department?: string
          description?: string
          id?: string
          location?: string
          must_have?: string[]
          owner_id?: string
          salary_max?: number
          salary_min?: number
          soft_factors?: string[]
          stage?: string
          title?: string
          work_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          job_id: string
          owner_id: string
          result: Json
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          job_id: string
          owner_id?: string
          result: Json
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          job_id?: string
          owner_id?: string
          result?: Json
        }
        Relationships: [
          {
            foreignKeyName: "matches_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_tracks: {
        Row: {
          candidate_id: string
          created_at: string
          drafts: Json
          history: Json
          id: string
          job_id: string
          last_contacted_at: string | null
          next_contact_at: string | null
          notes: string
          owner_id: string
          status: string
          step: number
        }
        Insert: {
          candidate_id: string
          created_at?: string
          drafts?: Json
          history?: Json
          id?: string
          job_id: string
          last_contacted_at?: string | null
          next_contact_at?: string | null
          notes?: string
          owner_id?: string
          status?: string
          step?: number
        }
        Update: {
          candidate_id?: string
          created_at?: string
          drafts?: Json
          history?: Json
          id?: string
          job_id?: string
          last_contacted_at?: string | null
          next_contact_at?: string | null
          notes?: string
          owner_id?: string
          status?: string
          step?: number
        }
        Relationships: [
          {
            foreignKeyName: "outreach_tracks_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_tracks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          job_id: string
          owner_id: string
          result: Json | null
          text: string
          title: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          job_id: string
          owner_id?: string
          result?: Json | null
          text?: string
          title?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          job_id?: string
          owner_id?: string
          result?: Json | null
          text?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcripts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      seed_sample_data: { Args: { _uid: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
