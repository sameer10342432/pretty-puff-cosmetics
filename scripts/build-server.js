import esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';

console.log('⚡ Compiling Pretty Puff Production Server & Seeder...');

async function build() {
  const start = Date.now();

  try {
    // 1. Build Server
    await esbuild.build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node18',
      packages: 'external',
      outfile: 'server.js',
      banner: {
        js: `// Pretty Puff Monolithic Production Server
// Compatible with cPanel Setup Node.js App
`,
      },
    });
    console.log('✓ server.js built successfully');

    // 2. Build Seeder
    await esbuild.build({
      entryPoints: ['server/seed.ts'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node18',
      packages: 'external',
      outfile: 'seed.js',
      banner: {
        js: `// Pretty Puff Production Database Seeder
`,
      },
    });
    console.log('✓ seed.js built successfully');

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✨ Server compilation completed in ${duration}s`);
  } catch (error) {
    console.error('❌ Server build failed:', error);
    process.exit(1);
  }
}

build();
