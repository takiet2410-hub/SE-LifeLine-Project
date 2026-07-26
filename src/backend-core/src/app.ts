import express from 'express';
import { errorHandler } from './shared/error.middleware';
import authAccountRoutes from './modules/auth-account/auth-account.routes';
import { bookingRoutes } from './modules/booking';
import { campaignRoutes } from './modules/campaign';
import { registrationRoutes } from './modules/registration';
import { setupSwagger } from './config/swagger.config';

const app = express();

// Enable CORS for frontend clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Setup Swagger
setupSwagger(app);

// Base routing structure
app.use('/api/v1/users', authAccountRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1', registrationRoutes);

app.use(errorHandler);

export default app;

