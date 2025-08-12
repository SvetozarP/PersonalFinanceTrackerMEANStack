import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';

import { AuthInterceptor } from './auth.interceptor';
import { TokenService } from '../services/token.service';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let tokenService: jasmine.SpyObj<TokenService>;
  let mockHandler: jasmine.SpyObj<HttpHandler>;

  beforeEach(() => {
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', ['getAccessToken']);
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
  });
});
