'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminNotificationForm from './admin-notification-form'

interface UserStats {
  user_id: string
  email: string
  daily_reports_count: number
  todos_count: number
  completed_todos_count: number
  latest_report_date: string | null
  reports?: any[]
  todos?: any[]
}

interface AdminStats {
  total_users: number
  total_reports: number
  total_todos: number
  total_completed_todos: number
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserStats[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // 全ユーザーの統計情報を取得
  const fetchUserStats = async () => {
    try {
      // サーバーAPIから全ユーザーデータを取得
      const response = await fetch('/admin/api/users')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', response.status, errorData)
        throw new Error(`Failed to fetch users: ${response.status}`)
      }

      const data = await response.json()
      console.log('Fetched users data:', data)
      
      if (!data.users) {
        console.error('No users in response:', data)
        throw new Error('Invalid response format')
      }

      const usersData = data.users

      // ユーザー統計を整形（メールアドレスは既にAPIから取得済み）
      const userStats = usersData.map((user: any) => ({
        user_id: user.user_id,
        email: user.email || `ユーザー ${user.user_id.substring(0, 8)}...`,
        daily_reports_count: user.daily_reports_count,
        todos_count: user.todos_count,
        completed_todos_count: user.completed_todos_count,
        latest_report_date: user.latest_report_date,
        reports: user.reports,
        todos: user.todos
      }))

      setUsers(userStats)

      // 全体統計を計算
      const totalReports = usersData.reduce((sum: number, u: any) => sum + u.daily_reports_count, 0)
      const totalTodos = usersData.reduce((sum: number, u: any) => sum + u.todos_count, 0)
      const totalCompletedTodos = usersData.reduce((sum: number, u: any) => sum + u.completed_todos_count, 0)

      setStats({
        total_users: usersData.length,
        total_reports: totalReports,
        total_todos: totalTodos,
        total_completed_todos: totalCompletedTodos
      })
    } catch (error: any) {
      console.error('Error fetching user stats:', error)
      setError(error.message || 'データの取得に失敗しました')
      // フォールバック: 直接Supabaseから取得
      try {
        console.log('Using fallback: fetching directly from Supabase')
        const [reportsResult, todosResult] = await Promise.all([
          supabase
            .from('daily_reports')
            .select('user_id, date, reflection, wake_up_time')
            .limit(1000),
          supabase
            .from('todos')
            .select('user_id, title, is_completed, target_date, created_at')
            .limit(1000)
        ])

        if (reportsResult.error) {
          console.error('Reports error:', reportsResult.error)
        }
        if (todosResult.error) {
          console.error('Todos error:', todosResult.error)
        }

        const reportsData = reportsResult.data || []
        const todosData = todosResult.data || []

        const allUserIds = [
          ...new Set([
            ...(reportsData.map(r => r.user_id) || []),
            ...(todosData.map(t => t.user_id) || [])
          ])
        ]

        // 既に取得したデータから統計を計算
        const userStats = allUserIds.map((userId) => {
          const userReports = reportsData.filter(r => r.user_id === userId) || []
          const userTodos = todosData.filter(t => t.user_id === userId) || []
          const completedTodos = userTodos.filter(t => t.is_completed)

          const latestReport = userReports.length > 0 
            ? userReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date
            : null

          return {
            user_id: userId,
            email: `ユーザー ${userId.substring(0, 8)}...`,
            daily_reports_count: userReports.length,
            todos_count: userTodos.length,
            completed_todos_count: completedTodos.length,
            latest_report_date: latestReport,
            reports: userReports,
            todos: userTodos
          }
        })

        setUsers(userStats)

        // 全体統計を計算
        const totalReports = reportsData.length
        const totalTodos = todosData.length
        const totalCompletedTodos = todosData.filter(t => t.is_completed).length

        setStats({
          total_users: allUserIds.length,
          total_reports: totalReports,
          total_todos: totalTodos,
          total_completed_todos: totalCompletedTodos
        })
      } catch (fallbackError: any) {
        console.error('Fallback error:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserStats()

    // リアルタイム更新のサブスクリプション
    const channel = supabase
      .channel('admin-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_reports',
        },
        () => {
          fetchUserStats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
        },
        () => {
          fetchUserStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          <p className="font-medium mb-1">エラーが発生しました</p>
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-2">
            RLSポリシーが正しく設定されているか確認してください。SupabaseのSQLエディタで <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">supabase-admin-rls-policies.sql</code> を実行してください。
          </p>
        </div>
      )}

      {/* お知らせ作成フォーム */}
      <AdminNotificationForm />

      {/* 全体統計 */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">総ユーザー数</div>
            <div className="text-3xl font-bold text-black dark:text-zinc-50">{stats.total_users}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">総日報数</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total_reports}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">総ToDo数</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.total_todos}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">完了ToDo数</div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.total_completed_todos}</div>
          </div>
        </div>
      )}

      {/* ユーザー一覧 */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
            ユーザー一覧
          </h2>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {users.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
              ユーザーが見つかりません
            </div>
          ) : (
            users.map((user) => (
              <button
                key={user.user_id}
                onClick={() => setSelectedUserId(user.user_id)}
                className="w-full p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-black dark:text-zinc-50">
                      {user.email}
                    </p>
                    <div className="flex gap-4 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <span>日報: {user.daily_reports_count}件</span>
                      <span>ToDo: {user.todos_count}件</span>
                      <span>完了: {user.completed_todos_count}件</span>
                    </div>
                  </div>
                  {user.latest_report_date && (
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      最終更新: {new Date(user.latest_report_date).toLocaleDateString('ja-JP')}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ユーザー詳細モーダル */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          userReports={users.find(u => u.user_id === selectedUserId)?.reports}
          userTodos={users.find(u => u.user_id === selectedUserId)?.todos}
        />
      )}
    </div>
  )
}

// ユーザー詳細モーダルコンポーネント
function UserDetailModal({ userId, onClose, userReports, userTodos }: { 
  userId: string
  onClose: () => void
  userReports?: any[]
  userTodos?: any[]
}) {
  const [reports, setReports] = useState<any[]>(userReports || [])
  const [todos, setTodos] = useState<any[]>(userTodos || [])
  const [loading, setLoading] = useState(!userReports || !userTodos)
  const supabase = createClient()

  useEffect(() => {
    // 既にデータが渡されている場合はスキップ
    if (userReports && userTodos) {
      setReports(userReports)
      setTodos(userTodos)
      setLoading(false)
      return
    }

    const fetchUserData = async () => {
      try {
        const [reportsResult, todosResult] = await Promise.all([
          supabase
            .from('daily_reports')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(50),
          supabase
            .from('todos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100)
        ])

        setReports(reportsResult.data || [])
        setTodos(todosResult.data || [])
      } catch (error: any) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId, userReports, userTodos])

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-black dark:text-zinc-50">
              ユーザー詳細
            </h3>
            <button
              onClick={onClose}
              className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 日報一覧 */}
              <div>
                <h4 className="text-lg font-medium text-black dark:text-zinc-50 mb-4">
                  日報 ({reports.length}件)
                </h4>
                <div className="space-y-3">
                  {reports.length === 0 ? (
                    <p className="text-zinc-600 dark:text-zinc-400">日報がありません</p>
                  ) : (
                    reports.map((report, index) => (
                      <div
                        key={report.id || `report-${index}-${report.date}`}
                        className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-black dark:text-zinc-50">
                            {new Date(report.date).toLocaleDateString('ja-JP')}
                          </p>
                          {report.wake_up_time && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              起床時間: {report.wake_up_time}
                            </p>
                          )}
                        </div>
                        {report.reflection && (
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                            {report.reflection}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ToDo一覧 */}
              <div>
                <h4 className="text-lg font-medium text-black dark:text-zinc-50 mb-4">
                  ToDo ({todos.length}件)
                </h4>
                <div className="space-y-2">
                  {todos.length === 0 ? (
                    <p className="text-zinc-600 dark:text-zinc-400">ToDoがありません</p>
                  ) : (
                    todos.map((todo, index) => (
                      <div
                        key={todo.id || `todo-${index}-${todo.created_at}`}
                        className={`flex items-center gap-2 p-3 rounded-lg ${
                          todo.is_completed
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : 'bg-zinc-50 dark:bg-zinc-800'
                        }`}
                      >
                        <span className={todo.is_completed ? 'text-green-600 dark:text-green-400' : ''}>
                          {todo.is_completed ? '✓' : '○'}
                        </span>
                        <span
                          className={`flex-1 ${
                            todo.is_completed
                              ? 'line-through text-zinc-500 dark:text-zinc-500'
                              : 'text-black dark:text-zinc-50'
                          }`}
                        >
                          {todo.title}
                        </span>
                        {todo.target_date && (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(todo.target_date).toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

