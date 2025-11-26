'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DailyReport, Todo } from '@/types'

interface HistoryTabProps {
  userId: string
}

export default function HistoryTab({ userId }: HistoryTabProps) {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null)
  const [selectedTodos, setSelectedTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // 日報リストの取得
  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(100)

      if (error) throw error
      setReports(data || [])
    } catch (error: any) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  // 選択された日の詳細を取得
  const fetchDateDetails = async (date: string) => {
    try {
      // 日報を取得
      const { data: reportData, error: reportError } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single()

      if (reportError && reportError.code !== 'PGRST116') {
        throw reportError
      }

      setSelectedReport(reportData || null)

      // その日のToDoを取得
      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .eq('target_date', date)
        .order('created_at', { ascending: false })

      if (todosError) throw todosError
      setSelectedTodos(todosData || [])
    } catch (error: any) {
      console.error('Error fetching date details:', error)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [userId])

  useEffect(() => {
    if (selectedDate) {
      fetchDateDetails(selectedDate)
    }
  }, [selectedDate])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-'
    const [hours, minutes] = timeString.split(':')
    return `${hours}:${minutes}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
        過去の記録
      </h2>

      {/* 日報リスト */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-medium text-black dark:text-zinc-50">
            記録一覧
          </h3>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {reports.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
              まだ記録がありません
            </div>
          ) : (
            reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedDate(report.date)}
                className={`w-full p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                  selectedDate === report.date ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-black dark:text-zinc-50">
                      {formatDate(report.date)}
                    </p>
                    {report.reflection && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                        {report.reflection}
                      </p>
                    )}
                  </div>
                  {report.wake_up_time && (
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {formatTime(report.wake_up_time)}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 詳細モーダル */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-black dark:text-zinc-50">
                  {formatDate(selectedDate)}
                </h3>
                <button
                  onClick={() => {
                    setSelectedDate(null)
                    setSelectedReport(null)
                    setSelectedTodos([])
                  }}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50"
                >
                  ✕
                </button>
              </div>

              {/* 振り返り */}
              {selectedReport?.reflection && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-black dark:text-zinc-50 mb-2">
                    振り返り
                  </h4>
                  <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {selectedReport.reflection}
                  </p>
                </div>
              )}

              {/* 起床時間 */}
              {selectedReport?.wake_up_time && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-black dark:text-zinc-50 mb-2">
                    目標起床時間
                  </h4>
                  <p className="text-zinc-700 dark:text-zinc-300">
                    {formatTime(selectedReport.wake_up_time)}
                  </p>
                </div>
              )}

              {/* 完了したToDo */}
              {selectedTodos.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-black dark:text-zinc-50 mb-4">
                    完了したToDo ({selectedTodos.filter(t => t.is_completed).length}件)
                  </h4>
                  <div className="space-y-2">
                    {selectedTodos
                      .filter(todo => todo.is_completed)
                      .map((todo) => (
                        <div
                          key={todo.id}
                          className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                        >
                          <span className="text-green-600 dark:text-green-400">✓</span>
                          <span className="text-zinc-700 dark:text-zinc-300 line-through">
                            {todo.title}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

