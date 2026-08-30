import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '../../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const { postId, platform } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (adminDb) {
      const postRef = adminDb.collection('blogPosts').doc(postId);
      const postDoc = await postRef.get();

      if (postDoc.exists) {
        await postRef.update({
          shareCount: FieldValue.increment(1),
          updatedAt: new Date(),
        });
      }

      // Log share event
      await adminDb.collection('shareEvents').add({
        postId,
        platform: platform || 'unknown',
        timestamp: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Blog Share API] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
