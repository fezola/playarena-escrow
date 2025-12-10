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
      escrow: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          match_id: string
          player_id: string
          released_at: string | null
          released_to: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          match_id: string
          player_id: string
          released_at?: string | null
          released_to?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          match_id?: string
          player_id?: string
          released_at?: string | null
          released_to?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_released_to_fkey"
            columns: ["released_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      game_invites: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          invite_code: string
          match_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          invite_code: string
          match_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          match_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_invites_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_chat: {
        Row: {
          created_at: string
          id: string
          match_id: string
          message: string
          player_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          message: string
          player_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          message?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_chat_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_chat_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_players: {
        Row: {
          deposit_tx_hash: string | null
          has_deposited: boolean
          id: string
          joined_at: string
          match_id: string
          player_id: string
          player_symbol: string | null
          score: number
        }
        Insert: {
          deposit_tx_hash?: string | null
          has_deposited?: boolean
          id?: string
          joined_at?: string
          match_id: string
          player_id: string
          player_symbol?: string | null
          score?: number
        }
        Update: {
          deposit_tx_hash?: string | null
          has_deposited?: boolean
          id?: string
          joined_at?: string
          match_id?: string
          player_id?: string
          player_symbol?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          contract_match_id: string | null
          created_at: string
          creator_id: string
          currency: string
          current_round: number
          ended_at: string | null
          game_state: Json | null
          game_type: Database["public"]["Enums"]["game_type"]
          id: string
          players_required: number
          rounds: number
          stake_amount: number
          started_at: string | null
          state: Database["public"]["Enums"]["match_state"]
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          contract_match_id?: string | null
          created_at?: string
          creator_id: string
          currency?: string
          current_round?: number
          ended_at?: string | null
          game_state?: Json | null
          game_type: Database["public"]["Enums"]["game_type"]
          id?: string
          players_required?: number
          rounds?: number
          stake_amount: number
          started_at?: string | null
          state?: Database["public"]["Enums"]["match_state"]
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          contract_match_id?: string | null
          created_at?: string
          creator_id?: string
          currency?: string
          current_round?: number
          ended_at?: string | null
          game_state?: Json | null
          game_type?: Database["public"]["Enums"]["game_type"]
          id?: string
          players_required?: number
          rounds?: number
          stake_amount?: number
          started_at?: string | null
          state?: Database["public"]["Enums"]["match_state"]
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moves: {
        Row: {
          created_at: string
          id: string
          match_id: string
          move_data: Json
          move_number: number
          player_id: string
          round_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          move_data: Json
          move_number: number
          player_id: string
          round_number: number
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          move_data?: Json
          move_number?: number
          player_id?: string
          round_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "moves_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moves_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          base_balance: number | null
          created_at: string
          current_streak: number
          display_name: string | null
          encrypted_private_key: string | null
          id: string
          level: number | null
          total_earnings: number
          total_losses: number
          total_wins: number
          updated_at: string
          usdt_balance: number | null
          user_id: string
          username: string | null
          wallet_address: string | null
          wallet_balance: number | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          base_balance?: number | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          encrypted_private_key?: string | null
          id?: string
          level?: number | null
          total_earnings?: number
          total_losses?: number
          total_wins?: number
          updated_at?: string
          usdt_balance?: number | null
          user_id: string
          username?: string | null
          wallet_address?: string | null
          wallet_balance?: number | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          base_balance?: number | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          encrypted_private_key?: string | null
          id?: string
          level?: number | null
          total_earnings?: number
          total_losses?: number
          total_wins?: number
          updated_at?: string
          usdt_balance?: number | null
          user_id?: string
          username?: string | null
          wallet_address?: string | null
          wallet_balance?: number | null
          xp?: number | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          currency: string
          id: string
          match_id: string | null
          status: string
          tx_hash: string | null
          tx_type: string
          user_id: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          match_id?: string | null
          status?: string
          tx_hash?: string | null
          tx_type: string
          user_id: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          match_id?: string | null
          status?: string
          tx_hash?: string | null
          tx_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
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
      refund_escrow: { Args: { _match_id: string }; Returns: Json }
      release_escrow_to_winner: {
        Args: { _match_id: string; _winner_id: string }
        Returns: Json
      }
    }
    Enums: {
      game_type:
        | "tic-tac-toe"
        | "chess"
        | "scrabble"
        | "connect-four"
        | "rock-paper-scissors"
        | "wordle"
        | "checkers"
        | "dots-and-boxes"
        | "boggle"
        | "pool"
        | "ping-pong"
        | "battleship"
        | "trivia"
      match_state:
        | "waiting"
        | "depositing"
        | "active"
        | "complete"
        | "cancelled"
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
      game_type: [
        "tic-tac-toe",
        "chess",
        "scrabble",
        "connect-four",
        "rock-paper-scissors",
        "wordle",
        "checkers",
        "dots-and-boxes",
        "boggle",
        "pool",
        "ping-pong",
        "battleship",
        "trivia",
      ],
      match_state: ["waiting", "depositing", "active", "complete", "cancelled"],
    },
  },
} as const
