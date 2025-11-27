'use client'

import { useEffect, useState } from 'react'

// PushAlertのWidget ID（環境変数から取得）
// Next.jsでは、NEXT_PUBLIC_プレフィックスの環境変数はクライアント側で使用可能
// ビルド時に置き換えられるように、直接参照する
// 環境変数が設定されていない場合は、ハードコードされたWidget IDを使用（Vercelで環境変数が設定されていない場合のフォールバック）
const PUSHALERT_WIDGET_ID = process.env.NEXT_PUBLIC_PUSHALERT_WIDGET_ID || '7d31b1ce0e2fdb36d3af902d5d1e4278'

// PushAlertのスクリプトが読み込まれるまで待機する関数
async function waitForPushAlert(maxWaitTime = 20000): Promise<void> {
  const startTime = Date.now()
  
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      // PushAlertオブジェクトが存在し、ready状態を確認
      if ((window as any).PushAlert && typeof (window as any).PushAlert === 'object') {
        clearInterval(checkInterval)
        console.log('PushAlert: Object is now available')
        resolve()
      } else if (Date.now() - startTime > maxWaitTime) {
        clearInterval(checkInterval)
        console.error('PushAlert: Timeout - PushAlert object not available', {
          windowPushAlert: typeof (window as any).PushAlert,
          elapsedTime: Date.now() - startTime
        })
        reject(new Error('PushAlertの読み込みがタイムアウトしました。ページをリロードしてください。'))
      }
    }, 200) // 200msごとに確認
    
    // 最初のチェック
    if ((window as any).PushAlert && typeof (window as any).PushAlert === 'object') {
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
    
    // スクリプトが読み込まれているか確認（まだの場合は待機）
    const scriptExists = document.querySelector(`script[src*="pushalert.co/integrate_${PUSHALERT_WIDGET_ID}"]`)
    if (!scriptExists) {
      console.log('PushAlert: Script not found, waiting a moment for initialization...')
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2秒待機
    }
    
    // PushAlertのスクリプトが読み込まれるまで待機
    console.log('PushAlert: Waiting for PushAlert object to be available...')
    await waitForPushAlert(20000) // 最大20秒待機（タイムアウト時間を延長）
    
    // PushAlertのAPIが利用可能か確認
    if (typeof window === 'undefined' || !(window as any).PushAlert) {
      console.error('PushAlert: Object still not available after waiting')
      throw new Error('PushAlertが読み込まれていません。ページをリロードしてください。')
    }
    
    // 既に通知許可の状態を確認
    const currentPermission = Notification.permission
    console.log('PushAlert: Current permission status:', currentPermission)
    
    if (currentPermission === 'granted') {
      console.log('PushAlert: Notification already granted')
      // 既に許可されている場合でも、PushAlertに購読を確認
      try {
        const pushAlert = (window as any).PushAlert
        if (pushAlert && typeof pushAlert.subscribe === 'function') {
          await pushAlert.subscribe()
        }
      } catch (e) {
        console.log('PushAlert: Already subscribed or subscription not needed')
      }
      return // エラーを投げずに成功として返す
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
          console.log('PushAlert: Available methods:', Object.keys(pushAlert))
          
          // PushAlertのsubscribeメソッドまたは通知許可をリクエスト
          if (typeof pushAlert.subscribe === 'function') {
            console.log('PushAlert: Calling subscribe() method')
            await pushAlert.subscribe()
            console.log('PushAlert: Subscription request sent')
          } else if (typeof pushAlert.requestNotification === 'function') {
            console.log('PushAlert: Calling requestNotification() method')
            await pushAlert.requestNotification()
            console.log('PushAlert: Notification request sent')
          } else if (typeof pushAlert.requestPermission === 'function') {
            console.log('PushAlert: Calling requestPermission() method')
            await pushAlert.requestPermission()
            console.log('PushAlert: Permission request sent')
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
        
        // ネイティブAPIにフォールバック
        if (error?.message && !error.message.includes('既に拒否')) {
          console.log('PushAlert: Falling back to native notification API')
          try {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
              console.log('PushAlert: Native permission granted')
              return
            } else if (permission === 'denied') {
              throw new Error('通知が拒否されました。')
            }
          } catch (nativeError: any) {
            throw new Error('通知許可のリクエストに失敗しました。')
          }
        } else {
          throw error
        }
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
    if (error?.message?.includes('読み込まれていません') || error?.message?.includes('タイムアウト')) {
      throw error
    }
    if (error?.message?.includes('既に')) {
      throw error
    }
    
    throw error
  }
}

export default function PushAlertInit() {
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    // 環境変数を取得（実行時に再取得）
    const widgetId = PUSHALERT_WIDGET_ID
    
    // デバッグ用：環境変数が読み込まれているか確認
    console.log('PushAlert: Widget ID from env:', process.env.NEXT_PUBLIC_PUSHALERT_WIDGET_ID || 'NOT SET (using fallback)')
    
    // PushAlertのスクリプトを読み込む（PushAlert推奨形式）
    if (typeof window !== 'undefined' && widgetId) {
      // 既にスクリプトが読み込まれているか確認
      const existingScript = document.querySelector(`script[src*="pushalert.co/integrate_${widgetId}"]`)
      
      if (existingScript) {
        console.log('PushAlert: Script already present in DOM.')
        setScriptLoaded(true)
        
        // 既にスクリプトがある場合、PushAlertオブジェクトが利用可能か確認
        setTimeout(() => {
          if ((window as any).PushAlert) {
            console.log('PushAlert: Object is already available')
          } else {
            console.warn('PushAlert: Script exists but object is not yet available')
          }
        }, 1000)
      } else {
        // 新しいスクリプトタグを作成して直接読み込む
        console.log('PushAlert: Script loading started with Widget ID:', widgetId)
        
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = `https://cdn.pushalert.co/integrate_${widgetId}.js`
        script.async = true
        
        script.onload = () => {
          console.log('PushAlert: Integration script loaded successfully.')
          setScriptLoaded(true)
          
          // スクリプトが読み込まれた後、PushAlertオブジェクトが利用可能になるまで少し待機
          setTimeout(() => {
            if ((window as any).PushAlert) {
              console.log('PushAlert: Object is now available')
            } else {
              console.warn('PushAlert: Script loaded but object is not yet available, will wait when needed')
            }
          }, 1000)
        }
        
        script.onerror = (e) => {
          console.error('PushAlert: Failed to load integration script', e)
          setScriptLoaded(false)
        }
        
        // headの最初に追加
        const firstScript = document.head.getElementsByTagName('script')[0]
        if (firstScript) {
          document.head.insertBefore(script, firstScript)
        } else {
          document.head.appendChild(script)
        }
      }
    } else if (!widgetId) {
      console.warn('PushAlert: Widget ID is not set. PushAlert will not function.')
    }
  }, [])

  return null
}

