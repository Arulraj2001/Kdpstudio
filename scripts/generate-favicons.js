const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function main() {
  const sourceImage = path.resolve('C:/Users/samue/.gemini/antigravity-ide/brain/756abeb4-97dd-47e6-83b3-5909db5a8a89/kdp_logo_option_3_1788025233684.jpg');
  if (!fs.existsSync(sourceImage)) {
    console.error('Source logo file not found:', sourceImage);
    process.exit(1);
  }

  const base64Data = fs.readFileSync(sourceImage).toString('base64');
  const imgSrc = `data:image/jpeg;base64,${base64Data}`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon.ico', size: 48 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
    { name: 'logo.png', size: 512 },
    { name: 'brand-icon.png', size: 256 },
  ];

  for (const item of sizes) {
    await page.setViewport({ width: item.size, height: item.size, deviceScaleFactor: 1 });
    
    // For smaller icons (<= 48px), zoom into the icon artwork (center top of the image)
    const isIconOnly = item.size <= 180;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body, html { width: ${item.size}px; height: ${item.size}px; overflow: hidden; background: #0f0f1a; display: flex; align-items: center; justify-content: center; }
            img {
              width: ${isIconOnly ? '135%' : '100%'};
              height: ${isIconOnly ? '135%' : '100%'};
              object-fit: cover;
              object-position: ${isIconOnly ? 'center 38%' : 'center center'};
              border-radius: ${item.size > 100 ? '20%' : '0%'};
            }
          </style>
        </head>
        <body>
          <img src="${imgSrc}" />
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'load' });
    const targetPath = path.join(process.cwd(), 'public', item.name);
    await page.screenshot({ path: targetPath, type: 'png' });
    console.log(`✓ Generated: public/${item.name} (${item.size}x${item.size})`);
  }

  await browser.close();
  console.log('All favicon & logo brand assets generated successfully!');
}

main().catch(console.error);
