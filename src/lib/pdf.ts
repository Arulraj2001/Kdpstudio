/**
 * PDF & Interior Print Layout Helper
 * Prepares print-ready KDP margin, trim size, and PDF layout calculations
 */

import { TrimSize, PaperType, KdpCalculationResult } from '../types/index';
import { calculateCoverDimensions, getRecommendedGutter, TRIM_DIMENSIONS } from './kdp';

export interface PdfExportOptions {
  bookTitle: string;
  author: string;
  trimSize: TrimSize;
  paperType: PaperType;
  pageCount: number;
  includeRunningHeaders?: boolean;
  includePageNumbers?: boolean;
}

export function generateKdpPdfManifest(options: PdfExportOptions): {
  trimWidth: number;
  trimHeight: number;
  gutterMargin: number;
  outsideMargin: number;
  topMargin: number;
  bottomMargin: number;
  coverSpecs: KdpCalculationResult;
} {
  const [trimWidth, trimHeight] = TRIM_DIMENSIONS[options.trimSize] || [6, 9];
  const gutterMargin = getRecommendedGutter(options.pageCount);
  const coverSpecs = calculateCoverDimensions(options.trimSize, options.pageCount, options.paperType);

  return {
    trimWidth,
    trimHeight,
    gutterMargin,
    outsideMargin: 0.5,
    topMargin: 0.75,
    bottomMargin: 0.75,
    coverSpecs,
  };
}
