const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function main() {
  const svgPath = path.join(process.cwd(), 'public', 'og-image.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html { width: 1200px; height: 630px; overflow: hidden; background: #080514; font-family: 'Plus Jakarta Sans', sans-serif; }
          svg { width: 1200px; height: 630px; display: block; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const targetPath = path.join(process.cwd(), 'public', 'og-image.png');
  await page.screenshot({ path: targetPath, type: 'png' });
  console.log(`✓ Successfully rendered public/og-image.png (1200x630, ${fs.statSync(targetPath).size} bytes)`);

  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(targetPath, path.join(distDir, 'og-image.png'));
    fs.copyFileSync(svgPath, path.join(distDir, 'og-image.svg'));
    console.log('✓ Copied og-image assets to dist/');
  }

  await browser.close();
}

main().catch(console.error);
