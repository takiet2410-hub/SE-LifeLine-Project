import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import { connectDB } from '../src/utils/db.util';
import { seedDefaultUsers } from '../src/utils/seed-users';

const run = async () => {
  console.log('🌱 Executing staff account seeding script...');
  await connectDB();
  await seedDefaultUsers();
  console.log('🎉 Seeding completed successfully!');
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
