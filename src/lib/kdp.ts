import {
  TrimSize,
  PaperType,
  KdpCalculationResult,
  Margins,
  TrimDimensions,
  FormatterFontSize,
} from '../types/index';

/**
 * Trim size dimensions in inches [width, height]
 */
export const TRIM_DIMENSIONS: Record<TrimSize, [number, number]> = {
  '5x8': [5, 8],
  '5.5x8.5': [5.5, 8.5],
  '6x9': [6, 9],
  '8.5x11': [8.5, 11],
};

/**
 * Standard KDP Bleed requirement (inches)
 */
export const KDP_BLEED_INCHES = 0.125;

/**
 * Standard Margin Safety Zone (inches)
 */
export const KDP_SAFETY_MARGIN_INCHES = 0.25;

/**
 * Spine thickness page multiplier per page (inches)
 */
export const SPINE_PAGE_MULTIPLIERS: Record<PaperType, number> = {
  white: 0.002252, // White paper (50# to 60#)
  cream: 0.0025,   // Cream paper
};

/**
 * Returns trim dimensions in inches for a given trim size
 */
export function getTrimDimensions(trimSize: TrimSize): TrimDimensions {
  const dims = TRIM_DIMENSIONS[trimSize] || [6, 9];
  return {
    width: dims[0],
    height: dims[1],
  };
}

/**
 * Returns recommended KDP margins in inches based on trim size and page count
 */
export function getMargins(
  trimSize: TrimSize,
  pageCount: number,
  pageNumbersAtBottom: boolean = true
): Margins {
  let inside = 0.375;
  if (pageCount > 500) {
    inside = 0.75;
  } else if (pageCount > 300) {
    inside = 0.625;
  } else if (pageCount > 150) {
    inside = 0.5;
  } else {
    inside = 0.375;
  }

  const outside = 0.25;
  const top = 0.5;
  const bottom = pageNumbersAtBottom ? 0.75 : 0.5;

  return {
    top,
    bottom,
    inside,
    outside,
  };
}

/**
 * Calculates spine width in inches according to KDP specs:
 * White: pageCount * 0.002252 + 0.06
 * Cream: pageCount * 0.0025 + 0.06
 */
export function getSpineWidth(pageCount: number, paperType: PaperType = 'white'): number {
  const multiplier = SPINE_PAGE_MULTIPLIERS[paperType] || 0.002252;
  const base = pageCount * multiplier;
  return Number((base + 0.06).toFixed(4));
}

/**
 * Calculates complete cover dimensions according to Amazon KDP specifications
 */
export function getCoverDimensions(
  trimSize: TrimSize,
  pageCount: number,
  paperType: PaperType = 'white'
): {
  totalWidth: number;
  totalHeight: number;
  spineWidth: number;
  bleed: number;
} {
  const { width, height } = getTrimDimensions(trimSize);
  const spineWidth = getSpineWidth(pageCount, paperType);
  const bleed = KDP_BLEED_INCHES;

  const totalWidth = Number(((width * 2) + spineWidth + (bleed * 2)).toFixed(4));
  const totalHeight = Number((height + (bleed * 2)).toFixed(4));

  return {
    totalWidth,
    totalHeight,
    spineWidth,
    bleed,
  };
}

/**
 * Calculates full calculation result with printing cost and royalties
 */
export function calculateCoverDimensions(
  trimSize: TrimSize,
  pageCount: number,
  paperType: PaperType = 'white'
): KdpCalculationResult {
  const coverDims = getCoverDimensions(trimSize, pageCount, paperType);
  
  const baseFixed = 1.00;
  const perPage = paperType === 'cream' ? 0.0125 : 0.012;
  const rawCost = baseFixed + (Math.max(24, pageCount) * perPage);
  const printingCost = Number(Math.max(2.15, rawCost).toFixed(2));
  const recommendedListPrice = Number((printingCost / 0.60 + 1.99).toFixed(2));

  return {
    spineWidth: coverDims.spineWidth,
    fullWidth: coverDims.totalWidth,
    fullHeight: coverDims.totalHeight,
    bleed: coverDims.bleed,
    safetyMargin: KDP_SAFETY_MARGIN_INCHES,
    printingCost,
    recommendedListPrice,
  };
}

/**
 * Estimate page count from word count, trim size, and font size
 */
export function estimatePageCount(
  wordCount: number,
  trimSize: TrimSize = '6x9',
  fontSize: FormatterFontSize = '11pt'
): number {
  if (!wordCount || wordCount <= 0) return 24; // Minimum KDP page requirement

  // Base words per page at 12pt
  let baseWpp = 300;
  switch (trimSize) {
    case '5x8':
      baseWpp = 250;
      break;
    case '5.5x8.5':
      baseWpp = 275;
      break;
    case '6x9':
      baseWpp = 300;
      break;
    case '8.5x11':
      baseWpp = 500;
      break;
  }

  // Adjust for font size multiplier
  let fontMultiplier = 1.0;
  if (fontSize === '10pt') {
    fontMultiplier = 1.15; // More words per page
  } else if (fontSize === '11pt') {
    fontMultiplier = 1.08;
  } else {
    fontMultiplier = 1.0; // 12pt
  }

  const effectiveWpp = baseWpp * fontMultiplier;
  const estimated = Math.ceil(wordCount / effectiveWpp);
  
  // Paperback minimum is 24 pages
  return Math.max(24, estimated);
}

/**
 * Recommended gutter margin based on page count
 */
export function getRecommendedGutter(pageCount: number): number {
  if (pageCount < 150) return 0.375;
  if (pageCount < 300) return 0.5;
  if (pageCount < 500) return 0.625;
  return 0.75;
}
