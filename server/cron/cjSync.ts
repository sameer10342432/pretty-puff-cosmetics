/**
 * Pretty Puff — CJdropshipping Scheduled Synchronisation CLI
 * 
 * Configurable via cPanel Cron Jobs:
 *   0 2 * * * /usr/local/bin/node /home/username/public_html/cj-sync.js >> /home/username/public_html/cj-sync.log 2>&1
 */

import { cjService } from '../services/cjService';
import { prisma } from '../prisma';

async function runCronSync() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🌸 Pretty Puff — Starting scheduled CJdropshipping catalog synchronisation...`);

  try {
    const settings = await cjService.getSettings();
    if (!settings.hasApiKey && !settings.hasToken) {
      console.log(`[${timestamp}] ⚠️ CJdropshipping API Key not configured. Skipping synchronisation.`);
      process.exit(0);
    }

    const result = await cjService.syncAllImported();
    console.log(`[${timestamp}] ✅ Synchronisation completed successfully.`);
    console.log(`   Total Mapped Products: ${result.total}`);
    console.log(`   Successfully Synced:   ${result.synced}`);
    console.log(`   Failed / Unchanged:    ${result.failed}`);

    if (result.errors && result.errors.length > 0) {
      console.log(`   Errors encountered:`);
      result.errors.forEach(err => console.log(`     - ${err}`));
    }
  } catch (error: any) {
    console.error(`[${timestamp}] ❌ Synchronisation fatal error:`, error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCronSync();
