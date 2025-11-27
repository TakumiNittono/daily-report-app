'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { promptNotificationPermission } from '@/app/components/PusherNotificationInit'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [notificationSuccess, setNotificationSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const getErrorMessage = (error: any): string => {
    const message = error.message || ''
    
    // レート制限エラー
    if (message.includes('For security purposes') || message.includes('rate limit')) {
      return 'セキュリティのため、しばらく時間をおいてから再度お試しください。既にアカウントをお持ちの場合は、ログインをお試しください。'
    }
    
    // 既にアカウントが存在する場合
    if (message.includes('User already registered') || message.includes('already registered')) {
      return 'このメールアドレスは既に登録されています。ログインをお試しください。'
    }
    
    // メール確認が必要な場合
    if (message.includes('Email not confirmed') || message.includes('email not confirmed')) {
      return 'メールアドレスの確認が必要です。メールボックスを確認してください。'
    }
    
    // 無効な認証情報
    if (message.includes('Invalid login credentials') || message.includes('invalid')) {
      return 'メールアドレスまたはパスワードが正しくありません。'
    }
    
    // その他のエラー
    return message || 'エラーが発生しました。もう一度お試しください。'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (error) {
          throw error
        }
        
        // サインアップ成功
        if (data.user) {
          alert('アカウントを作成しました。ログインしてください。')
          setIsSignUp(false)
          setError(null)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) {
          throw error
        }
        
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationPermission = async () => {
    setNotificationLoading(true)
    setNotificationError(null)
    setNotificationSuccess(false)
    
    try {
      await promptNotificationPermission()
      setNotificationSuccess(true)
      // 成功メッセージを3秒後に消す
      setTimeout(() => {
        setNotificationSuccess(false)
      }, 3000)
    } catch (error: any) {
      console.error('通知許可のリクエストに失敗しました:', error)
      
      // エラーメッセージをユーザーに表示
      let errorMessage = '通知許可のリクエストに失敗しました。'
      
      if (error?.message?.includes('Can only be used on')) {
        errorMessage = '通知機能は本番環境（Vercel）でのみ利用できます。'
      } else if (error?.message?.includes('App ID')) {
        errorMessage = 'OneSignalの設定が完了していません。環境変数を確認してください。'
      } else if (error?.message) {
        errorMessage = `エラー: ${error.message}`
      }
      
      setNotificationError(errorMessage)
    } finally {
      setNotificationLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="example@email.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          パスワード
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '処理中...' : isSignUp ? 'サインアップ' : 'ログイン'}
      </button>

      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
        {notificationSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-3 text-sm">
            ✓ 通知許可のプロンプトが表示されました
          </div>
        )}
        {notificationError && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded mb-3 text-sm">
            {notificationError}
          </div>
        )}
        <button
          type="button"
          onClick={handleNotificationPermission}
          disabled={notificationLoading}
          className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {notificationLoading ? '処理中...' : '🔔 プッシュ通知を許可する'}
        </button>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 text-center">
          ログイン前に通知を許可すると、重要な情報をお届けできます
        </p>
      </div>

      <div className="text-center space-y-2">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
          }}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {isSignUp ? '既にアカウントをお持ちですか？ログイン' : 'アカウントをお持ちでない方はサインアップ'}
        </button>
        {isSignUp && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            既にアカウントを作成済みの場合は、ログインをお試しください
          </p>
        )}
      </div>
    </form>
  )
}
