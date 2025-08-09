import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
})

// Types for our database tables
export interface Memory {
  id: string
  title: string
  description: string
  latitude: number
  longitude: number
  image_url?: string
  tags: string[]
  date: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  username: string
  created_at: string
  updated_at: string
} 