import { createClient } from '@/lib/supabase/server'

// 管理者メールアドレスのリスト（アプリケーション側でもチェック）
const ADMIN_EMAILS = ['nittonotakumi@gmail.com']

/**
 * 現在のユーザーが管理者かどうかを確認
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  // メールアドレスでチェック（アプリケーション側のフォールバック）
  if (ADMIN_EMAILS.includes(user.email || '')) {
    // メールアドレスが管理者リストに含まれている場合、管理者テーブルにも追加
    await supabase
      .from('admins')
      .upsert({ user_id: user.id }, { onConflict: 'user_id' })
    
    return true
  }

  // 管理者テーブルでチェック
  const { data, error } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return !error && !!data
}

/**
 * 管理者チェック付きでSupabaseクライアントを取得
 * 管理者でない場合はnullを返す
 */
export async function getAdminClient() {
  const isAdminUser = await isAdmin()
  
  if (!isAdminUser) {
    return null
  }

  return await createClient()
}

