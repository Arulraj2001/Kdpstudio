importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  "apiKey": "AIzaSyC3gnC1NdRYEHm4zR8Kfe0BJeGR_Ae1xLk",
  "authDomain": "kdpstudioaio-3bf53.firebaseapp.com",
  "projectId": "kdpstudioaio-3bf53",
  "storageBucket": "kdpstudioaio-3bf53.firebasestorage.app",
  "messagingSenderId": "494698350011",
  "appId": "1:494698350011:web:ad96b775d58d49a874309e"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] Received background message:', payload);

  const { title, body, icon, data } = payload.notification || {};
  const notificationTitle = title || 'KDP Studio';
  const notificationOptions = {
    body: body || 'You have a new update in KDP Studio.',
    icon: icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data || {},
    actions: getActionsForType(data?.type),
    image: data?.imageUrl || undefined,
    requireInteraction: data?.type === 'bulk_complete',
    tag: data?.type || 'general',
    renotify: false,
    silent: false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

function getActionsForType(type) {
  switch (type) {
    case 'bulk_complete':
      return [
        { action: 'view', title: '📦 View Results' },
        { action: 'download', title: '⬇️ Download ZIP' },
      ];
    case 'quota_warning':
      return [
        { action: 'upgrade', title: '⬆️ Upgrade Plan' },
      ];
    case 'plan_expiring':
      return [
        { action: 'renew', title: '🔄 Renew Now' },
      ];
    default:
      return [];
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  let targetUrl = '/dashboard';

  switch (event.action) {
    case 'view':
      targetUrl = data?.jobUrl || '/bulk';
      break;
    case 'download':
      targetUrl = data?.zipUrl || '/bulk';
      break;
    case 'upgrade':
      targetUrl = '/pricing';
      break;
    case 'renew':
      targetUrl = '/settings/billing';
      break;
    default:
      targetUrl = data?.clickUrl || '/dashboard';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
