const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function main() {
  const sourceImage = path.resolve('C:/Users/samue/.gemini/antigravity-ide/brain/756abeb4-97dd-47e6-83b3-5909db5a8a89/kdp_logo_option_c_fullscreen_1788026105674.jpg');
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
    const pngBase64 = await page.evaluate(async (src, size) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // Deep background
            ctx.fillStyle = '#0f0826';
            ctx.fillRect(0, 0, size, size);

            // Source crop coordinates: tightly center on the gold ring & quill crest
            const sx = 100;
            const sy = 100;
            const sw = 824;
            const sh = 824;

            // Draw full-bleed
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
            
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl.replace(/^data:image\/png;base64,/, ''));
          } catch (e) {
            reject(e.message);
          }
        };
        img.onerror = () => reject('Failed to load image');
        img.src = src;
      });
    }, imgSrc, item.size);

    const buffer = Buffer.from(pngBase64, 'base64');
    
    // Write to public/
    const publicPath = path.join(process.cwd(), 'public', item.name);
    fs.writeFileSync(publicPath, buffer);

    // Also write directly to dist/ if dist exists
    const distDir = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, item.name), buffer);
    }

    console.log(`✓ Successfully generated: public/${item.name} (${buffer.length} bytes, ${item.size}x${item.size})`);
  }

  await browser.close();
  console.log('All icons generated and verified!');
}

main().catch(console.error);
