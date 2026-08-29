/**
 * KDP Studio — Book Series Types
 * Phase 12B — KDP Studio
 */

export interface SeriesCoverStyle {
  layout: 'uniform' | 'progressive' | 'themed';
  titlePosition: 'top' | 'center' | 'bottom';
  volumeNumberStyle: 'Book 1' | 'Vol. 1' | 'Part 1' | '#1' | 'I';
  volumeNumberPosition: 'top' | 'bottom' | 'spine';
  seriesTitleVisible: boolean;
  seriesTitlePosition: 'above-title' | 'below-title';
  authorNamePosition: 'top' | 'bottom';
  backgroundType: 'solid' | 'gradient' | 'image';
  borderStyle: 'none' | 'thin' | 'thick' | 'decorative';
}

export interface SeriesSpineStyle {
  showSeriesTitle: boolean;
  showVolumeNumber: boolean;
  spineColor: string;
  spineTextColor: string;
  spineFont: string;
}

export interface SeriesColorScheme {
  mode: 'fixed' | 'rotating' | 'progressive';
  palette: string[];           // Hex colors
  primaryColors: string[];     // Per-book calculated colors
  startColor?: string;
  endColor?: string;
}

export interface SeriesVolume {
  volumeNumber: number;
  bookId: string | null;       // null if planned placeholder
  title: string;
  subtitle: string;
  status: 'planned' | 'writing' | 'formatted' | 'published';
  publishedDate: string | null;
  amazonUrl: string | null;
  coverImageUrl: string | null;
  pageCount: number | null;
  price: number | null;
}

export interface BookSeries {
  id: string;
  uid: string;

  // Series Identity
  title: string;
  subtitle: string;
  description: string;
  genre: string;
  targetAudience: string;

  // Books in Series
  bookIds: string[];           // Ordered list of book IDs
  puzzleBookIds: string[];     // Ordered puzzle book IDs if any
  totalVolumes: number;        // Target planned count (e.g. 3 for trilogy, 5 for series)
  volumes?: SeriesVolume[];    // Snapshot of volume metadata

  // Series Branding
  coverStyle: SeriesCoverStyle;
  spineStyle: SeriesSpineStyle;
  colorScheme: SeriesColorScheme;

  // Series Metadata & KDP
  seriesKeywords: string[];
  amazonSeriesUrl: string;

  // Status
  status: 'planning' | 'active' | 'complete';
  createdAt: string;
  updatedAt: string;
}

/**
 * HSL color interpolation for smooth progressive palette transitions
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const val = Math.round((n + m) * 255);
    return Math.max(0, Math.min(255, val)).toString(16).padStart(2, '0');
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function interpolateColors(startHex: string, endHex: string, steps: number): string[] {
  if (steps <= 1) return [startHex];
  const start = hexToHsl(startHex);
  const end = hexToHsl(endHex);

  const colors: string[] = [];
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const h = Math.round(start.h + (end.h - start.h) * ratio);
    const s = Math.round(start.s + (end.s - start.s) * ratio);
    const l = Math.round(start.l + (end.l - start.l) * ratio);
    colors.push(hslToHex(h, s, l));
  }
  return colors;
}

export function computeVolumeColors(
  scheme: SeriesColorScheme,
  totalVolumes: number
): string[] {
  const count = Math.max(1, totalVolumes);
  const palette = scheme.palette && scheme.palette.length > 0 ? scheme.palette : ['#7c3aed'];

  if (scheme.mode === 'fixed') {
    return Array(count).fill(palette[0]);
  } else if (scheme.mode === 'rotating') {
    return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
  } else if (scheme.mode === 'progressive') {
    const start = scheme.startColor || palette[0] || '#7c3aed';
    const end = scheme.endColor || palette[palette.length - 1] || '#3b82f6';
    return interpolateColors(start, end, count);
  }
  return Array(count).fill(palette[0]);
}

export const DEFAULT_SERIES_COVER_STYLE: SeriesCoverStyle = {
  layout: 'uniform',
  titlePosition: 'center',
  volumeNumberStyle: 'Book 1',
  volumeNumberPosition: 'top',
  seriesTitleVisible: true,
  seriesTitlePosition: 'above-title',
  authorNamePosition: 'bottom',
  backgroundType: 'solid',
  borderStyle: 'none',
};

export const DEFAULT_SERIES_SPINE_STYLE: SeriesSpineStyle = {
  showSeriesTitle: true,
  showVolumeNumber: true,
  spineColor: '#1e1b4b',
  spineTextColor: '#ffffff',
  spineFont: 'Playfair Display',
};

export const DEFAULT_SERIES_COLOR_SCHEME: SeriesColorScheme = {
  mode: 'fixed',
  palette: ['#7c3aed', '#4f46e5', '#3b82f6', '#06b6d4', '#10b981'],
  primaryColors: ['#7c3aed', '#7c3aed', '#7c3aed'],
  startColor: '#7c3aed',
  endColor: '#3b82f6',
};
