import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '../../../../../../lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) return NextResponse.json({ subscribers: [] });

    const snap = await adminDb
      .collection('newsletterSubscribers')
      .orderBy('subscribedAt', 'desc')
      .limit(500)
      .get();

    const subscribers = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        email: d.email,
        name: d.name || null,
        status: d.status || 'pending',
        source: d.source || 'unknown',
        tags: Array.isArray(d.tags) ? d.tags : [],
        subscribedAt: d.subscribedAt?.toDate ? d.subscribedAt.toDate() : new Date(d.subscribedAt || 0),
        confirmedAt: d.confirmedAt?.toDate ? d.confirmedAt.toDate() : null,
      };
    });

    return NextResponse.json({ success: true, subscribers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed fetching subscribers' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { email, action } = await req.json();
    const adminDb = getAdminDb();
    if (!adminDb || !email) return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });

    const snap = await adminDb.collection('newsletterSubscribers').where('email', '==', email.toLowerCase()).get();
    if (snap.empty) return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });

    const batch = adminDb.batch();
    snap.docs.forEach((d) => {
      if (action === 'unsubscribe') {
        batch.update(d.ref, { status: 'unsubscribed', unsubscribedAt: new Date() });
      }
    });
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id, email } = await req.json();
    const adminDb = getAdminDb();
    if (!adminDb) return NextResponse.json({ error: 'No database' }, { status: 500 });

    if (id) {
      await adminDb.collection('newsletterSubscribers').doc(id).delete();
    } else if (email) {
      const snap = await adminDb.collection('newsletterSubscribers').where('email', '==', email.toLowerCase()).get();
      const batch = adminDb.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
