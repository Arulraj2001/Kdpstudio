import { build as viteBuild } from 'vite';
import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('Injecting Service Worker & PWA configs...');
  try {
    execSync('node scripts/inject-sw-config.cjs', { stdio: 'inherit' });
  } catch (e) {
    console.warn('SW config injection notice:', e.message);
  }

  console.log('Building Vite frontend...');
  await viteBuild();

  console.log('Bundling Express server with esbuild...');
  await esbuild.build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    sourcemap: true,
    outfile: 'dist/server.cjs',
  });

  // Ensure sw.js and firebase-messaging-sw.js are present in dist/
  const distDir = path.resolve('dist');
  const publicDir = path.resolve('public');
  ['sw.js', 'firebase-messaging-sw.js', 'manifest.json', 'site.webmanifest'].forEach(file => {
    const src = path.join(publicDir, file);
    const dest = path.join(distDir, file);
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
  });

  console.log('Build completed successfully!');
}

run().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
