/**
 * API Route: /api/series/export-bible
 * Generates a full Series Bible PDF reference document
 */

import { withUsageCheck } from '../../../../lib/withUsageCheck';
import { getSeries, getSeriesVolumes } from '../../../../lib/seriesService';
import { generateSeriesBibleHtml } from '../../../../lib/seriesBibleService';
import puppeteer from 'puppeteer';

export async function exportSeriesBibleHandler(reqBody: { seriesId: string }) {
  const { seriesId } = reqBody;
  if (!seriesId) throw new Error('seriesId is required');

  const series = await getSeries(seriesId);
  if (!series) throw new Error('Series not found');

  const volumes = await getSeriesVolumes(seriesId);
  const html = generateSeriesBibleHtml(series, volumes);

  let pdfBuffer: Buffer | null = null;
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const generated = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });
    await browser.close();
    pdfBuffer = Buffer.from(generated);
  } catch (err) {
    console.warn('Puppeteer launch failed for series bible, falling back to HTML stream:', err);
  }

  return { html, pdfBuffer, title: series.title };
}

export const POST = withUsageCheck('pdfExports', async (req, { user }) => {
  try {
    const body = await req.json();
    const result = await exportSeriesBibleHandler(body);

    if (result.pdfBuffer) {
      return new Response(result.pdfBuffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${result.title.replace(/[^a-z0-9]/gi, '_')}_Series_Bible.pdf"`,
        },
      });
    }

    return new Response(result.html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Export failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
