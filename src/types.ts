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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          club_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          title: string
        }
        Insert: {
          club_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          title: string
        }
        Update: {
          club_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_scans: {
        Row: {
          id: string
          registration_id: string | null
          scan_type: Database["public"]["Enums"]["scan_type"]
          scanned_at: string | null
          scanned_by: string | null
        }
        Insert: {
          id?: string
          registration_id?: string | null
          scan_type: Database["public"]["Enums"]["scan_type"]
          scanned_at?: string | null
          scanned_by?: string | null
        }
        Update: {
          id?: string
          registration_id?: string | null
          scan_type?: Database["public"]["Enums"]["scan_type"]
          scanned_at?: string | null
          scanned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_scans_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_scans_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          badge_level: number
          badge_name: string
          earned_at: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          badge_level: number
          badge_name: string
          earned_at?: string | null
          id?: string
          student_id?: string | null
        }
        Update: {
          badge_level?: number
          badge_name?: string
          earned_at?: string | null
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_coordinators: {
        Row: {
          club_id: string | null
          created_at: string | null
          id: string
          signature_name: string | null
          signature_url: string | null
          user_id: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          id?: string
          signature_name?: string | null
          signature_url?: string | null
          user_id?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          id?: string
          signature_name?: string | null
          signature_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_coordinators_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_coordinators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          coordinator_name: string | null
          coordinator_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          coordinator_name?: string | null
          coordinator_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          coordinator_name?: string | null
          coordinator_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          attendance_confirmed: boolean | null
          certificate_generated: boolean | null
          entry_scanned_at: string | null
          event_id: string | null
          exit_scanned_at: string | null
          id: string
          points_awarded: number | null
          qr_code: string
          registered_at: string | null
          student_id: string | null
        }
        Insert: {
          attendance_confirmed?: boolean | null
          certificate_generated?: boolean | null
          entry_scanned_at?: string | null
          event_id?: string | null
          exit_scanned_at?: string | null
          id?: string
          points_awarded?: number | null
          qr_code: string
          registered_at?: string | null
          student_id?: string | null
        }
        Update: {
          attendance_confirmed?: boolean | null
          certificate_generated?: boolean | null
          entry_scanned_at?: string | null
          event_id?: string | null
          exit_scanned_at?: string | null
          id?: string
          points_awarded?: number | null
          qr_code?: string
          registered_at?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          bonus_points: number | null
          category: Database["public"]["Enums"]["event_category"]
          club_id: string | null
          coordinator_id: string | null
          created_at: string | null
          credit_points: number | null
          description: string | null
          duration: number
          event_date: string
          id: string
          max_participants: number | null
          name: string
          updated_at: string | null
          volunteers: string | null
        }
        Insert: {
          bonus_points?: number | null
          category: Database["public"]["Enums"]["event_category"]
          club_id?: string | null
          coordinator_id?: string | null
          created_at?: string | null
          credit_points?: number | null
          description?: string | null
          duration: number
          event_date: string
          id?: string
          max_participants?: number | null
          name: string
          updated_at?: string | null
          volunteers?: string | null
        }
        Update: {
          bonus_points?: number | null
          category?: Database["public"]["Enums"]["event_category"]
          club_id?: string | null
          coordinator_id?: string | null
          created_at?: string | null
          credit_points?: number | null
          description?: string | null
          duration?: number
          event_date?: string
          id?: string
          max_participants?: number | null
          name?: string
          updated_at?: string | null
          volunteers?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          roll_number: string | null
          section: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          roll_number?: string | null
          section?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          roll_number?: string | null
          section?: string | null
          year?: number | null
        }
        Relationships: []
      }
      student_credits: {
        Row: {
          badges_earned: number | null
          events_attended: number | null
          id: string
          student_id: string | null
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          badges_earned?: number | null
          events_attended?: number | null
          id?: string
          student_id?: string | null
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          badges_earned?: number | null
          events_attended?: number | null
          id?: string
          student_id?: string | null
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_credits_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
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
      [_ in never]: never
    }
    Enums: {
      event_category:
        | "Quiz"
        | "Guest Lecture"
        | "Competition"
        | "Workshop"
        | "Cultural"
        | "Sports"
        | "Technical"
        | "Other"
      scan_type: "entry" | "exit"
      user_role: "admin" | "coordinator" | "student"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      event_category: [
        "Quiz",
        "Guest Lecture",
        "Competition",
        "Workshop",
        "Cultural",
        "Sports",
        "Technical",
        "Other",
      ],
      scan_type: ["entry", "exit"],
      user_role: ["admin", "coordinator", "student"],
    },
  },
} as const
