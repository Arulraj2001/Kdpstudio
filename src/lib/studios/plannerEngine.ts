/**
 * Parametric Low-Content Planners, Journals & Habit Trackers Engine
 * - Algorithmic vector page generators for high-converting low-content KDP interiors
 * - Supports Daily Productivity Planners, Weekly Habit Trackers, Gratitude Journals, Dot Grid, and Lined Journals
 * - Strictly enforces 0.75" inside gutter safe zones (mirrored for odd/even pages)
 */

export type PlannerType = 
  | 'daily-productivity' 
  | 'weekly-habit-tracker' 
  | 'gratitude-journal' 
  | 'dot-grid' 
  | 'lined-journal';

export interface PlannerConfig {
  type: PlannerType;
  title: string;
  pageCount: number; // 50, 100, 120, 150
  trimSize: '6x9' | '8.5x11' | '5.5x8.5';
  includeQuotes: boolean;
  themeStyle: 'minimal' | 'modern' | 'floral';
}

export const PLANNER_TEMPLATES: Record<PlannerType, { name: string; icon: string; description: string; bestTrim: string }> = {
  'daily-productivity': {
    name: 'Daily Productivity Planner',
    icon: '⚡',
    description: 'Hourly time-blocking (6 AM - 9 PM), Top 3 Priorities, To-Do list, Water tracker, and Notes.',
    bestTrim: '6x9 or 8.5x11'
  },
  'weekly-habit-tracker': {
    name: 'Weekly Habit & Goal Matrix',
    icon: '🎯',
    description: '7-day habit tracker matrix (Monday-Sunday) for 10 daily habits with milestone checkpoints.',
    bestTrim: '8.5x11 or 6x9'
  },
  'gratitude-journal': {
    name: 'Gratitude & Mindfulness Journal',
    icon: '🌱',
    description: 'Morning 3-point gratitude, Daily Affirmations, Today\'s Joy, and Evening Reflection wins.',
    bestTrim: '6x9 or 5.5x8.5'
  },
  'dot-grid': {
    name: '5mm Bullet Dot Grid Notebook',
    icon: '⚬',
    description: 'Precise 5mm bullet dot grid interior perfect for custom journaling and sketch notes.',
    bestTrim: '6x9 or 8.5x11'
  },
  'lined-journal': {
    name: 'College Ruled Lined Notebook',
    icon: '📝',
    description: 'Clean, elegant ruled lines with top date header and margin lines.',
    bestTrim: '6x9 or 8.5x11'
  }
};
