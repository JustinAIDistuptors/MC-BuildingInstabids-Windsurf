export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      attachments: {
        Row: {
          id: string
          message_id: string
          file_name: string
          file_type: string
          file_size: number
          file_url: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          file_name: string
          file_type: string
          file_size: number
          file_url: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          file_name?: string
          file_type?: string
          file_size?: number
          file_url?: string
          created_at?: string
        }
      }
      bids: {
        Row: {
          id: string
          project_id: string
          contractor_id: string
          amount: number
          status: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          contractor_id: string
          amount: number
          status: string
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          contractor_id?: string
          amount?: number
          status?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      contractor_aliases: {
        Row: {
          id: string
          project_id: string
          contractor_id: string
          alias: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          contractor_id: string
          alias: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          contractor_id?: string
          alias?: string
          created_at?: string
        }
      }
      message_recipients: {
        Row: {
          id: string
          message_id: string
          recipient_id: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          recipient_id: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          recipient_id?: string
          read_at?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          content: string
          created_at: string
          project_id: string
          message_type: string
          contractor_alias: string | null
        }
        Insert: {
          id?: string
          sender_id: string
          content: string
          created_at?: string
          project_id: string
          message_type?: string
          contractor_alias?: string | null
        }
        Update: {
          id?: string
          sender_id?: string
          content?: string
          created_at?: string
          project_id?: string
          message_type?: string
          contractor_alias?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          user_type: string
          company_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          user_type: string
          company_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          user_type?: string
          company_name?: string | null
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string
          status: string
          owner_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          status: string
          owner_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: string
          owner_id?: string
          created_at?: string
          updated_at?: string | null
        }
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
  }
}
