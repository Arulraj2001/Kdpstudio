import { build as viteBuild } from 'vite';
import * as esbuild from 'esbuild';

async function run() {
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

  console.log('Build completed successfully!');
}

run().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
