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
      chatroom_users: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          pin_hash: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          pin_hash?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          pin_hash?: string | null
        }
        Relationships: []
      }
      complaints: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported_nickname: string
          reporter_nickname: string
          room: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reported_nickname: string
          reporter_nickname: string
          room: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported_nickname?: string
          reporter_nickname?: string
          room?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_at: string
          id: string
          user_name: string
        }
        Insert: {
          attempt_at?: string
          id?: string
          user_name: string
        }
        Update: {
          attempt_at?: string
          id?: string
          user_name?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          file_type: string | null
          file_url: string | null
          id: string
          is_pinned: boolean
          pinned_by: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_pinned?: boolean
          pinned_by?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_pinned?: boolean
          pinned_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "chatroom_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "chatroom_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pc_messages: {
        Row: {
          color: string
          content: string | null
          created_at: string
          file_type: string | null
          file_url: string | null
          id: string
          nickname: string
          reply_to: string | null
          room: string
        }
        Insert: {
          color?: string
          content?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          nickname: string
          reply_to?: string | null
          room: string
        }
        Update: {
          color?: string
          content?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          nickname?: string
          reply_to?: string | null
          room?: string
        }
        Relationships: [
          {
            foreignKeyName: "pc_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "pc_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      pc_stars: {
        Row: {
          created_at: string
          id: string
          message_id: string
          nickname: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          nickname: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          nickname?: string
        }
        Relationships: [
          {
            foreignKeyName: "pc_stars_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "pc_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_messages: {
        Row: {
          content: string | null
          created_at: string
          file_type: string | null
          file_url: string | null
          id: string
          is_pinned: boolean
          pinned_by: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_pinned?: boolean
          pinned_by?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_pinned?: boolean
          pinned_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "chatroom_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secret_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "chatroom_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_with_pin: {
        Args: { _color: string; _name: string; _pin: string }
        Returns: undefined
      }
      delete_own_message:
        | {
            Args: { _message_id: string; _table?: string; _user_id: string }
            Returns: undefined
          }
        | {
            Args: {
              _message_id: string
              _pin?: string
              _table?: string
              _user_id: string
            }
            Returns: undefined
          }
      pin_message: {
        Args: {
          _message_id: string
          _pin: string
          _table?: string
          _user_id: string
        }
        Returns: undefined
      }
      update_user_color: {
        Args: { _color: string; _pin?: string; _user_id: string }
        Returns: undefined
      }
      verify_user_pin: {
        Args: { _name: string; _pin: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
