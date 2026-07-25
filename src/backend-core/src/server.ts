import app from './app';
import { connectDB } from './utils/db.util';
import { env } from './config/env.config';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
const startServer = async () => {
  await connectDB();
  
  app.listen(env.PORT, () => {
    console.log(`🚀 Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
};

startServer();
