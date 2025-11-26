'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Todo {
  id: string
  title: string
  is_completed: boolean
  created_at: string
}

interface TodoListProps {
  userId: string
}

type FilterType = 'all' | 'active' | 'completed'

export default function TodoList({ userId }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const supabase = createClient()

  // フィルター適用後のToDoリスト
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.is_completed)
      case 'completed':
        return todos.filter(todo => todo.is_completed)
      default:
        return todos
    }
  }, [todos, filter])

  // 統計情報
  const stats = useMemo(() => {
    const total = todos.length
    const completed = todos.filter(t => t.is_completed).length
    const active = total - completed
    return { total, completed, active }
  }, [todos])

  // エラーメッセージの日本語化
  const getErrorMessage = (error: any): string => {
    const message = error.message || error.toString() || ''
    
    if (message.includes('relation "todos" does not exist') || 
        message.includes('does not exist') ||
        message.includes('relation') && message.includes('not exist')) {
      return 'データベースのテーブルが作成されていません。SupabaseのSQLエディタでsupabase-setup.sqlを実行してください。'
    }
    
    if (message.includes('permission denied') || 
        message.includes('new row violates row-level security') ||
        message.includes('row-level security') ||
        message.includes('RLS')) {
      return 'アクセス権限がありません。RLSポリシーが正しく設定されているか確認してください。'
    }
    
    if (message.includes('JWT') || message.includes('auth')) {
      return '認証エラーが発生しました。再度ログインしてください。'
    }
    
    return `エラー: ${message}`
  }

  // ToDoリストの取得
  const fetchTodos = async () => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTodos(data || [])
    } catch (error: any) {
      console.error('Error fetching todos:', error)
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()

    // リアルタイム更新のサブスクリプション
    const channel = supabase
      .channel('todos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchTodos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // ToDoの追加
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTitle.trim()) return

    const titleToAdd = newTodoTitle.trim()
    setError(null)

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([
          {
            user_id: userId,
            title: titleToAdd,
            is_completed: false,
          },
        ])
        .select()

      if (error) throw error
      
      setNewTodoTitle('')
      await fetchTodos()
    } catch (error: any) {
      console.error('Error adding todo:', error)
      const errorMessage = getErrorMessage(error)
      setError(errorMessage)
      setNewTodoTitle(titleToAdd)
    }
  }

  // ToDoの編集開始
  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
  }

  // ToDoの編集保存
  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null)
      return
    }

    try {
      const { error } = await supabase
        .from('todos')
        .update({ title: editTitle.trim() })
        .eq('id', id)

      if (error) throw error
      
      setEditingId(null)
      setEditTitle('')
      await fetchTodos()
    } catch (error: any) {
      console.error('Error updating todo:', error)
      alert('ToDoの更新に失敗しました')
    }
  }

  // ToDoの編集キャンセル
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  // ToDoの完了状態を切り替え
  const handleToggleTodo = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    
    // 即座にUIを更新（楽観的更新）
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, is_completed: newStatus } : todo
      )
    )

    try {
      const { error } = await supabase
        .from('todos')
        .update({ is_completed: newStatus })
        .eq('id', id)

      if (error) {
        // エラーが発生した場合、リストを再取得して元に戻す
        await fetchTodos()
        throw error
      }
    } catch (error: any) {
      console.error('Error updating todo:', error.message)
      alert('ToDoの更新に失敗しました')
    }
  }

  // ToDoの削除
  const handleDeleteTodo = async (id: string) => {
    // 即座にUIから削除（楽観的更新）
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id))

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) {
        // エラーが発生した場合、リストを再取得して元に戻す
        await fetchTodos()
        throw error
      }
    } catch (error: any) {
      console.error('Error deleting todo:', error.message)
      alert('ToDoの削除に失敗しました')
    }
  }

  // 完了済みToDoを一括削除
  const handleClearCompleted = async () => {
    const completedIds = todos.filter(t => t.is_completed).map(t => t.id)
    if (completedIds.length === 0) return

    // 即座にUIから削除（楽観的更新）
    setTodos(prevTodos => prevTodos.filter(todo => !todo.is_completed))

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .in('id', completedIds)

      if (error) {
        // エラーが発生した場合、リストを再取得して元に戻す
        await fetchTodos()
        throw error
      }
    } catch (error: any) {
      console.error('Error clearing completed:', error.message)
      alert('削除に失敗しました')
    }
  }

  // すべてのToDoを完了/未完了に切り替え
  const handleToggleAll = async () => {
    const allCompleted = todos.every(t => t.is_completed)
    const newStatus = !allCompleted

    try {
      const { error } = await supabase
        .from('todos')
        .update({ is_completed: newStatus })
        .eq('user_id', userId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error toggling all:', error.message)
      alert('更新に失敗しました')
    }
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
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg shadow-sm">
          <p className="font-medium mb-1">エラーが発生しました</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">合計</div>
          <div className="text-2xl font-bold text-black dark:text-zinc-50">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">未完了</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">完了</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
        </div>
      </div>
      
      {/* ToDo追加フォーム */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
        <form onSubmit={handleAddTodo} className="flex gap-2">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="新しいToDoを入力..."
            className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            追加
          </button>
        </form>
      </div>

      {/* フィルターと一括操作 */}
      {todos.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
          <div className="flex gap-2">
            <button
              onClick={handleToggleAll}
              className="px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              {todos.every(t => t.is_completed) ? 'すべて未完了' : 'すべて完了'}
            </button>
            {stats.completed > 0 && (
              <button
                onClick={handleClearCompleted}
                className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                完了済みを削除
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'completed'] as FilterType[]).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                  filter === filterType
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {filterType === 'all' ? 'すべて' : filterType === 'active' ? '未完了' : '完了済み'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ToDoリスト */}
      <div className="space-y-2">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400">
              {filter === 'all' 
                ? 'ToDoがありません。新しいToDoを追加してください。'
                : filter === 'active'
                ? '未完了のToDoがありません。'
                : '完了済みのToDoがありません。'}
            </p>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className="group flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all"
            >
              <input
                type="checkbox"
                checked={todo.is_completed}
                onChange={(e) => {
                  e.stopPropagation()
                  handleToggleTodo(todo.id, todo.is_completed)
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              {editingId === todo.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(todo.id)
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    autoFocus
                    className="flex-1 px-3 py-1 border border-blue-500 rounded bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSaveEdit(todo.id)}
                    className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-sm bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-black dark:text-zinc-50 rounded transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <>
                  <span
                    onClick={() => handleStartEdit(todo)}
                    className={`flex-1 cursor-pointer ${
                      todo.is_completed
                        ? 'line-through text-zinc-400 dark:text-zinc-600'
                        : 'text-black dark:text-zinc-50'
                    }`}
                  >
                    {todo.title}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(todo)}
                      className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
