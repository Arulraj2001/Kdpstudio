/**
 * Pure JavaScript Color by Number Engine
 * Generates pre-segmented geometric SVG scenes with numbered regions and color palettes.
 * Phase 11E — KDP Studio
 */

export interface ColorRegion {
  id: number;
  shape: 'circle' | 'rect' | 'path' | 'polygon';
  cx?: number;
  cy?: number;
  r?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  d?: string;
  points?: string;
  colorName: string;
  colorHex: string;
  label: string;
  labelX?: number;
  labelY?: number;
}

export interface ColorKeyItem {
  number: number;
  color: string;
  name: string;
}

export interface ColorByNumberPageData {
  title: string;
  description: string;
  viewBox: string;
  regions: ColorRegion[];
  colorKey: ColorKeyItem[];
  svgWidth?: number;
  svgHeight?: number;
}

/**
 * Extracts a deduplicated color key list from a set of regions
 */
export function extractColorKey(regions: ColorRegion[]): ColorKeyItem[] {
  const map = new Map<number, { color: string; name: string }>();
  regions.forEach((r) => {
    if (!map.has(r.id)) {
      map.set(r.id, { color: r.colorHex, name: r.colorName });
    }
  });

  return Array.from(map.entries())
    .map(([number, data]) => ({
      number,
      color: data.color,
      name: data.name,
    }))
    .sort((a, b) => a.number - b.number);
}

/**
 * Generates printable black & white puzzle SVG with numbered regions
 */
export function generateColorByNumberSvg(pageData: ColorByNumberPageData): string {
  const viewBox = pageData.viewBox || '0 0 500 650';

  const shapesHtml = pageData.regions
    .map((r) => {
      let shapeTag = '';
      let textX = r.labelX ?? (r.cx ?? (r.x ? r.x + (r.width || 0) / 2 : 250));
      let textY = r.labelY ?? (r.cy ?? (r.y ? r.y + (r.height || 0) / 2 : 300));

      if (r.shape === 'circle') {
        shapeTag = `<circle cx="${r.cx || 0}" cy="${r.cy || 0}" r="${r.r || 30}" fill="#ffffff" stroke="#0f172a" stroke-width="2.5" />`;
        textX = r.cx || textX;
        textY = r.cy || textY;
      } else if (r.shape === 'rect') {
        shapeTag = `<rect x="${r.x || 0}" y="${r.y || 0}" width="${r.width || 50}" height="${r.height || 50}" rx="4" fill="#ffffff" stroke="#0f172a" stroke-width="2.5" />`;
        textX = (r.x || 0) + (r.width || 0) / 2;
        textY = (r.y || 0) + (r.height || 0) / 2;
      } else if (r.shape === 'polygon' && r.points) {
        shapeTag = `<polygon points="${r.points}" fill="#ffffff" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />`;
      } else if (r.d) {
        shapeTag = `<path d="${r.d}" fill="#ffffff" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />`;
      }

      const numberTag = `<text x="${textX}" y="${textY + 4}" text-anchor="middle" dominant-baseline="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="900" fill="#0f172a" pointer-events="none">${r.id}</text>`;

      return `<g class="cbn-region" data-id="${r.id}">${shapeTag}${numberTag}</g>`;
    })
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" style="background:#ffffff; border-radius:12px;">
    ${shapesHtml}
  </svg>`;
}

/**
 * Generates colored answer key SVG
 */
export function generateAnswerSvg(pageData: ColorByNumberPageData): string {
  const viewBox = pageData.viewBox || '0 0 500 650';

  const shapesHtml = pageData.regions
    .map((r) => {
      if (r.shape === 'circle') {
        return `<circle cx="${r.cx || 0}" cy="${r.cy || 0}" r="${r.r || 30}" fill="${r.colorHex}" stroke="#0f172a" stroke-width="1.5" />`;
      } else if (r.shape === 'rect') {
        return `<rect x="${r.x || 0}" y="${r.y || 0}" width="${r.width || 50}" height="${r.height || 50}" rx="4" fill="${r.colorHex}" stroke="#0f172a" stroke-width="1.5" />`;
      } else if (r.shape === 'polygon' && r.points) {
        return `<polygon points="${r.points}" fill="${r.colorHex}" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round" />`;
      } else if (r.d) {
        return `<path d="${r.d}" fill="${r.colorHex}" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round" />`;
      }
      return '';
    })
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" style="background:#ffffff; border-radius:12px;">
    ${shapesHtml}
  </svg>`;
}

/**
 * High-quality procedural geometric scene fallback generator
 */
export function generateFallbackColorByNumberScene(
  theme: string,
  pageNum: number,
  complexity: 'simple' | 'medium' | 'complex' = 'medium'
): ColorByNumberPageData {
  const safeTheme = theme || 'Landscape & Nature';
  const colors = [
    { number: 1, color: '#38bdf8', name: 'Sky Blue' },
    { number: 2, color: '#facc15', name: 'Sunny Yellow' },
    { number: 3, color: '#22c55e', name: 'Meadow Green' },
    { number: 4, color: '#ea580c', name: 'Warm Orange' },
    { number: 5, color: '#a855f7', name: 'Violet Purple' },
    { number: 6, color: '#ef4444', name: 'Crimson Red' },
    { number: 7, color: '#0284c7', name: 'Deep Ocean' },
    { number: 8, color: '#15803d', name: 'Forest Green' },
  ];

  const regions: ColorRegion[] = [
    // Sky background
    {
      id: 1,
      shape: 'rect',
      x: 20,
      y: 20,
      width: 460,
      height: 320,
      colorName: colors[0].name,
      colorHex: colors[0].color,
      label: 'Sky',
      labelX: 250,
      labelY: 90,
    },
    // Sun
    {
      id: 2,
      shape: 'circle',
      cx: 390,
      cy: 100,
      r: 55,
      colorName: colors[1].name,
      colorHex: colors[1].color,
      label: 'Sun',
      labelX: 390,
      labelY: 100,
    },
    // Distant mountain
    {
      id: 5,
      shape: 'polygon',
      points: '80,340 230,160 380,340',
      colorName: colors[4].name,
      colorHex: colors[4].color,
      label: 'Mountain Peak',
      labelX: 230,
      labelY: 260,
    },
    // Near hill
    {
      id: 4,
      shape: 'polygon',
      points: '20,340 140,220 300,340',
      colorName: colors[3].name,
      colorHex: colors[3].color,
      label: 'Warm Hill',
      labelX: 140,
      labelY: 290,
    },
    // Rolling hills / grass
    {
      id: 3,
      shape: 'rect',
      x: 20,
      y: 340,
      width: 460,
      height: 140,
      colorName: colors[2].name,
      colorHex: colors[2].color,
      label: 'Meadow',
      labelX: 250,
      labelY: 410,
    },
    // Foreground lake / ground
    {
      id: 7,
      shape: 'rect',
      x: 20,
      y: 480,
      width: 460,
      height: 150,
      colorName: colors[6].name,
      colorHex: colors[6].color,
      label: 'Lake Water',
      labelX: 250,
      labelY: 550,
    },
    // Feature flower / centerpiece circle 1
    {
      id: 6,
      shape: 'circle',
      cx: 150,
      cy: 530,
      r: 40,
      colorName: colors[5].name,
      colorHex: colors[5].color,
      label: 'Lotus Bloom',
      labelX: 150,
      labelY: 530,
    },
    // Feature flower / centerpiece circle 2
    {
      id: 8,
      shape: 'circle',
      cx: 350,
      cy: 530,
      r: 40,
      colorName: colors[7].name,
      colorHex: colors[7].color,
      label: 'Water Lily',
      labelX: 350,
      labelY: 530,
    },
  ];

  return {
    title: `${safeTheme} Scene #${pageNum}`,
    description: `A vibrant ${safeTheme.toLowerCase()} scene composed of geometric color regions.`,
    viewBox: '0 0 500 650',
    regions,
    colorKey: extractColorKey(regions),
  };
}
