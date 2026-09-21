import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('📦 Starting Pretty Puff cPanel Deployment Packaging Workflow...');

const rootDir = process.cwd();
const stagingDir = path.join(rootDir, '.cpanel-staging');
const distDir = path.join(rootDir, 'dist');
const zipOutput = path.join(distDir, 'prettypuff-cpanel-deploy.zip');

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

async function packageApp() {
  const start = Date.now();

  try {
    // 1. Build Client
    console.log('\n1️⃣  Building Frontend Client (Vite)...');
    execSync('node ./node_modules/vite/bin/vite.js build', { stdio: 'inherit' });

    // 2. Build Server & Seeder
    console.log('\n2️⃣  Building Server & Database Seeder (esbuild)...');
    execSync('node scripts/build-server.js', { stdio: 'inherit' });

    // 3. Prepare Clean Staging Directory
    console.log('\n3️⃣  Assembling Production Files in Staging Area...');
    if (fs.existsSync(stagingDir)) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }
    fs.mkdirSync(stagingDir, { recursive: true });

    // Copy startup file & seeder
    fs.copyFileSync(path.join(rootDir, 'server.js'), path.join(stagingDir, 'server.js'));
    fs.copyFileSync(path.join(rootDir, 'seed.js'), path.join(stagingDir, 'seed.js'));

    // Copy compiled client dist
    copyRecursive(path.join(rootDir, 'dist'), path.join(stagingDir, 'dist'));

    // Copy package files
    // Prepare a clean package.json for production
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    const prodPkg = {
      name: pkg.name,
      version: pkg.version,
      private: true,
      type: 'module',
      scripts: {
        start: 'node server.js',
        seed: 'node seed.js',
        'prisma:generate': 'prisma generate',
        'prisma:push': 'prisma db push',
        'prisma:migrate': 'prisma migrate deploy',
      },
      dependencies: pkg.dependencies,
      devDependencies: {
        prisma: pkg.devDependencies?.prisma || '^6.4.1',
      },
    };
    fs.writeFileSync(
      path.join(stagingDir, 'package.json'),
      JSON.stringify(prodPkg, null, 2),
      'utf8'
    );
    fs.copyFileSync(path.join(rootDir, 'package-lock.json'), path.join(stagingDir, 'package-lock.json'));

    // Copy Prisma folder with MySQL schema as the default schema.prisma
    const prismaStaging = path.join(stagingDir, 'prisma');
    fs.mkdirSync(prismaStaging, { recursive: true });
    fs.copyFileSync(
      path.join(rootDir, 'prisma/schema.mysql.prisma'),
      path.join(prismaStaging, 'schema.prisma')
    );
    fs.copyFileSync(
      path.join(rootDir, 'prisma/schema.mysql.prisma'),
      path.join(prismaStaging, 'schema.mysql.prisma')
    );

    // Copy raw SQL schema for 1-click phpMyAdmin import
    if (fs.existsSync(path.join(rootDir, 'database_schema.sql'))) {
      fs.copyFileSync(
        path.join(rootDir, 'database_schema.sql'),
        path.join(stagingDir, 'database_schema.sql')
      );
    }

    // Create uploads directory with subdirectories and .gitkeep
    const uploadsStaging = path.join(stagingDir, 'uploads');
    ['', 'products', 'blog', 'banners', 'general'].forEach(sub => {
      const dir = path.join(uploadsStaging, sub);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, '.gitkeep'), '', 'utf8');
    });

    // Copy documentation & env template
    fs.copyFileSync(path.join(rootDir, '.env.example'), path.join(stagingDir, '.env.example'));
    if (fs.existsSync(path.join(rootDir, 'CPANEL_DEPLOYMENT.md'))) {
      fs.copyFileSync(path.join(rootDir, 'CPANEL_DEPLOYMENT.md'), path.join(stagingDir, 'CPANEL_DEPLOYMENT.md'));
    }
    if (fs.existsSync(path.join(rootDir, 'README.md'))) {
      fs.copyFileSync(path.join(rootDir, 'README.md'), path.join(stagingDir, 'README.md'));
    }

    // 4. Create ZIP Archive
    console.log('\n4️⃣  Compressing into Production ZIP...');
    if (fs.existsSync(zipOutput)) {
      fs.unlinkSync(zipOutput);
    }

    // Use cross-platform compression (bsdtar / tar or powershell)
    try {
      execSync(`tar -a -c -f "${zipOutput}" -C "${stagingDir}" .`, { stdio: 'pipe' });
    } catch {
      // Fallback to PowerShell Compress-Archive
      execSync(
        `powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipOutput}' -Force"`,
        { stdio: 'inherit' }
      );
    }

    // 5. Cleanup Staging Directory
    fs.rmSync(stagingDir, { recursive: true, force: true });

    const stats = fs.statSync(zipOutput);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const duration = ((Date.now() - start) / 1000).toFixed(2);

    console.log('\n============================================================');
    console.log('🎉 CPANEL DEPLOYMENT ZIP READY!');
    console.log(`📁 File:     ${zipOutput}`);
    console.log(`📊 Size:     ${sizeMB} MB`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('============================================================');
  } catch (error) {
    console.error('\n❌ Packaging failed:', error);
    if (fs.existsSync(stagingDir)) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }
    process.exit(1);
  }
}

packageApp();
