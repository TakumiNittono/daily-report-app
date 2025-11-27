import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TabNavigation from '@/components/tab-navigation'
import { isAdmin } from '@/lib/admin'

export default async function Home() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminStatus = await isAdmin()

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-zinc-900">
      <main className="container mx-auto max-w-5xl px-4 py-8">
        {/* ヘッダー */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-black dark:text-zinc-50 mb-2">
                日報＆自己管理
          </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                {user.email}
          </p>
        </div>
            <div className="flex gap-4">
              {adminStatus && (
          <a
                  href="/admin"
                  className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
                  管理者画面
                </a>
              )}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
                  ログアウト
                </button>
              </form>
            </div>
        </div>
        </header>

        {/* タブナビゲーションとコンテンツ */}
        <TabNavigation userId={user.id} />
      </main>
    </div>
  )
}
