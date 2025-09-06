import { performanceMiddleware } from '../../../shared/middleware/performance.middleware';
import { Request, Response, NextFunction } from 'express';

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { logger as mockLogger } from '../../../shared/services/logger.service';

describe('Performance Middleware - Branch Coverage', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      method: 'GET',
      url: '/test',
      path: '/test',
      headers: {
        'user-agent': 'test-agent',
        'x-forwarded-for': '192.168.1.1',
      },
      ip: '127.0.0.1',
      body: {},
      query: {},
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      on: jest.fn(),
      get: jest.fn(),
      locals: {},
    };

    mockNext = jest.fn();
  });

  describe('performanceMiddleware', () => {
    it('should track request performance successfully', (done) => {
      const middleware = performanceMiddleware();

      // Mock response events
      let finishCallback: () => void;
      let closeCallback: () => void;

      (mockResponse.on as jest.Mock).mockImplementation((event: string, callback: () => void) => {
        if (event === 'finish') {
          finishCallback = callback;
        } else if (event === 'close') {
          closeCallback = callback;
        }
      });

      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();

      // Simulate response finish
      setTimeout(() => {
        finishCallback();
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Request completed',
          expect.objectContaining({
            method: 'GET',
            url: '/test',
            statusCode: 200,
            duration: expect.any(Number),
          })
        );
        done();
      }, 10);
    });

    it('should handle response close event', (done) => {
      const middleware = performanceMiddleware();

      let closeCallback: () => void;

      (mockResponse.on as jest.Mock).mockImplementation((event: string, callback: () => void) => {
        if (event === 'close') {
          closeCallback = callback;
        }
      });

      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Simulate response close
      setTimeout(() => {
        closeCallback();
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Request closed before completion',
          expect.objectContaining({
            method: 'GET',
            url: '/test',
            duration: expect.any(Number),
          })
        );
        done();
      }, 10);
    });

    it('should handle slow requests', (done) => {
      const middleware = performanceMiddleware();

      let finishCallback: () => void;

      (mockResponse.on as jest.Mock).mockImplementation((event: string, callback: () => void) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
      });

      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Simulate slow response
      setTimeout(() => {
        finishCallback();
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Slow request detected',
          expect.objectContaining({
            method: 'GET',
            url: '/test',
            duration: expect.any(Number),
            threshold: 1000,
          })
        );
        done();
      }, 1100); // Simulate slow request
    });

    it('should handle requests without user-agent', () => {
      const middleware = performanceMiddleware();

      mockRequest.headers = {};

      (mockResponse.on as jest.Mock).mockImplementation(() => {});
      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests without x-forwarded-for', () => {
      const middleware = performanceMiddleware();

      mockRequest.headers = {
        'user-agent': 'test-agent',
      };

      (mockResponse.on as jest.Mock).mockImplementation(() => {});
      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests with different content types', () => {
      const middleware = performanceMiddleware();

      (mockResponse.on as jest.Mock).mockImplementation(() => {});
      (mockResponse.get as jest.Mock).mockReturnValue('application/json');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests with different status codes', (done) => {
      const middleware = performanceMiddleware();

      let finishCallback: () => void;

      (mockResponse.on as jest.Mock).mockImplementation((event: string, callback: () => void) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
      });

      (mockResponse.get as jest.Mock).mockReturnValue('text/html');
      (mockResponse.status as jest.Mock).mockReturnValue(404);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      setTimeout(() => {
        finishCallback();
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Request completed',
          expect.objectContaining({
            statusCode: 404,
          })
        );
        done();
      }, 10);
    });

    it('should handle error responses', (done) => {
      const middleware = performanceMiddleware();

      let finishCallback: () => void;

      (mockResponse.on as jest.Mock).mockImplementation((event: string, callback: () => void) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
      });

      (mockResponse.get as jest.Mock).mockReturnValue('text/html');
      (mockResponse.status as jest.Mock).mockReturnValue(500);

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      setTimeout(() => {
        finishCallback();
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Request completed with error',
          expect.objectContaining({
            statusCode: 500,
          })
        );
        done();
      }, 10);
    });

    it('should handle requests with query parameters', () => {
      const middleware = performanceMiddleware();

      mockRequest.query = { page: '1', limit: '10' };

      (mockResponse.on as jest.Mock).mockImplementation(() => {});
      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests with body data', () => {
      const middleware = performanceMiddleware();

      mockRequest.body = { name: 'test', email: 'test@example.com' };

      (mockResponse.on as jest.Mock).mockImplementation(() => {});
      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests with params', () => {
      const middleware = performanceMiddleware();

      mockRequest.params = { id: '123' };

      (mockResponse.on as jest.Mock).mockImplementation(() => {});
      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle different HTTP methods', () => {
      const middleware = performanceMiddleware();

      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
      
      methods.forEach(method => {
        mockRequest.method = method;
        (mockResponse.on as jest.Mock).mockImplementation(() => {});
        (mockResponse.get as jest.Mock).mockReturnValue('text/html');

        middleware(mockRequest as Request, mockResponse as Response, mockNext);
      });

      expect(mockNext).toHaveBeenCalledTimes(methods.length);
    });

    it('should handle requests with different URLs', () => {
      const middleware = performanceMiddleware();

      const urls = ['/api/users', '/api/transactions', '/api/categories'];
      
      urls.forEach(url => {
        mockRequest.url = url;
        mockRequest.path = url;
        (mockResponse.on as jest.Mock).mockImplementation(() => {});
        (mockResponse.get as jest.Mock).mockReturnValue('text/html');

        middleware(mockRequest as Request, mockResponse as Response, mockNext);
      });

      expect(mockNext).toHaveBeenCalledTimes(urls.length);
    });

    it('should handle requests with complex headers', () => {
      const middleware = performanceMiddleware();

      mockRequest.headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        'x-real-ip': '203.0.113.1',
        'accept': 'application/json',
        'content-type': 'application/json',
        'authorization': 'Bearer token123',
      };

      (mockResponse.on as jest.Mock).mockImplementation(() => {});
      (mockResponse.get as jest.Mock).mockReturnValue('application/json');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests with different IP addresses', () => {
      const middleware = performanceMiddleware();

      const ips = ['127.0.0.1', '192.168.1.100', '10.0.0.1', '::1'];
      
      ips.forEach(ip => {
        mockRequest.ip = ip;
        (mockResponse.on as jest.Mock).mockImplementation(() => {});
        (mockResponse.get as jest.Mock).mockReturnValue('text/html');

        middleware(mockRequest as Request, mockResponse as Response, mockNext);
      });

      expect(mockNext).toHaveBeenCalledTimes(ips.length);
    });

    it('should handle response events in different order', (done) => {
      const middleware = performanceMiddleware();

      let closeCallback: () => void;

      (mockResponse.on as jest.Mock).mockImplementation((event: string, callback: () => void) => {
        if (event === 'close') {
          closeCallback = callback;
        }
      });

      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Simulate close before finish
      setTimeout(() => {
        closeCallback();
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Request closed before completion',
          expect.objectContaining({
            method: 'GET',
            url: '/test',
          })
        );
        done();
      }, 10);
    });
  });
});