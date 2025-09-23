import { performanceMiddleware } from '../../../shared/middleware/performance.middleware';
import { Request, Response, NextFunction } from 'express';

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { logger as mockLogger } from '../../../shared/services/logger.service';

describe('Performance Middleware - Branch Coverage', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
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
      get: jest.fn((header: string) => {
        return mockRequest.headers?.[header.toLowerCase()] as string | undefined;
      }) as any,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      on: jest.fn(),
      get: jest.fn(),
      locals: {},
      statusCode: 200,
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('performanceMiddleware', () => {
    it('should track request performance successfully', () => {
      const middleware = performanceMiddleware;

      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();

      // Simulate response end (which triggers the performance logging)
      (mockResponse as any).end();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Request completed',
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          statusCode: 200,
          duration: expect.any(Number),
        })
      );
    });

    it('should handle response close event', () => {
      const middleware = performanceMiddleware;

      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Simulate response end
      (mockResponse as any).end();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Request completed',
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          duration: expect.any(Number),
        })
      );
    });

    it('should handle slow requests', () => {
      const middleware = performanceMiddleware;

      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Simulate slow response by advancing time before calling end
      jest.advanceTimersByTime(1100);
      (mockResponse as any).end();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Slow request detected',
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          duration: expect.any(Number),
        })
      );
    });

    it('should handle requests without user-agent', () => {
      const middleware = performanceMiddleware;

      mockRequest.headers = {};

      (mockResponse.on as jest.Mock).mockImplementation(() => {});
      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests without x-forwarded-for', () => {
      const middleware = performanceMiddleware;

      mockRequest.headers = {
        'user-agent': 'test-agent',
      };

      (mockResponse.on as jest.Mock).mockImplementation(() => {});
      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests with different content types', () => {
      const middleware = performanceMiddleware;

      (mockResponse.on as jest.Mock).mockImplementation(() => {});
      (mockResponse.get as jest.Mock).mockReturnValue('application/json');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests with different status codes', () => {
      const middleware = performanceMiddleware;

      (mockResponse.get as jest.Mock).mockReturnValue('text/html');
      (mockResponse as any).statusCode = 404;

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      (mockResponse as any).end();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Request completed',
        expect.objectContaining({
          statusCode: 404,
        })
      );
    });

    it('should handle error responses', () => {
      const middleware = performanceMiddleware;

      (mockResponse.get as jest.Mock).mockReturnValue('text/html');
      (mockResponse as any).statusCode = 500;

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      (mockResponse as any).end();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Request completed',
        expect.objectContaining({
          statusCode: 500,
        })
      );
    });

    it('should handle requests with query parameters', () => {
      const middleware = performanceMiddleware;

      mockRequest.query = { page: '1', limit: '10' };

      (mockResponse.on as jest.Mock).mockImplementation(() => {});
      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests with body data', () => {
      const middleware = performanceMiddleware;

      mockRequest.body = { name: 'test', email: 'test@example.com' };

      (mockResponse.on as jest.Mock).mockImplementation(() => {});
      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests with params', () => {
      const middleware = performanceMiddleware;

      mockRequest.params = { id: '123' };

      (mockResponse.on as jest.Mock).mockImplementation(() => {});
      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle different HTTP methods', () => {
      const middleware = performanceMiddleware;

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
      const middleware = performanceMiddleware;

      const urls = ['/api/users', '/api/transactions', '/api/categories'];
      
      urls.forEach(url => {
        mockRequest.url = url;
        (mockRequest as any).path = url;
        (mockResponse.on as jest.Mock).mockImplementation(() => {});
        (mockResponse.get as jest.Mock).mockReturnValue('text/html');

        middleware(mockRequest as Request, mockResponse as Response, mockNext);
      });

      expect(mockNext).toHaveBeenCalledTimes(urls.length);
    });

    it('should handle requests with complex headers', () => {
      const middleware = performanceMiddleware;

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
      const middleware = performanceMiddleware;

      const ips = ['127.0.0.1', '192.168.1.100', '10.0.0.1', '::1'];
      
      ips.forEach(ip => {
        (mockRequest as any).ip = ip;
        (mockResponse.on as jest.Mock).mockImplementation(() => {});
        (mockResponse.get as jest.Mock).mockReturnValue('text/html');

        middleware(mockRequest as Request, mockResponse as Response, mockNext);
      });

      expect(mockNext).toHaveBeenCalledTimes(ips.length);
    });

    it('should handle response events in different order', () => {
      const middleware = performanceMiddleware;

      (mockResponse.get as jest.Mock).mockReturnValue('text/html');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Simulate response end
      (mockResponse as any).end();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Request completed',
        expect.objectContaining({
          method: 'GET',
          url: '/test',
        })
      );
    });
  });
});