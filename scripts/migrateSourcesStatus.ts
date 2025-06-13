#!/usr/bin/env node

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local in both root and web app
config({ path: path.join(__dirname, '../.env.local') });
config({ path: path.join(__dirname, '../apps/web/.env.local') });

import { getDriver, closeDriver } from '../packages/db/src/index';

async function migrateSourcesStatus() {
  const driver = getDriver();
  const session = driver.session();

  try {
    console.log('Starting migration: Setting status="pending" for sources without status...');
    
    const result = await session.run(`
      MATCH (s:Source)
      WHERE s.status IS NULL
      SET s.status = 'pending'
      RETURN count(s) as updated
    `);

    const updatedCount = result.records[0]?.get('updated')?.toNumber() || 0;
    console.log(`✅ Migration completed. Updated ${updatedCount} sources.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await session.close();
    await closeDriver();
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${__filename}`) {
  migrateSourcesStatus().catch(console.error);
}

export { migrateSourcesStatus };