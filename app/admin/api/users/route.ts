import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const adminStatus = await isAdmin()
  
  if (!adminStatus) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  try {
    // 全ユーザーのデータを取得（ビューを使用してメールアドレスも取得）
    const [reportsResult, todosResult] = await Promise.all([
      supabase
        .from('admin_daily_reports')
        .select('user_id, user_email, date, reflection, wake_up_time')
        .order('date', { ascending: false }),
      supabase
        .from('admin_todos')
        .select('user_id, user_email, title, is_completed, target_date, created_at')
        .order('created_at', { ascending: false })
    ])

    // エラーチェック
    if (reportsResult.error) {
      console.error('Error fetching reports:', reportsResult.error)
      return NextResponse.json({ 
        error: 'Failed to fetch reports', 
        details: reportsResult.error.message 
      }, { status: 500 })
    }

    if (todosResult.error) {
      console.error('Error fetching todos:', todosResult.error)
      return NextResponse.json({ 
        error: 'Failed to fetch todos', 
        details: todosResult.error.message 
      }, { status: 500 })
    }

    const reportsData = reportsResult.data || []
    const todosData = todosResult.data || []

    // ユーザーIDのリストを取得
    const allUserIds = [
      ...new Set([
        ...(reportsData.map(r => r.user_id) || []),
        ...(todosData.map(t => t.user_id) || [])
      ])
    ]

    // 各ユーザーの統計を計算
    const users = allUserIds.map(userId => {
      const userReports = reportsData.filter(r => r.user_id === userId) || []
      const userTodos = todosData.filter(t => t.user_id === userId) || []
      const completedTodos = userTodos.filter(t => t.is_completed)

      const latestReport = userReports.length > 0 
        ? userReports[0].date 
        : null

      // メールアドレスを取得（reportsまたはtodosから）
      const email = userReports[0]?.user_email || userTodos[0]?.user_email || `ユーザー ${userId.substring(0, 8)}...`

      return {
        user_id: userId,
        email: email,
        daily_reports_count: userReports.length,
        todos_count: userTodos.length,
        completed_todos_count: completedTodos.length,
        latest_report_date: latestReport,
        reports: userReports,
        todos: userTodos
      }
    })

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

