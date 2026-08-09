import express from 'express';
import { env } from './config/env.config';
import { errorHandler } from './shared/error.middleware';
import authAccountRoutes from './modules/auth-account/auth-account.routes';
import { bookingRoutes } from './modules/booking';
import { campaignRoutes } from './modules/campaign';
import { registrationRoutes } from './modules/registration';
import { bloodInventoryRoutes } from './modules/blood-inventory';
import { articleRoutes, publicArticleRoutes } from './modules/content';
import { setupSwagger } from './config/swagger.config';
import sosRequestRoutes from './modules/sos-request/routes/sos-request.routes';
import notificationRoutes from './modules/notification';
import { seedMockLocationData } from './modules/sos-request/jobs/seed-mock-data';
import cookieParser from 'cookie-parser';

// BullMQ Workers & Queues
import { startScheduledPublisherJob } from './modules/content/jobs/scheduled-publisher.processor';
import './modules/notification/jobs/notification.processor';
import './modules/sos-request/jobs/sos-evaluation.processor';

// BullMQ Dashboard
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { sosEvaluationQueue, notificationQueue, scheduledTasksQueue } from './config/queue.config';

// Firebase
import { initFirebase } from './config/firebase.config';
initFirebase();

const app = express();

// Start background scheduled article publisher (repeatable job)
startScheduledPublisherJob();

// Setup BullBoard Dashboard for local dev
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [
    new BullMQAdapter(sosEvaluationQueue),
    new BullMQAdapter(notificationQueue),
    new BullMQAdapter(scheduledTasksQueue),
  ],
  serverAdapter: serverAdapter,
});
app.use('/admin/queues', serverAdapter.getRouter());

// Seed mock data only in development
if (process.env.NODE_ENV !== 'production') {
  seedMockLocationData();
}

// Enable CORS for frontend clients
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = (env.CORS_ORIGINS || 'http://localhost:5173').split(',');
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (env.NODE_ENV === 'development' && origin) {
    res.header('Access-Control-Allow-Origin', origin); // Must echo origin when using credentials
  } else {
    res.header('Access-Control-Allow-Origin', '*'); // Fallback when no origin or not dev
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(express.json());
app.use(cookieParser(env.JWT_SECRET));

// Setup Swagger
setupSwagger(app);

// Convenient redirects to Swagger API documentation
app.get(['/', '/swagger', '/docs'], (req, res) => {
  res.redirect('/api-docs');
});

import hospitalRoutes from './modules/auth-account/hospital.routes';
import chatbotRoutes from './modules/chatbot/chatbot.routes';

// Base routing structure
app.use('/api/v1/users', authAccountRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/chatbot', chatbotRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1', registrationRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/bc/inventory', bloodInventoryRoutes);
app.use('/api/v1/bc/articles', articleRoutes);
app.use('/api/v1/articles', publicArticleRoutes);
app.use('/api/v1/hospital/sos-requests', sosRequestRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.use(errorHandler);

export default app;
