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
    await page.setViewport({ width: item.size, height: item.size, deviceScaleFactor: 1 });
    
    // In the 1024x1024 source image:
    // The circular gold crest is centered from x: 120 to 904 (width: 784), y: 120 to 904 (height: 784).
    // By drawing the circular emblem so it fills 96% of the canvas, there are ZERO wasted margins!
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body, html { width: ${item.size}px; height: ${item.size}px; overflow: hidden; background: #0f0826; }
            canvas { width: ${item.size}px; height: ${item.size}px; display: block; }
          </style>
        </head>
        <body>
          <canvas id="c" width="${item.size}" height="${item.size}"></canvas>
          <script>
            const img = new Image();
            img.onload = () => {
              const canvas = document.getElementById('c');
              const ctx = canvas.getContext('2d');

              // Deep indigo/violet background fill
              ctx.fillStyle = '#100a28';
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              // Source crop coordinates: tightly center on the gold ring & quill crest
              const sx = 115;
              const sy = 115;
              const sw = 794;
              const sh = 794;

              // Fill 96% of canvas
              const pad = canvas.width * 0.02;
              const dw = canvas.width - (pad * 2);
              const dh = canvas.height - (pad * 2);

              ctx.drawImage(img, sx, sy, sw, sh, pad, pad, dw, dh);
            };
            img.src = '${imgSrc}';
          </script>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 120));

    const targetPath = path.join(process.cwd(), 'public', item.name);
    await page.screenshot({ path: targetPath, type: 'png' });
    console.log(`✓ Generated full-bleed logo: public/${item.name} (${item.size}x${item.size})`);
  }

  await browser.close();
  console.log('All full-bleed favicons and brand icons generated successfully!');
}

main().catch(console.error);
