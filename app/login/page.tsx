import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/login-form'

export default async function LoginPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
              ToDoリストアプリ
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              タスクを管理して、効率的に作業しましょう
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
