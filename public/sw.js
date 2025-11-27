// PushAlertのService Workerを読み込む
importScripts("https://cdn.pushalert.co/sw-86140_2.js");

// プッシュ通知を受信したときの処理
// PushAlertのService Workerが処理した後にも実行される
self.addEventListener('push', function(event) {
  console.log('[Custom SW] Push notification received');
  
  let notificationData = null;
  
  try {
    // プッシュデータを取得
    if (event.data) {
      const data = event.data.json();
      notificationData = {
        title: data.title || data.notification?.title || '通知',
        body: data.body || data.message || data.notification?.body || '',
        icon: data.icon || data.notification?.icon || null,
        image: data.image || data.notification?.image || null,
        url: data.url || data.click_action || data.notification?.click_action || null,
        data: data
      };
    }
  } catch (e) {
    console.error('[Custom SW] Error parsing push data:', e);
    try {
      // テキストデータの場合
      const textData = event.data ? event.data.text() : '新しい通知があります';
      notificationData = {
        title: '通知',
        body: textData,
        data: {}
      };
    } catch (e2) {
      console.error('[Custom SW] Error parsing text data:', e2);
      notificationData = {
        title: '通知',
        body: '新しい通知があります',
        data: {}
      };
    }
  }
  
  // クライアントに通知データを送信
  if (notificationData) {
    console.log('[Custom SW] Sending notification data to clients:', notificationData);
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({
            type: 'PUSH_NOTIFICATION',
            notification: notificationData
          });
          console.log('[Custom SW] Message sent to client:', client.url);
        });
        
        // クライアントがいない場合でも、次にクライアントが開いたときにメッセージを受け取れるように
        if (clients.length === 0) {
          console.log('[Custom SW] No clients available, notification will be saved when client opens');
        }
      })
    );
  }
});

// 通知が表示されたときの処理
self.addEventListener('notificationclick', function(event) {
  console.log('[Custom SW] Notification clicked');
  
  event.notification.close();
  
  const notificationData = {
    title: event.notification.title,
    body: event.notification.body,
    icon: event.notification.icon,
    image: event.notification.image,
    url: event.notification.data?.url || event.notification.data?.click_action || event.notification.tag || null,
    data: event.notification.data || {}
  };
  
  console.log('[Custom SW] Notification data:', notificationData);
  
  // クライアントに通知クリックイベントを送信
  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function(clients) {
      if (clients.length > 0) {
        // 既存のクライアントがあればフォーカス
        const client = clients.find(c => c.focused) || clients[0];
        client.focus();
        client.postMessage({
          type: 'NOTIFICATION_CLICK',
          notification: notificationData
        });
        console.log('[Custom SW] Click message sent to client:', client.url);
      } else {
        // クライアントがなければ開く
        if (notificationData.url) {
          return self.clients.openWindow(notificationData.url);
        } else {
          // URLがない場合はアプリのルートを開く
          return self.clients.openWindow('/');
        }
      }
    })
  );
});

// Service Workerがインストールされたときの処理
self.addEventListener('install', function(event) {
  console.log('[Custom SW] Service Worker installed');
  self.skipWaiting();
});

// Service Workerがアクティブになったときの処理
self.addEventListener('activate', function(event) {
  console.log('[Custom SW] Service Worker activated');
  event.waitUntil(self.clients.claim());
});