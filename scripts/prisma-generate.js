import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const rootDir = process.cwd();
const sqliteSchema = path.join(rootDir, 'prisma/schema.prisma');
const mysqlSchema = path.join(rootDir, 'prisma/schema.mysql.prisma');

// Determine database dialect from environment
const dbUrl = process.env.DATABASE_URL || '';
const hasDbName = Boolean(process.env.DB_NAME);
const isMySQL = dbUrl.startsWith('mysql:') || hasDbName;

let targetSchema = sqliteSchema;

if (isMySQL) {
  if (fs.existsSync(mysqlSchema)) {
    targetSchema = mysqlSchema;
    console.log('🐬 Detected MySQL database environment. Using prisma/schema.mysql.prisma');
  } else {
    console.log('🐬 Detected MySQL environment, using prisma/schema.prisma');
  }
} else {
  console.log('📁 Detected SQLite database environment. Using prisma/schema.prisma');
}

const relativeSchema = path.relative(rootDir, targetSchema).replace(/\\/g, '/');
console.log(`⚡ Running: prisma generate --schema=${relativeSchema}`);

try {
  execSync(`node ./node_modules/prisma/build/index.js generate --schema=${relativeSchema}`, {
    stdio: 'inherit',
  });
  console.log('✅ Prisma client generated successfully!');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error);
  process.exit(1);
}
