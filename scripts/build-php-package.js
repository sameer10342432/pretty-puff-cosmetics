import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('📦 Starting Pretty Puff Production Packaging Workflow...');

const rootDir = process.cwd();
const stagingDir = path.join(rootDir, '.php-staging');
const distDir = path.join(rootDir, 'dist');
const zipRootOutput = path.join(rootDir, 'Pretty-Puff-Production.zip');
const zipDistOutput = path.join(distDir, 'Pretty-Puff-Production.zip');
const zipLegacyOutput = path.join(distDir, 'prettypuff-php-cpanel.zip');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function buildPackage() {
  const start = Date.now();

  try {
    // 1. Build Client with Vite
    console.log('\n1️⃣  Building Production Frontend Client (Vite)...');
    execSync('node ./node_modules/vite/bin/vite.js build', { stdio: 'inherit' });

    // 2. Prepare Clean Staging Area
    console.log('\n2️⃣  Assembling Self-Contained PHP Application (.php-staging)...');
    if (fs.existsSync(stagingDir)) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }
    fs.mkdirSync(stagingDir, { recursive: true });

    // Copy built client assets and index.html
    fs.copyFileSync(path.join(distDir, 'index.html'), path.join(stagingDir, 'index.html'));
    copyRecursive(path.join(distDir, 'assets'), path.join(stagingDir, 'assets'));

    // Copy PHP codebase
    const phpDir = path.join(rootDir, 'php');
    fs.copyFileSync(path.join(phpDir, 'index.php'), path.join(stagingDir, 'index.php'));
    fs.copyFileSync(path.join(phpDir, '.htaccess'), path.join(stagingDir, '.htaccess'));
    fs.copyFileSync(path.join(phpDir, 'sitemap.php'), path.join(stagingDir, 'sitemap.php'));
    fs.copyFileSync(path.join(phpDir, 'robots.txt'), path.join(stagingDir, 'robots.txt'));
    fs.copyFileSync(path.join(phpDir, 'seed.php'), path.join(stagingDir, 'seed.php'));
    fs.copyFileSync(path.join(phpDir, 'seed_data.json'), path.join(stagingDir, 'seed_data.json'));

    // Copy API, Config, Includes, Admin
    copyRecursive(path.join(phpDir, 'api'), path.join(stagingDir, 'api'));
    copyRecursive(path.join(phpDir, 'config'), path.join(stagingDir, 'config'));
    copyRecursive(path.join(phpDir, 'includes'), path.join(stagingDir, 'includes'));
    copyRecursive(path.join(phpDir, 'admin'), path.join(stagingDir, 'admin'));

    // Copy uploads directory structure with security .htaccess
    const uploadsStaging = path.join(stagingDir, 'uploads');
    ['', 'products', 'blog', 'banners', 'general'].forEach(sub => {
      const dir = path.join(uploadsStaging, sub);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, '.gitkeep'), '', 'utf8');
    });
    fs.copyFileSync(path.join(phpDir, 'uploads/.htaccess'), path.join(uploadsStaging, '.htaccess'));

    // Copy isolated database/ directory for optional initial setup
    const dbStaging = path.join(stagingDir, 'database');
    if (!fs.existsSync(dbStaging)) fs.mkdirSync(dbStaging, { recursive: true });
    if (fs.existsSync(path.join(rootDir, 'safe_schema.sql'))) {
      fs.copyFileSync(path.join(rootDir, 'safe_schema.sql'), path.join(dbStaging, 'safe_schema.sql'));
    }
    if (fs.existsSync(path.join(rootDir, 'database/README.txt'))) {
      fs.copyFileSync(path.join(rootDir, 'database/README.txt'), path.join(dbStaging, 'README.txt'));
    }

    // Copy private-config template
    if (fs.existsSync(path.join(rootDir, 'private-config'))) {
      copyRecursive(path.join(rootDir, 'private-config'), path.join(stagingDir, 'private-config'));
    }

    // Copy deployment guides
    if (fs.existsSync(path.join(rootDir, 'CPANEL_DEPLOYMENT.md'))) {
      fs.copyFileSync(path.join(rootDir, 'CPANEL_DEPLOYMENT.md'), path.join(stagingDir, 'CPANEL_DEPLOYMENT.md'));
    }

    // 3. Compress into Production ZIP Packages
    console.log('\n3️⃣  Compressing into Production ZIP Packages...');
    [zipRootOutput, zipDistOutput, zipLegacyOutput].forEach(f => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });

    try {
      execSync(`tar -a -c -f "${zipRootOutput}" -C "${stagingDir}" .`, { stdio: 'pipe' });
    } catch {
      execSync(
        `powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipRootOutput}' -Force"`,
        { stdio: 'inherit' }
      );
    }

    // Copy to dist folder as well
    fs.copyFileSync(zipRootOutput, zipDistOutput);
    fs.copyFileSync(zipRootOutput, zipLegacyOutput);

    const stats = fs.statSync(zipRootOutput);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const duration = ((Date.now() - start) / 1000).toFixed(2);

    console.log('\n============================================================');
    console.log('🎉 PRETTY PUFF PRODUCTION CPANEL DEPLOYMENT PACKAGE READY!');
    console.log(`📁 Primary ZIP:   ${zipRootOutput}`);
    console.log(`📁 Dist ZIP:      ${zipDistOutput}`);
    console.log(`📊 Size:          ${sizeMB} MB (${stats.size} bytes)`);
    console.log(`⏱️  Duration:      ${duration}s`);
    console.log(`🎯 Staging:       ${stagingDir}`);
    console.log('============================================================');
  } catch (error) {
    console.error('\n❌ Packaging failed:', error);
    process.exit(1);
  }
}

buildPackage();
