/**
 * KDP Studio — Bulk Book Generator Service
 * Phase 14A
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
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import {
  BulkTemplate,
  BulkJob,
  BulkVariation,
  BulkJobStatus,
  BulkBookType,
} from '../types/bulk';

const TEMPLATES_COLLECTION = 'bulkTemplates';
const JOBS_COLLECTION = 'bulkJobs';
const LOCAL_TEMPLATES_KEY = 'kdp_bulk_templates_offline';
const LOCAL_JOBS_KEY = 'kdp_bulk_jobs_offline';

// ---------------------------------------------------------------------------
// Offline / LocalStorage Helpers
// ---------------------------------------------------------------------------

function getLocalTemplates(): BulkTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTemplates(templates: BulkTemplate[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(templates));
  } catch {}
}

function getLocalJobs(): BulkJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_JOBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalJobs(jobs: BulkJob[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(jobs));
  } catch {}
}

// ---------------------------------------------------------------------------
// Template Operations
// ---------------------------------------------------------------------------

/**
 * Saves a new bulk template to Firestore / LocalStorage
 */
export async function saveBulkTemplate(
  uid: string,
  templateData: Omit<BulkTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const templateId = 'btpl_' + Math.random().toString(36).substring(2, 9) + Date.now();
  const now = new Date().toISOString();

  const newTemplate: BulkTemplate = {
    ...templateData,
    id: templateId,
    uid,
    createdAt: now,
    updatedAt: now,
  };

  // Sync to localStorage
  const localList = getLocalTemplates();
  saveLocalTemplates([newTemplate, ...localList]);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
      await setDoc(docRef, newTemplate);
    } catch (err) {
      console.warn('Firestore saveBulkTemplate fallback to local:', err);
    }
  }

  return templateId;
}

/**
 * Fetches all bulk templates for a user
 */
export async function getUserBulkTemplates(uid: string): Promise<BulkTemplate[]> {
  let list: BulkTemplate[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, TEMPLATES_COLLECTION),
        where('uid', '==', uid)
      );
      const snapshot = await getDocs(q);
      list = snapshot.docs.map((d) => d.data() as BulkTemplate);
    } catch (err) {
      console.warn('Firestore getUserBulkTemplates fallback to local:', err);
    }
  }

  if (!list.length) {
    const local = getLocalTemplates().filter((t) => t.uid === uid || uid === 'demo-user-123');
    list = local;
  }

  return list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
}

/**
 * Gets a single bulk template by ID
 */
export async function getBulkTemplate(templateId: string): Promise<BulkTemplate | null> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as BulkTemplate;
      }
    } catch (err) {
      console.warn('Firestore getBulkTemplate error:', err);
    }
  }

  const local = getLocalTemplates().find((t) => t.id === templateId);
  return local || null;
}

/**
 * Updates an existing bulk template
 */
export async function updateBulkTemplate(
  templateId: string,
  data: Partial<BulkTemplate>
): Promise<void> {
  const now = new Date().toISOString();
  const updatePayload = { ...data, updatedAt: now };

  // Update local
  const localList = getLocalTemplates().map((t) =>
    t.id === templateId ? { ...t, ...updatePayload } : t
  );
  saveLocalTemplates(localList);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
      await updateDoc(docRef, updatePayload);
    } catch (err) {
      console.warn('Firestore updateBulkTemplate error:', err);
    }
  }
}

/**
 * Deletes a bulk template
 */
export async function deleteBulkTemplate(templateId: string): Promise<void> {
  // Update local
  const localList = getLocalTemplates().filter((t) => t.id !== templateId);
  saveLocalTemplates(localList);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteBulkTemplate error:', err);
    }
  }
}

// ---------------------------------------------------------------------------
// Job Operations
// ---------------------------------------------------------------------------

/**
 * Creates and queues a new BulkJob from a template
 */
export async function createBulkJob(
  uid: string,
  template: BulkTemplate
): Promise<string> {
  const jobId = 'bjob_' + Math.random().toString(36).substring(2, 9) + Date.now();
  const now = new Date().toISOString();

  // Resolve all variations
  const variations = resolveVariations(template);
  const totalVariations = variations.length;
  const estimatedTimeSeconds = estimateJobTime(template.bookType, totalVariations);

  const newJob: BulkJob = {
    id: jobId,
    uid,
    templateId: template.id,
    templateName: template.name,
    bookType: template.bookType,
    status: 'queued',
    variations,
    totalVariations,
    completedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    currentVariationIndex: 0,
    estimatedTimeSeconds,
    startedAt: null,
    completedAt: null,
    zipUrl: null,
    createdAt: now,
    updatedAt: now,
  };

  // Sync local
  const localList = getLocalJobs();
  saveLocalJobs([newJob, ...localList]);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, JOBS_COLLECTION, jobId);
      await setDoc(docRef, newJob);
    } catch (err) {
      console.warn('Firestore createBulkJob fallback to local:', err);
    }
  }

  return jobId;
}

/**
 * Gets a single bulk job by ID
 */
export async function getBulkJob(jobId: string): Promise<BulkJob | null> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, JOBS_COLLECTION, jobId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as BulkJob;
      }
    } catch (err) {
      console.warn('Firestore getBulkJob error:', err);
    }
  }

  const local = getLocalJobs().find((j) => j.id === jobId);
  return local || null;
}

/**
 * Gets all bulk jobs for a user
 */
export async function getUserBulkJobs(uid: string): Promise<BulkJob[]> {
  let list: BulkJob[] = [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, JOBS_COLLECTION),
        where('uid', '==', uid)
      );
      const snapshot = await getDocs(q);
      list = snapshot.docs.map((d) => d.data() as BulkJob);
    } catch (err) {
      console.warn('Firestore getUserBulkJobs fallback to local:', err);
    }
  }

  if (!list.length) {
    const local = getLocalJobs().filter((j) => j.uid === uid || uid === 'demo-user-123');
    list = local;
  }

  return list
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 50);
}

/**
 * Updates status of a bulk job
 */
export async function updateJobStatus(
  jobId: string,
  status: BulkJobStatus,
  extra?: Partial<BulkJob>
): Promise<void> {
  const now = new Date().toISOString();
  const payload: Partial<BulkJob> = {
    status,
    updatedAt: now,
    ...extra,
  };

  if (status === 'running' && !extra?.startedAt) {
    payload.startedAt = now;
  } else if ((status === 'complete' || status === 'failed') && !extra?.completedAt) {
    payload.completedAt = now;
  }

  // Local sync
  const localList = getLocalJobs().map((j) =>
    j.id === jobId ? { ...j, ...payload } : j
  );
  saveLocalJobs(localList);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, JOBS_COLLECTION, jobId);
      await updateDoc(docRef, payload);
    } catch (err) {
      console.warn('Firestore updateJobStatus error:', err);
    }
  }
}

/**
 * Updates arbitrary fields of a bulk job
 */
export async function updateBulkJob(
  jobId: string,
  data: Partial<BulkJob>
): Promise<void> {
  const now = new Date().toISOString();
  const payload: Partial<BulkJob> = {
    ...data,
    updatedAt: now,
  };

  const localList = getLocalJobs().map((j) =>
    j.id === jobId ? { ...j, ...payload } : j
  );
  saveLocalJobs(localList);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, JOBS_COLLECTION, jobId);
      await updateDoc(docRef, payload);
    } catch (err) {
      console.warn('Firestore updateBulkJob error:', err);
    }
  }
}

/**
 * Updates a specific variation in a bulk job
 */
export async function updateVariationStatus(
  jobId: string,
  variationIndex: number,
  data: Partial<BulkVariation>
): Promise<void> {
  const currentJob = await getBulkJob(jobId);
  if (!currentJob) return;

  const variations = [...currentJob.variations];
  if (variations[variationIndex]) {
    variations[variationIndex] = {
      ...variations[variationIndex],
      ...data,
    };
  }

  const completedCount = variations.filter((v) => v.status === 'complete').length;
  const failedCount = variations.filter((v) => v.status === 'failed').length;
  const skippedCount = variations.filter((v) => v.status === 'skipped').length;

  const now = new Date().toISOString();
  const payload = {
    variations,
    completedCount,
    failedCount,
    skippedCount,
    currentVariationIndex: variationIndex,
    updatedAt: now,
  };

  // Local sync
  const localList = getLocalJobs().map((j) =>
    j.id === jobId ? { ...j, ...payload } : j
  );
  saveLocalJobs(localList);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, JOBS_COLLECTION, jobId);
      await updateDoc(docRef, payload);
    } catch (err) {
      console.warn('Firestore updateVariationStatus error:', err);
    }
  }
}

// ---------------------------------------------------------------------------
// Variation Resolution
// ---------------------------------------------------------------------------

/**
 * Takes the template variables and calculates all variations
 */
export function resolveVariations(template: BulkTemplate): BulkVariation[] {
  const variables = template.variables || [];
  if (!variables.length) {
    return [
      {
        variationIndex: 0,
        resolvedVariables: {},
        resolvedTitle: template.titleTemplate || template.name || 'Untitled Book',
        resolvedSubtitle: template.subtitleTemplate || '',
        bookId: null,
        status: 'pending',
        error: null,
        startedAt: null,
        completedAt: null,
        pdfUrl: null,
      },
    ];
  }

  // 1. Find variable with the most values (max 20 variations)
  let maxCount = 1;
  for (const v of variables) {
    let count = 1;
    if (v.type === 'text' && v.values?.length) {
      count = v.values.length;
    } else if (v.type === 'color' && v.colors?.length) {
      count = v.colors.length;
    } else if (v.type === 'select' && v.selectedValues?.length) {
      count = v.selectedValues.length;
    } else if (v.type === 'ai-generate' && v.generatedValues?.length) {
      count = v.generatedValues.length;
    } else if (v.type === 'number' && v.startValue !== undefined && v.endValue !== undefined) {
      const step = v.step || 1;
      count = Math.max(1, Math.floor((v.endValue - v.startValue) / step) + 1);
    }
    if (count > maxCount) maxCount = count;
  }

  // Hard clamp at 20 variations
  const totalCount = Math.min(20, Math.max(1, maxCount));
  const results: BulkVariation[] = [];

  for (let i = 0; i < totalCount; i++) {
    const resolvedVars: Record<string, string> = {};

    for (const v of variables) {
      const key = v.name || v.label || `var_${v.id}`;

      if (v.type === 'text') {
        const arr = v.values?.length ? v.values : ['Default'];
        resolvedVars[key] = arr[i % arr.length];
      } else if (v.type === 'color') {
        const arr = v.colors?.length ? v.colors : ['#4f46e5'];
        resolvedVars[key] = arr[i % arr.length];
      } else if (v.type === 'number') {
        const start = v.startValue ?? 1;
        const step = v.step ?? 1;
        resolvedVars[key] = String(start + i * step);
      } else if (v.type === 'select') {
        const arr = v.selectedValues?.length ? v.selectedValues : v.options?.length ? v.options : ['Option 1'];
        resolvedVars[key] = arr[i % arr.length];
      } else if (v.type === 'ai-generate') {
        const arr = v.generatedValues?.length ? v.generatedValues : ['AI Theme'];
        resolvedVars[key] = arr[i % arr.length];
      }
    }

    const resolvedTitle = resolveTemplate(template.titleTemplate, resolvedVars);
    const resolvedSubtitle = resolveTemplate(template.subtitleTemplate || '', resolvedVars);

    results.push({
      variationIndex: i,
      resolvedVariables: resolvedVars,
      resolvedTitle: resolvedTitle || `Book Variation ${i + 1}`,
      resolvedSubtitle: resolvedSubtitle,
      bookId: null,
      status: 'pending',
      error: null,
      startedAt: null,
      completedAt: null,
      pdfUrl: null,
    });
  }

  return results;
}

/**
 * Replaces {varName} placeholders with resolved variable values
 */
export function resolveTemplate(
  templateString: string,
  variables: Record<string, string>
): string {
  if (!templateString) return '';
  let result = templateString;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    result = result.replace(regex, value);
  }

  return result.trim();
}

// ---------------------------------------------------------------------------
// Estimation
// ---------------------------------------------------------------------------

/**
 * Estimates total processing time in seconds (with 20% buffer)
 */
export function estimateJobTime(
  bookType: BulkBookType,
  variationCount: number
): number {
  let perVariation = 45;

  switch (bookType) {
    case 'word-search':
      perVariation = 45;
      break;
    case 'word-fit':
      perVariation = 60;
      break;
    case 'coloring-book':
      perVariation = 120;
      break;
    case 'color-by-number':
      perVariation = 90;
      break;
    case 'journal':
      perVariation = 30;
      break;
    case 'planner':
      perVariation = 30;
      break;
    case 'non-fiction':
      perVariation = 180;
      break;
    case 'activity-book':
      perVariation = 60;
      break;
  }

  const baseSeconds = perVariation * variationCount;
  return Math.round(baseSeconds * 1.2); // 20% buffer
}
