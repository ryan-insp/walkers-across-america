// ============================================================
// Database types — match the Supabase schema exactly
// ============================================================

export interface Challenge {
  id: string
  slug: string
  title: string
  year: number
  start_date: string
  end_date: string
  start_location_name: string
  end_location_name: string
  start_lat: number
  start_lng: number
  end_lat: number
  end_lng: number
  target_miles: number
  target_steps: number
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface RoutePoint {
  id: string
  challenge_id: string
  order_index: number
  name: string
  lat: number
  lng: number
  cumulative_mile_marker: number
  point_type: 'start' | 'checkpoint' | 'finish'
  created_at: string
}

export interface DailyActivity {
  id: string
  challenge_id: string
  activity_date: string
  miles: number | null
  steps: number | null
  source_priority: 'healthkit_miles' | 'healthkit_steps_converted' | 'manual'
  synced_at: string
}

export interface SyncEvent {
  id: string
  challenge_id: string
  sync_started_at: string
  sync_completed_at: string | null
  status: 'running' | 'success' | 'error'
  records_written: number
  error_message: string | null
  source: string
}

export interface Milestone {
  id: string
  challenge_id: string
  milestone_type: 'miles_100' | 'percent_10' | 'checkpoint' | 'fastest_week' | 'surprise'
  title: string
  body: string
  milestone_date: string
  trigger_value: number | null
  is_auto_generated: boolean
  is_visible: boolean
  created_at: string
}

export interface AppSettings {
  id: string
  challenge_id: string
  theme: string
  logo_url: string | null
  public_share_image_url: string | null
  map_style: string
  show_exact_values: boolean
  updated_at: string
}

export interface SmsSettings {
  id: string
  challenge_id: string
  enabled: boolean
  phone_number: string | null
  weekly_summary_enabled: boolean
  milestone_sms_enabled: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// Computed / API response types
// ============================================================

export interface ProgressData {
  total_miles: number
  total_steps: number
  percent_complete: number
  days_elapsed: number
  actual_pace_miles_per_day: number
  target_pace_miles_per_day: number
  ahead_behind_miles: number
  estimated_arrival_date: string | null
  current_location_name: string
  next_location_name: string | null
  current_position: { lat: number; lng: number } | null
  latest_milestone_text: string | null
}

export interface PublicPageData {
  challenge: Challenge
  progress: ProgressData
  route_points: RoutePoint[]
  milestones: Milestone[]
}

// ============================================================
// iOS sync payload
// ============================================================

export interface HealthKitSyncPayload {
  challenge_slug: string
  activities: {
    date: string        // YYYY-MM-DD
    miles?: number | null
    steps?: number | null
  }[]
}
