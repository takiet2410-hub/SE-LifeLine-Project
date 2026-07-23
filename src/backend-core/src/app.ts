import express from 'express';
import { errorHandler } from './shared/error.middleware';
import authAccountRoutes from './modules/auth-account/auth-account.routes';
import { bookingRoutes } from './modules/booking';
import { campaignRoutes } from './modules/campaign';
import { setupSwagger } from './config/swagger.config';

const app = express();

app.use(express.json());

// Setup Swagger
setupSwagger(app);

// Base routing structure
app.use('/api/v1/users', authAccountRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/campaigns', campaignRoutes);

app.use(errorHandler);

export default app;

