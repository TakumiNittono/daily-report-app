'use client'

import { useState, useEffect } from 'react'
import { TabType } from '@/types'
import TodayTab from './today-tab'
import HistoryTab from './history-tab'
import TodoListByDate from './todo-list-by-date'
import NotificationsTab from './notifications-tab'
import NotificationSync from '@/app/components/NotificationSync'
import { createClient } from '@/lib/supabase/client'

interface TabNavigationProps {
  userId: string
}

export default function TabNavigation({ userId }: TabNavigationProps) {
  const [activeTab, setActiveTab] = useState<TabType>('today')
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  // 未読通知数を取得
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false)

        if (error) {
          // テーブルが存在しない場合は0を返す（エラーをログに残す）
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.warn('Notifications table does not exist yet. Please run supabase-notifications-setup.sql in Supabase.')
            setUnreadCount(0)
            return
          }
          throw error
        }
        setUnreadCount(count || 0)
      } catch (error: any) {
        // テーブルが存在しない場合のエラーを適切に処理
        if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
          console.warn('Notifications table does not exist yet. Please run supabase-notifications-setup.sql in Supabase.')
          setUnreadCount(0)
        } else {
          console.error('Error fetching unread count:', error)
        }
      }
    }

    fetchUnreadCount()

    // リアルタイム更新のサブスクリプション
    const channel = supabase
      .channel('notifications-count-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  return (
    <div>
      <NotificationSync userId={userId} />
      {/* タブナビゲーション */}
      <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'today'
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'text-zinc-600 dark:text-zinc-400 border-transparent hover:text-black dark:hover:text-zinc-50'
          }`}
        >
          今日の日報
        </button>
        <button
          onClick={() => setActiveTab('today_todos')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'today_todos'
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'text-zinc-600 dark:text-zinc-400 border-transparent hover:text-black dark:hover:text-zinc-50'
          }`}
        >
          今日のToDoリスト
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'text-zinc-600 dark:text-zinc-400 border-transparent hover:text-black dark:hover:text-zinc-50'
          }`}
        >
          過去の記録
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 relative ${
            activeTab === 'notifications'
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'text-zinc-600 dark:text-zinc-400 border-transparent hover:text-black dark:hover:text-zinc-50'
          }`}
        >
          お知らせ
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full min-w-[18px] text-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* タブコンテンツ */}
      <div>
        {activeTab === 'today' && <TodayTab userId={userId} />}
        {activeTab === 'today_todos' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
              今日のToDoリスト
            </h2>
            <TodoListByDate 
              userId={userId} 
              targetDate={new Date().toISOString().split('T')[0]}
              showStats={true}
              showFilter={true}
              showBulkActions={true}
            />
          </div>
        )}
        {activeTab === 'history' && <HistoryTab userId={userId} />}
        {activeTab === 'notifications' && <NotificationsTab userId={userId} />}
      </div>
    </div>
  )
}

