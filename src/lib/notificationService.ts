import { getAdminMessaging, getAdminDb } from './firebase-admin';

export type NotificationType =
  | 'bulk_complete'
  | 'quota_warning'
  | 'quota_exceeded'
  | 'plan_expiring'
  | 'plan_upgraded'
  | 'upi_approved'
  | 'general';

export interface SendPushParams {
  uid: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export async function sendPushNotification(params: SendPushParams): Promise<{ sent: number; failed: number }> {
  const { uid, type, title, body, data = {}, imageUrl } = params;

  const db = getAdminDb();
  const messaging = getAdminMessaging();

  if (!db || !messaging) {
    console.log(`[Push] Skipping push notification for user ${uid} (Admin SDK not initialized / preview mode): ${title}`);
    return { sent: 0, failed: 0 };
  }

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return { sent: 0, failed: 0 };
    }

    const userData = userDoc.data() || {};
    const fcmTokens = userData.fcmTokens || [];

    if (!Array.isArray(fcmTokens) || fcmTokens.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const tokensToRemove: string[] = [];

    const clickUrl = data.clickUrl || (type === 'bulk_complete' ? '/bulk' : type === 'quota_warning' ? '/pricing' : '/dashboard');

    for (const tokenItem of fcmTokens) {
      const token = typeof tokenItem === 'string' ? tokenItem : tokenItem.token;
      if (!token) continue;

      const payload: any = {
        token,
        notification: {
          title,
          body,
          ...(imageUrl ? { imageUrl } : {}),
        },
        data: {
          type,
          clickUrl,
          ...data,
        },
        webpush: {
          fcmOptions: {
            link: clickUrl,
          },
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            requireInteraction: type === 'bulk_complete',
          },
        },
      };

      try {
        await messaging.send(payload);
        sent++;
      } catch (err: any) {
        failed++;
        console.warn(`[Push] Failed to send to token for user ${uid}:`, err?.message || err);
        if (
          err?.code === 'messaging/registration-token-not-registered' ||
          err?.code === 'messaging/invalid-registration-token'
        ) {
          tokensToRemove.push(token);
        }
      }
    }

    // Prune stale / unregistered tokens from Firestore
    if (tokensToRemove.length > 0) {
      const updatedTokens = fcmTokens.filter((t: any) => {
        const tok = typeof t === 'string' ? t : t.token;
        return !tokensToRemove.includes(tok);
      });
      await db.collection('users').doc(uid).update({
        fcmTokens: updatedTokens,
      }).catch((e) => console.warn('[Push] Error pruning stale tokens:', e));
    }

    return { sent, failed };
  } catch (err) {
    console.error('[Push] Unexpected error sending push notification:', err);
    return { sent: 0, failed: 0 };
  }
}
