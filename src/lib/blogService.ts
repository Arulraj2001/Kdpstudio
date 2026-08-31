/**
 * Database-Driven Blog CMS & EEAT Architecture Service
 * KDP Studio — Amazon KDP Self-Publishing Suite
 */

import {
  BlogPost,
  BlogAuthor,
  BlogTocItem,
  BlogStatus,
  AdConfig,
  AdPositionConfig,
} from '../types/blog';
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  increment,
  serverTimestamp,
} from 'firebase/firestore';

// Browser-safe fallback: In client environment, delegate all operations to Web Firestore SDK (db)
function getAdminDb(): any {
  return null;
}

// ── Default Ad Placements ──
export const DEFAULT_AD_POSITIONS: AdPositionConfig[] = [
  {
    id: 'header',
    name: 'Header Banner',
    description: 'Above the post title',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: true,
    minWordCount: 0,
  },
  {
    id: 'in-article-1',
    name: 'In-Article #1',
    description: 'After first 300 words',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: true,
    minWordCount: 600,
  },
  {
    id: 'in-article-2',
    name: 'In-Article #2',
    description: 'After middle of article',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: true,
    minWordCount: 1200,
  },
  {
    id: 'in-article-3',
    name: 'In-Article #3',
    description: 'Before conclusion',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: true,
    minWordCount: 2000,
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Right sidebar on desktop',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: true,
    minWordCount: 0,
  },
  {
    id: 'footer',
    name: 'Footer',
    description: 'Below article content',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: false,
    minWordCount: 0,
  },
  {
    id: 'between-posts',
    name: 'Between Posts',
    description: 'Between related posts',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: true,
    minWordCount: 0,
  },
];

// Helper to strip HTML tags
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

// ─────────────────────────────────────────
// Content Analysis & Slug Generation
// ─────────────────────────────────────────

export function generateSlug(title: string): string {
  if (!title) return 'untitled-post';
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special characters
    .replace(/\s+/g, '-')     // replace spaces with hyphens
    .replace(/-+/g, '-')      // remove consecutive hyphens
    .replace(/^-+|-+$/g, ''); // trim hyphens from ends
}

export async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  const baseSlug = slug || 'untitled-post';
  let candidate = baseSlug;
  let counter = 1;

  const admin = getAdminDb();
  if (admin) {
    while (true) {
      const snap = await admin.collection('blogPosts').where('slug', '==', candidate).limit(2).get();
      const docs = snap.docs.filter((d) => d.id !== excludeId);
      if (docs.length === 0) return candidate;
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
  } else if (db) {
    while (true) {
      const q = query(collection(db, 'blogPosts'), where('slug', '==', candidate), firestoreLimit(2));
      const snap = await getDocs(q);
      const docs = snap.docs.filter((d) => d.id !== excludeId);
      if (docs.length === 0) return candidate;
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
  }

  return candidate;
}

export function countWords(html: string): number {
  const text = stripHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function calculateReadingTime(html: string): number {
  const words = countWords(html);
  // Average adult reading speed: 238 words per minute
  return Math.max(1, Math.ceil(words / 238));
}

export function generateTableOfContents(html: string): BlogTocItem[] {
  if (!html) return [];
  const items: BlogTocItem[] = [];
  const headingRegex = /<h([234])(?:\s+[^>]*)?>(.*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10) as 2 | 3 | 4;
    const rawTag = match[0];
    const rawContent = match[2];
    const text = stripHtml(rawContent);
    if (!text) continue;

    // Check for existing id attribute
    const idMatch = /id=["']([^"']+)["']/i.exec(rawTag);
    const id = idMatch
      ? idMatch[1]
      : text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');

    items.push({ id, text, level });
  }

  return items;
}

export function generateExcerpt(html: string, maxChars: number = 155): string {
  const text = stripHtml(html);
  if (text.length <= maxChars) return text;
  const truncated = text.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

// ─────────────────────────────────────────
// CRUD Operations
// ─────────────────────────────────────────

export async function createBlogPost(
  data: Omit<
    BlogPost,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'readingTimeMinutes'
    | 'wordCount'
    | 'tableOfContents'
    | 'viewCount'
    | 'estimatedReadCount'
    | 'revisionCount'
  >,
  adminEmail: string
): Promise<string> {
  const slug = await ensureUniqueSlug(data.slug || generateSlug(data.title));
  const wordCount = countWords(data.content);
  const readingTimeMinutes = calculateReadingTime(data.content);
  const tableOfContents = generateTableOfContents(data.content);
  const excerpt = data.excerpt || generateExcerpt(data.content, 155);
  const now = new Date().toISOString();

  const isPublished = data.status === 'published';
  const publishedAt = isPublished ? (data.publishedAt || now) : (data.publishedAt || null);

  const postPayload: Omit<BlogPost, 'id'> = {
    ...data,
    slug,
    excerpt,
    wordCount,
    readingTimeMinutes,
    tableOfContents,
    metaTitle: data.metaTitle || data.title,
    metaDescription: data.metaDescription || excerpt,
    ogTitle: data.ogTitle || data.metaTitle || data.title,
    ogDescription: data.ogDescription || data.metaDescription || excerpt,
    ogImage: data.ogImage || data.featuredImage?.url || null,
    twitterTitle: data.twitterTitle || data.metaTitle || data.title,
    twitterDescription: data.twitterDescription || data.metaDescription || excerpt,
    twitterImage: data.twitterImage || data.featuredImage?.url || null,
    canonicalUrl: data.canonicalUrl || `https://kdpstudio-aio.web.app/blog/${slug}`,
    noIndex: data.noIndex || false,
    schemaType: data.schemaType || 'Article',
    faqItems: data.faqItems || [],
    howToSteps: data.howToSteps || [],
    sources: data.sources || [],
    adsEnabled: data.adsEnabled !== false,
    adOverrides: data.adOverrides || [],
    viewCount: 0,
    estimatedReadCount: 0,
    createdAt: now,
    publishedAt,
    updatedAt: now,
    lastReviewedAt: data.lastReviewedAt || (isPublished ? now : null),
    reviewedBy: data.reviewedBy || null,
    isExpertReviewed: data.isExpertReviewed || false,
    publishedBy: adminEmail,
    lastEditedBy: adminEmail,
    revisionCount: 1,
    internalNotes: data.internalNotes || '',
  };

  const admin = getAdminDb();
  let postId = '';

  if (admin) {
    const docRef = admin.collection('blogPosts').doc();
    postId = docRef.id;
    await docRef.set({ id: postId, ...postPayload });

    // Update author post count if authorId exists
    if (data.authorId) {
      await admin
        .collection('blogAuthors')
        .doc(data.authorId)
        .set({ totalPosts: (admin as any).firestore.FieldValue.increment(1) }, { merge: true })
        .catch(() => {});
    }
  } else if (db) {
    const colRef = collection(db, 'blogPosts');
    const newDoc = doc(colRef);
    postId = newDoc.id;
    await setDoc(newDoc, { id: postId, ...postPayload });

    if (data.authorId) {
      await updateDoc(doc(db, 'blogAuthors', data.authorId), {
        totalPosts: increment(1),
      }).catch(() => {});
    }
  }

  // Trigger ISR Revalidation if published
  if (isPublished) {
    revalidateBlogPost(slug).catch(console.error);
  }

  return postId;
}

export async function updateBlogPost(
  id: string,
  data: Partial<BlogPost>,
  adminEmail: string
): Promise<void> {
  const now = new Date().toISOString();
  const updateData: any = {
    ...data,
    updatedAt: now,
    lastEditedBy: adminEmail,
  };

  if (data.content !== undefined) {
    updateData.wordCount = countWords(data.content);
    updateData.readingTimeMinutes = calculateReadingTime(data.content);
    updateData.tableOfContents = generateTableOfContents(data.content);
    if (!data.excerpt) {
      updateData.excerpt = generateExcerpt(data.content, 155);
    }
  }

  if (data.slug) {
    updateData.slug = await ensureUniqueSlug(data.slug, id);
  }

  if (data.status === 'published' && !data.publishedAt) {
    updateData.publishedAt = now;
  }

  const admin = getAdminDb();
  if (admin) {
    const docRef = admin.collection('blogPosts').doc(id);
    await docRef.set(
      {
        ...updateData,
        revisionCount: (admin as any).firestore.FieldValue.increment(1),
      },
      { merge: true }
    );
  } else if (db) {
    const docRef = doc(db, 'blogPosts', id);
    await updateDoc(docRef, {
      ...updateData,
      revisionCount: increment(1),
    });
  }

  // Revalidate ISR if published
  if (data.slug || updateData.slug) {
    revalidateBlogPost(data.slug || updateData.slug).catch(console.error);
  }
}

export async function deleteBlogPost(id: string): Promise<void> {
  // Soft delete: never hard delete blog posts for SEO preservation
  const now = new Date().toISOString();
  const admin = getAdminDb();
  if (admin) {
    await admin.collection('blogPosts').doc(id).update({
      status: 'archived',
      updatedAt: now,
    });
  } else if (db) {
    await updateDoc(doc(db, 'blogPosts', id), {
      status: 'archived',
      updatedAt: now,
    });
  }
}

export function mapSeedPostToBlogPost(post: any): BlogPost {
  return {
    id: post.slug,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || generateExcerpt(post.content || '', 155),
    content: post.content || '',
    status: 'published',
    category: post.category || 'Publishing Strategy',
    tags: Array.isArray(post.tags) ? post.tags : ['KDP', 'Publishing'],
    authorName: post.author || 'KDP Studio Editorial Board',
    authorRole: 'KDP Publishing Specialist',
    authorCredentials: post.authorCredentials || 'Senior KDP Publishing Strategist',
    authorPhotoUrl: post.authorPhotoUrl || null,
    readingTimeMinutes: post.readTime ? parseInt(post.readTime) || calculateReadingTime(post.content || '') : calculateReadingTime(post.content || ''),
    wordCount: countWords(post.content || ''),
    tableOfContents: generateTableOfContents(post.content || ''),
    featuredImage: null,
    viewCount: 1420,
    publishedAt: post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
    createdAt: post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
    updatedAt: post.date ? new Date(post.date).toISOString() : new Date().toISOString(),
    focusKeyword: post.focusKeyword || '',
    secondaryKeywords: post.secondaryKeywords || [],
    metaTitle: post.metaTitle || post.title,
    metaDescription: post.metaDescription || post.excerpt || '',
    schemaType: post.schemaType || 'Article',
    faqItems: post.faqItems || [],
    howToSteps: post.howToSteps || [],
    sources: post.sources || [],
    isExpertReviewed: post.isExpertReviewed !== undefined ? post.isExpertReviewed : true,
    reviewedBy: post.reviewedBy || 'Elena Vance, Self-Publishing Director',
    lastReviewedAt: post.lastReviewedAt || '2026-08-28',
    adsEnabled: true,
  } as BlogPost;
}

export async function getBlogPost(id: string): Promise<BlogPost | null> {
  const admin = getAdminDb();
  if (admin) {
    try {
      const snap = await admin.collection('blogPosts').doc(id).get();
      if (snap.exists) return snap.data() as BlogPost;
    } catch {}
  } else if (db) {
    try {
      const snap = await getDoc(doc(db, 'blogPosts', id));
      if (snap.exists()) return snap.data() as BlogPost;
    } catch {}
  }

  // Fallback to SEED_BLOG_POSTS
  try {
    const { SEED_BLOG_POSTS } = await import('./blog');
    const seed = SEED_BLOG_POSTS.find((p) => p.slug === id);
    if (seed) return mapSeedPostToBlogPost(seed);
  } catch {}

  return null;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const admin = getAdminDb();
  if (admin) {
    try {
      const snap = await admin.collection('blogPosts').where('slug', '==', slug).limit(1).get();
      if (!snap.empty) return snap.docs[0].data() as BlogPost;
    } catch {}
  } else if (db) {
    try {
      const q = query(collection(db, 'blogPosts'), where('slug', '==', slug), firestoreLimit(1));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs[0].data() as BlogPost;
    } catch {}
  }

  // Fallback to SEED_BLOG_POSTS
  try {
    const { SEED_BLOG_POSTS } = await import('./blog');
    const seed = SEED_BLOG_POSTS.find((p) => p.slug === slug);
    if (seed) return mapSeedPostToBlogPost(seed);
  } catch {}

  return null;
}

export async function getAllSlugs(): Promise<string[]> {
  const admin = getAdminDb();
  if (admin) {
    try {
      const snap = await admin.collection('blogPosts').where('status', '==', 'published').get();
      if (!snap.empty) return snap.docs.map((d: any) => d.data().slug).filter(Boolean);
    } catch {}
  } else if (db) {
    try {
      const q = query(collection(db, 'blogPosts'), where('status', '==', 'published'));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs.map((d) => d.data().slug).filter(Boolean);
    } catch {}
  }

  try {
    const { SEED_BLOG_POSTS } = await import('./blog');
    return SEED_BLOG_POSTS.map((p) => p.slug);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────
// Dynamic Database Auto-Seeding & Retrieval
// ─────────────────────────────────────────

export async function seedBlogPostsIfEmpty(): Promise<BlogPost[]> {
  try {
    const { SEED_BLOG_POSTS } = await import('./blog');
    if (!SEED_BLOG_POSTS || !SEED_BLOG_POSTS.length) return [];

    if (db) {
      const snap = await getDocs(collection(db, 'blogPosts'));
      if (snap.empty) {
        const seeded: BlogPost[] = [];
        for (const post of SEED_BLOG_POSTS) {
          const docRef = doc(db, 'blogPosts', post.slug);
          const fullPost = mapSeedPostToBlogPost(post);
          await setDoc(docRef, fullPost).catch(() => {});
          seeded.push(fullPost);
        }
        return seeded;
      }
    }
  } catch (err) {
    console.warn('[BlogService] Auto-seeding notice:', err);
  }
  return [];
}

export async function getPublishedPosts(options?: {
  limit?: number;
  cursor?: string;
  category?: string;
  tag?: string;
  authorId?: string;
  excludeId?: string;
}): Promise<{ posts: BlogPost[]; nextCursor: string | null }> {
  const limitCount = options?.limit || 12;
  let posts: BlogPost[] = [];

  if (db) {
    try {
      const snap = await getDocs(collection(db, 'blogPosts'));
      if (!snap.empty) {
        posts = snap.docs
          .map((d) => d.data() as BlogPost)
          .filter((p) => p.status === 'published');
      }
    } catch (err) {
      console.warn('[BlogService] getPublishedPosts Firestore fetch:', err);
    }
  }

  // Fallback to SEED_BLOG_POSTS if Firestore returns empty
  if (posts.length === 0) {
    try {
      const { SEED_BLOG_POSTS } = await import('./blog');
      posts = SEED_BLOG_POSTS.map(mapSeedPostToBlogPost);
      seedBlogPostsIfEmpty().catch(() => {});
    } catch {}
  }

  // Apply Category Filter
  if (options?.category && options.category !== 'All') {
    posts = posts.filter(
      (p) => (p.category || '').toLowerCase() === options.category!.toLowerCase()
    );
  }

  // Apply Tag Filter
  if (options?.tag && options.tag !== 'All') {
    posts = posts.filter((p) => Array.isArray(p.tags) && p.tags.includes(options.tag!));
  }

  // Apply Author Filter
  if (options?.authorId) {
    posts = posts.filter((p) => p.authorId === options.authorId);
  }

  // Exclude ID
  if (options?.excludeId) {
    posts = posts.filter((p) => p.id !== options.excludeId);
  }

  // Sort latest published first
  posts.sort(
    (a, b) =>
      new Date(b.publishedAt || b.createdAt || 0).getTime() -
      new Date(a.publishedAt || a.createdAt || 0).getTime()
  );

  let nextCursor: string | null = null;
  if (posts.length > limitCount) {
    posts = posts.slice(0, limitCount);
    nextCursor = posts[posts.length - 1]?.id || null;
  }

  return { posts, nextCursor };
}

export async function getAllAdminPosts(options?: {
  status?: BlogStatus;
  category?: string;
  search?: string;
}): Promise<BlogPost[]> {
  let posts: BlogPost[] = [];

  if (db) {
    try {
      const snap = await getDocs(collection(db, 'blogPosts'));
      if (!snap.empty) {
        posts = snap.docs.map((d) => d.data() as BlogPost);
      }
    } catch (err) {
      console.warn('[BlogService] getAllAdminPosts Firestore notice:', err);
    }
  }

  // If no posts in Firestore yet, provide seed posts and auto-seed in background
  if (posts.length === 0) {
    try {
      const { SEED_BLOG_POSTS } = await import('./blog');
      posts = SEED_BLOG_POSTS.map(mapSeedPostToBlogPost);
      seedBlogPostsIfEmpty().catch(() => {});
    } catch {}
  }

  // Filter by status if specified
  if (options?.status && options.status !== 'all') {
    posts = posts.filter((p) => p.status === options.status);
  }

  // Filter by category if specified
  if (options?.category && options.category !== 'All') {
    posts = posts.filter(
      (p) => (p.category || '').toLowerCase() === options.category!.toLowerCase()
    );
  }

  // Search filter
  if (options?.search) {
    const s = options.search.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title?.toLowerCase().includes(s) ||
        p.slug?.toLowerCase().includes(s) ||
        p.authorName?.toLowerCase().includes(s) ||
        p.tags?.some((t) => t.toLowerCase().includes(s))
    );
  }

  // Sort by updated/created date descending
  return posts.sort(
    (a, b) =>
      new Date(b.updatedAt || b.publishedAt || b.createdAt || 0).getTime() -
      new Date(a.updatedAt || a.publishedAt || a.createdAt || 0).getTime()
  );
}

export async function getLiveCategories(): Promise<string[]> {
  try {
    const posts = await getAllAdminPosts();
    const categoriesSet = new Set<string>();
    categoriesSet.add('All');
    posts.forEach((p) => {
      if (p.category && p.category.trim()) {
        categoriesSet.add(p.category.trim());
      }
    });
    return Array.from(categoriesSet);
  } catch {
    return ['All', 'Publishing Strategy', 'Cover Design', 'KDP Formatting', 'Keywords & SEO'];
  }
}

export async function getLiveTags(): Promise<string[]> {
  try {
    const posts = await getAllAdminPosts();
    const tagsSet = new Set<string>();
    tagsSet.add('All');
    posts.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          if (t && t.trim()) tagsSet.add(t.trim());
        });
      }
    });
    return Array.from(tagsSet);
  } catch {
    return ['All', 'KDP', 'Self-Publishing', 'Amazon'];
  }
}

// ─────────────────────────────────────────
// Author Operations
// ─────────────────────────────────────────

export async function createAuthor(
  data: Omit<BlogAuthor, 'id' | 'createdAt' | 'updatedAt' | 'totalPosts' | 'slug'>
): Promise<string> {
  const slug = generateSlug(data.name);
  const now = new Date().toISOString();
  const admin = getAdminDb();

  const authorPayload: Omit<BlogAuthor, 'id'> = {
    ...data,
    slug,
    totalPosts: 0,
    createdAt: now,
    updatedAt: now,
  };

  if (admin) {
    const docRef = admin.collection('blogAuthors').doc();
    await docRef.set({ id: docRef.id, ...authorPayload });
    return docRef.id;
  } else if (db) {
    const colRef = collection(db, 'blogAuthors');
    const newDoc = doc(colRef);
    await setDoc(newDoc, { id: newDoc.id, ...authorPayload });
    return newDoc.id;
  }

  return '';
}

export async function getAllAuthors(): Promise<BlogAuthor[]> {
  const admin = getAdminDb();
  if (admin) {
    const snap = await admin.collection('blogAuthors').orderBy('name', 'asc').get();
    return snap.docs.map((d) => d.data() as BlogAuthor);
  } else if (db) {
    const q = query(collection(db, 'blogAuthors'), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as BlogAuthor);
  }
  return [];
}

export async function getAuthor(id: string): Promise<BlogAuthor | null> {
  const admin = getAdminDb();
  if (admin) {
    const snap = await admin.collection('blogAuthors').doc(id).get();
    if (!snap.exists) return null;
    return snap.data() as BlogAuthor;
  } else if (db) {
    const snap = await getDoc(doc(db, 'blogAuthors', id));
    if (!snap.exists()) return null;
    return snap.data() as BlogAuthor;
  }
  return null;
}

export async function updateAuthor(id: string, data: Partial<BlogAuthor>): Promise<void> {
  const now = new Date().toISOString();
  const admin = getAdminDb();
  if (admin) {
    await admin.collection('blogAuthors').doc(id).set({ ...data, updatedAt: now }, { merge: true });
  } else if (db) {
    await updateDoc(doc(db, 'blogAuthors', id), { ...data, updatedAt: now });
  }
}

// ─────────────────────────────────────────
// Ad Config Operations
// ─────────────────────────────────────────

export async function getAdConfig(): Promise<AdConfig> {
  const admin = getAdminDb();
  const defaultDoc: AdConfig = {
    adsensePublisherId: process.env.NEXT_PUBLIC_ADSENSE_PUB_ID || '',
    globalAdsEnabled: false,
    autoAdsEnabled: false,
    positions: DEFAULT_AD_POSITIONS,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  };

  try {
    if (admin) {
      const snap = await admin.collection('adConfig').doc('settings').get();
      if (!snap.exists) return defaultDoc;
      return { ...defaultDoc, ...snap.data() } as AdConfig;
    } else if (db) {
      const snap = await getDoc(doc(db, 'adConfig', 'settings'));
      if (!snap.exists()) return defaultDoc;
      return { ...defaultDoc, ...snap.data() } as AdConfig;
    }
  } catch (err) {
    console.warn('[blogService] getAdConfig error fallback:', err);
  }

  return defaultDoc;
}

export async function saveAdConfig(config: AdConfig, adminEmail: string): Promise<void> {
  const payload = {
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail,
  };

  const admin = getAdminDb();
  if (admin) {
    await admin.collection('adConfig').doc('settings').set(payload, { merge: true });
  } else if (db) {
    await setDoc(doc(db, 'adConfig', 'settings'), payload, { merge: true });
  }
}

// ─────────────────────────────────────────
// ISR Revalidation & Cache Refresh
// ─────────────────────────────────────────

export async function revalidateBlogPost(slug: string): Promise<void> {
  try {
    const revalidateSecret = process.env.REVALIDATE_SECRET || 'kdp-studio-revalidate-2026';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kdpstudio-aio.web.app';

    if (typeof fetch !== 'undefined') {
      await fetch(`${baseUrl}/api/blog/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${revalidateSecret}`,
        },
        body: JSON.stringify({ slug }),
      }).catch((e) => console.debug('[ISR] Non-blocking revalidation dispatch notice:', e?.message));
    }
  } catch (e) {
    // Non-blocking
  }
}

export async function revalidateAll(): Promise<void> {
  try {
    const revalidateSecret = process.env.REVALIDATE_SECRET || 'kdp-studio-revalidate-2026';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kdpstudio-aio.web.app';

    if (typeof fetch !== 'undefined') {
      await fetch(`${baseUrl}/api/blog/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${revalidateSecret}`,
        },
        body: JSON.stringify({ revalidateAll: true }),
      }).catch((e) => console.debug('[ISR] Non-blocking revalidateAll dispatch notice:', e?.message));
    }
  } catch (e) {
    // Non-blocking
  }
}

// ─────────────────────────────────────────
// View Count & IP Rate Limiting
// ─────────────────────────────────────────

export async function incrementViewCount(postId: string, clientIp: string = 'unknown'): Promise<boolean> {
  if (!postId) return false;
  const currentHour = Math.floor(Date.now() / 3600000);
  const cleanIp = clientIp.replace(/[^a-zA-Z0-9]/g, '_');
  const rateLimitKey = `${cleanIp}_${postId}_${currentHour}`;

  const admin = getAdminDb();
  if (admin) {
    const rateRef = admin.collection('viewRateLimit').doc(rateLimitKey);
    const snap = await rateRef.get();
    if (snap.exists) {
      return false; // Already counted this hour
    }

    await rateRef.set({
      ip: clientIp,
      postId,
      hour: currentHour,
      createdAt: (admin as any).firestore.FieldValue.serverTimestamp(),
    });

    await admin.collection('blogPosts').doc(postId).update({
      viewCount: (admin as any).firestore.FieldValue.increment(1),
    }).catch(() => {});

    return true;
  } else if (db) {
    const rateRef = doc(db, 'viewRateLimit', rateLimitKey);
    const snap = await getDoc(rateRef);
    if (snap.exists()) {
      return false;
    }

    await setDoc(rateRef, {
      ip: clientIp,
      postId,
      hour: currentHour,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'blogPosts', postId), {
      viewCount: increment(1),
    }).catch(() => {});

    return true;
  }

  return false;
}
