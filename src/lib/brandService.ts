/**
 * KDP Studio — Brand Kit Service
 * Firestore & Storage CRUD operations for Author Brand Kit
 * Phase 12A — KDP Studio
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { BrandKit, DEFAULT_BRAND_KIT } from '../types/brand';
import { Book } from '../types';
import { trackFeatureUse } from './featureTracker';

const BRAND_CACHE_PREFIX = 'kdp_brand_kit_';
const inMemoryBrandKits = new Map<string, BrandKit>();

function getLocalBrandKit(uid: string): BrandKit | null {
  if (inMemoryBrandKits.has(uid)) {
    return inMemoryBrandKits.get(uid) || null;
  }
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${BRAND_CACHE_PREFIX}${uid}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function setLocalBrandKit(uid: string, data: BrandKit): void {
  inMemoryBrandKits.set(uid, data);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(`${BRAND_CACHE_PREFIX}${uid}`, JSON.stringify(data));
    } catch {
      // silent
    }
  }
}

/**
 * Retrieves an author's Brand Kit
 */
export async function getBrandKit(uid: string): Promise<BrandKit | null> {
  if (!uid) return null;

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'brandKits', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as BrandKit;
        setLocalBrandKit(uid, data);
        return data;
      }
    } catch (err) {
      console.warn('Firestore getBrandKit warning, reading local fallback:', err);
    }
  }

  return getLocalBrandKit(uid);
}

/**
 * Saves or updates an author's Brand Kit
 */
export async function saveBrandKit(uid: string, data: Partial<BrandKit>): Promise<void> {
  if (!uid) return;

  const nowIso = new Date().toISOString();
  const existing = (await getBrandKit(uid)) || { ...DEFAULT_BRAND_KIT, uid, createdAt: nowIso, updatedAt: nowIso };

  const updated: BrandKit = {
    ...existing,
    ...data,
    uid,
    updatedAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'brandKits', uid);
      await setDoc(docRef, {
        ...updated,
        updatedAt: serverTimestamp(),
        createdAt: existing.createdAt || serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore saveBrandKit error, saved to local cache:', err);
    }
  }

  setLocalBrandKit(uid, updated);
  trackFeatureUse(uid, 'brand_kit_saved').catch(console.error);
}

/**
 * Converts a File object to an optimized Base64 Data URL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an Author Photo directly to Firestore as an optimized Data URL
 */
export async function uploadAuthorPhoto(uid: string, file: File): Promise<string> {
  if (!uid || !file) throw new Error('Missing user or file for photo upload');

  const dataUrl = await fileToDataUrl(file);
  await saveBrandKit(uid, { authorPhotoUrl: dataUrl });
  return dataUrl;
}

/**
 * Uploads an Author / Publisher Logo directly to Firestore as an optimized Data URL
 */
export async function uploadLogo(uid: string, file: File): Promise<string> {
  if (!uid || !file) throw new Error('Missing user or file for logo upload');

  const dataUrl = await fileToDataUrl(file);
  await saveBrandKit(uid, { logoUrl: dataUrl });
  return dataUrl;
}

/**
 * Replaces variables in copyright template
 */
export function formatCopyrightText(
  template: string,
  vars: {
    year?: number | string;
    author?: string;
    publisher?: string;
    website?: string;
    isbn?: string;
    includeImprint?: boolean;
  }
): string {
  const currentYear = vars.year || new Date().getFullYear();
  let text = (template || DEFAULT_BRAND_KIT.copyrightTemplate)
    .replace(/\{year\}/g, String(currentYear))
    .replace(/\{author\}/g, vars.author || 'Author')
    .replace(/\{publisher\}/g, vars.publisher || 'Independent Publisher')
    .replace(/\{website\}/g, vars.website || '')
    .replace(/\{isbn\}/g, vars.isbn || '[ISBN-13]');

  if (vars.includeImprint !== false) {
    text += '\n\nTypeset and formatted using KDP Studio (https://kdpstudio.com)';
  }
  return text;
}

/**
 * Automatically applies brand defaults to a new Book manuscript
 */
export async function applyBrandKitToBook(uid: string, book: Partial<Book>): Promise<Partial<Book>> {
  const brandKit = await getBrandKit(uid);
  if (!brandKit || !brandKit.autoApplyToNewBooks) return book;

  const chosenAuthor = brandKit.activePenName || brandKit.authorName || book.author || 'Kindle Author';
  const copyrightContent = formatCopyrightText(brandKit.copyrightTemplate, {
    author: chosenAuthor,
    publisher: brandKit.publisherName,
    website: brandKit.authorWebsite,
  });

  return {
    ...book,
    author: chosenAuthor,
    genre: book.genre || brandKit.defaultGenre,
    language: book.language || brandKit.defaultLanguage,
    trimSize: (book.trimSize || brandKit.defaultTrimSize) as any,
    paperType: (book.paperType || brandKit.defaultPaperType) as any,
    frontMatter: {
      titlePage: true,
      copyrightPage: true,
      dedication: book.frontMatter?.dedication || '',
      tableOfContents: true,
      preface: book.frontMatter?.preface || '',
      ...(book.frontMatter || {}),
      copyrightText: copyrightContent,
    },
    backMatter: {
      aboutAuthor: brandKit.authorBioMedium || brandKit.authorBioShort || book.backMatter?.aboutAuthor || '',
      aboutAuthorText: brandKit.authorBioMedium || brandKit.authorBioShort || '',
      otherBooks: book.backMatter?.otherBooks || '',
      resources: book.backMatter?.resources || (brandKit.authorWebsite ? `Connect with author: ${brandKit.authorWebsite}` : ''),
      ...(book.backMatter || {}),
    },
  };
}

/**
 * Returns brand styling tokens for the Cover Builder
 */
export async function getBrandKitForCover(uid: string): Promise<{
  colors: { primary: string; secondary: string; accent: string; text: string; background: string };
  fonts: { heading: string; body: string; accent: string };
  logoUrl: string | null;
  logoText: string;
  authorName: string;
}> {
  const brand = (await getBrandKit(uid)) || ({ ...DEFAULT_BRAND_KIT, uid } as BrandKit);

  return {
    colors: {
      primary: brand.primaryColor,
      secondary: brand.secondaryColor,
      accent: brand.accentColor,
      text: brand.textColor,
      background: brand.backgroundColor,
    },
    fonts: {
      heading: brand.headingFont,
      body: brand.bodyFont,
      accent: brand.accentFont,
    },
    logoUrl: brand.logoUrl,
    logoText: brand.logoText || brand.publisherName || brand.authorName,
    authorName: brand.activePenName || brand.authorName,
  };
}

/**
 * Injects Google Fonts stylesheet link dynamically for preview
 */
export function loadGoogleFonts(fonts: string[]): void {
  if (typeof document === 'undefined') return;
  fonts.forEach((font) => {
    if (!font) return;
    const linkId = `gfont-${font.replace(/\s+/g, '-').toLowerCase()}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;900&display=swap`;
      document.head.appendChild(link);
    }
  });
}
