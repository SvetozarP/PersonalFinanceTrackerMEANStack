import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service';
import { databaseOptimizationService } from '../services/database-optimization.service';

/**
 * Performance monitoring middleware
 * Tracks request duration, memory usage, and database query performance
 */
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Override res.end to capture response completion
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

    // Log performance metrics
    const performanceData = {
      method: req.method,
      url: req.url,
      duration: duration,
      memoryDelta: memoryDelta,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    };

    // Log based on performance thresholds
    if (duration > 1000) {
      logger.warn('Slow request detected', performanceData);
    } else if (duration > 500) {
      logger.info('Moderate request duration', performanceData);
    } else {
      logger.debug('Request completed', performanceData);
    }

    // Log memory usage if significant
    if (memoryDelta > 10 * 1024 * 1024) { // 10MB
      logger.warn('High memory usage detected', {
        ...performanceData,
        memoryUsage: {
          heapUsed: endMemory.heapUsed,
          heapTotal: endMemory.heapTotal,
          external: endMemory.external,
          rss: endMemory.rss
        }
      });
    }

    // Call original end method
    if (originalEnd) {
      originalEnd.call(this, chunk, encoding);
    }
  };

  next();
};

/**
 * Database performance monitoring middleware
 * Tracks MongoDB query performance and execution statistics
 */
export const databasePerformanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Override res.end to capture database performance
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log database performance if request took significant time
    if (duration > 100) {
      logger.info('Database operation completed', {
        method: req.method,
        url: req.url,
        duration: duration,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });
    }

    // Call original end method
    if (originalEnd) {
      originalEnd.call(this, chunk, encoding);
    }
  };

  next();
};

/**
 * Memory monitoring middleware
 * Tracks memory usage patterns and alerts on high usage
 */
export const memoryMonitoringMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  // Alert on high memory usage
  if (memoryUsagePercent > 80) {
    logger.warn('High memory usage detected', {
      memoryUsage: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      },
      usagePercent: memoryUsagePercent,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
  }

  // Log memory usage for debugging
  if (memoryUsagePercent > 60) {
    logger.debug('Memory usage monitoring', {
      usagePercent: memoryUsagePercent,
      method: req.method,
      url: req.url
    });
  }

  next();
};

/**
 * Query optimization middleware
 * Analyzes and optimizes database queries
 */
export const queryOptimizationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Store original query execution methods
  const originalQuery = req.query;
  
  // Add query optimization hints to request
  req.queryOptimization = {
    enableCaching: true,
    maxResults: 1000,
    timeout: 30000
  };

  // Override res.end to analyze query performance
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any {
    const endTime = Date.now();
    const duration = endTime - (req as any).startTime || Date.now();

    // Analyze query performance if this was a database operation
    if (req.url.includes('/api/') && req.method === 'GET') {
      databaseOptimizationService.analyzeQueryPerformance(originalQuery, 'transactions')
        .then(analysis => {
          if (analysis.efficiency < 50) {
            logger.warn('Query efficiency below threshold', {
              url: req.url,
              efficiency: analysis.efficiency,
              executionTime: analysis.executionTime,
              suggestions: analysis.suggestions
            });
          }
        })
        .catch(error => {
          logger.debug('Query analysis failed', { error: String(error) });
        });
    }

    // Call original end method
    if (originalEnd) {
      originalEnd.call(this, chunk, encoding);
    }
  };

  next();
};

/**
 * Cache control middleware
 * Manages query result caching
 */
export const cacheControlMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Set cache headers based on request type
  if (req.method === 'GET') {
    // Cache GET requests for 5 minutes
    res.set('Cache-Control', 'public, max-age=300');
    res.set('ETag', `"${Date.now()}"`);
  } else {
    // No cache for non-GET requests
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }

  next();
};

/**
 * Performance metrics collection middleware
 * Collects comprehensive performance metrics
 */
export const metricsCollectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Store start time for later use
  (req as any).startTime = startTime;
  (req as any).startMemory = startMemory;

  // Override res.end to collect metrics
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

    // Collect comprehensive metrics
    const metrics = {
      request: {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
      },
      performance: {
        duration: duration,
        memoryDelta: memoryDelta,
        memoryUsage: {
          heapUsed: endMemory.heapUsed,
          heapTotal: endMemory.heapTotal,
          external: endMemory.external,
          rss: endMemory.rss
        }
      },
      response: {
        statusCode: res.statusCode,
        contentLength: res.get('Content-Length') || 0
      }
    };

    // Log metrics based on performance
    if (duration > 1000 || memoryDelta > 50 * 1024 * 1024) {
      logger.warn('Performance metrics collected', metrics);
    } else {
      logger.debug('Performance metrics collected', metrics);
    }

    // Call original end method
    if (originalEnd) {
      originalEnd.call(this, chunk, encoding);
    }
  };

  next();
};

// Extend Request interface to include custom properties
declare global {
  namespace Express {
    interface Request {
      queryOptimization?: {
        enableCaching: boolean;
        maxResults: number;
        timeout: number;
      };
      startTime?: number;
      startMemory?: NodeJS.MemoryUsage;
    }
  }
}