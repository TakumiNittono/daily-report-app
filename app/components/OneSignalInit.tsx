'use client'

import { useEffect } from 'react'
import OneSignal from 'react-onesignal'

export default function OneSignalInit() {
  useEffect(() => {
    const initializeOneSignal = async () => {
      // 開発環境でlocalhostの場合、OneSignalの初期化をスキップ
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      
      if (isLocalhost) {
        console.log('OneSignal: Skipping initialization on localhost (only works on production domain)')
        return
      }

      // OneSignal App IDを環境変数から取得
      const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
      
      if (!oneSignalAppId) {
        console.warn('OneSignal: App ID is not configured. Please set NEXT_PUBLIC_ONESIGNAL_APP_ID environment variable.')
        return
      }

      try {
        await OneSignal.init({
          appId: oneSignalAppId,
          allowLocalhostAsSecureOrigin: true,
        })

        // プッシュ通知の許可をリクエスト
        await OneSignal.Slidedown.promptPush()
      } catch (error: any) {
        // ドメイン制限のエラーは無視（本番環境では動作する）
        if (error?.message?.includes('Can only be used on')) {
          console.log('OneSignal: Domain restriction - will work on production domain')
        } else {
          console.error('OneSignal initialization error:', error)
        }
      }
    }

    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      initializeOneSignal()
    }
  }, [])

  return null
}

