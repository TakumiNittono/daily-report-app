'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NotificationHandlerProps {
  userId: string
}

export default function NotificationHandler({ userId }: NotificationHandlerProps) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Service Workerの登録を確認
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        // 通知クリックイベントをリッスン
        navigator.serviceWorker.addEventListener('message', async (event) => {
          if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
            const notificationData = event.data.notification

            // 通知をデータベースに保存（まだ保存されていない場合）
            if (notificationData) {
              try {
                // 通知が既に存在するかチェック（PushAlertの通知IDなどで確認）
                const { data: existing } = await supabase
                  .from('notifications')
                  .select('id')
                  .eq('user_id', userId)
                  .eq('pushalert_notification_id', notificationData.id || '')
                  .single()

                if (!existing) {
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
                      data: notificationData.data || null,
                      is_read: false,
                    })

                  if (error) {
                    console.error('Error saving notification:', error)
                  }
                }

                // 通知を既読にする
                if (notificationData.id) {
                  await supabase
                    .from('notifications')
                    .update({ 
                      is_read: true,
                      read_at: new Date().toISOString()
                    })
                    .eq('user_id', userId)
                    .eq('pushalert_notification_id', notificationData.id)
                }

                // URLがあれば遷移
                if (notificationData.url) {
                  router.push(notificationData.url)
                } else {
                  // 通知タブに遷移
                  router.push('/#notifications')
                }
              } catch (error) {
                console.error('Error handling notification click:', error)
              }
            }
          }

          // プッシュ通知受信イベント
          if (event.data && event.data.type === 'NOTIFICATION_RECEIVED') {
            const notificationData = event.data.notification

            // 通知をデータベースに保存
            if (notificationData) {
              try {
                // 通知が既に存在するかチェック
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
                      data: notificationData.data || null,
                      is_read: false,
                    })

                  if (error) {
                    console.error('Error saving notification:', error)
                  } else {
                    // 通知が保存されたことをユーザーに知らせる（オプション）
                    console.log('Notification saved to database')
                  }
                }
              } catch (error) {
                console.error('Error handling notification received:', error)
              }
            }
          }
        })
      })
    }

    // ブラウザの通知APIで通知クリックをリッスン
    if ('Notification' in window && Notification.permission === 'granted') {
      // 既存の通知クリック処理があれば、それも処理
      // PushAlertが自動的に処理する場合は、この部分は不要かもしれません
    }
  }, [userId, router, supabase])

  return null
}

