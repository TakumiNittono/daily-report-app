'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// PushAlertのWidget ID（環境変数から取得）
// Next.jsでは、NEXT_PUBLIC_プレフィックスの環境変数はクライアント側で使用可能
// ビルド時に置き換えられるように、直接参照する
const PUSHALERT_WIDGET_ID = process.env.NEXT_PUBLIC_PUSHALERT_WIDGET_ID || ''

// 通知許可プロンプトを表示する関数（外部から呼び出し可能）
export async function promptNotificationPermission(): Promise<void> {
  try {
    console.log('PushAlert: Starting notification permission prompt...')
    
    // 開発環境でlocalhostの場合
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    
    if (isLocalhost) {
      throw new Error('通知機能は本番環境（Vercel）でのみ利用できます。localhostでは動作しません。')
    }
    
    // PushAlertのWidget IDが設定されているか確認
    if (!PUSHALERT_WIDGET_ID) {
      throw new Error('PushAlertの設定が完了していません。環境変数NEXT_PUBLIC_PUSHALERT_WIDGET_IDを設定してください。')
    }
    
    // PushAlertのAPIが利用可能か確認
    if (typeof window === 'undefined' || !(window as any).PushAlert) {
      throw new Error('PushAlertが読み込まれていません。ページをリロードしてください。')
    }
    
    // 既に通知許可の状態を確認
    const currentPermission = Notification.permission
    console.log('PushAlert: Current permission status:', currentPermission)
    
    if (currentPermission === 'granted') {
      throw new Error('通知は既に許可されています。')
    }
    
    if (currentPermission === 'denied') {
      throw new Error('通知は既に拒否されています。ブラウザの設定から変更してください。')
    }
    
    // PushAlertの通知許可をリクエスト
    if (currentPermission === 'default') {
      try {
        // PushAlertのAPIを確認
        // PushAlertが自動的に通知許可をリクエストする場合もあるため、少し待機
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // PushAlertのsubscribeメソッドまたは通知許可をリクエスト
        if ((window as any).PushAlert) {
          // PushAlertのAPIが利用可能な場合、subscribeを呼び出す
          if (typeof (window as any).PushAlert.subscribe === 'function') {
            (window as any).PushAlert.subscribe()
            console.log('PushAlert: Subscription request sent')
          } else if (typeof (window as any).PushAlert.requestNotification === 'function') {
            (window as any).PushAlert.requestNotification()
            console.log('PushAlert: Notification request sent')
          }
        } else {
          // PushAlertがまだ読み込まれていない場合、ネイティブの通知許可をリクエスト
          const permission = await Notification.requestPermission()
          console.log('PushAlert: Native permission result:', permission)
          
          if (permission === 'denied') {
            throw new Error('通知が拒否されました。')
          }
        }
      } catch (error: any) {
        console.error('PushAlert subscription error:', error)
        throw new Error('通知許可のリクエストに失敗しました。')
      }
    }
    
    console.log('PushAlert: Permission prompt completed successfully')
  } catch (error: any) {
    console.error('PushAlert error:', error)
    
    // エラーメッセージをより分かりやすく
    if (error?.message?.includes('localhost')) {
      throw error
    }
    if (error?.message?.includes('設定が完了していません')) {
      throw error
    }
    if (error?.message?.includes('読み込まれていません')) {
      throw error
    }
    if (error?.message?.includes('既に')) {
      throw error
    }
    
    throw error
  }
}

export default function PushAlertInit() {
  const pathname = usePathname()

  useEffect(() => {
    // 環境変数を取得（実行時に再取得）
    const widgetId = process.env.NEXT_PUBLIC_PUSHALERT_WIDGET_ID || ''
    
    // デバッグ用：環境変数が読み込まれているか確認
    console.log('PushAlert: Widget ID from env:', widgetId || 'NOT SET')
    
    // PushAlertのスクリプトを読み込む（PushAlert推奨形式）
    if (typeof window !== 'undefined' && widgetId) {
      // 既にスクリプトが読み込まれているか確認
      if (!document.querySelector(`script[src*="pushalert.co/integrate_${widgetId}"]`)) {
        // PushAlertの推奨スクリプト形式で読み込む
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.innerHTML = `
          (function(d, t) {
            var g = d.createElement(t),
                s = d.getElementsByTagName(t)[0];
            g.src = "https://cdn.pushalert.co/integrate_${widgetId}.js";
            s.parentNode.insertBefore(g, s);
          }(document, "script"));
        `
        document.head.appendChild(script)
        
        console.log('PushAlert: Script loaded with Widget ID:', widgetId)
      }
    } else if (!widgetId) {
      console.warn('PushAlert: Widget ID is not set. Please set NEXT_PUBLIC_PUSHALERT_WIDGET_ID environment variable.')
    }
  }, [])

  return null
}

