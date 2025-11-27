'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// PushAlertのWidget ID（環境変数から取得）
// Next.jsでは、NEXT_PUBLIC_プレフィックスの環境変数はクライアント側で使用可能
// ビルド時に置き換えられるように、直接参照する
// 環境変数が設定されていない場合は、ハードコードされたWidget IDを使用（Vercelで環境変数が設定されていない場合のフォールバック）
const PUSHALERT_WIDGET_ID = process.env.NEXT_PUBLIC_PUSHALERT_WIDGET_ID || '7d31b1ce0e2fdb36d3af902d5d1e4278'

// PushAlertのスクリプトが読み込まれるまで待機する関数
async function waitForPushAlert(maxWaitTime = 10000): Promise<void> {
  const startTime = Date.now()
  
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      if ((window as any).PushAlert) {
        clearInterval(checkInterval)
        console.log('PushAlert: Script is now available')
        resolve()
      } else if (Date.now() - startTime > maxWaitTime) {
        clearInterval(checkInterval)
        reject(new Error('PushAlertの読み込みがタイムアウトしました。ページをリロードしてください。'))
      }
    }, 100) // 100msごとに確認
    
    // 最初のチェック
    if ((window as any).PushAlert) {
      clearInterval(checkInterval)
      resolve()
    }
  })
}

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
    
    // PushAlertのスクリプトが読み込まれるまで待機
    console.log('PushAlert: Waiting for script to load...')
    await waitForPushAlert(10000) // 最大10秒待機
    
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
        const pushAlert = (window as any).PushAlert
        
        if (pushAlert) {
          // PushAlertのsubscribeメソッドまたは通知許可をリクエスト
          if (typeof pushAlert.subscribe === 'function') {
            await pushAlert.subscribe()
            console.log('PushAlert: Subscription request sent')
          } else if (typeof pushAlert.requestNotification === 'function') {
            await pushAlert.requestNotification()
            console.log('PushAlert: Notification request sent')
          } else {
            // PushAlertのAPIが見つからない場合、ネイティブの通知許可をリクエスト
            console.log('PushAlert: Using native notification API')
            const permission = await Notification.requestPermission()
            console.log('PushAlert: Native permission result:', permission)
            
            if (permission === 'denied') {
              throw new Error('通知が拒否されました。')
            }
          }
        } else {
          throw new Error('PushAlertが読み込まれていません。')
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
        
        // スクリプト読み込み完了を検知
        script.onload = () => {
          console.log('PushAlert: Script loaded successfully, waiting for PushAlert object...')
          // PushAlertオブジェクトが利用可能になるまで少し待機
          setTimeout(() => {
            if ((window as any).PushAlert) {
              console.log('PushAlert: Object is now available')
            } else {
              console.warn('PushAlert: Script loaded but object is not yet available')
            }
          }, 500)
        }
        
        script.onerror = () => {
          console.error('PushAlert: Failed to load script')
        }
        
        script.innerHTML = `
          (function(d, t) {
            var g = d.createElement(t),
                s = d.getElementsByTagName(t)[0];
            g.src = "https://cdn.pushalert.co/integrate_${widgetId}.js";
            g.onload = function() {
              console.log('PushAlert: Integration script loaded');
            };
            s.parentNode.insertBefore(g, s);
          }(document, "script"));
        `
        document.head.appendChild(script)
        
        console.log('PushAlert: Script loading started with Widget ID:', widgetId)
      } else {
        console.log('PushAlert: Script already loaded')
      }
    } else if (!widgetId) {
      console.warn('PushAlert: Widget ID is not set. Please set NEXT_PUBLIC_PUSHALERT_WIDGET_ID environment variable.')
    }
  }, [])

  return null
}

