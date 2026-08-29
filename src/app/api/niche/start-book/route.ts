/**
 * KDP Studio — Start Book from Niche API
 * Phase 13B
 * Creates a new Book document pre-populated from AI Niche Research results.
 */

import { withUsageCheck, AuthenticatedUserContext } from '../../../../lib/withUsageCheck';
import { NicheResult, NicheBookIdea, NicheCategory } from '../../../../types/niche';
import { Book, TrimSize } from '../../../../types';
import { linkNicheToBook, updateSavedNiche } from '../../../../lib/nicheService';
import { getAdminDb } from '../../../../lib/firebase-admin';
import { db, isFirebaseConfigured } from '../../../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export function mapNicheToGenre(category: NicheCategory | string): string {
  const mapping: Record<string, string> = {
    'non-fiction': 'Non-Fiction',
    'self-help': 'Self-Help',
    'children': "Children's",
    'coloring-books': 'Other',
    'puzzle-books': 'Other',
    'journals-planners': 'Non-Fiction',
    'fiction': 'Fiction',
    'cookbooks': 'Non-Fiction',
    'business': 'Non-Fiction',
    'health-wellness': 'Self-Help',
    'education': 'Non-Fiction',
    'low-content': 'Other',
  };
  return mapping[category] || 'Non-Fiction';
}

function parsePrice(priceStr?: string): number {
  if (!priceStr) return 9.99;
  const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  return isNaN(num) || num <= 0 ? 9.99 : num;
}

export async function startBookFromNicheHandler(
  params: {
    nicheResult: NicheResult;
    bookIdea: NicheBookIdea;
    savedNicheId?: string;
  },
  userContext: { uid: string; email?: string }
): Promise<{ bookId: string; book: Book }> {
  const { nicheResult, bookIdea, savedNicheId } = params;
  const uid = userContext.uid || 'demo-user-123';

  if (!nicheResult || !bookIdea) {
    throw new Error('Niche result and book idea are required');
  }

  const bookId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();
  const genre = mapNicheToGenre(nicheResult.category);
  const trimSize = (nicheResult.recommendedTrimSize as TrimSize) || '6x9';

  const newBook: Book & { nicheSource?: any; uid?: string } = {
    id: bookId,
    title: bookIdea.title || nicheResult.nicheTitle,
    subtitle: bookIdea.subtitle || '',
    author: userContext.email ? userContext.email.split('@')[0] : 'Kindle Author',
    language: 'English',
    genre,
    trimSize,
    paperType: 'white',
    status: 'draft',
    createdAt: nowIso,
    updatedAt: nowIso,
    chapters: [
      {
        id: `chap_${Date.now()}_1`,
        title: 'Chapter 1: The Beginning',
        content: `<p>Start drafting your manuscript for <strong>${bookIdea.title}</strong> based on: ${bookIdea.angle || 'your unique angle'}.</p>`,
        order: 1,
        wordCount: 15,
      },
    ],
    frontMatter: {
      titlePage: true,
      copyrightPage: true,
      dedication: '',
      tableOfContents: true,
      preface: '',
    },
    backMatter: {
      aboutAuthor: '',
      otherBooks: '',
      resources: '',
    },
    metadata: {
      description: `<p>${nicheResult.description || ''}</p><p><b>Target Audience:</b> ${bookIdea.targetReader || 'Readers seeking practical guidance'}</p>`,
      keywords: Array.isArray(nicheResult.suggestedKeywords) ? nicheResult.suggestedKeywords.slice(0, 7) : [],
      categories: Array.isArray(nicheResult.recommendedBisacCategories) ? nicheResult.recommendedBisacCategories : [],
      price: parsePrice(bookIdea.suggestedPrice || nicheResult.recommendedPrice),
      royaltyPlan: nicheResult.royaltyPlan === '35%' ? '35' : '70',
    },
    nicheSource: {
      nicheTitle: nicheResult.nicheTitle,
      opportunityScore: nicheResult.opportunityScore,
      savedNicheId: savedNicheId || null,
    },
    uid,
  };

  // 1. Persist to Firestore if configured
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      await adminDb.collection('books').doc(bookId).set(newBook);
    } catch (e) {
      console.warn('Failed to save book to adminDb:', e);
    }
  } else if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'books', bookId), newBook);
    } catch (e) {
      console.warn('Failed to save book to client db:', e);
    }
  }

  // 2. Link niche to book if savedNicheId provided
  if (savedNicheId) {
    try {
      await linkNicheToBook(savedNicheId, bookId);
      await updateSavedNiche(savedNicheId, { status: 'writing' });
    } catch (e) {
      console.warn('Failed to update saved niche status:', e);
    }
  }

  return { bookId, book: newBook };
}

export const POST = withUsageCheck('aiGenerations', async (req: Request, { user }: { user: AuthenticatedUserContext }) => {
  try {
    const body = await req.json();
    const data = await startBookFromNicheHandler(body, user);
    return new Response(JSON.stringify({ success: true, ...data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('API /api/niche/start-book error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
