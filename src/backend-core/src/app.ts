import express from 'express';
import cors from 'cors';
import { env } from './config/env.config';
import { errorHandler } from './shared/error.middleware';
import authAccountRoutes from './modules/auth-account/auth-account.routes';
import { bookingRoutes } from './modules/booking';
import { setupSwagger } from './config/swagger.config';

const app = express();

app.use(cors({
  origin: env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Setup Swagger
setupSwagger(app);

// Base routing structure
app.use('/api/v1/users', authAccountRoutes);
app.use('/api/v1/bookings', bookingRoutes);

app.use(errorHandler);

export default app;
