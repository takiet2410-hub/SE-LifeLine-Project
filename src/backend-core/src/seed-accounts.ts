import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import {
  DEMO_ACCOUNT_SUMMARY,
  DEMO_PASSWORD,
  seedMockLocationData,
} from './modules/sos-request/jobs/seed-mock-data';

dotenv.config();

try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Keep the operating system DNS configuration when custom DNS is unavailable.
}

async function seedDemoData() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required to seed demo data.');
  }

  if (process.argv.includes('--dry-run')) {
    const redactedTarget = mongoUri
      .replace(/:\/\/[^@]+@/, '://***@')
      .replace(/\?.*$/, '');
    console.log(`[Seed dry-run] Target: ${redactedTarget}`);
    console.table(DEMO_ACCOUNT_SUMMARY);
    console.log('[Seed dry-run] Organizations: 2 hospitals, 1 blood center');
    console.log('[Seed dry-run] Inventory: 4 demo blood bags');
    console.log(`[Seed dry-run] Shared demo password: ${DEMO_PASSWORD}`);
    return;
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10_000 });
    console.log('[Seed] Connected to MongoDB');
    await seedMockLocationData();
  } finally {
    await mongoose.disconnect();
  }
}

seedDemoData().catch((error) => {
  console.error('[Seed] Failed:', error);
  process.exitCode = 1;
});
