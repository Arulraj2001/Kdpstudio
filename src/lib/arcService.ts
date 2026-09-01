/**
 * KDP Studio — ARC Reader Lounge & Newsletter Cross-Promotion Service
 * 100% Amazon KDP & FTC Compliant
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  ArcCampaign,
  ArcClaim,
  ReaderProfile,
  NewsletterSwap,
  ArcAdSlotConfig,
} from '../types/arc';

const STORAGE_KEYS = {
  CAMPAIGNS: 'kdp_arc_campaigns',
  CLAIMS: 'kdp_arc_claims',
  SWAPS: 'kdp_newsletter_swaps',
  READERS: 'kdp_reader_profiles',
  ADS: 'kdp_arc_ad_config',
};

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL SEED DATA (For Immediate Community Discovery)
// ─────────────────────────────────────────────────────────────────────────────
const SEED_CAMPAIGNS: ArcCampaign[] = [
  {
    id: 'arc-seed-1',
    authorId: 'demo-author-1',
    authorName: 'Sarah Jenkins',
    authorEmail: 'sarah.j.author@gmail.com',
    title: 'The Assertive Nurse: Difficult Conversations Playbook',
    subtitle: 'A Practical Workbook for High-Stakes Patient & Team Communication',
    genre: 'Non-Fiction / Medical',
    blurb: 'Master critical bedside and clinical conversations with de-escalation frameworks, script templates, and stress-response self-assessments designed for modern frontline healthcare professionals.',
    pageCount: 184,
    format: 'both',
    totalSlots: 50,
    claimedSlots: 28,
    reviewWindowDays: 14,
    amazonAsin: 'B0DF92KC81',
    amazonUrl: 'https://www.amazon.com/dp/B0DF92KC81',
    watermarkingEnabled: true,
    targetMarketplace: 'US',
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['Nursing', 'Healthcare', 'Communication', 'Workbook'],
    featured: true,
  },
  {
    id: 'arc-seed-2',
    authorId: 'demo-author-2',
    authorName: 'Elena Rostova',
    authorEmail: 'elena.rostova.writes@gmail.com',
    title: 'Echoes of the Obsidian Throne',
    subtitle: 'The Sunken Dynasty Chronicles — Book 1',
    genre: 'Fantasy / Romance',
    blurb: 'An exiled cartographer with forbidden tide magic is recruited by a disgraced rebel general to chart an uncharted sunken archipelago. Enemies-to-lovers slow burn with political intrigue.',
    pageCount: 360,
    format: 'epub',
    totalSlots: 100,
    claimedSlots: 64,
    reviewWindowDays: 21,
    amazonAsin: 'B0DF81NK92',
    amazonUrl: 'https://www.amazon.com/dp/B0DF81NK92',
    watermarkingEnabled: true,
    targetMarketplace: 'US',
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['Romantasy', 'Magic System', 'Enemies to Lovers'],
    featured: true,
  },
  {
    id: 'arc-seed-3',
    authorId: 'demo-author-3',
    authorName: 'Marcus Vance',
    authorEmail: 'mvance.thrillers@gmail.com',
    title: 'Zero Protocol: A Cyber Espionage Thriller',
    subtitle: 'A David Cain Spec-Ops Mystery',
    genre: 'Mystery / Thriller',
    blurb: 'When an autonomous AI defense grid triggers an unprovoked missile lockdown, rogue agent David Cain has 72 hours to breach a subterranean server farm in Geneva before world financial markets collapse.',
    pageCount: 290,
    format: 'both',
    totalSlots: 40,
    claimedSlots: 19,
    reviewWindowDays: 14,
    amazonAsin: 'B0DF76PL44',
    amazonUrl: 'https://www.amazon.com/dp/B0DF76PL44',
    watermarkingEnabled: false,
    targetMarketplace: 'US',
    status: 'active',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['Cyber Thriller', 'Espionage', 'AI', 'Action'],
  },
  {
    id: 'arc-seed-4',
    authorId: 'demo-author-4',
    authorName: 'Clara Bloom',
    authorEmail: 'clara.bloom.books@gmail.com',
    title: 'Mindful Mornings: 90-Day Guided Gratitude Journal',
    subtitle: 'Daily Prompts for Mental Clarity and Inner Calm',
    genre: 'Self-Help / Journal',
    blurb: '120-page structured mindfulness companion with 5-minute morning check-ins, habit trackers, and guided evening reflections to reduce cognitive overload and build calm consistency.',
    pageCount: 124,
    format: 'pdf',
    totalSlots: 35,
    claimedSlots: 14,
    reviewWindowDays: 10,
    amazonAsin: 'B0DF65MN11',
    amazonUrl: 'https://www.amazon.com/dp/B0DF65MN11',
    watermarkingEnabled: false,
    targetMarketplace: 'US',
    status: 'active',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['Gratitude', 'Self-Care', 'Journal', 'Habits'],
  },
];

const SEED_SWAPS: NewsletterSwap[] = [
  {
    id: 'swap-seed-1',
    requesterAuthorId: 'demo-author-2',
    requesterAuthorName: 'Elena Rostova',
    requesterBookTitle: 'Echoes of the Obsidian Throne',
    requesterAmazonUrl: 'https://www.amazon.com/dp/B0DF81NK92',
    requesterNewsletterSize: 1850,
    requesterGenre: 'Fantasy / Romance',
    targetDateForRequester: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

    recipientAuthorId: 'demo-author-5',
    recipientAuthorName: 'Damian Blackwood',
    recipientBookTitle: 'The Shadow Court Heir',
    recipientAmazonUrl: 'https://www.amazon.com/dp/B0DF99XX01',
    recipientNewsletterSize: 2200,
    recipientGenre: 'Fantasy / Romance',
    targetDateForRecipient: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

    status: 'accepted',
    requesterClicks: 142,
    recipientClicks: 188,
    trackingTokenA: 'trk-a-81nk92',
    trackingTokenB: 'trk-b-99xx01',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: LOCAL STORAGE RETRIEVAL & PERSISTENCE
// ─────────────────────────────────────────────────────────────────────────────
function getLocal<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota safe fallback
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ARC CAMPAIGN OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all active public ARC campaigns with optional genre and search query
 */
export async function getPublicArcCampaigns(
  genreFilter?: string,
  searchQuery?: string
): Promise<ArcCampaign[]> {
  try {
    if (db) {
      const q = query(
        collection(db, 'arc_campaigns'),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        let results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ArcCampaign));
        if (genreFilter && genreFilter !== 'All') {
          results = results.filter((c) => c.genre.toLowerCase().includes(genreFilter.toLowerCase()));
        }
        if (searchQuery && searchQuery.trim()) {
          const qLower = searchQuery.toLowerCase().trim();
          results = results.filter(
            (c) =>
              c.title.toLowerCase().includes(qLower) ||
              c.authorName.toLowerCase().includes(qLower) ||
              c.blurb.toLowerCase().includes(qLower)
          );
        }
        return results;
      }
    }
  } catch (err) {
    console.warn('Firestore getPublicArcCampaigns fallback:', err);
  }

  // LocalStorage Fallback
  let items = getLocal<ArcCampaign>(STORAGE_KEYS.CAMPAIGNS, SEED_CAMPAIGNS);
  items = items.filter((c) => c.status === 'active');
  if (genreFilter && genreFilter !== 'All') {
    items = items.filter((c) => c.genre.toLowerCase().includes(genreFilter.toLowerCase()));
  }
  if (searchQuery && searchQuery.trim()) {
    const qLower = searchQuery.toLowerCase().trim();
    items = items.filter(
      (c) =>
        c.title.toLowerCase().includes(qLower) ||
        c.authorName.toLowerCase().includes(qLower) ||
        c.blurb.toLowerCase().includes(qLower)
    );
  }
  return items;
}

/**
 * Fetch an author's specific ARC campaigns
 */
export async function getAuthorArcCampaigns(authorId: string): Promise<ArcCampaign[]> {
  try {
    if (db && authorId) {
      const q = query(
        collection(db, 'arc_campaigns'),
        where('authorId', '==', authorId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ArcCampaign));
      }
    }
  } catch (err) {
    console.warn('Firestore getAuthorArcCampaigns fallback:', err);
  }

  const items = getLocal<ArcCampaign>(STORAGE_KEYS.CAMPAIGNS, SEED_CAMPAIGNS);
  return items.filter((c) => c.authorId === authorId);
}

/**
 * Create a new ARC campaign
 */
export async function createArcCampaign(
  authorId: string,
  data: Omit<ArcCampaign, 'id' | 'authorId' | 'claimedSlots' | 'createdAt' | 'updatedAt'>
): Promise<ArcCampaign> {
  const newId = `arc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const campaign: ArcCampaign = {
    ...data,
    id: newId,
    authorId,
    claimedSlots: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    if (db) {
      await setDoc(doc(db, 'arc_campaigns', newId), campaign);
    }
  } catch (err) {
    console.warn('Firestore createArcCampaign fallback:', err);
  }

  const items = getLocal<ArcCampaign>(STORAGE_KEYS.CAMPAIGNS, SEED_CAMPAIGNS);
  items.unshift(campaign);
  setLocal(STORAGE_KEYS.CAMPAIGNS, items);

  return campaign;
}

/**
 * Update an existing ARC campaign
 */
export async function updateArcCampaign(
  campaignId: string,
  patch: Partial<ArcCampaign>
): Promise<void> {
  try {
    if (db) {
      await updateDoc(doc(db, 'arc_campaigns', campaignId), {
        ...patch,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Firestore updateArcCampaign fallback:', err);
  }

  const items = getLocal<ArcCampaign>(STORAGE_KEYS.CAMPAIGNS, SEED_CAMPAIGNS);
  const idx = items.findIndex((c) => c.id === campaignId);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
    setLocal(STORAGE_KEYS.CAMPAIGNS, items);
  }
}

/**
 * Delete an ARC campaign
 */
export async function deleteArcCampaign(campaignId: string): Promise<void> {
  try {
    if (db) {
      await deleteDoc(doc(db, 'arc_campaigns', campaignId));
    }
  } catch (err) {
    console.warn('Firestore deleteArcCampaign fallback:', err);
  }

  let items = getLocal<ArcCampaign>(STORAGE_KEYS.CAMPAIGNS, SEED_CAMPAIGNS);
  items = items.filter((c) => c.id !== campaignId);
  setLocal(STORAGE_KEYS.CAMPAIGNS, items);
}

// ─────────────────────────────────────────────────────────────────────────────
// READER CLAIMS & FEEDBACK ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reader claims an ARC copy
 */
export async function claimArcCopy(
  campaign: ArcCampaign,
  reader: { uid: string; email: string; name: string; answer?: string }
): Promise<ArcClaim> {
  const claimId = `claim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const claim: ArcClaim = {
    id: claimId,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    authorId: campaign.authorId,
    readerId: reader.uid,
    readerName: reader.name || reader.email.split('@')[0],
    readerEmail: reader.email,
    status: 'approved',
    claimedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    downloadCount: 1,
    reminderCount: 0,
    screeningAnswer: reader.answer || null,
  };

  try {
    if (db) {
      await setDoc(doc(db, 'arc_claims', claimId), claim);
      // Increment claimedSlots in campaign
      await updateDoc(doc(db, 'arc_campaigns', campaign.id), {
        claimedSlots: (campaign.claimedSlots || 0) + 1,
      });
    }
  } catch (err) {
    console.warn('Firestore claimArcCopy fallback:', err);
  }

  // Update local campaign slots
  const campaigns = getLocal<ArcCampaign>(STORAGE_KEYS.CAMPAIGNS, SEED_CAMPAIGNS);
  const cIdx = campaigns.findIndex((c) => c.id === campaign.id);
  if (cIdx !== -1) {
    campaigns[cIdx].claimedSlots = (campaigns[cIdx].claimedSlots || 0) + 1;
    setLocal(STORAGE_KEYS.CAMPAIGNS, campaigns);
  }

  // Save claim
  const claims = getLocal<ArcClaim>(STORAGE_KEYS.CLAIMS, []);
  claims.unshift(claim);
  setLocal(STORAGE_KEYS.CLAIMS, claims);

  return claim;
}

/**
 * Get all claims for an author's campaign
 */
export async function getCampaignClaims(campaignId: string): Promise<ArcClaim[]> {
  try {
    if (db) {
      const q = query(
        collection(db, 'arc_claims'),
        where('campaignId', '==', campaignId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ArcClaim));
      }
    }
  } catch (err) {
    console.warn('Firestore getCampaignClaims fallback:', err);
  }

  const claims = getLocal<ArcClaim>(STORAGE_KEYS.CLAIMS, []);
  return claims.filter((c) => c.campaignId === campaignId);
}

/**
 * Get claims submitted by a reader
 */
export async function getReaderClaims(readerId: string): Promise<ArcClaim[]> {
  try {
    if (db) {
      const q = query(
        collection(db, 'arc_claims'),
        where('readerId', '==', readerId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ArcClaim));
      }
    }
  } catch (err) {
    console.warn('Firestore getReaderClaims fallback:', err);
  }

  const claims = getLocal<ArcClaim>(STORAGE_KEYS.CLAIMS, []);
  return claims.filter((c) => c.readerId === readerId);
}

/**
 * Reader submits voluntary review proof link
 */
export async function submitVoluntaryReview(
  claimId: string,
  reviewUrl: string,
  rating?: number,
  feedback?: string
): Promise<void> {
  const updateData = {
    status: 'reviewed' as const,
    reviewUrl,
    reviewRating: rating,
    feedbackText: feedback,
    reviewDate: new Date().toISOString(),
  };

  try {
    if (db) {
      await updateDoc(doc(db, 'arc_claims', claimId), updateData);
    }
  } catch (err) {
    console.warn('Firestore submitVoluntaryReview fallback:', err);
  }

  const claims = getLocal<ArcClaim>(STORAGE_KEYS.CLAIMS, []);
  const idx = claims.findIndex((c) => c.id === claimId);
  if (idx !== -1) {
    claims[idx] = { ...claims[idx], ...updateData };
    setLocal(STORAGE_KEYS.CLAIMS, claims);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NEWSLETTER CROSS-PROMOTION SWAP OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all newsletter swaps for an author
 */
export async function getNewsletterSwaps(authorId?: string): Promise<NewsletterSwap[]> {
  try {
    if (db && authorId) {
      const q1 = query(
        collection(db, 'newsletter_swaps'),
        where('requesterAuthorId', '==', authorId)
      );
      const snap1 = await getDocs(q1);
      const list1 = snap1.docs.map((d) => ({ id: d.id, ...d.data() } as NewsletterSwap));

      const q2 = query(
        collection(db, 'newsletter_swaps'),
        where('recipientAuthorId', '==', authorId)
      );
      const snap2 = await getDocs(q2);
      const list2 = snap2.docs.map((d) => ({ id: d.id, ...d.data() } as NewsletterSwap));

      const combined = [...list1, ...list2];
      if (combined.length > 0) return combined;
    }
  } catch (err) {
    console.warn('Firestore getNewsletterSwaps fallback:', err);
  }

  const swaps = getLocal<NewsletterSwap>(STORAGE_KEYS.SWAPS, SEED_SWAPS);
  if (!authorId) return swaps;
  return swaps.filter(
    (s) => s.requesterAuthorId === authorId || s.recipientAuthorId === authorId
  );
}

/**
 * Propose a new newsletter swap
 */
export async function proposeNewsletterSwap(
  data: Omit<NewsletterSwap, 'id' | 'status' | 'requesterClicks' | 'recipientClicks' | 'trackingTokenA' | 'trackingTokenB' | 'createdAt' | 'updatedAt'>
): Promise<NewsletterSwap> {
  const swapId = `swap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const swap: NewsletterSwap = {
    ...data,
    id: swapId,
    status: 'pending',
    requesterClicks: 0,
    recipientClicks: 0,
    trackingTokenA: `trk-a-${Math.random().toString(36).substring(2, 8)}`,
    trackingTokenB: `trk-b-${Math.random().toString(36).substring(2, 8)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    if (db) {
      await setDoc(doc(db, 'newsletter_swaps', swapId), swap);
    }
  } catch (err) {
    console.warn('Firestore proposeNewsletterSwap fallback:', err);
  }

  const swaps = getLocal<NewsletterSwap>(STORAGE_KEYS.SWAPS, SEED_SWAPS);
  swaps.unshift(swap);
  setLocal(STORAGE_KEYS.SWAPS, swaps);

  return swap;
}

/**
 * Accept or decline a newsletter swap proposal
 */
export async function respondToNewsletterSwap(
  swapId: string,
  status: 'accepted' | 'declined' | 'completed'
): Promise<void> {
  try {
    if (db) {
      await updateDoc(doc(db, 'newsletter_swaps', swapId), {
        status,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Firestore respondToNewsletterSwap fallback:', err);
  }

  const swaps = getLocal<NewsletterSwap>(STORAGE_KEYS.SWAPS, SEED_SWAPS);
  const idx = swaps.findIndex((s) => s.id === swapId);
  if (idx !== -1) {
    swaps[idx].status = status;
    swaps[idx].updatedAt = new Date().toISOString();
    setLocal(STORAGE_KEYS.SWAPS, swaps);
  }
}

/**
 * Record a click on a swap attribution link
 */
export async function recordSwapClick(trackingToken: string): Promise<string | null> {
  const swaps = getLocal<NewsletterSwap>(STORAGE_KEYS.SWAPS, SEED_SWAPS);
  for (const s of swaps) {
    if (s.trackingTokenA === trackingToken) {
      s.requesterClicks = (s.requesterClicks || 0) + 1;
      setLocal(STORAGE_KEYS.SWAPS, swaps);
      return s.recipientAmazonUrl;
    }
    if (s.trackingTokenB === trackingToken) {
      s.recipientClicks = (s.recipientClicks || 0) + 1;
      setLocal(STORAGE_KEYS.SWAPS, swaps);
      return s.requesterAmazonUrl;
    }
  }
  return null;
}
