import express, { Express } from 'express';
import cors from 'cors';
import { environment } from './config/environment';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logging';
import routes from './routes';

const app: Express = express();

// Middleware
app.use(cors({ origin: environment.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/api', routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
