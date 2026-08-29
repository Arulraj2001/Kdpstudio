import { getPuzzleBook } from '../../../../../lib/puzzleService';
import { generatePuzzleBookHtml, getTrimDimensions } from '../../../../../lib/puzzles/puzzlePdfRenderer';

export async function POST(req: Request) {
  try {
    const { bookId } = await req.json();
    if (!bookId) {
      return new Response(JSON.stringify({ error: 'Missing bookId' }), { status: 400 });
    }

    const book = await getPuzzleBook(bookId);
    if (!book) {
      return new Response(JSON.stringify({ error: 'Puzzle book not found' }), { status: 404 });
    }

    const html = generatePuzzleBookHtml(book, book.settings, book.pages);
    const { width, height } = getTrimDimensions(book.settings.trimSize || '8.5x11');

    let puppeteer: any;
    try {
      puppeteer = await import('puppeteer');
    } catch {
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${book.settings.title || 'color_by_number'}.html"`,
        },
      });
    }

    const browser = await puppeteer.default.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      width: `${width}in`,
      height: `${height}in`,
      printBackground: true,
      margin: {
        top: '0.4in',
        bottom: '0.4in',
        left: '0.4in',
        right: '0.4in',
      },
    });

    await browser.close();

    const safeTitle = (book.settings.title || 'color_by_number')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}_interior.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('Color by Number PDF export error:', err);
    return new Response(JSON.stringify({ error: err.message || 'PDF export failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
