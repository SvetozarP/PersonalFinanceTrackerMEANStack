import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { logger } from './shared/services/logger.service';
import { config } from './config/environment';

// Import database connection
import { databaseConnection } from './config/database';

// Import routes
import authRoutes from './modules/auth/auth.routes';

const app = express();
const PORT = config.BACKEND_PORT;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Finance Tracker Backend',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Global error handler
app.use(
  (
    error: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error('Global error handler:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error:
        config.NODE_ENV === 'development'
          ? String(error.message)
          : 'Something went wrong',
    });
  }
);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database first
    await databaseConnection.connect();

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(` Health check: http://localhost:${PORT}/health`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', String(error));
    process.exit(1);
  }
};

void startServer();

export default app;
