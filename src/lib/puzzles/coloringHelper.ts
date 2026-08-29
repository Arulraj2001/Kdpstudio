/**
 * Pure TypeScript helper for Coloring Book SVG Line Art generation
 * Phase 11D — KDP Studio
 */

export function generateColoringLineArtFallback(title: string, theme: string, pageNum: number): string {
  const safeTitle = (title || `Page ${pageNum}`).replace(/[^a-zA-Z0-9 ]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1300" width="1000" height="1300" style="background:#ffffff;">
    <rect x="50" y="50" width="900" height="1200" rx="20" fill="none" stroke="#0f172a" stroke-width="6" />
    <rect x="70" y="70" width="860" height="1160" rx="12" fill="none" stroke="#0f172a" stroke-width="2" stroke-dasharray="10,6" />
    
    <!-- Outer Decorative Corner Ornaments -->
    <circle cx="100" cy="100" r="24" fill="none" stroke="#0f172a" stroke-width="4"/>
    <circle cx="900" cy="100" r="24" fill="none" stroke="#0f172a" stroke-width="4"/>
    <circle cx="100" cy="1200" r="24" fill="none" stroke="#0f172a" stroke-width="4"/>
    <circle cx="900" cy="1200" r="24" fill="none" stroke="#0f172a" stroke-width="4"/>

    <!-- Central Mandala / Line Art Centerpiece -->
    <g transform="translate(500, 620)">
      <circle cx="0" cy="0" r="280" fill="none" stroke="#0f172a" stroke-width="5"/>
      <circle cx="0" cy="0" r="240" fill="none" stroke="#0f172a" stroke-width="3"/>
      <circle cx="0" cy="0" r="190" fill="none" stroke="#0f172a" stroke-width="4"/>
      <circle cx="0" cy="0" r="140" fill="none" stroke="#0f172a" stroke-width="3"/>
      <circle cx="0" cy="0" r="90" fill="none" stroke="#0f172a" stroke-width="5"/>
      <circle cx="0" cy="0" r="40" fill="none" stroke="#0f172a" stroke-width="3"/>

      <!-- Symmetrical Petals / Line Geometry -->
      ${Array.from({ length: 12 }, (_, i) => {
        const angle = i * 30;
        return `
        <g transform="rotate(${angle})">
          <path d="M 0,-40 Q 60,-140 0,-240 Q -60,-140 0,-40" fill="none" stroke="#0f172a" stroke-width="3.5" />
          <circle cx="0" cy="-140" r="16" fill="none" stroke="#0f172a" stroke-width="2.5" />
          <path d="M 0,-90 Q 30,-190 0,-280 Q -30,-190 0,-90" fill="none" stroke="#0f172a" stroke-width="2" />
        </g>`;
      }).join('')}
    </g>

    <!-- Theme & Plate Banner -->
    <g transform="translate(500, 1140)">
      <text x="0" y="0" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="bold" fill="#0f172a" letter-spacing="2">
        ${safeTitle.toUpperCase()}
      </text>
      <text x="0" y="24" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#64748b" letter-spacing="1">
        THEME: ${(theme || 'COLORING').toUpperCase()}
      </text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
