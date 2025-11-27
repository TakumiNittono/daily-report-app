import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * PushAlert Webhook エンドポイント
 * PushAlertから通知が送信されたときに、このエンドポイントが呼ばれます
 * 
 * 設定方法:
 * 1. PushAlertダッシュボードにログイン
 * 2. Settings > Webhooks セクションを開く
 * 3. Webhook URLを設定: https://your-domain.com/api/pushalert-webhook
 * 4. 通知送信イベントを選択（例: notification.sent）
 */

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log('PushAlert Webhook received:', JSON.stringify(body, null, 2))

    // PushAlertからのWebhookデータの形式を解析
    // 注意: PushAlertの実際のWebhook形式に応じて調整が必要です
    const notificationData = parsePushAlertWebhook(body)

    if (!notificationData) {
      console.warn('Invalid webhook data format:', body)
      return NextResponse.json(
        { error: 'Invalid webhook data format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 全ユーザーのIDを取得
    const userIds = await getAllUserIds(supabase)

    if (userIds.length === 0) {
      console.warn('No users found to send notifications to')
      return NextResponse.json(
        { error: 'No users found' },
        { status: 404 }
      )
    }

    // 全ユーザーに通知を作成
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title: notificationData.title || '通知',
      body: notificationData.body || notificationData.message || null,
      url: notificationData.url || notificationData.link || null,
      icon: notificationData.icon || null,
      image: notificationData.image || null,
      data: notificationData || null,
      pushalert_notification_id: notificationData.id || notificationData.notification_id || null,
      is_read: false,
    }))

    // バッチで通知を作成
    const batchSize = 100
    const allCreatedNotifications: any[] = []

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      
      const { data: createdNotifications, error: createError } = await supabase
        .from('notifications')
        .insert(batch)
        .select()

      if (createError) {
        console.error(`Error creating notifications batch ${i / batchSize + 1}:`, createError)
        // エラーがあっても続行
      } else if (createdNotifications) {
        allCreatedNotifications.push(...createdNotifications)
      }
    }

    console.log(`Created ${allCreatedNotifications.length} notifications from PushAlert webhook`)

    return NextResponse.json({
      success: true,
      message: `Created ${allCreatedNotifications.length} notifications`,
      created: allCreatedNotifications.length,
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error processing PushAlert webhook:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * PushAlert Webhookデータを解析
 * 注意: PushAlertの実際のWebhook形式に応じて調整が必要です
 */
function parsePushAlertWebhook(body: any): any {
  // パターン1: 標準的な形式
  if (body.notification) {
    return {
      id: body.notification.id,
      title: body.notification.title,
      body: body.notification.body || body.notification.message,
      url: body.notification.url || body.notification.link,
      icon: body.notification.icon,
      image: body.notification.image,
      ...body.notification,
    }
  }

  // パターン2: フラットな形式
  if (body.title || body.message) {
    return {
      id: body.id || body.notification_id,
      title: body.title,
      body: body.body || body.message,
      url: body.url || body.link,
      icon: body.icon,
      image: body.image,
      ...body,
    }
  }

  // パターン3: dataフィールド内に含まれる
  if (body.data) {
    return parsePushAlertWebhook(body.data)
  }

  // デフォルト: そのまま返す
  return body.title || body.message ? body : null
}

/**
 * 全ユーザーのIDを取得
 */
async function getAllUserIds(supabase: any): Promise<string[]> {
  const userIdsSet = new Set<string>()

  // 1. admin_daily_reportsから取得
  const { data: reportsData } = await supabase
    .from('admin_daily_reports')
    .select('user_id')
    .limit(1000)

  if (reportsData) {
    reportsData.forEach((r: { user_id: string }) => {
      if (r.user_id) {
        userIdsSet.add(r.user_id)
      }
    })
  }

  // 2. admin_todosから取得
  const { data: todosData } = await supabase
    .from('admin_todos')
    .select('user_id')
    .limit(1000)

  if (todosData) {
    todosData.forEach((t: { user_id: string }) => {
      if (t.user_id) {
        userIdsSet.add(t.user_id)
      }
    })
  }

  return Array.from(userIdsSet)
}

// GET メソッドもサポート（テスト用）
export async function GET() {
  return NextResponse.json({
    message: 'PushAlert Webhook endpoint is ready',
    instructions: 'Set this URL in your PushAlert dashboard: https://your-domain.com/api/pushalert-webhook',
  })
}

