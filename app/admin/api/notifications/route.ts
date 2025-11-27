import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { NextResponse } from 'next/server'

// 管理者が通知を作成するAPI
export async function POST(request: Request) {
  const adminStatus = await isAdmin()
  
  if (!adminStatus) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { user_id, title, body: notificationBody, url, icon, image, data } = body

    // 必須フィールドのバリデーション
    if (!user_id || !title) {
      return NextResponse.json(
        { error: 'user_id and title are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 通知をデータベースに保存
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        title,
        body: notificationBody || null,
        url: url || null,
        icon: icon || null,
        image: image || null,
        data: data || null,
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /admin/api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// 全ユーザーに通知を送信するAPI（バッチ作成）
export async function PUT(request: Request) {
  const adminStatus = await isAdmin()
  
  if (!adminStatus) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, body: notificationBody, url, icon, image, data } = body

    // 必須フィールドのバリデーション
    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 全ユーザーのIDを取得（複数のソースから取得して統合）
    const userIdsSet = new Set<string>()

    // 1. admin_daily_reportsから取得
    const { data: reportsData, error: reportsError } = await supabase
      .from('admin_daily_reports')
      .select('user_id')
      .limit(1000)

    if (!reportsError && reportsData) {
      reportsData.forEach(r => {
        if (r.user_id) {
          userIdsSet.add(r.user_id)
        }
      })
    } else {
      console.warn('Error fetching users from reports:', reportsError)
    }

    // 2. admin_todosから取得（フォールバック）
    const { data: todosData, error: todosError } = await supabase
      .from('admin_todos')
      .select('user_id')
      .limit(1000)

    if (!todosError && todosData) {
      todosData.forEach(t => {
        if (t.user_id) {
          userIdsSet.add(t.user_id)
        }
      })
    } else {
      console.warn('Error fetching users from todos:', todosError)
    }

    // ユーザーIDのリストを作成
    const userIds = Array.from(userIdsSet)

    if (userIds.length === 0) {
      // ユーザーが存在しない場合のエラーメッセージ
      return NextResponse.json(
        { 
          error: 'No users found', 
          details: 'ユーザーが見つかりませんでした。データベースに日報またはToDoが登録されているユーザーが必要です。',
          suggestion: 'まず、一般画面から日報やToDoを作成してから、通知を送信してください。'
        },
        { status: 404 }
      )
    }

    console.log(`Found ${userIds.length} users to send notifications to`)

    // 全ユーザーに通知を作成
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      body: notificationBody || null,
      url: url || null,
      icon: icon || null,
      image: image || null,
      data: data || null,
      is_read: false,
    }))

    // バッチで通知を作成（一度に挿入できる数の制限を考慮）
    const batchSize = 100
    const allCreatedNotifications: any[] = []
    let hasError = false
    let lastError: any = null

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      
      const { data: createdNotifications, error: createError } = await supabase
        .from('notifications')
        .insert(batch)
        .select()

      if (createError) {
        console.error(`Error creating notifications batch ${i / batchSize + 1}:`, createError)
        hasError = true
        lastError = createError
        // エラーがあっても続行（部分的に成功する可能性がある）
      } else if (createdNotifications) {
        allCreatedNotifications.push(...createdNotifications)
      }
    }

    if (hasError && allCreatedNotifications.length === 0) {
      // すべてのバッチが失敗した場合
      return NextResponse.json(
        { 
          error: 'Failed to create notifications',
          details: lastError?.message || 'Unknown error',
          hint: lastError?.code === '42P01' 
            ? 'notificationsテーブルが存在しません。supabase-notifications-setup.sqlを実行してください。'
            : 'データベースエラーが発生しました。詳細を確認してください。'
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: `Created ${allCreatedNotifications.length} out of ${notifications.length} notifications`,
        created: allCreatedNotifications.length,
        total: notifications.length,
        notifications: allCreatedNotifications,
        ...(hasError ? { warning: 'Some notifications failed to create' } : {})
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in PUT /admin/api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

