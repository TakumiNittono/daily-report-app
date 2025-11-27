'use client'

import { useState } from 'react'

interface AdminNotificationFormProps {
  onSuccess?: () => void
}

export default function AdminNotificationForm({ onSuccess }: AdminNotificationFormProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 全ユーザーに通知を送信
  const handleSendToAll = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!title.trim()) {
        setError('タイトルを入力してください')
        return
      }

      const response = await fetch('/admin/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim() || null,
          url: url.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '通知の作成に失敗しました')
      }

      const data = await response.json()
      setSuccess(true)
      setTitle('')
      setBody('')
      setUrl('')
      
      if (onSuccess) {
        onSuccess()
      }

      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err: any) {
      setError(err.message || '通知の作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
        お知らせを作成
      </h2>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-4">
          お知らせが作成されました！すべてのユーザーの「お知らせ」タブに表示されます。
        </div>
      )}

      <form onSubmit={handleSendToAll} className="space-y-4">
        <div>
          <label htmlFor="notification-title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            id="notification-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 重要なお知らせ"
          />
        </div>

        <div>
          <label htmlFor="notification-body" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            本文
          </label>
          <textarea
            id="notification-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="通知の内容を入力してください"
          />
        </div>

        <div>
          <label htmlFor="notification-url" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            リンクURL（オプション）
          </label>
          <input
            id="notification-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            通知をクリックしたときに遷移するURLを指定できます
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>使い方:</strong> PushAlertで通知を送信した後、同じ内容をここで入力して「全ユーザーに通知を送信」ボタンをクリックすると、すべてのユーザーの「お知らせ」タブに通知が表示されます。
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '作成中...' : '全ユーザーに通知を送信'}
        </button>
      </form>
    </div>
  )
}

