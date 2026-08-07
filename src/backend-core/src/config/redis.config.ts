import { Redis, RedisOptions } from 'ioredis';
import { env } from './env.config';

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  connectTimeout: 20000,
  family: 4, // Force IPv4 to avoid ENOTFOUND or timeouts on some machines
  keepAlive: 10000, // Send TCP keepalive packets every 10s to keep Upstash alive
  autoResubscribe: true,
  autoResendUnfulfilledCommands: true,
  tls: { rejectUnauthorized: false },
  retryStrategy: (times) => {
    // Retry connection backoff
    console.warn(`[Redis] Connection attempt ${times} failed. Retrying in ${Math.min(times * 1000, 5000)}ms`);
    return Math.min(times * 1000, 5000);
  }
};

// If using Upstash or external redis URL
let connection: Redis;

if (env.REDIS_URL) {
  // Use specific URL (like rediss://...)
  connection = new Redis(env.REDIS_URL, redisOptions);
  console.log('[Redis] Configured with REDIS_URL');
} else {
  // Fallback for local development
  connection = new Redis({
    host: 'localhost',
    port: 6379,
    ...redisOptions,
  });
  console.log('[Redis] Configured with local fallback (localhost:6379)');
}

connection.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});

export { connection as redisConnection };
