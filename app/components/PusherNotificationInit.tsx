'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// 通知許可プロンプトを表示する関数（外部から呼び出し可能）
export async function promptNotificationPermission(): Promise<void> {
  try {
    console.log('Push Notification: Starting permission prompt...')
    
    // 開発環境でlocalhostの場合
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    
    if (isLocalhost) {
      throw new Error('通知機能は本番環境（Vercel）でのみ利用できます。localhostでは動作しません。')
    }
    
    // ブラウザが通知をサポートしているか確認
    if (typeof window === 'undefined' || !('Notification' in window)) {
      throw new Error('このブラウザは通知をサポートしていません。')
    }
    
    // Service Workerがサポートされているか確認
    if (!('serviceWorker' in navigator)) {
      throw new Error('このブラウザはService Workerをサポートしていません。')
    }
    
    // 既に通知許可の状態を確認
    const currentPermission = Notification.permission
    console.log('Push Notification: Current permission status:', currentPermission)
    
    if (currentPermission === 'granted') {
      // 既に許可されている場合、Service Workerを登録
      await registerServiceWorker()
      throw new Error('通知は既に許可されています。')
    }
    
    if (currentPermission === 'denied') {
      throw new Error('通知は既に拒否されています。ブラウザの設定から変更してください。')
    }
    
    // ネイティブの通知許可をリクエスト
    if (currentPermission === 'default') {
      const permission = await Notification.requestPermission()
      console.log('Push Notification: Permission result:', permission)
      
      if (permission === 'denied') {
        throw new Error('通知が拒否されました。')
      }
      
      if (permission === 'granted') {
        // Service Workerを登録
        await registerServiceWorker()
        console.log('Push Notification: Service Worker registered successfully')
      }
    }
    
    console.log('Push Notification: Permission prompt completed successfully')
  } catch (error: any) {
    console.error('Push Notification error:', error)
    
    // エラーメッセージをより分かりやすく
    if (error?.message?.includes('localhost')) {
      throw error
    }
    if (error?.message?.includes('サポートしていません')) {
      throw error
    }
    if (error?.message?.includes('既に')) {
      throw error
    }
    
    throw error
  }
}

// Service Workerを登録する関数
async function registerServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registered:', registration)
    
    // プッシュ通知の購読を準備（将来的にPusher Beamsで使用）
    // ここでPusher BeamsのクライアントSDKを使用して購読を開始
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    throw new Error('Service Workerの登録に失敗しました。')
  }
}

export default function PusherNotificationInit() {
  const pathname = usePathname()

  useEffect(() => {
    // ログインページでは何もしない（ボタンから呼び出す）
    if (pathname === '/login' || pathname?.startsWith('/auth/')) {
      return
    }

    // ホーム画面では自動で通知許可をリクエストしない
    // ユーザーが明示的にボタンをクリックした場合のみ許可をリクエスト
  }, [pathname])

  return null
}

