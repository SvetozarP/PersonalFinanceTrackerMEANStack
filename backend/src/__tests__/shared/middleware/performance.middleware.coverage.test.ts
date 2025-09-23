import { Request, Response, NextFunction } from 'express';
import { 
  performanceMiddleware, 
  databasePerformanceMiddleware, 
  memoryMonitoringMiddleware 
} from '../../../shared/middleware/performance.middleware';
import { logger } from '../../../shared/services/logger.service';

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Performance Middleware - Coverage Tests', () => {
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

  describe('Performance Middleware - Additional Coverage', () => {
    it('should handle very fast requests (< 100ms)', (done) => {
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

      // Simulate very fast request
      setTimeout(() => {
        mockRes.end!();
      }, 50);
    });

    it('should handle requests with different status codes', (done) => {
      const originalEnd = mockRes.end;
      let endCalled = false;

      mockRes.statusCode = 404;

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

    it('should handle requests with different methods', (done) => {
      const originalEnd = mockRes.end;
      let endCalled = false;

      mockReq.method = 'POST';

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
  });

  describe('Database Performance Middleware - Additional Coverage', () => {
    it('should handle mongoose query method overrides', () => {
      const mongoose = require('mongoose');
      
      databasePerformanceMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      // Test that the middleware doesn't throw errors
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle multiple middleware calls', () => {
      databasePerformanceMiddleware(mockReq as Request, mockRes as Response, mockNext);
      databasePerformanceMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memory Monitoring Middleware - Additional Coverage', () => {
    it('should handle memory usage at exactly 80% threshold', () => {
      const originalMemoryUsage = process.memoryUsage;
      (process as any).memoryUsage = jest.fn().mockReturnValue({
        rss: 1000 * 1024 * 1024, // 1GB
        heapTotal: 1000 * 1024 * 1024, // 1GB
        heapUsed: 800 * 1024 * 1024, // 800MB (exactly 80% usage)
        external: 0,
        arrayBuffers: 0
      });

      memoryMonitoringMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // At exactly 80%, it should NOT trigger the warning (threshold is > 80, not >= 80)
      expect(logger.warn).not.toHaveBeenCalled();

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    it('should handle memory usage at 79% (just below threshold)', () => {
      const originalMemoryUsage = process.memoryUsage;
      (process as any).memoryUsage = jest.fn().mockReturnValue({
        rss: 1000 * 1024 * 1024, // 1GB
        heapTotal: 1000 * 1024 * 1024, // 1GB
        heapUsed: 790 * 1024 * 1024, // 790MB (79% usage)
        external: 0,
        arrayBuffers: 0
      });

      memoryMonitoringMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.warn).not.toHaveBeenCalled();

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    it('should handle memory usage at 100%', () => {
      const originalMemoryUsage = process.memoryUsage;
      (process as any).memoryUsage = jest.fn().mockReturnValue({
        rss: 1000 * 1024 * 1024, // 1GB
        heapTotal: 1000 * 1024 * 1024, // 1GB
        heapUsed: 1000 * 1024 * 1024, // 1000MB (100% usage)
        external: 0,
        arrayBuffers: 0
      });

      memoryMonitoringMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.warn).toHaveBeenCalledWith(
        'High memory usage detected',
        expect.objectContaining({
          usagePercent: expect.any(Number)
        })
      );

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    it('should handle zero heap total (edge case)', () => {
      const originalMemoryUsage = process.memoryUsage;
      (process as any).memoryUsage = jest.fn().mockReturnValue({
        rss: 1000 * 1024 * 1024, // 1GB
        heapTotal: 0, // Zero heap total
        heapUsed: 100 * 1024 * 1024, // 100MB
        external: 0,
        arrayBuffers: 0
      });

      memoryMonitoringMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // With zero heap total, it will result in Infinity% usage, which should trigger warning
      expect(logger.warn).toHaveBeenCalledWith(
        'High memory usage detected',
        expect.objectContaining({
          usagePercent: expect.any(Number)
        })
      );
      expect(mockNext).toHaveBeenCalled();

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('Integration Tests - Additional Coverage', () => {
    it('should handle all middleware together with different scenarios', () => {
      // Test with different request scenarios
      const scenarios = [
        { method: 'GET', statusCode: 200 },
        { method: 'POST', statusCode: 201 },
        { method: 'PUT', statusCode: 200 },
        { method: 'DELETE', statusCode: 204 },
        { method: 'PATCH', statusCode: 200 }
      ];

      scenarios.forEach(scenario => {
        const req = { ...mockReq, method: scenario.method } as any;
        const res = { ...mockRes, statusCode: scenario.statusCode } as any;
        const next = jest.fn();

        // Mock memory usage for each scenario
        const originalMemoryUsage = process.memoryUsage;
        (process as any).memoryUsage = jest.fn().mockReturnValue({
          rss: 1000 * 1024 * 1024,
          heapTotal: 1000 * 1024 * 1024,
          heapUsed: 500 * 1024 * 1024, // 50% usage
          external: 0,
          arrayBuffers: 0
        });

        performanceMiddleware(req, res, next);
        databasePerformanceMiddleware(req, res, next);
        memoryMonitoringMiddleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(3);
        
        // Restore original function
        process.memoryUsage = originalMemoryUsage;
      });
    });

    it('should handle middleware with missing request properties', () => {
      const minimalReq = {} as any;
      const minimalRes = { end: jest.fn() } as any;
      const next = jest.fn();

      // Mock memory usage to prevent errors
      const originalMemoryUsage = process.memoryUsage;
      (process as any).memoryUsage = jest.fn().mockReturnValue({
        rss: 1000 * 1024 * 1024,
        heapTotal: 1000 * 1024 * 1024,
        heapUsed: 500 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0
      });

      expect(() => {
        performanceMiddleware(minimalReq, minimalRes, next);
        databasePerformanceMiddleware(minimalReq, minimalRes, next);
        memoryMonitoringMiddleware(minimalReq, minimalRes, next);
      }).not.toThrow();

      expect(next).toHaveBeenCalledTimes(3);
      
      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });
  });
});
