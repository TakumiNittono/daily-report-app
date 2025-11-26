'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DailyReport } from '@/types'

interface DailyReportFormProps {
  userId: string
  date: string // YYYY-MM-DD形式
}

export default function DailyReportForm({ userId, date }: DailyReportFormProps) {
  const [reflection, setReflection] = useState('')
  const [wakeUpTime, setWakeUpTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const supabase = createClient()

  // 日報データの取得
  const fetchDailyReport = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116はレコードが見つからないエラー
        console.error('Supabase error:', error)
        throw error
      }

      if (data) {
        setReflection(data.reflection || '')
        setWakeUpTime(data.wake_up_time || '')
      }
    } catch (error: any) {
      console.error('Error fetching daily report:', error)
      const errorMessage = error?.message || error?.toString() || '不明なエラー'
      console.error('Error details:', {
        message: errorMessage,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDailyReport()
  }, [userId, date])

  // 日報の保存
  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('daily_reports')
        .upsert({
          user_id: userId,
          date,
          reflection: reflection.trim() || null,
          wake_up_time: wakeUpTime || null,
        }, {
          onConflict: 'user_id,date'
        })

      if (error) throw error
      
      setLastSaved(new Date())
    } catch (error: any) {
      console.error('Error saving daily report:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 自動保存（3秒のデバウンス）
  useEffect(() => {
    if (loading) return

    const timer = setTimeout(() => {
      if (reflection || wakeUpTime) {
        handleSave()
      }
    }, 3000)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reflection, wakeUpTime, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 今日の振り返り */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
          今日の振り返り
        </h2>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="今日の気付きや反省、学んだことを記録しましょう..."
          className="w-full h-32 px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {lastSaved && `最終保存: ${lastSaved.toLocaleTimeString()}`}
            {!lastSaved && '自動保存されます'}
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '手動保存'}
          </button>
        </div>
      </div>

      {/* 明日の準備 */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
          明日の準備
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              明日の目標起床時間
            </label>
            <input
              type="time"
              value={wakeUpTime}
              onChange={(e) => setWakeUpTime(e.target.value)}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

