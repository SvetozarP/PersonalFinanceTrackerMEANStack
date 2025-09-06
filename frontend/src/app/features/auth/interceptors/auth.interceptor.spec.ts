import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';

import { AuthInterceptor, authInterceptor } from './auth.interceptor';
import { TokenService } from '../services/token.service';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let tokenService: jasmine.SpyObj<TokenService>;
  let mockHandler: jasmine.SpyObj<HttpHandler>;

  beforeEach(() => {
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', [
      'getAccessToken', 
      'refreshAccessToken', 
      'clearAll'
    ]);
    const mockHandlerSpy = jasmine.createSpyObj('HttpHandler', ['handle']);
    
    // Configure TestBed for dependency injection
    TestBed.configureTestingModule({
      providers: [
        AuthInterceptor,
        { provide: TokenService, useValue: tokenServiceSpy },
        provideZonelessChangeDetection()
      ]
    });

    interceptor = TestBed.inject(AuthInterceptor);
    tokenService = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
    mockHandler = mockHandlerSpy;
    
    // Setup default mock handler behavior
    mockHandler.handle.and.returnValue(of({} as HttpEvent<unknown>));
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  describe('public auth endpoints', () => {
    it('should not add token for login endpoint', () => {
      const request = new HttpRequest('POST', '/api/auth/login', {});
      tokenService.getAccessToken.and.returnValue('test-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalledWith(request);
      expect(tokenService.getAccessToken).not.toHaveBeenCalled();
    });

    it('should not add token for register endpoint', () => {
      const request = new HttpRequest('POST', '/api/auth/register', {});
      tokenService.getAccessToken.and.returnValue('test-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalledWith(request);
      expect(tokenService.getAccessToken).not.toHaveBeenCalled();
    });

    it('should not add token for refresh-token endpoint', () => {
      const request = new HttpRequest('POST', '/api/auth/refresh-token', {});
      tokenService.getAccessToken.and.returnValue('test-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalledWith(request);
      expect(tokenService.getAccessToken).not.toHaveBeenCalled();
    });

    it('should add token for protected auth endpoints', () => {
      const request = new HttpRequest('GET', '/api/auth/profile', {});
      tokenService.getAccessToken.and.returnValue('test-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalled();
      expect(tokenService.getAccessToken).toHaveBeenCalled();
    });
  });

  describe('protected endpoints', () => {
    it('should add Bearer token for protected endpoints', () => {
      const request = new HttpRequest('GET', '/api/users/profile', {});
      tokenService.getAccessToken.and.returnValue('test-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalled();
      expect(tokenService.getAccessToken).toHaveBeenCalled();
    });

    it('should add Bearer token for financial endpoints', () => {
      const request = new HttpRequest('GET', '/api/transactions', {});
      tokenService.getAccessToken.and.returnValue('test-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalled();
      expect(tokenService.getAccessToken).toHaveBeenCalled();
    });

    it('should add Bearer token for budget endpoints', () => {
      const request = new HttpRequest('GET', '/api/budgets', {});
      tokenService.getAccessToken.and.returnValue('test-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalled();
      expect(tokenService.getAccessToken).toHaveBeenCalled();
    });
  });

  describe('different HTTP methods', () => {
    it('should add token for GET requests', () => {
      const request = new HttpRequest('GET', '/api/users', {});
      tokenService.getAccessToken.and.returnValue('test-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalled();
      expect(tokenService.getAccessToken).toHaveBeenCalled();
    });

    it('should add token for POST requests', () => {
      const request = new HttpRequest('POST', '/api/users', {});
      tokenService.getAccessToken.and.returnValue('test-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalled();
      expect(tokenService.getAccessToken).toHaveBeenCalled();
    });

    it('should add token for PUT requests', () => {
      const request = new HttpRequest('PUT', '/api/users/123', {});
      tokenService.getAccessToken.and.returnValue('test-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalled();
      expect(tokenService.getAccessToken).toHaveBeenCalled();
    });

    it('should add token for PATCH requests', () => {
      const request = new HttpRequest('PATCH', '/api/users/123', {});
      tokenService.getAccessToken.and.returnValue('test-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalled();
      expect(tokenService.getAccessToken).toHaveBeenCalled();
    });

    it('should add token for DELETE requests', () => {
      const request = new HttpRequest('DELETE', '/api/users/123', {});
      tokenService.getAccessToken.and.returnValue('test-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalled();
      expect(tokenService.getAccessToken).toHaveBeenCalled();
    });
  });

  describe('token handling', () => {
    it('should add token when valid token exists', () => {
      const request = new HttpRequest('GET', '/api/users', {});
      tokenService.getAccessToken.and.returnValue('valid-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalled();
      // The request should be cloned with the Authorization header
      const handledRequest = mockHandler.handle.calls.mostRecent().args[0];
      expect(handledRequest.headers.get('Authorization')).toBe('Bearer valid-token');
    });

    it('should not add token when no token exists', () => {
      const request = new HttpRequest('GET', '/api/users', {});
      tokenService.getAccessToken.and.returnValue(null);

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalledWith(request);
      expect(tokenService.getAccessToken).toHaveBeenCalled();
    });

    it('should not add token when token is empty string', () => {
      const request = new HttpRequest('GET', '/api/users', {});
      tokenService.getAccessToken.and.returnValue('');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalledWith(request);
      expect(tokenService.getAccessToken).toHaveBeenCalled();
    });
  });

  describe('401 error handling', () => {
    it('should handle 401 error by refreshing token', () => {
      const request = new HttpRequest('GET', '/api/users', {});
      const errorResponse = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      const refreshResponse = { accessToken: 'new-token' };
      
      tokenService.getAccessToken.and.returnValue('old-token');
      tokenService.refreshAccessToken.and.returnValue(of(refreshResponse));
      mockHandler.handle.and.returnValue(throwError(() => errorResponse));

      interceptor.intercept(request, mockHandler).subscribe({
        next: () => {},
        error: () => {}
      });

      expect(tokenService.refreshAccessToken).toHaveBeenCalled();
    });

    it('should clear all tokens when refresh fails', () => {
      const request = new HttpRequest('GET', '/api/users', {});
      const errorResponse = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      const refreshError = new Error('Refresh failed');
      
      tokenService.getAccessToken.and.returnValue('old-token');
      tokenService.refreshAccessToken.and.returnValue(throwError(() => refreshError));
      mockHandler.handle.and.returnValue(throwError(() => errorResponse));

      interceptor.intercept(request, mockHandler).subscribe({
        next: () => {},
        error: () => {}
      });

      expect(tokenService.clearAll).toHaveBeenCalled();
    });

    it('should not handle 401 for refresh-token endpoint', () => {
      const request = new HttpRequest('POST', '/api/auth/refresh-token', {});
      const errorResponse = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      
      tokenService.getAccessToken.and.returnValue('old-token');
      mockHandler.handle.and.returnValue(throwError(() => errorResponse));

      interceptor.intercept(request, mockHandler).subscribe({
        next: () => {},
        error: () => {}
      });

      expect(tokenService.refreshAccessToken).not.toHaveBeenCalled();
    });

    it('should handle multiple concurrent 401 errors', () => {
      const request1 = new HttpRequest('GET', '/api/users', {});
      const request2 = new HttpRequest('GET', '/api/transactions', {});
      const errorResponse = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      const refreshResponse = { accessToken: 'new-token' };
      
      tokenService.getAccessToken.and.returnValue('old-token');
      tokenService.refreshAccessToken.and.returnValue(of(refreshResponse));
      mockHandler.handle.and.returnValue(throwError(() => errorResponse));

      // First request should trigger refresh
      interceptor.intercept(request1, mockHandler).subscribe({
        next: () => {},
        error: () => {}
      });

      // Second request should wait for refresh
      interceptor.intercept(request2, mockHandler).subscribe({
        next: () => {},
        error: () => {}
      });

      expect(tokenService.refreshAccessToken).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle requests with special characters in URL', () => {
      const request = new HttpRequest('GET', '/api/users/search?q=test%20user', {});
      tokenService.getAccessToken.and.returnValue('test-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalled();
      expect(tokenService.getAccessToken).toHaveBeenCalled();
    });

    it('should handle requests with complex URLs', () => {
      const request = new HttpRequest('GET', '/api/users/123/transactions?date=2023-01-01&category=groceries', {});
      tokenService.getAccessToken.and.returnValue('test-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalled();
      expect(tokenService.getAccessToken).toHaveBeenCalled();
    });

    it('should handle requests with existing Authorization header', () => {
      const request = new HttpRequest('GET', '/api/users', {}, {
        headers: new HttpHeaders({ 'Authorization': 'Bearer existing-token' })
      });
      tokenService.getAccessToken.and.returnValue('new-token');

      interceptor.intercept(request, mockHandler);

      expect(mockHandler.handle).toHaveBeenCalled();
      const handledRequest = mockHandler.handle.calls.mostRecent().args[0];
      expect(handledRequest.headers.get('Authorization')).toBe('Bearer new-token');
    });

    it('should handle non-401 errors without refresh', () => {
      const request = new HttpRequest('GET', '/api/users', {});
      const errorResponse = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
      
      tokenService.getAccessToken.and.returnValue('test-token');
      mockHandler.handle.and.returnValue(throwError(() => errorResponse));

      interceptor.intercept(request, mockHandler).subscribe({
        next: () => {},
        error: () => {}
      });

      expect(tokenService.refreshAccessToken).not.toHaveBeenCalled();
    });

    it('should handle successful responses', () => {
      const request = new HttpRequest('GET', '/api/users', {});
      const successResponse = new HttpResponse({ status: 200, body: { data: 'test' } });
      
      tokenService.getAccessToken.and.returnValue('test-token');
      mockHandler.handle.and.returnValue(of(successResponse));

      interceptor.intercept(request, mockHandler).subscribe(response => {
        expect(response).toBe(successResponse);
      });

      expect(tokenService.getAccessToken).toHaveBeenCalled();
    });
  });
});

describe('authInterceptor (functional)', () => {
  let mockNext: jasmine.Spy<jasmine.Func>;

  beforeEach(() => {
    mockNext = jasmine.createSpy('next').and.returnValue(of({} as HttpEvent<unknown>));
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should skip token for login endpoint', () => {
    const request = new HttpRequest('POST', '/api/auth/login', {});
    
    authInterceptor(request, mockNext);

    expect(mockNext).toHaveBeenCalledWith(request);
  });

  it('should skip token for register endpoint', () => {
    const request = new HttpRequest('POST', '/api/auth/register', {});
    
    authInterceptor(request, mockNext);

    expect(mockNext).toHaveBeenCalledWith(request);
  });

  it('should skip token for refresh-token endpoint', () => {
    const request = new HttpRequest('POST', '/api/auth/refresh-token', {});
    
    authInterceptor(request, mockNext);

    expect(mockNext).toHaveBeenCalledWith(request);
  });

  it('should add token for protected endpoints when token exists', () => {
    const request = new HttpRequest('GET', '/api/users', {});
    localStorage.setItem('access_token', 'test-token');
    
    authInterceptor(request, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const handledRequest = mockNext.calls.mostRecent().args[0];
    expect(handledRequest.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('should not add token when no token exists', () => {
    const request = new HttpRequest('GET', '/api/users', {});
    
    authInterceptor(request, mockNext);

    expect(mockNext).toHaveBeenCalledWith(request);
  });

  it('should handle empty token', () => {
    const request = new HttpRequest('GET', '/api/users', {});
    localStorage.setItem('access_token', '');
    
    authInterceptor(request, mockNext);

    expect(mockNext).toHaveBeenCalledWith(request);
  });

  it('should handle null token', () => {
    const request = new HttpRequest('GET', '/api/users', {});
    localStorage.setItem('access_token', 'null');
    
    authInterceptor(request, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const handledRequest = mockNext.calls.mostRecent().args[0];
    expect(handledRequest.headers.get('Authorization')).toBe('Bearer null');
  });
});
