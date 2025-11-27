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

    // 全ユーザーのIDを取得（admin_daily_reportsビューからユーザーIDを取得）
    const { data: reportsData, error: reportsError } = await supabase
      .from('admin_daily_reports')
      .select('user_id')
      .limit(1000)

    if (reportsError) {
      console.error('Error fetching users from reports:', reportsError)
      // フォールバック: todosテーブルから取得
      const { data: todosData } = await supabase
        .from('admin_todos')
        .select('user_id')
        .limit(1000)

      if (!todosData || todosData.length === 0) {
        return NextResponse.json(
          { error: 'Failed to fetch users' },
          { status: 500 }
        )
      }

      // ユーザーIDのリストを作成（重複を削除）
      const userIds = [...new Set(todosData.map(t => t.user_id))]
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

      const { data: createdNotifications, error: createError } = await supabase
        .from('notifications')
        .insert(notifications)
        .select()

      if (createError) {
        console.error('Error creating notifications:', createError)
        return NextResponse.json(
          { error: 'Failed to create notifications', details: createError.message },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          message: `Created ${createdNotifications?.length || 0} notifications`,
          notifications: createdNotifications
        },
        { status: 201 }
      )
    }

    // ユーザーIDのリストを作成（重複を削除）
    const userIds = [...new Set((reportsData || []).map(r => r.user_id))]

    if (userIds.length === 0) {
      return NextResponse.json(
        { error: 'No users found' },
        { status: 404 }
      )
    }

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

    const { data: createdNotifications, error: createError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()

    if (createError) {
      console.error('Error creating notifications:', createError)
      return NextResponse.json(
        { error: 'Failed to create notifications', details: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: `Created ${createdNotifications?.length || 0} notifications`,
        notifications: createdNotifications 
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

