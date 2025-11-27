export interface Todo {
  id: string
  user_id: string
  title: string
  is_completed: boolean
  target_date: string | null // DATE型
  created_at: string
}

export interface DailyReport {
  id: string
  user_id: string
  date: string // DATE型
  reflection: string | null
  wake_up_time: string | null // TIME型 (HH:MM:SS形式)
  created_at: string
  updated_at: string
}

export type TabType = 'today' | 'today_todos' | 'history' | 'notifications'

