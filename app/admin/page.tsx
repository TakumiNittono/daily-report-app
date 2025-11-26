import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import AdminDashboard from '@/components/admin-dashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminStatus = await isAdmin()
  
  if (!adminStatus) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-zinc-900">
      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* ヘッダー */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-black dark:text-zinc-50 mb-2">
                管理者ダッシュボード
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                管理者: {user.email}
              </p>
            </div>
            <div className="flex gap-4">
              <a
                href="/"
                className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                一般画面へ
              </a>
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

        {/* 管理者ダッシュボード */}
        <AdminDashboard />
      </main>
    </div>
  )
}

