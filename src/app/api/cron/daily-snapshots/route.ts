/**
 * CRON Job: Daily Snapshots Backup
 * Schedule: "0 2 * * *" (Every day at 2:00 AM UTC)
 * Phase 16A
 */

import { getAdminDb } from '../../../../lib/firebase-admin';
import { createSnapshot, deleteSnapshot } from '../../../../lib/versionService';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid CRON_SECRET' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return new Response(
        JSON.stringify({ message: 'Firestore Admin not initialized (offline/preview)', processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Query version configs with autoSnapshotDaily == true
    const configsSnap = await adminDb
      .collection('versionConfigs')
      .where('autoSnapshotDaily', '==', true)
      .get();

    let processedUsers = 0;
    let createdSnapshots = 0;
    let cleanedSnapshots = 0;

    for (const configDoc of configsSnap.docs) {
      const config = configDoc.data();
      const uid = config.uid || configDoc.id;
      if (!uid) continue;

      // Fetch user's active (non-published) manuscripts (limit to 10 active books per user)
      const booksSnap = await adminDb
        .collection('books')
        .where('uid', '==', uid)
        .where('status', '!=', 'published')
        .limit(10)
        .get();

      for (const bookDoc of booksSnap.docs) {
        const bookData = { id: bookDoc.id, ...bookDoc.data() };
        try {
          const snapId = await createSnapshot(uid, bookDoc.id, bookData as any, 'auto-daily');
          if (snapId) {
            createdSnapshots++;
          }
        } catch (err) {
          console.warn(`[Daily Snapshot] Error snapshotting book ${bookDoc.id} for user ${uid}:`, err);
        }
      }

      // Apply retention policy if configured
      if (config.retentionDays && Number(config.retentionDays) > 0) {
        const retentionDays = Number(config.retentionDays);
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

        const oldSnaps = await adminDb
          .collection('snapshots')
          .where('uid', '==', uid)
          .where('createdAt', '<', cutoffDate)
          .get();

        for (const oldDoc of oldSnaps.docs) {
          try {
            await deleteSnapshot(oldDoc.id, uid);
            cleanedSnapshots++;
          } catch (err) {
            console.warn(`[Daily Snapshot] Cleanup error for snap ${oldDoc.id}:`, err);
          }
        }
      }

      processedUsers++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedUsers,
        createdSnapshots,
        cleanedSnapshots,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[CRON daily-snapshots] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error processing daily snapshots' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
