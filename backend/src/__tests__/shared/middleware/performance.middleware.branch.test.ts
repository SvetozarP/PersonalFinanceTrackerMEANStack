import { Request, Response, NextFunction } from 'express';
import { performanceMiddleware, databasePerformanceMiddleware, memoryMonitoringMiddleware } from '../../../shared/middleware/performance.middleware';
import { logger } from '../../../shared/services/logger.service';

jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Performance Middleware - Branch Coverage Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      method: 'GET',
      url: '/test',
      headers: {},
      get: jest.fn().mockReturnValue('127.0.0.1')
    } as any;
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn()
    } as any;
    mockNext = jest.fn();
  });

  describe('Performance Middleware - Branch Coverage', () => {
    it('should handle different request methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      methods.forEach(method => {
        const req = { ...mockReq, method } as Request;
        performanceMiddleware(req, mockRes as Response, mockNext);
        expect(mockNext).toHaveBeenCalled();
      });
    });

    it('should handle different response status codes', () => {
      const originalEnd = mockRes.end;
      mockRes.end = function(chunk?: any, encoding?: any): any {
        if (originalEnd) {
          originalEnd.call(this, chunk, encoding);
        }
      };

      // Test different status codes
      const statusCodes = [200, 201, 400, 401, 403, 404, 500];
      
      statusCodes.forEach(statusCode => {
        const res = { ...mockRes, statusCode } as Response;
        performanceMiddleware(mockReq as Request, res, mockNext);
      });

      expect(mockNext).toHaveBeenCalledTimes(statusCodes.length);
    });

    it('should handle requests with different durations', () => {
      const originalEnd = mockRes.end;
      mockRes.end = function(chunk?: any, encoding?: any): any {
        if (originalEnd) {
          originalEnd.call(this, chunk, encoding);
        }
      };

      // Test fast requests
      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      // Test slow requests by adding delay
      setTimeout(() => {
        performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);
      }, 10);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests with different URLs', () => {
      const urls = ['/api/users', '/api/transactions', '/api/budgets', '/api/categories'];
      
      urls.forEach(url => {
        const req = { ...mockReq, url } as Request;
        performanceMiddleware(req, mockRes as Response, mockNext);
      });

      expect(mockNext).toHaveBeenCalledTimes(urls.length);
    });

    it('should handle requests with different IP addresses', () => {
      const ips = ['127.0.0.1', '192.168.1.1', '10.0.0.1', '::1'];
      
      ips.forEach(ip => {
        const req = { ...mockReq, get: jest.fn().mockReturnValue(ip) } as Request;
        performanceMiddleware(req, mockRes as Response, mockNext);
      });

      expect(mockNext).toHaveBeenCalledTimes(ips.length);
    });
  });

  describe('Database Performance Middleware - Branch Coverage', () => {
    it('should handle different mongoose query types', () => {
      // Mock different query types
      const queryTypes = ['find', 'findOne', 'aggregate', 'count', 'distinct'];
      
      queryTypes.forEach(queryType => {
        const req = { ...mockReq, [queryType]: jest.fn() } as any;
        databasePerformanceMiddleware(req, mockRes as Response, mockNext);
      });

      expect(mockNext).toHaveBeenCalledTimes(queryTypes.length);
    });

    it('should handle queries with different execution times', () => {
      // Test fast queries
      databasePerformanceMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      // Test slow queries
      setTimeout(() => {
        databasePerformanceMiddleware(mockReq as Request, mockRes as Response, mockNext);
      }, 10);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle different collection names', () => {
      const collections = ['transactions', 'budgets', 'categories', 'users'];
      
      collections.forEach(collection => {
        const req = { ...mockReq, collection } as any;
        databasePerformanceMiddleware(req, mockRes as Response, mockNext);
      });

      expect(mockNext).toHaveBeenCalledTimes(collections.length);
    });
  });

  describe('Memory Monitoring Middleware - Branch Coverage', () => {
    it('should handle different memory usage levels', () => {
      const memoryLevels = [
        { heapUsed: 100 * 1024 * 1024, heapTotal: 1000 * 1024 * 1024 }, // 10%
        { heapUsed: 500 * 1024 * 1024, heapTotal: 1000 * 1024 * 1024 }, // 50%
        { heapUsed: 800 * 1024 * 1024, heapTotal: 1000 * 1024 * 1024 }, // 80%
        { heapUsed: 900 * 1024 * 1024, heapTotal: 1000 * 1024 * 1024 }, // 90%
        { heapUsed: 1000 * 1024 * 1024, heapTotal: 1000 * 1024 * 1024 } // 100%
      ];

      memoryLevels.forEach(memory => {
        const originalMemoryUsage = process.memoryUsage;
        (process as any).memoryUsage = jest.fn().mockReturnValue({
          rss: 1000 * 1024 * 1024,
          heapTotal: memory.heapTotal,
          heapUsed: memory.heapUsed,
          external: 0,
          arrayBuffers: 0
        });

        memoryMonitoringMiddleware(mockReq as Request, mockRes as Response, mockNext);
        
        process.memoryUsage = originalMemoryUsage;
      });

      expect(mockNext).toHaveBeenCalledTimes(memoryLevels.length);
    });

    it('should handle different heap total sizes', () => {
      const heapTotals = [0, 100, 1000, 10000, 100000]; // Different sizes in MB
      
      heapTotals.forEach(heapTotal => {
        const originalMemoryUsage = process.memoryUsage;
        (process as any).memoryUsage = jest.fn().mockReturnValue({
          rss: 1000 * 1024 * 1024,
          heapTotal: heapTotal * 1024 * 1024,
          heapUsed: 500 * 1024 * 1024,
          external: 0,
          arrayBuffers: 0
        });

        memoryMonitoringMiddleware(mockReq as Request, mockRes as Response, mockNext);
        
        process.memoryUsage = originalMemoryUsage;
      });

      expect(mockNext).toHaveBeenCalledTimes(heapTotals.length);
    });

    it('should handle edge cases for memory monitoring', () => {
      const edgeCases = [
        { heapUsed: 0, heapTotal: 1000 * 1024 * 1024 }, // 0% usage
        { heapUsed: 1000 * 1024 * 1024, heapTotal: 0 }, // Infinite usage
        { heapUsed: -100, heapTotal: 1000 * 1024 * 1024 }, // Negative usage
        { heapUsed: 1000 * 1024 * 1024, heapTotal: -1000 } // Negative total
      ];

      edgeCases.forEach(memory => {
        const originalMemoryUsage = process.memoryUsage;
        (process as any).memoryUsage = jest.fn().mockReturnValue({
          rss: 1000 * 1024 * 1024,
          heapTotal: memory.heapTotal,
          heapUsed: memory.heapUsed,
          external: 0,
          arrayBuffers: 0
        });

        memoryMonitoringMiddleware(mockReq as Request, mockRes as Response, mockNext);
        
        process.memoryUsage = originalMemoryUsage;
      });

      expect(mockNext).toHaveBeenCalledTimes(edgeCases.length);
    });
  });

  describe('Integration Tests - Branch Coverage', () => {
    it('should handle all middleware together with different scenarios', () => {
      const scenarios = [
        { method: 'GET', url: '/api/transactions', statusCode: 200 },
        { method: 'POST', url: '/api/budgets', statusCode: 201 },
        { method: 'PUT', url: '/api/categories', statusCode: 200 },
        { method: 'DELETE', url: '/api/users', statusCode: 204 }
      ];

      scenarios.forEach(scenario => {
        const req = { ...mockReq, method: scenario.method, url: scenario.url } as Request;
        const res = { ...mockRes, statusCode: scenario.statusCode } as Response;
        
        // Mock memory usage for each scenario
        const originalMemoryUsage = process.memoryUsage;
        (process as any).memoryUsage = jest.fn().mockReturnValue({
          rss: 1000 * 1024 * 1024,
          heapTotal: 1000 * 1024 * 1024,
          heapUsed: 500 * 1024 * 1024,
          external: 0,
          arrayBuffers: 0
        });

        performanceMiddleware(req, res, mockNext);
        databasePerformanceMiddleware(req, res, mockNext);
        memoryMonitoringMiddleware(req, res, mockNext);
        
        process.memoryUsage = originalMemoryUsage;
      });

      expect(mockNext).toHaveBeenCalledTimes(scenarios.length * 3);
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

























