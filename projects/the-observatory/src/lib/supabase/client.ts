import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
