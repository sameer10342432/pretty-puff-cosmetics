import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🌸 Building Pretty Puff for GitHub Pages deployment...');

try {
  // 1. Build client bundle
  execSync('node ./node_modules/vite/bin/vite.js build', { stdio: 'inherit' });

  // 2. Duplicate index.html to 404.html for GitHub Pages SPA routing
  const distDir = path.resolve(process.cwd(), 'dist');
  const indexHtml = path.join(distDir, 'index.html');
  const notFoundHtml = path.join(distDir, '404.html');
  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, notFoundHtml);
    console.log('✓ Created 404.html for SPA fallback routing');
  }

  // 3. Deploy to gh-pages branch
  console.log('🚀 Pushing to gh-pages branch...');
  execSync('git checkout --orphan gh-pages-temp', { stdio: 'ignore' });
  execSync('git rm -rf .', { stdio: 'ignore' });
  execSync('git --work-tree dist add --all', { stdio: 'ignore' });
  execSync('git commit -m "Deploy latest build to GitHub Pages"', { stdio: 'ignore' });
  execSync('git push origin gh-pages-temp:gh-pages --force', { stdio: 'inherit' });
  execSync('git checkout main', { stdio: 'ignore' });
  execSync('git branch -D gh-pages-temp', { stdio: 'ignore' });

  console.log('✨ Deployed successfully to https://sameer10342432.github.io/pretty-puff-cosmetics/');
} catch (error) {
  console.error('Deployment failed:', error);
  try {
    execSync('git checkout main', { stdio: 'ignore' });
    execSync('git branch -D gh-pages-temp', { stdio: 'ignore' });
  } catch {}
  process.exit(1);
}
