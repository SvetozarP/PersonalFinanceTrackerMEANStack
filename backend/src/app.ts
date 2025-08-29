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
console.log('✅ Auth routes mounted at /api/auth');

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

// Start server
const startServer = async () => {
  try {
    // Connect to database first
    await databaseConnection.connect();

    // Import and mount financial routes BEFORE starting the server
    console.log('Starting to import financial routes...');

    try {
      const financialRoutes = await import(
        './modules/financial/financial.routes'
      );
      app.use('/api/financial', financialRoutes.default);
      console.log('✅ Financial routes mounted at /api/financial');
    } catch (error) {
      console.error('❌ Failed to import financial routes:', error);
    }

    try {
      const transactionRoutes = await import(
        './modules/financial/transactions/routes/transaction.routes'
      );
      app.use('/api/transactions', transactionRoutes.default);
      console.log('✅ Transaction routes mounted at /api/transactions');
    } catch (error) {
      console.error('❌ Failed to import transaction routes:', error);
    }

    try {
      const categoryRoutes = await import(
        './modules/financial/categories/routes/category.routes'
      );
      app.use('/api/categories', categoryRoutes.default);
      console.log('✅ Category routes mounted at /api/categories');
    } catch (error) {
      console.error('❌ Failed to import category routes:', error);
    }

    console.log('Routes mounting completed');

    // 404 handler - Register AFTER routes are mounted
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    });

    // Debug: Show all registered routes
    console.log('🔍 All registered routes:');
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        console.log(
          `  ${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`
        );
      } else if (middleware.name === 'router') {
        console.log(`  Router: ${middleware.regexp}`);
        // Show what's inside the router
        if (middleware.handle && middleware.handle.stack) {
          middleware.handle.stack.forEach((route: any) => {
            if (route.route) {
              console.log(
                `    ${Object.keys(route.route.methods).join(',').toUpperCase()} ${route.route.path}`
              );
            }
          });
        }
      }
    });

    // Now start the server AFTER routes are mounted
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
