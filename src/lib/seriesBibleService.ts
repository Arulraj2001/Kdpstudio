/**
 * KDP Studio — Series Bible PDF Generation Service
 * Produces an author's comprehensive series reference manual (Overview, Roadmap, Branding, Metadata, Notes).
 */

import { BookSeries, SeriesVolume } from '../types/series';

export function generateSeriesBibleHtml(
  series: BookSeries,
  volumes: SeriesVolume[]
): string {
  const primaryColor = series.colorScheme.palette[0] || '#7c3aed';
  const secondaryColor = series.colorScheme.palette[1] || '#4f46e5';

  const volumesTableRows = volumes
    .map(
      (v) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Vol. ${v.volumeNumber}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 600; color: #0f172a;">${v.title}</div>
          ${v.subtitle ? `<div style="font-size: 11px; color: #64748b;">${v.subtitle}</div>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; ${
            v.status === 'published'
              ? 'background: #dcfce7; color: #166534;'
              : v.status === 'writing'
              ? 'background: #dbeafe; color: #1e40af;'
              : 'background: #f1f5f9; color: #475569;'
          }">
            ${v.status}
          </span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569;">
          ${v.pageCount ? `${v.pageCount} pgs` : '—'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0f172a;">
          ${v.price ? `$${v.price.toFixed(2)}` : '—'}
        </td>
      </tr>
    `
    )
    .join('');

  const swatchesHtml = series.colorScheme.palette
    .map(
      (c, i) => `
      <div style="display: inline-block; margin-right: 16px; margin-bottom: 12px; text-align: center;">
        <div style="width: 52px; height: 52px; border-radius: 12px; background: ${c}; border: 1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.06); margin-bottom: 6px;"></div>
        <div style="font-size: 11px; font-weight: bold; color: #334155;">#${i + 1}</div>
        <div style="font-size: 10px; color: #64748b; font-family: monospace;">${c}</div>
      </div>
    `
    )
    .join('');

  const keywordsChips = (series.seriesKeywords || [])
    .map(
      (k) => `
      <span style="display: inline-block; background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; margin: 0 6px 6px 0;">
        ${k}
      </span>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Series Bible — ${series.title}</title>
  <style>
    @page {
      size: letter;
      margin: 20mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .page-break {
      page-break-after: always;
    }
    .bible-header {
      border-bottom: 3px solid ${primaryColor};
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: #f1f5f9;
      color: #334155;
    }
    .section-title {
      font-size: 16px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${primaryColor};
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-top: 28px;
      margin-bottom: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background: #f8fafc;
      padding: 10px 12px;
      text-align: left;
      font-weight: 700;
      color: #475569;
      border-bottom: 2px solid #cbd5e1;
    }
    .lined-box {
      width: 100%;
      height: 340px;
      background-image: repeating-linear-gradient(#ffffff 0px, #ffffff 27px, #e2e8f0 28px);
      border: 1px solid #cbd5e1;
      border-radius: 8px;
    }
  </style>
</head>
<body>

  <!-- COVER / OVERVIEW PAGE -->
  <div class="bible-header">
    <span class="badge" style="background: ${primaryColor}15; color: ${primaryColor};">Author Series Bible</span>
    <h1 style="font-size: 32px; font-weight: 900; margin: 12px 0 6px 0; color: #0f172a;">${series.title}</h1>
    ${series.subtitle ? `<p style="font-size: 16px; color: #64748b; margin: 0;">${series.subtitle}</p>` : ''}
  </div>

  <div style="display: flex; gap: 24px; margin-bottom: 24px;">
    <div style="flex: 1; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b;">Genre</div>
      <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px;">${series.genre}</div>
    </div>
    <div style="flex: 1; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b;">Target Audience</div>
      <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px;">${series.targetAudience || 'General Audience'}</div>
    </div>
    <div style="flex: 1; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b;">Planned Scope</div>
      <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px;">${series.totalVolumes} Planned Volumes</div>
    </div>
  </div>

  <div class="section-title">1. Series Premise & Description</div>
  <div style="background: #ffffff; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; line-height: 1.7; color: #334155;">
    ${series.description ? series.description.replace(/\\n/g, '<br/>') : '<em>No series description entered yet.</em>'}
  </div>

  <div class="section-title">2. Volume Roadmap</div>
  <table>
    <thead>
      <tr>
        <th style="width: 15%;">Volume</th>
        <th style="width: 45%;">Title & Subtitle</th>
        <th style="width: 15%;">Status</th>
        <th style="width: 12%; text-align: center;">Length</th>
        <th style="width: 13%; text-align: right;">List Price</th>
      </tr>
    </thead>
    <tbody>
      ${volumesTableRows}
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- SECTION 3: VISUAL IDENTITY & BRANDING -->
  <div class="section-title">3. Series Visual Identity & Cover Design</div>
  
  <div style="margin-bottom: 20px;">
    <h4 style="font-size: 13px; font-weight: 700; color: #475569; margin: 0 0 10px 0;">COLOR SCHEME (${series.colorScheme.mode.toUpperCase()})</h4>
    <div>${swatchesHtml}</div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
    <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b;">Cover Style Layout</div>
      <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 4px; text-transform: capitalize;">${series.coverStyle.layout}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Volume Badge: ${series.coverStyle.volumeNumberStyle} (${series.coverStyle.volumeNumberPosition})</div>
    </div>
    <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b;">Spine Continuity</div>
      <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 4px;">Font: ${series.spineStyle.spineFont}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Color: ${series.spineStyle.spineColor} (Text: ${series.spineStyle.spineTextColor})</div>
    </div>
  </div>

  <div class="section-title">4. Amazon KDP Metadata & Search Keywords</div>
  <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b;">Official Amazon Series Title</div>
    <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">${series.title}</div>
    ${series.amazonSeriesUrl ? `<div style="font-size: 12px; color: #2563eb; margin-top: 4px; word-break: break-all;">${series.amazonSeriesUrl}</div>` : ''}
  </div>

  <div style="margin-bottom: 24px;">
    <h4 style="font-size: 13px; font-weight: 700; color: #475569; margin: 0 0 8px 0;">SHARED SERIES KEYWORDS</h4>
    <div>${keywordsChips || '<span style="font-size: 12px; color: #94a3b8;">No series keywords assigned yet.</span>'}</div>
  </div>

  <div class="section-title">5. Author Continuity & Plot Notes</div>
  <div class="lined-box"></div>

  <div style="text-align: center; margin-top: 32px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
    Generated with KDP Studio Series Manager • ${new Date().toLocaleDateString()}
  </div>

</body>
</html>
  `.trim();
}
