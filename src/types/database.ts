// Database types for Supabase
// These types match the database schema defined in supabase/schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      seasons: {
        Row: {
          id: string;
          admin_id: string;
          name: string;
          start_date: string;
          num_weeks: number;
          num_courts: number;
          status: "active" | "completed" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          name: string;
          start_date: string;
          num_weeks?: number;
          num_courts?: number;
          status?: "active" | "completed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          name?: string;
          start_date?: string;
          num_weeks?: number;
          num_courts?: number;
          status?: "active" | "completed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          admin_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      season_players: {
        Row: {
          id: string;
          season_id: string;
          player_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          player_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          player_id?: string;
          created_at?: string;
        };
      };
      weeks: {
        Row: {
          id: string;
          season_id: string;
          week_number: number;
          date: string;
          status: "draft" | "finalized" | "completed";
          schedule_warnings: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          week_number: number;
          date: string;
          status?: "draft" | "finalized" | "completed";
          schedule_warnings?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          week_number?: number;
          date?: string;
          status?: "draft" | "finalized" | "completed";
          schedule_warnings?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      player_availability: {
        Row: {
          id: string;
          week_id: string;
          player_id: string;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          week_id: string;
          player_id: string;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          week_id?: string;
          player_id?: string;
          is_available?: boolean;
          created_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          week_id: string;
          round_number: number;
          court_number: number;
          team1_player1_id: string;
          team1_player2_id: string;
          team2_player1_id: string;
          team2_player2_id: string;
          team1_score: number | null;
          team2_score: number | null;
          status: "scheduled" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          week_id: string;
          round_number: number;
          court_number: number;
          team1_player1_id: string;
          team1_player2_id: string;
          team2_player1_id: string;
          team2_player2_id: string;
          team1_score?: number | null;
          team2_score?: number | null;
          status?: "scheduled" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          week_id?: string;
          round_number?: number;
          court_number?: number;
          team1_player1_id?: string;
          team1_player2_id?: string;
          team2_player1_id?: string;
          team2_player2_id?: string;
          team1_score?: number | null;
          team2_score?: number | null;
          status?: "scheduled" | "completed";
          created_at?: string;
          updated_at?: string;
        };
      };
      byes: {
        Row: {
          id: string;
          week_id: string;
          round_number: number;
          player_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          week_id: string;
          round_number: number;
          player_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          week_id?: string;
          round_number?: number;
          player_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      season_status: "active" | "completed" | "archived";
      week_status: "draft" | "finalized" | "completed";
      game_status: "scheduled" | "completed";
    };
  };
};
