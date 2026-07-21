import express, { Express, Request, Response } from 'express';
import { setupSwagger } from './config/swagger.config';
import { errorMiddleware } from './shared/error.middleware';
import { campaignRoutes } from './modules/campaign-mgmt';
import { articleRoutes } from './modules/content-news';

const app: Express = express();

/**
 * Middleware
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Swagger documentation
 */
setupSwagger(app);

/**
 * Routes
 */
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/articles', articleRoutes);

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'Route not found',
  });
});

/**
 * Global error handler
 */
app.use(errorMiddleware);

export default app;
