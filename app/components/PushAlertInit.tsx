'use client'

import { useEffect, useState } from 'react'

// PushAlertのWidget ID（環境変数から取得）
// Next.jsでは、NEXT_PUBLIC_プレフィックスの環境変数はクライアント側で使用可能
// ビルド時に置き換えられるように、直接参照する
// 環境変数が設定されていない場合は、ハードコードされたWidget IDを使用（Vercelで環境変数が設定されていない場合のフォールバック）
const PUSHALERT_WIDGET_ID = process.env.NEXT_PUBLIC_PUSHALERT_WIDGET_ID || '7d31b1ce0e2fdb36d3af902d5d1e4278'

// PushAlertのスクリプトが読み込まれるまで待機する関数
async function waitForPushAlert(maxWaitTime = 3000): Promise<boolean> {
  const startTime = Date.now()
  
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      // PushAlertオブジェクトが存在し、ready状態を確認
      if ((window as any).PushAlert && typeof (window as any).PushAlert === 'object') {
        clearInterval(checkInterval)
        console.log('PushAlert: Object is now available')
        resolve(true)
      } else if (Date.now() - startTime > maxWaitTime) {
        clearInterval(checkInterval)
        console.warn('PushAlert: Object not available within timeout, will use native API')
        resolve(false)
      }
    }, 100) // 100msごとに確認（より頻繁にチェック）
    
    // 最初のチェック
    if ((window as any).PushAlert && typeof (window as any).PushAlert === 'object') {
      clearInterval(checkInterval)
      resolve(true)
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
    
    // PushAlertのオブジェクトが利用可能か短時間で確認（最大3秒）
    console.log('PushAlert: Checking if PushAlert object is available...')
    const pushAlertAvailable = await waitForPushAlert(3000) // 最大3秒待機
    
    // PushAlertが利用できない場合は、ネイティブAPIにフォールバック
    if (!pushAlertAvailable || !(window as any).PushAlert) {
      console.log('PushAlert: Not available, using native notification API')
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        console.log('PushAlert: Native permission granted')
        return
      } else if (permission === 'denied') {
        throw new Error('通知が拒否されました。')
      } else {
        // defaultの場合は何もしない（ユーザーがキャンセル）
        return
      }
    }
    
    // PushAlertが利用可能な場合の処理
    const pushAlert = (window as any).PushAlert
    const currentPermission = Notification.permission
    
    console.log('PushAlert: Current permission status:', currentPermission)
    
    // 既に許可されている場合
    if (currentPermission === 'granted') {
      console.log('PushAlert: Notification already granted')
      // PushAlertに購読を確認（エラーは無視）
      try {
        if (pushAlert && typeof pushAlert.subscribe === 'function') {
          await pushAlert.subscribe()
        }
      } catch (e) {
        console.log('PushAlert: Subscription check completed')
      }
      return
    }
    
    // 既に拒否されている場合
    if (currentPermission === 'denied') {
      throw new Error('通知は既に拒否されています。ブラウザの設定から変更してください。')
    }
    
    // 通知許可をリクエスト（defaultの場合）
    // 確実に通知許可のプロンプトが表示されるように、ネイティブAPIを優先的に使用
    // PushAlertが利用可能な場合は、PushAlertで購読を試みるが、失敗した場合はネイティブAPIを使用
    try {
      let permissionGranted = false
      
      // PushAlertが利用可能な場合、まずPushAlertのsubscribe()を試す
      if (pushAlert && typeof pushAlert.subscribe === 'function') {
        try {
          console.log('PushAlert: Attempting to subscribe via PushAlert...')
          // PushAlertのsubscribe()を試す（タイムアウト付き）
          const subscribePromise = pushAlert.subscribe()
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PushAlert subscribe timeout')), 2000)
          )
          
          await Promise.race([subscribePromise, timeoutPromise])
          console.log('PushAlert: Subscription request sent')
          
          // PushAlertのsubscribe()が成功した後、通知許可の状態を確認
          await new Promise(resolve => setTimeout(resolve, 500)) // 少し待機してから確認
          const permission = Notification.permission
          
          if (permission === 'granted') {
            console.log('PushAlert: Permission granted via PushAlert')
            permissionGranted = true
          } else if (permission === 'default') {
            // PushAlertのsubscribe()が呼ばれたが、まだ許可されていない場合はネイティブAPIを使用
            console.log('PushAlert: Permission still default, using native API')
          }
        } catch (subscribeError: any) {
          console.warn('PushAlert: subscribe() failed or timed out, using native API:', subscribeError)
          // PushAlertが失敗した場合は、ネイティブAPIを使用
        }
      }
      
      // PushAlertが利用できない、または失敗した場合、ネイティブAPIを使用（確実にプロンプトを表示）
      if (!permissionGranted && Notification.permission === 'default') {
        console.log('PushAlert: Requesting notification permission via native API')
        const permission = await Notification.requestPermission()
        
        if (permission === 'granted') {
          console.log('PushAlert: Native permission granted')
          permissionGranted = true
        } else if (permission === 'denied') {
          throw new Error('通知が拒否されました。')
        }
      }
      
      if (!permissionGranted) {
        throw new Error('通知許可のリクエストが完了しませんでした。')
      }
    } catch (error: any) {
      console.error('PushAlert subscription error:', error)
      
      // 最後のフォールバック：ネイティブAPIで確実に試す
      if (!error?.message?.includes('拒否') && Notification.permission === 'default') {
        console.log('PushAlert: Final attempt with native notification API')
        try {
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            console.log('PushAlert: Native permission granted in final attempt')
            return
          } else if (permission === 'denied') {
            throw new Error('通知が拒否されました。')
          }
        } catch (nativeError: any) {
          throw new Error('通知許可のリクエストに失敗しました。ブラウザの設定を確認してください。')
        }
      } else {
        throw error
      }
    }
    
    console.log('PushAlert: Permission prompt completed')
  } catch (error: any) {
    console.error('PushAlert error:', error)
    // エラーメッセージをそのまま返す
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

