import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CheckUserIdPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 管理者かどうか確認
  const { data: adminData } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const isAdmin = !!adminData

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-zinc-900">
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-black dark:text-zinc-50 mb-6">
            ユーザー情報確認
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                メールアドレス
              </label>
              <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-black dark:text-zinc-50">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                ユーザーID（UUID）
              </label>
              <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-black dark:text-zinc-50 font-mono text-sm break-all">
                {user.id}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                管理者ステータス
              </label>
              <div className={`px-4 py-2 rounded-lg ${
                isAdmin 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}>
                {isAdmin ? '✓ 管理者です' : '✗ 管理者ではありません'}
              </div>
            </div>

            {!isAdmin && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h2 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  管理者になるには
                </h2>
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                  SupabaseのSQLエディタで以下のSQLを実行してください：
                </p>
                <div className="bg-zinc-900 dark:bg-zinc-950 p-3 rounded font-mono text-xs text-green-400 overflow-x-auto">
                  <code>
                    INSERT INTO admins (user_id) VALUES ('{user.id}') ON CONFLICT (user_id) DO NOTHING;
                  </code>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                  SQL実行後、このページをリロードしてください。
                </p>
              </div>
            )}

            {isAdmin && (
              <div className="mt-6">
                <a
                  href="/admin"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  管理者ダッシュボードへ
                </a>
              </div>
            )}

            <div className="mt-6">
              <a
                href="/"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50"
              >
                ← 一般画面に戻る
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

