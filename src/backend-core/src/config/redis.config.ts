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
    // Retry connection backoff (up to 30s to prevent spamming cloud limits)
    return Math.min(times * 2000, 30000);
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

let lastLimitWarn = 0;
connection.on('error', (err: any) => {
  const msg = err?.message || String(err);
  if (msg.includes('max requests limit exceeded')) {
    const now = Date.now();
    if (now - lastLimitWarn > 60000) { // log once per minute max
      console.warn('[Redis Warning] Upstash request limit exceeded. BullMQ background queues temporarily paused.');
      lastLimitWarn = now;
    }
    return;
  }
  console.error('[Redis] Connection error:', msg);
});

export { connection as redisConnection };
