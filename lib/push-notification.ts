/**
 * プッシュ通知関連のユーティリティ関数
 * 将来的にプッシュ通知を実装する際の基盤
 */

/**
 * 通知許可をリクエスト
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('このブラウザは通知をサポートしていません')
    return 'denied'
  }

  const permission = await Notification.requestPermission()
  return permission
}

/**
 * 通知許可の状態を取得
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

/**
 * 通知を表示（テスト用）
 */
export function showNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    console.warn('このブラウザは通知をサポートしていません')
    return
  }

  if (Notification.permission === 'granted') {
    new Notification(title, options)
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, options)
      }
    })
  }
}

