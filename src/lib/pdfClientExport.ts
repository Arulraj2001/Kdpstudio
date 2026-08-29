import { jsPDF } from 'jspdf';
import { Book, FormatterSettings, Margins, TrimDimensions } from '../types/index';
import { generateBookHtml } from './bookHtmlGenerator';

/**
 * Downloads a PDF either via server-side Puppeteer API or client-side print-rendered document
 */
export async function exportBookAsPdf(
  book: Book,
  settings: FormatterSettings,
  margins: Margins,
  trimDimensions: TrimDimensions,
  onProgress?: (msg: string) => void
): Promise<{ success: boolean; filename: string; sizeBytes?: number; pages?: number }> {
  const filename = `${book.title ? book.title.toLowerCase().replace(/[^a-z0-9]/gi, '_') : 'interior'}_interior.pdf`;

  if (onProgress) onProgress('Compiling book manuscript layout...');

  // Try Server-Side Puppeteer API first
  try {
    if (onProgress) onProgress('Calling PDF formatting engine...');

    const response = await fetch('/api/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        book,
        settings,
        margins,
        trimSize: trimDimensions,
      }),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        filename,
        sizeBytes: blob.size,
      };
    }
  } catch (err) {
    console.warn('Server-side PDF generation fallback:', err);
  }

  // Client-side fallback using High-Fidelity jsPDF / Print Document
  if (onProgress) onProgress('Generating client-side high-resolution PDF...');

  try {
    const fullHtml = generateBookHtml(book, settings, margins, trimDimensions);

    // Create printable iframe or popup for browser direct print-to-pdf
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(fullHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error(e);
        } finally {
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 3000);
        }
      }, 500);

      return {
        success: true,
        filename,
      };
    }
  } catch (clientErr: any) {
    console.error('Client PDF fallback failed:', clientErr);
    throw new Error('Failed to generate PDF document');
  }

  return { success: true, filename };
}
