'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NotificationSyncProps {
  userId: string
}

export default function NotificationSync({ userId }: NotificationSyncProps) {
  const supabase = createClient()

  useEffect(() => {
    // PushAlertの通知受信を監視
    if (typeof window !== 'undefined' && (window as any).PushAlert) {
      // PushAlertが通知を表示したときに呼ばれるコールバックを設定
      // 注意: PushAlertのAPIに応じて実装を調整する必要があります
      
      // 通知クリック時の処理
      const handleNotificationClick = async (notificationData: any) => {
        try {
          // 通知をデータベースに保存
          const { error } = await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              title: notificationData.title || '通知',
              body: notificationData.body || null,
              url: notificationData.url || null,
              pushalert_notification_id: notificationData.id || null,
              icon: notificationData.icon || null,
              image: notificationData.image || null,
              data: notificationData || null,
              is_read: false,
            })

          if (error) {
            console.error('Error saving notification:', error)
          }
        } catch (error) {
          console.error('Error handling notification:', error)
        }
      }

      // PushAlertのイベントをリッスン（PushAlertのAPIに応じて調整）
      // 例: (window as any).PushAlert.on('notification.click', handleNotificationClick)
    }

    // Service Workerからのメッセージをリッスン
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
          const notificationData = event.data.notification

          // 通知をデータベースに保存
          try {
            const { data: existing } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', userId)
              .eq('pushalert_notification_id', notificationData.id || '')
              .single()

            if (!existing) {
              const { error } = await supabase
                .from('notifications')
                .insert({
                  user_id: userId,
                  title: notificationData.title || '通知',
                  body: notificationData.body || null,
                  url: notificationData.url || null,
                  pushalert_notification_id: notificationData.id || null,
                  icon: notificationData.icon || null,
                  image: notificationData.image || null,
                  data: notificationData || null,
                  is_read: false,
                })

              if (error) {
                console.error('Error saving notification:', error)
              }
            }
          } catch (error) {
            console.error('Error handling push notification:', error)
          }
        }
      })
    }
  }, [userId, supabase])

  return null
}

