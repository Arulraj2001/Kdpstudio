/**
 * Feature Usage Tracker — Client & Universal helper
 * Tracks user interactions and feature engagements across KDP Studio.
 * Fire-and-forget helper: NEVER blocks UI or user actions.
 */

import { db, isFirebaseConfigured } from './firebase';
import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import type { FeatureStats } from '../types/admin';

export const FEATURE_METADATA: Record<
  string,
  { label: string; category: FeatureStats['category'] }
> = {
  book_created: { label: 'New Book Created', category: 'writing' },
  chapter_ai_write: { label: 'AI Write Chapter', category: 'writing' },
  chapter_ai_continue: { label: 'AI Continue Chapter', category: 'writing' },
  pdf_exported: { label: 'PDF Formatter Export', category: 'export' },
  epub_exported: { label: 'EPUB Export', category: 'export' },
  cover_built: { label: 'Cover Builder Export', category: 'export' },
  cover_ai_image: { label: 'AI Cover Art Generated', category: 'writing' },
  kdp_metadata_generated: { label: 'KDP Metadata AI', category: 'research' },
  puzzle_word_search_created: { label: 'Word Search Generated', category: 'puzzle' },
  puzzle_coloring_created: { label: 'Coloring Book Generated', category: 'puzzle' },
  puzzle_word_fit_created: { label: 'Word Fit Crosswords', category: 'puzzle' },
  puzzle_cbn_created: { label: 'Color by Number', category: 'puzzle' },
  niche_research_run: { label: 'Niche Research Run', category: 'research' },
  niche_book_started: { label: 'Book from Niche', category: 'research' },
  series_created: { label: 'Series Bible Created', category: 'brand' },
  bulk_job_run: { label: 'Bulk Batch Generation', category: 'export' },
  audit_run_basic: { label: 'Basic Content Audit', category: 'writing' },
  audit_run_full: { label: 'Full AI Content Audit', category: 'writing' },
  snapshot_created: { label: 'Version Snapshot Saved', category: 'writing' },
  snapshot_restored: { label: 'Version Restored', category: 'writing' },
  analytics_entry_added: { label: 'Royalty Entry Added', category: 'analytics' },
  goal_created: { label: 'Publishing Goal Set', category: 'analytics' },
  goal_achieved: { label: 'Goal Milestone Achieved', category: 'analytics' },
  brand_kit_saved: { label: 'Brand Kit Updated', category: 'brand' },
};

/**
 * Tracks a single feature interaction.
 * Fire and forget: NEVER await in critical UI code.
 */
export async function trackFeatureUse(
  uid: string,
  feature: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  if (!uid || !feature) return;

  const eventId = `fe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const nowIso = new Date().toISOString();

  if (isFirebaseConfigured && db) {
    try {
      const eventRef = doc(db, 'featureEvents', eventId);
      await setDoc(eventRef, {
        uid,
        feature,
        metadata,
        timestamp: serverTimestamp(),
        createdAt: nowIso,
      });

      const counterRef = doc(db, 'featureCounters', feature);
      await setDoc(
        counterRef,
        {
          feature,
          count: increment(1),
          lastUsedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Ignore failure in fire-and-forget
    }
  }
}
