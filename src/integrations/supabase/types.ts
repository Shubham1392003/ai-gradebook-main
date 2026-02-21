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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cheating_logs: {
        Row: {
          description: string | null
          event_type: string
          evidence_url: string | null
          id: string
          student_id: string
          submission_id: string
          timestamp: string
        }
        Insert: {
          description?: string | null
          event_type: string
          evidence_url?: string | null
          id?: string
          student_id: string
          submission_id: string
          timestamp?: string
        }
        Update: {
          description?: string | null
          event_type?: string
          evidence_url?: string | null
          id?: string
          student_id?: string
          submission_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "cheating_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          ai_explanation: string | null
          created_at: string
          id: string
          is_ai_evaluated: boolean
          is_teacher_reviewed: boolean
          marks_obtained: number
          question_id: string
          submission_id: string
          teacher_remarks: string | null
          updated_at: string
        }
        Insert: {
          ai_explanation?: string | null
          created_at?: string
          id?: string
          is_ai_evaluated?: boolean
          is_teacher_reviewed?: boolean
          marks_obtained?: number
          question_id: string
          submission_id: string
          teacher_remarks?: string | null
          updated_at?: string
        }
        Update: {
          ai_explanation?: string | null
          created_at?: string
          id?: string
          is_ai_evaluated?: boolean
          is_teacher_reviewed?: boolean
          marks_obtained?: number
          question_id?: string
          submission_id?: string
          teacher_remarks?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_name: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          scheduled_at: string | null
          status: string
          subject: string
          teacher_id: string
          title: string
          total_marks: number
          updated_at: string
          warning_limit: number
        }
        Insert: {
          class_name: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          scheduled_at?: string | null
          status?: string
          subject: string
          teacher_id: string
          title: string
          total_marks?: number
          updated_at?: string
          warning_limit?: number
        }
        Update: {
          class_name?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          scheduled_at?: string | null
          status?: string
          subject?: string
          teacher_id?: string
          title?: string
          total_marks?: number
          updated_at?: string
          warning_limit?: number
        }
        Relationships: []
      }
      grievances: {
        Row: {
          created_at: string
          id: string
          reason: string
          status: string
          student_id: string
          submission_id: string
          teacher_response: string | null
          updated_at: string
          updated_marks: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          status?: string
          student_id: string
          submission_id: string
          teacher_response?: string | null
          updated_at?: string
          updated_marks?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          status?: string
          student_id?: string
          submission_id?: string
          teacher_response?: string | null
          updated_at?: string
          updated_marks?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "grievances_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          exam_id: string
          id: string
          marks: number
          options: Json | null
          order_index: number
          question_text: string
          question_type: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          exam_id: string
          id?: string
          marks?: number
          options?: Json | null
          order_index?: number
          question_text: string
          question_type?: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          exam_id?: string
          id?: string
          marks?: number
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      scorecards: {
        Row: {
          cgpa: number | null
          created_at: string
          exam_id: string
          grade: string | null
          id: string
          percentage: number
          sgpa: number | null
          student_id: string
          total_marks: number
          total_marks_obtained: number
        }
        Insert: {
          cgpa?: number | null
          created_at?: string
          exam_id: string
          grade?: string | null
          id?: string
          percentage?: number
          sgpa?: number | null
          student_id: string
          total_marks?: number
          total_marks_obtained?: number
        }
        Update: {
          cgpa?: number | null
          created_at?: string
          exam_id?: string
          grade?: string | null
          id?: string
          percentage?: number
          sgpa?: number | null
          student_id?: string
          total_marks?: number
          total_marks_obtained?: number
        }
        Relationships: [
          {
            foreignKeyName: "scorecards_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          answers: Json
          created_at: string
          exam_id: string
          id: string
          is_terminated: boolean
          started_at: string
          status: string
          student_id: string
          submitted_at: string | null
          warning_count: number
        }
        Insert: {
          answers?: Json
          created_at?: string
          exam_id: string
          id?: string
          is_terminated?: boolean
          started_at?: string
          status?: string
          student_id: string
          submitted_at?: string | null
          warning_count?: number
        }
        Update: {
          answers?: Json
          created_at?: string
          exam_id?: string
          id?: string
          is_terminated?: boolean
          started_at?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
          warning_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "submissions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
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
    }
    Enums: {
      app_role: "teacher" | "student"
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
      app_role: ["teacher", "student"],
    },
  },
} as const
