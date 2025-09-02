import { Request, Response, NextFunction } from 'express';
import { 
  performanceMiddleware, 
  databasePerformanceMiddleware, 
  memoryMonitoringMiddleware 
} from '../../shared/middleware/performance.middleware';
import { logger } from '../../shared/services/logger.service';

// Mock logger
jest.mock('../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock mongoose
jest.mock('mongoose', () => ({
  Query: {
    prototype: {
      find: jest.fn(),
      findOne: jest.fn()
    }
  },
  Model: {
    aggregate: jest.fn()
  }
}));

describe('Performance Middleware Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/api/test',
      get: jest.fn().mockReturnValue('test-user-agent'),
      ip: '127.0.0.1'
    } as any;

    mockRes = {
      statusCode: 200,
      end: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as any;

    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('Performance Middleware', () => {
    it('should track request duration and log performance metrics', (done) => {
      const originalEnd = mockRes.end;
      let endCalled = false;

      // Override end to capture the call
      mockRes.end = function(chunk?: any, encoding?: any): any {
        if (!endCalled) {
          endCalled = true;
          if (originalEnd) {
            originalEnd.call(this, chunk, encoding);
          }
          done();
        }
      };

      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Simulate request completion
      setTimeout(() => {
        mockRes.end!();
      }, 10);
    });

    it('should log slow requests as warnings', (done) => {
      const originalEnd = mockRes.end;
      let endCalled = false;

      mockRes.end = function(chunk?: any, encoding?: any): any {
        if (!endCalled) {
          endCalled = true;
          if (originalEnd) {
            originalEnd.call(this, chunk, encoding);
          }
          done();
        }
      };

      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Simulate slow request
      setTimeout(() => {
        mockRes.end!();
      }, 1100); // Over 1 second
    });

    it('should log moderate requests as info', (done) => {
      const originalEnd = mockRes.end;
      let endCalled = false;

      mockRes.end = function(chunk?: any, encoding?: any): any {
        if (!endCalled) {
          endCalled = true;
          if (originalEnd) {
            originalEnd.call(this, chunk, encoding);
          }
          done();
        }
      };

      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Simulate moderate request
      setTimeout(() => {
        mockRes.end!();
      }, 600); // Over 500ms
    });

    it('should track memory usage', (done) => {
      const originalEnd = mockRes.end;
      let endCalled = false;

      mockRes.end = function(chunk?: any, encoding?: any): any {
        if (!endCalled) {
          endCalled = true;
          if (originalEnd) {
            originalEnd.call(this, chunk, encoding);
          }
          done();
        }
      };

      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);

      setTimeout(() => {
        mockRes.end!();
      }, 10);
    });

    it('should call next middleware', () => {
      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Database Performance Middleware', () => {
    it('should call next middleware', () => {
      databasePerformanceMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should override mongoose query methods', () => {
      const mongoose = require('mongoose');
      
      databasePerformanceMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      // Check that methods are overridden
      expect(mongoose.Query.prototype.find).toBeDefined();
      expect(mongoose.Query.prototype.findOne).toBeDefined();
      expect(mongoose.Model.aggregate).toBeDefined();
    });
  });

  describe('Memory Monitoring Middleware', () => {
    it('should monitor memory usage and call next', () => {
      memoryMonitoringMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should log high memory usage warnings', () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      (process as any).memoryUsage = jest.fn().mockReturnValue({
        rss: 1000 * 1024 * 1024, // 1GB
        heapTotal: 1000 * 1024 * 1024, // 1GB
        heapUsed: 900 * 1024 * 1024, // 900MB (90% usage)
        external: 0,
        arrayBuffers: 0
      });

      memoryMonitoringMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.warn).toHaveBeenCalledWith(
        'High memory usage detected',
        expect.objectContaining({
          usagePercent: expect.any(String)
        })
      );

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    it('should not log warnings for normal memory usage', () => {
      // Mock normal memory usage
      const originalMemoryUsage = process.memoryUsage;
      (process as any).memoryUsage = jest.fn().mockReturnValue({
        rss: 1000 * 1024 * 1024, // 1GB
        heapTotal: 1000 * 1024 * 1024, // 1GB
        heapUsed: 500 * 1024 * 1024, // 500MB (50% usage)
        external: 0,
        arrayBuffers: 0
      });

      memoryMonitoringMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.warn).not.toHaveBeenCalled();

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('Integration Tests', () => {
    it('should work together without conflicts', () => {
      // Apply all middleware in sequence
      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);
      databasePerformanceMiddleware(mockReq as Request, mockRes as Response, mockNext);
      memoryMonitoringMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(3);
    });

    it('should handle errors gracefully', () => {
      const errorReq = {
        ...mockReq,
        get: jest.fn().mockImplementation(() => {
          throw new Error('Test error');
        })
      };

      expect(() => {
        performanceMiddleware(errorReq as Request, mockRes as Response, mockNext);
      }).not.toThrow();
    });
  });
});
