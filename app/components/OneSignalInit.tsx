'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import OneSignal from 'react-onesignal'

// OneSignalの初期化状態を管理するグローバル変数
let oneSignalInitialized = false
let oneSignalInitPromise: Promise<void> | null = null

export async function initializeOneSignal(): Promise<void> {
  // 既に初期化中または初期化済みの場合は待機
  if (oneSignalInitPromise) {
    return oneSignalInitPromise
  }

  if (oneSignalInitialized) {
    return Promise.resolve()
  }

  // 開発環境でlocalhostの場合、OneSignalの初期化をスキップ
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  
  if (isLocalhost) {
    console.log('OneSignal: Skipping initialization on localhost (only works on production domain)')
    return Promise.resolve()
  }

  // OneSignal App IDを環境変数から取得
  const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  
  if (!oneSignalAppId) {
    console.warn('OneSignal: App ID is not configured. Please set NEXT_PUBLIC_ONESIGNAL_APP_ID environment variable.')
    return Promise.resolve()
  }

  oneSignalInitPromise = (async () => {
    try {
      await OneSignal.init({
        appId: oneSignalAppId,
        allowLocalhostAsSecureOrigin: true,
      })
      oneSignalInitialized = true
    } catch (error: any) {
      // ドメイン制限のエラーは無視（本番環境では動作する）
      if (error?.message?.includes('Can only be used on')) {
        console.log('OneSignal: Domain restriction - will work on production domain')
      } else {
        console.error('OneSignal initialization error:', error)
      }
      throw error
    }
  })()

  return oneSignalInitPromise
}

// 通知許可プロンプトを表示する関数（外部から呼び出し可能）
export async function promptNotificationPermission(): Promise<void> {
  try {
    console.log('OneSignal: Starting notification permission prompt...')
    
    // 開発環境でlocalhostの場合
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    
    if (isLocalhost) {
      throw new Error('通知機能は本番環境（Vercel）でのみ利用できます。localhostでは動作しません。')
    }
    
    // 初期化
    await initializeOneSignal()
    
    console.log('OneSignal: Initialized, prompting for permission...')
    
    // プロンプトを表示（既に許可/拒否されている場合は、OneSignalが自動的に処理します）
    await OneSignal.Slidedown.promptPush()
    console.log('OneSignal: Prompt displayed successfully')
  } catch (error: any) {
    console.error('OneSignal prompt error:', error)
    
    // エラーメッセージをより分かりやすく
    if (error?.message?.includes('localhost')) {
      throw error
    }
    if (error?.message?.includes('Can only be used on')) {
      throw new Error('通知機能は本番環境（Vercel）でのみ利用できます。')
    }
    if (error?.message?.includes('App ID')) {
      throw new Error('OneSignalの設定が完了していません。環境変数を確認してください。')
    }
    
    throw error
  }
}

export default function OneSignalInit() {
  const pathname = usePathname()

  useEffect(() => {
    const autoInitialize = async () => {
      // ログインページでは自動プロンプトを表示しない
      if (pathname === '/login' || pathname?.startsWith('/auth/')) {
        // 初期化だけは行う（ボタンから呼び出せるようにするため）
        await initializeOneSignal().catch(() => {
          // エラーは無視（既にログ出力されている）
        })
        return
      }

      // ホーム画面では自動で初期化してプロンプトを表示
      try {
        await initializeOneSignal()

        // 3秒後にプロンプトを表示（ユーザーがアプリを確認してから）
        setTimeout(async () => {
          try {
            await OneSignal.Slidedown.promptPush()
          } catch (promptError) {
            console.error('OneSignal prompt error:', promptError)
          }
        }, 3000)
      } catch (error) {
        // エラーは既にログ出力されている
      }
    }

    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      autoInitialize()
    }
  }, [pathname])

  return null
}

