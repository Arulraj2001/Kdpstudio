const fs = require('fs');
const path = require('path');

const pngPath = path.join(process.cwd(), 'public', 'og-image.png');
if (!fs.existsSync(pngPath)) {
  console.error('public/og-image.png not found');
  process.exit(1);
}

const pngBuffer = fs.readFileSync(pngPath);
const base64Data = pngBuffer.toString('base64');
const dataUri = `data:image/png;base64,${base64Data}`;

const svgContent = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <title>KDP Studio — AI-Powered Book Publishing Suite</title>
  <desc>Create, format, and publish Amazon KDP books with AI.</desc>
  <image href="${dataUri}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice" />
</svg>
`;

const publicSvgPath = path.join(process.cwd(), 'public', 'og-image.svg');
fs.writeFileSync(publicSvgPath, svgContent, 'utf8');
console.log(`✓ Generated public/og-image.svg from updated og-image.png (${fs.statSync(publicSvgPath).size} bytes)`);

const distDir = path.join(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  fs.copyFileSync(pngPath, path.join(distDir, 'og-image.png'));
  fs.writeFileSync(path.join(distDir, 'og-image.svg'), svgContent, 'utf8');
  console.log('✓ Synced og-image.png and og-image.svg to dist/');
}
