const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function generateOg() {
  try {
    const svgPath = path.resolve(__dirname, '../public/og-image.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630 });
    await page.setContent(`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}body{width:1200px;height:630px;overflow:hidden;}</style></head><body>${svgContent}</body></html>`);
    const pngPath = path.resolve(__dirname, '../public/og-image.png');
    await page.screenshot({ path: pngPath, type: 'png' });
    await browser.close();
    console.log('Successfully generated public/og-image.png (1200x630)');
  } catch (e) {
    console.error('Failed to generate PNG:', e);
  }
}

generateOg();
