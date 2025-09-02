import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service';

/**
 * Performance monitoring middleware
 * Tracks request duration and logs slow queries
 */
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;
    
    // Calculate memory usage
    const memoryUsed = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    };

    // Log performance metrics
    const performanceData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      memoryUsed: `${Math.round(memoryUsed.heapUsed / 1024 / 1024 * 100) / 100}MB`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    };

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', performanceData);
    } else if (duration > 500) {
      logger.info('Moderate request duration', performanceData);
    } else {
      logger.debug('Request completed', performanceData);
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Database query performance middleware
 * Tracks MongoDB query performance
 */
export const databasePerformanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Store original mongoose query methods
  const originalFind = require('mongoose').Query.prototype.find;
  const originalFindOne = require('mongoose').Query.prototype.findOne;
  const originalAggregate = require('mongoose').Model.aggregate;

  // Override find method
  require('mongoose').Query.prototype.find = function(options?: any) {
    const startTime = Date.now();
    const query = this;
    
    return originalFind.call(this, options).then((result: any) => {
      const duration = Date.now() - startTime;
      
      if (duration > 100) { // Log queries taking more than 100ms
        logger.warn('Slow database query detected', {
          operation: 'find',
          collection: query.model?.collection?.name || 'unknown',
          duration: `${duration}ms`,
          filter: query.getFilter(),
          options: query.getOptions(),
          resultCount: Array.isArray(result) ? result.length : 1
        });
      }
      
      return result;
    });
  };

  // Override findOne method
  require('mongoose').Query.prototype.findOne = function(options?: any) {
    const startTime = Date.now();
    const query = this;
    
    return originalFindOne.call(this, options).then((result: any) => {
      const duration = Date.now() - startTime;
      
      if (duration > 100) { // Log queries taking more than 100ms
        logger.warn('Slow database query detected', {
          operation: 'findOne',
          collection: query.model?.collection?.name || 'unknown',
          duration: `${duration}ms`,
          filter: query.getFilter(),
          options: query.getOptions(),
          resultCount: result ? 1 : 0
        });
      }
      
      return result;
    });
  };

  // Override aggregate method
  require('mongoose').Model.aggregate = function(pipeline: any[]) {
    const startTime = Date.now();
    const model = this;
    
    return originalAggregate.call(this, pipeline).then((result: any) => {
      const duration = Date.now() - startTime;
      
      if (duration > 200) { // Log aggregations taking more than 200ms
        logger.warn('Slow database aggregation detected', {
          operation: 'aggregate',
          collection: model.collection.name,
          duration: `${duration}ms`,
          pipeline: pipeline,
          resultCount: Array.isArray(result) ? result.length : 1
        });
      }
      
      return result;
    });
  };

  next();
};

/**
 * Memory usage monitoring middleware
 */
export const memoryMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const memoryUsage = process.memoryUsage();
  
  // Log high memory usage
  const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
  const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100;
  
  if (memoryUsagePercent > 80) {
    logger.warn('High memory usage detected', {
      heapUsed: `${Math.round(heapUsedMB * 100) / 100}MB`,
      heapTotal: `${Math.round(heapTotalMB * 100) / 100}MB`,
      usagePercent: `${Math.round(memoryUsagePercent * 100) / 100}%`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100}MB`
    });
  }
  
  next();
};
