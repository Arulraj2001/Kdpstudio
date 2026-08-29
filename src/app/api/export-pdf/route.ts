import { withUsageCheck } from '../../../lib/withUsageCheck';
import { getVersionConfig, createSnapshot } from '../../../lib/versionService';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const POST = withUsageCheck('pdfExports', async (req, { user }) => {
  try {
    const body = await req.json();
    const bookId = body.bookId || body.book?.id;
    let snapshotId: string | null = null;

    // Auto-snapshot trigger on PDF export
    if (bookId && user?.uid) {
      try {
        const config = await getVersionConfig(user.uid);
        if (config.autoSnapshotOnExport !== false) {
          let book = body.book;
          if (!book && db) {
            const bookSnap = await getDoc(doc(db, 'books', bookId));
            if (bookSnap.exists()) {
              book = { id: bookId, ...bookSnap.data() };
            }
          }

          if (book) {
            snapshotId = await createSnapshot(user.uid, bookId, book, 'pre-export-pdf').catch(
              (err) => {
                console.warn('Auto-snapshot on PDF export failed:', err);
                return null;
              }
            );
          }
        }
      } catch (snapErr) {
        console.warn('Snapshot config check error:', snapErr);
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (snapshotId) {
      headers['X-Snapshot-Created'] = snapshotId;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'PDF export initialized',
        user: user.uid,
        snapshotCreated: snapshotId,
      }),
      { status: 200, headers }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'PDF export error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
