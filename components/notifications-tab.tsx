'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  user_id: string
  title: string
  body: string | null
  url: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
  pushalert_notification_id: string | null
  icon: string | null
  image: string | null
  data: any
}

interface NotificationsTabProps {
  userId: string
}

export default function NotificationsTab({ userId }: NotificationsTabProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  // 通知一覧の取得
  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        // テーブルが存在しない場合のエラーを適切に処理
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Notifications table does not exist yet. Please run supabase-notifications-setup.sql in Supabase.')
          setNotifications([])
          setUnreadCount(0)
          setLoading(false)
          return
        }
        throw error
      }

      setNotifications(data || [])
      const unread = (data || []).filter(n => !n.is_read).length
      setUnreadCount(unread)
    } catch (error: any) {
      // テーブルが存在しない場合のエラーを適切に処理
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('Notifications table does not exist yet. Please run supabase-notifications-setup.sql in Supabase.')
        setNotifications([])
        setUnreadCount(0)
      } else {
        console.error('Error fetching notifications:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  // 通知を既読にする
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error

      // UIを更新
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
    }
  }

  // 全ての通知を既読にする
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error

      // UIを更新
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // 通知を削除する
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error

      // UIを更新
      const deletedNotification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error: any) {
      console.error('Error deleting notification:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // リアルタイム更新のサブスクリプション
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // 通知をクリックしたときの処理
  const handleNotificationClick = async (notification: Notification) => {
    // 既読にする
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    // URLがあれば遷移
    if (notification.url) {
      window.location.href = notification.url
    }
  }

  // 日時のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'たった今'
    if (diffMins < 60) return `${diffMins}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    if (diffDays < 7) return `${diffDays}日前`
    
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <p className="text-zinc-600 dark:text-zinc-400">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
          お知らせ
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            全て既読にする
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-600 dark:text-zinc-400">通知はありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`
                p-4 rounded-lg border cursor-pointer transition-colors
                ${notification.is_read
                  ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                    <h3 className={`font-medium ${notification.is_read ? 'text-zinc-700 dark:text-zinc-300' : 'text-black dark:text-zinc-50'}`}>
                      {notification.title}
                    </h3>
                  </div>
                  {notification.body && (
                    <p className={`text-sm mb-2 ${notification.is_read ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {notification.body}
                    </p>
                  )}
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNotification(notification.id)
                  }}
                  className="ml-4 text-zinc-400 hover:text-red-500 transition-colors"
                  title="削除"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

