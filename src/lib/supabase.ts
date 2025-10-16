import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create Supabase client for server-side operations (with service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types (we'll define these based on your schema)
export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string
          user_address: string
          service_type: string
          token_type: string
          amount: number
          service_details: any
          tx_digest: string
          pending_payment_id?: string
          clubkonnect_order_id?: string
          clubkonnect_request_id?: string
          status: string
          error?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_address: string
          service_type: string
          token_type: string
          amount: number
          service_details: any
          tx_digest: string
          pending_payment_id?: string
          clubkonnect_order_id?: string
          clubkonnect_request_id?: string
          status: string
          error?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_address?: string
          service_type?: string
          token_type?: string
          amount?: number
          service_details?: any
          tx_digest?: string
          pending_payment_id?: string
          clubkonnect_order_id?: string
          clubkonnect_request_id?: string
          status?: string
          error?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_activities: {
        Row: {
          id: string
          user_address: string
          activity_type: string
          activity_data: any
          created_at: string
        }
        Insert: {
          id?: string
          user_address: string
          activity_type: string
          activity_data: any
          created_at?: string
        }
        Update: {
          id?: string
          user_address?: string
          activity_type?: string
          activity_data?: any
          created_at?: string
        }
      }
      wallet_connections: {
        Row: {
          id: string
          user_address: string
          wallet_type: string
          connection_count: number
          last_connected_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_address: string
          wallet_type: string
          connection_count?: number
          last_connected_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_address?: string
          wallet_type?: string
          connection_count?: number
          last_connected_at?: string
          created_at?: string
        }
      }
      admin_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: any
          description?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: any
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: any
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
