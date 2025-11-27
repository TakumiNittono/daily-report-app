'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NotificationSyncProps {
  userId: string
}

export default function NotificationSync({ userId }: NotificationSyncProps) {
  const supabase = createClient()

  // 通知をデータベースに保存する関数
  const saveNotificationToDatabase = useCallback(async (notificationData: any) => {
    try {
      console.log('Saving notification to database:', notificationData)

      // 既に同じ通知が存在するかチェック（タイトルと本文で判定、1分以内）
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('title', notificationData.title || '通知')
        .eq('body', notificationData.body || '')
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // 1分以内の通知のみチェック
        .maybeSingle()

      if (!existing) {
        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: notificationData.title || '通知',
            body: notificationData.body || null,
            url: notificationData.url || notificationData.data?.url || null,
            pushalert_notification_id: notificationData.id || notificationData.data?.id || null,
            icon: notificationData.icon || notificationData.data?.icon || null,
            image: notificationData.image || notificationData.data?.image || null,
            data: notificationData.data || notificationData || null,
            is_read: false,
          })

        if (error) {
          console.error('Error saving notification:', error)
        } else {
          console.log('✅ Notification saved to database:', notificationData.title)
        }
      } else {
        console.log('⚠️ Notification already exists, skipping:', notificationData.title)
      }
    } catch (error) {
      console.error('Error handling push notification:', error)
    }
  }, [userId, supabase])

  // 通知を既読にする関数
  const markNotificationAsRead = useCallback(async (notificationData: any) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('title', notificationData.title || '通知')
        .eq('is_read', false)

      if (error) {
        console.error('Error marking notification as read:', error)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [userId, supabase])

  useEffect(() => {
    // Service Workerからのメッセージをリッスン
    if ('serviceWorker' in navigator) {
      const handleServiceWorkerMessage = async (event: MessageEvent) => {
        console.log('Service Worker message received:', event.data)
        
        if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
          const notificationData = event.data.notification
          console.log('📬 Received push notification from service worker:', notificationData)

          // 通知をデータベースに保存
          await saveNotificationToDatabase(notificationData)
        }
        
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          const notificationData = event.data.notification
          console.log('👆 Notification clicked:', notificationData)

          // 通知を既読にする
          await markNotificationAsRead(notificationData)
        }
      }

      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
      
      // クリーンアップ
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
      }
    }

    // ブラウザの通知表示を監視（フォールバック）
    // 通知が表示されたときに自動的にデータベースに保存を試みる
    const checkForNotifications = () => {
      // この方法では、PushAlertが表示した通知を直接キャプチャできないため
      // Service Workerからのメッセージに依存する
    }

    // 定期的にService Workerの状態を確認（デバッグ用）
    const interval = setInterval(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            console.log('Service Worker registered:', registration.scope)
          }
        })
      }
    }, 30000) // 30秒ごとに確認

    return () => {
      clearInterval(interval)
    }
  }, [saveNotificationToDatabase, markNotificationAsRead])

  return null
}

