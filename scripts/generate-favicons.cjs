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

  // We will render the image inside a canvas in the browser,
  // find the tight bounding box of the glowing quill and book spread (excluding bottom text),
  // and export tightly-cropped, centered, high-contrast icons for all sizes!

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
    // The glowing quill & book spread is located from sx: 180, sy: 260, sw: 664, sh: 400
    // By drawing only this region and fitting it with slight padding into the canvas,
    // the icon symbol fills the entire square container boldly and crisply!
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body, html { width: ${item.size}px; height: ${item.size}px; overflow: hidden; background: #0a0a14; }
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
              
              // Dark modern gradient background
              const bgGrad = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, canvas.width * 0.7
              );
              bgGrad.addColorStop(0, '#15122c');
              bgGrad.addColorStop(1, '#080811');
              ctx.fillStyle = bgGrad;
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              // Source crop coordinates for the glowing quill & book spread icon artwork
              // Source image is 1024x1024:
              const sx = 190;
              const sy = 275;
              const sw = 644;
              const sh = 385;

              // Fit tightly into canvas with 6% margin so it looks bold and full
              const pad = canvas.width * 0.06;
              const dw = canvas.width - (pad * 2);
              const dh = dw * (sh / sw);
              const dx = pad;
              const dy = (canvas.height - dh) / 2;

              ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
            };
            img.src = '${imgSrc}';
          </script>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'load' });
    // Wait slightly for canvas draw
    await new Promise(r => setTimeout(r, 100));

    const targetPath = path.join(process.cwd(), 'public', item.name);
    await page.screenshot({ path: targetPath, type: 'png' });
    console.log(`✓ Generated tightly cropped: public/${item.name} (${item.size}x${item.size})`);
  }

  await browser.close();
  console.log('All tightly-cropped favicons and brand icons generated successfully!');
}

main().catch(console.error);
