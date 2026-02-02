import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client for the orchestrator schema (main app data)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'orchestrator'
  }
})

// Client for public schema (if needed)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey)

// Helper types based on our schema
export type Project = {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  health_score?: number
  priority: number
  created_at: string
  updated_at: string
}

export type Task = {
  id: string
  title: string
  description?: string
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  project_id?: string
  due_date?: string
  scheduled_start?: string
  scheduled_end?: string
  duration_minutes?: number
  energy_level?: 'high' | 'medium' | 'low'
  created_at: string
  updated_at: string
}

export type FitnessMetric = {
  id: string
  date: string
  body_battery?: number
  vo2_max?: number
  hrv?: number
  sleep_score?: number
  sleep_hours?: number
  resting_hr?: number
  steps?: number
  calories_burned?: number
  weight_kg?: number
  mood_score?: number
  energy_score?: number
  notes?: string
}

export type FinanceEntry = {
  id: string
  date: string
  source: string
  description?: string
  hours: number
  rate_nok: number
  mva_rate: number
  subtotal_nok: number
  total_nok: number
  invoiced: boolean
  paid: boolean
}

export type Calendar = {
  id: string
  user_id: string
  provider: 'google' | 'apple' | 'outlook' | 'internal'
  external_id?: string
  name: string
  email?: string
  color?: string
  sync_enabled: boolean
  last_synced_at?: string
  webhook_channel_id?: string
  webhook_expiration?: string
  calendars?: { id: string; summary: string; primary: boolean }[]
}

export type CalendarEvent = {
  id: string
  calendar_id: string
  external_id?: string
  title: string
  description?: string
  location?: string
  starts_at: string
  ends_at: string
  is_all_day: boolean
  status: string
}
