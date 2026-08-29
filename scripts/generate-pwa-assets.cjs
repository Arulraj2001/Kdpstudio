const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function main() {
  const sourceImage = path.resolve('C:/Users/samue/.gemini/antigravity-ide/brain/756abeb4-97dd-47e6-83b3-5909db5a8a89/kdp_logo_option_c_fullscreen_1788026105674.jpg');
  if (!fs.existsSync(sourceImage)) {
    console.error('Source logo not found:', sourceImage);
    process.exit(1);
  }

  const base64Data = fs.readFileSync(sourceImage).toString('base64');
  const imgSrc = `data:image/jpeg;base64,${base64Data}`;

  const publicDir = path.join(process.cwd(), 'public');
  const distDir = path.join(process.cwd(), 'dist');

  const dirs = [
    path.join(publicDir, 'icons'),
    path.join(publicDir, 'splash'),
    path.join(publicDir, 'screenshots'),
  ];

  dirs.forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    const distSub = path.join(distDir, path.basename(d));
    if (!fs.existsSync(distSub)) fs.mkdirSync(distSub, { recursive: true });
  });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Generate PWA App Icons
  const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
  for (const size of iconSizes) {
    const pngBase64 = await page.evaluate(async (src, s) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = s;
          canvas.height = s;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#0f0826';
          ctx.fillRect(0, 0, s, s);
          ctx.drawImage(img, 100, 100, 824, 824, 0, 0, s, s);
          resolve(canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, ''));
        };
        img.src = src;
      });
    }, imgSrc, size);

    const buf = Buffer.from(pngBase64, 'base64');
    const filename = `icon-${size}x${size}.png`;
    fs.writeFileSync(path.join(publicDir, 'icons', filename), buf);
    fs.writeFileSync(path.join(distDir, 'icons', filename), buf);
    console.log(`✓ Generated icons/${filename}`);
  }

  // 2. Generate Shortcut Icons
  const shortcuts = [
    { name: 'shortcut-new-book.png', iconText: '✍️', bg: '#7c3aed', title: 'New Book' },
    { name: 'shortcut-books.png', iconText: '📚', bg: '#4f46e5', title: 'My Books' },
    { name: 'shortcut-analytics.png', iconText: '📊', bg: '#0891b2', title: 'Analytics' },
  ];

  for (const sc of shortcuts) {
    const pngBase64 = await page.evaluate(async (item) => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 96;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');

        // Rounded rect background
        ctx.fillStyle = item.bg;
        ctx.beginPath();
        ctx.roundRect(0, 0, 96, 96, 24);
        ctx.fill();

        ctx.font = '48px "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.iconText, 48, 50);

        resolve(canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, ''));
      });
    }, sc);

    const buf = Buffer.from(pngBase64, 'base64');
    fs.writeFileSync(path.join(publicDir, 'icons', sc.name), buf);
    fs.writeFileSync(path.join(distDir, 'icons', sc.name), buf);
    console.log(`✓ Generated icons/${sc.name}`);
  }

  // 3. Generate iOS Splash Screens
  const splashes = [
    { name: 'apple-splash-1170-2532.png', width: 1170, height: 2532, label: 'iPhone 12/13/14/15' },
    { name: 'apple-splash-2048-2732.png', width: 2048, height: 2732, label: 'iPad Pro 12.9' },
  ];

  for (const sp of splashes) {
    const pngBase64 = await page.evaluate(async (src, w, h) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');

          // Dark radial gradient
          const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
          grad.addColorStop(0, '#1c1538');
          grad.addColorStop(1, '#090614');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          // Center Logo Emblem
          const logoSize = Math.min(w * 0.45, 420);
          const lx = (w - logoSize) / 2;
          const ly = (h - logoSize) / 2 - 80;
          ctx.drawImage(img, 100, 100, 824, 824, lx, ly, logoSize, logoSize);

          // Text under logo
          ctx.fillStyle = '#ffffff';
          ctx.font = `900 ${Math.round(w * 0.05)}px "Segoe UI", Roboto, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('KDP Studio', w / 2, ly + logoSize + 60);

          ctx.fillStyle = '#a78bfa';
          ctx.font = `600 ${Math.round(w * 0.024)}px "Segoe UI", Roboto, sans-serif`;
          ctx.letterSpacing = '3px';
          ctx.fillText('AI-POWERED PUBLISHING SUITE', w / 2, ly + logoSize + 110);

          resolve(canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, ''));
        };
        img.src = src;
      });
    }, imgSrc, sp.width, sp.height);

    const buf = Buffer.from(pngBase64, 'base64');
    fs.writeFileSync(path.join(publicDir, 'splash', sp.name), buf);
    fs.writeFileSync(path.join(distDir, 'splash', sp.name), buf);
    console.log(`✓ Generated splash/${sp.name}`);
  }

  // 4. Generate Mobile PWA Preview Screenshots
  const screenshots = [
    { name: 'dashboard-mobile.png', title: 'Dashboard', sub: 'Manage your books and royalties' },
    { name: 'studio-mobile.png', title: 'AI Book Studio', sub: 'Draft & format chapters in seconds' },
  ];

  for (const ss of screenshots) {
    const pngBase64 = await page.evaluate(async (src, item) => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 390;
        canvas.height = 844;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 390, 844);

        // Header bar
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 390, 70);

        // Mini logo
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 100, 100, 824, 824, 16, 16, 38, 38);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('KDP Studio', 64, 40);

          // Card 1
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(16, 90, 358, 180, 16);
          ctx.fill();

          ctx.fillStyle = '#c084fc';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText(item.title, 36, 130);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '14px sans-serif';
          ctx.fillText(item.sub, 36, 160);

          // Card 2
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(16, 290, 358, 220, 16);
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('Active Projects (12)', 36, 330);

          // Progress bar
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.roundRect(36, 360, 318, 12, 6);
          ctx.fill();

          ctx.fillStyle = '#7c3aed';
          ctx.beginPath();
          ctx.roundRect(36, 360, 240, 12, 6);
          ctx.fill();

          resolve(canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, ''));
        };
        img.src = src;
      });
    }, imgSrc, ss);

    const buf = Buffer.from(pngBase64, 'base64');
    fs.writeFileSync(path.join(publicDir, 'screenshots', ss.name), buf);
    fs.writeFileSync(path.join(distDir, 'screenshots', ss.name), buf);
    console.log(`✓ Generated screenshots/${ss.name}`);
  }

  await browser.close();
  console.log('All PWA assets generated successfully!');
}

main().catch(console.error);
