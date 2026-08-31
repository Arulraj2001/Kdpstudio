/**
 * EAN-13 ISBN Barcode Generator for Amazon KDP Paperback covers.
 * Conforms to standard EAN-13 encoding with standard quiet zones.
 */

// EAN-13 bit patterns
const L_CODES = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G_CODES = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R_CODES = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];

const FIRST_DIGIT_ENCODINGS = [
  'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
  'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'
];

/**
 * Calculates EAN-13 checksum digit
 */
export function calculateEan13Checksum(first12Digits: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(first12Digits[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

/**
 * Generates clean SVG markup for a given ISBN-13 barcode
 */
export function generateIsbnBarcodeSvg(isbnInput: string, priceCode = '90000'): string {
  // Strip non-digits
  const clean = isbnInput.replace(/\D/g, '');
  let full13 = clean;

  if (clean.length === 12) {
    full13 = clean + calculateEan13Checksum(clean);
  } else if (clean.length < 12) {
    full13 = '978' + clean.padStart(9, '0');
    full13 = full13.slice(0, 12) + calculateEan13Checksum(full13.slice(0, 12));
  } else if (clean.length > 13) {
    full13 = clean.slice(0, 13);
  }

  const firstDigit = parseInt(full13[0], 10);
  const pattern = FIRST_DIGIT_ENCODINGS[firstDigit];

  // Encode Left 6 digits
  let bitString = '101'; // Start guard

  for (let i = 1; i <= 6; i++) {
    const digit = parseInt(full13[i], 10);
    const codeType = pattern[i - 1];
    bitString += codeType === 'L' ? L_CODES[digit] : G_CODES[digit];
  }

  bitString += '01010'; // Center guard

  // Encode Right 6 digits (including checksum)
  for (let i = 7; i <= 12; i++) {
    const digit = parseInt(full13[i], 10);
    bitString += R_CODES[digit];
  }

  bitString += '101'; // End guard

  // Build SVG bars
  const barWidth = 1.8;
  const startX = 20;
  const startY = 12;
  const mainBarHeight = 54;
  const guardBarHeight = 62;
  const totalSvgWidth = 200;
  const totalSvgHeight = 82;

  let barsSvg = '';
  for (let i = 0; i < bitString.length; i++) {
    if (bitString[i] === '1') {
      const isGuard = i < 3 || (i >= 45 && i < 50) || i >= 92;
      const height = isGuard ? guardBarHeight : mainBarHeight;
      const x = startX + i * barWidth;
      barsSvg += `<rect x="${x.toFixed(1)}" y="${startY}" width="${barWidth.toFixed(1)}" height="${height}" fill="#000000" />`;
    }
  }

  // Format ISBN text for display (e.g. 978-1-2345-6789-0)
  const formattedIsbn = `ISBN: ${full13.slice(0, 3)}-${full13.slice(3, 4)}-${full13.slice(4, 9)}-${full13.slice(9, 12)}-${full13.slice(12)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSvgWidth} ${totalSvgHeight}" width="${totalSvgWidth}" height="${totalSvgHeight}">
    <rect width="100%" height="100%" fill="#ffffff" rx="2" />
    <text x="100" y="9" font-family="monospace, Arial, sans-serif" font-size="8" font-weight="bold" fill="#000000" text-anchor="middle">${formattedIsbn}</text>
    <g>${barsSvg}</g>
    <!-- Numbers beneath bars -->
    <text x="${(startX - 8).toFixed(1)}" y="74" font-family="monospace, sans-serif" font-size="9" font-weight="bold" fill="#000000">${full13[0]}</text>
    <text x="${(startX + 18).toFixed(1)}" y="74" font-family="monospace, sans-serif" font-size="9" font-weight="bold" fill="#000000" letter-spacing="1.2">${full13.slice(1, 7)}</text>
    <text x="${(startX + 98).toFixed(1)}" y="74" font-family="monospace, sans-serif" font-size="9" font-weight="bold" fill="#000000" letter-spacing="1.2">${full13.slice(7, 13)}</text>
  </svg>`;
}

export interface KdpPreflightReport {
  passed: boolean;
  warnings: string[];
  errors: string[];
  specs: {
    pageCount: number;
    spineWidth: number;
    spineTextAllowed: boolean;
    trimSize: string;
    totalWidth: number;
    totalHeight: number;
    bleedWidth: number;
    bleedHeight: number;
    resolutionDpi: number;
  };
}

/**
 * Runs pre-flight quality checks on cover specs and canvas objects
 */
export function runKdpCoverPreflight(params: {
  pageCount: number;
  spineWidth: number;
  trimSize: string;
  hasSpineText: boolean;
  paperType: string;
  totalWidth: number;
  totalHeight: number;
}): KdpPreflightReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const spineTextAllowed = params.pageCount >= 79;

  // 1. Spine text rule: Amazon KDP policy rejects spine text on books with < 79 pages
  if (params.hasSpineText && !spineTextAllowed) {
    errors.push(
      `Amazon KDP policy requires at least 79 pages for spine text. Current book has ${params.pageCount} pages (Spine: ${params.spineWidth}"). Please remove spine text or increase page count.`
    );
  }

  // 2. Spine thickness warning
  if (params.spineWidth < 0.1) {
    warnings.push(
      `Spine thickness (${params.spineWidth}") is very narrow. Ensure any artwork near spine crease does not wrap onto back cover.`
    );
  }

  // 3. Page count minimum check
  if (params.pageCount < 24) {
    errors.push(`KDP Paperback requires a minimum of 24 pages. Current: ${params.pageCount} pages.`);
  }

  if (params.pageCount > 828) {
    warnings.push(
      `Book has ${params.pageCount} pages. Amazon KDP maximum for standard black & white white paper is 828 pages.`
    );
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    specs: {
      pageCount: params.pageCount,
      spineWidth: params.spineWidth,
      spineTextAllowed,
      trimSize: params.trimSize,
      totalWidth: params.totalWidth,
      totalHeight: params.totalHeight,
      bleedWidth: 0.125,
      bleedHeight: 0.125,
      resolutionDpi: 300,
    },
  };
}
