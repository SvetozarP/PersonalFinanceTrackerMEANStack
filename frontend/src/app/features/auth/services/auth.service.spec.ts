import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError, firstValueFrom } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';

import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { environment } from '../../../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../../../core/models/auth.models';


describe('AuthService', () => {
  let service: AuthService;
  let tokenService: jasmine.SpyObj<TokenService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser: User = {
    _id: 'user123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockLoginRequest: LoginRequest = {
    email: 'test@example.com',
    password: 'password123'
  };

  const mockRegisterRequest: RegisterRequest = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    password: 'Password123!'
  };

  const mockAuthResponse: AuthResponse = {
    user: mockUser,
    tokens: {
      accessToken: 'access-token-123',
      refreshToken: ''
    }
  };

  beforeEach(() => {
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', [
      'setAccessToken',
      'setUserData',
      'getAccessToken',
      'getUserData',
      'clearAccessToken',
      'clearUserData',
      'clearTokens',
      'isTokenExpired',
      'shouldRefreshToken',
      'refreshAccessToken'
    ]);
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        { provide: TokenService, useValue: tokenServiceSpy },
        { provide: Router, useValue: routerSpy },
        provideZonelessChangeDetection(),
        // Override the global HttpClient to use our test HttpClient
        { provide: HttpClient, useValue: jasmine.createSpyObj('HttpClient', ['post', 'get']) }
      ]
    }).compileComponents();

    // Set up default spy behavior before creating the service
    tokenServiceSpy.getAccessToken.and.returnValue(null);
    tokenServiceSpy.getUserData.and.returnValue(null);
    tokenServiceSpy.isTokenExpired.and.returnValue(false);
    tokenServiceSpy.shouldRefreshToken.and.returnValue(false);

    const httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    service = new AuthService(httpClient, tokenServiceSpy, routerSpy);
    tokenService = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    // Reset the service after setting up spies to prevent constructor initialization from interfering
    (service as any).isInitialized = false;
  });



  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should successfully login user and store tokens', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-123'
        }
      };

      const httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
      httpClient.post.and.returnValue(of(mockResponse));

      const response = await firstValueFrom(service.login(mockLoginRequest));
      
      expect(httpClient.post).toHaveBeenCalledWith(`${environment.apiUrl}/auth/login`, mockLoginRequest);
      expect(response).toEqual(mockAuthResponse);
      expect(tokenService.setAccessToken).toHaveBeenCalledWith('access-token-123');
      expect(tokenService.setUserData).toHaveBeenCalledWith(mockUser);
    });

    it('should handle login errors', async () => {
      const errorResponse = {
        status: 401,
        error: { message: 'Invalid credentials' }
      };

      const httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
      httpClient.post.and.returnValue(throwError(() => errorResponse));

      try {
        await firstValueFrom(service.login(mockLoginRequest));
        fail('should have failed');
      } catch (error: any) {
        expect(error.status).toBe(401);
        expect(error.error.message).toBe('Invalid credentials');
      }
    });
  });

  describe('register', () => {
    it('should successfully register user and store tokens', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: 'access-token-123'
        }
      };

      const httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
      httpClient.post.and.returnValue(of(mockResponse));

      const response = await firstValueFrom(service.register(mockRegisterRequest));
      
      expect(httpClient.post).toHaveBeenCalledWith(`${environment.apiUrl}/auth/register`, mockRegisterRequest);
      expect(response).toEqual(mockAuthResponse);
      expect(tokenService.setAccessToken).toHaveBeenCalledWith('access-token-123');
      expect(tokenService.setUserData).toHaveBeenCalledWith(mockUser);
    });

    it('should handle registration errors', async () => {
      const errorResponse = {
        status: 400,
        error: { message: 'Email already exists' }
      };

      const httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
      httpClient.post.and.returnValue(throwError(() => errorResponse));

      try {
        await firstValueFrom(service.register(mockRegisterRequest));
        fail('should have failed');
      } catch (error: any) {
        expect(error.status).toBe(400);
        expect(error.error.message).toBe('Email already exists');
      }
    });
  });

  describe('logout', () => {
    it('should clear tokens and navigate to login', () => {
      service.logout();

      expect(tokenService.clearAccessToken).toHaveBeenCalled();
      expect(tokenService.clearUserData).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    // TODO: This test is difficult to run in browser environment due to window.location being read-only
    // The test verifies that the service handles router navigation errors gracefully
    // In production, this would fall back to window.location.href = '/auth/login'
    // Skipping this test for now as it causes page reload issues in test environment
    xit('should handle router navigation errors gracefully', () => {
      router.navigate.and.returnValue(Promise.reject('Navigation error'));
      
      // The service should not throw an error when router navigation fails
      expect(() => service.logout()).not.toThrow();
      
      // Verify that token service methods are called
      expect(tokenService.clearAccessToken).toHaveBeenCalled();
      expect(tokenService.clearUserData).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const mockResponse = {
        accessToken: 'new-access-token-123'
      };

      tokenService.refreshAccessToken.and.returnValue(of(mockResponse));

      const response = await firstValueFrom(service.refreshToken());
      
      expect(tokenService.refreshAccessToken).toHaveBeenCalled();
      expect(response).toEqual(mockResponse);
    });

    it('should handle refresh token errors', async () => {
      const errorResponse = {
        status: 401,
        error: { message: 'Invalid refresh token' }
      };

      tokenService.refreshAccessToken.and.returnValue(throwError(() => errorResponse));

      try {
        await firstValueFrom(service.refreshToken());
        fail('should have failed');
      } catch (error: any) {
        expect(error.status).toBe(401);
      }
    });
  });

  describe('getCurrentUser', () => {
    it('should return user profile from backend', async () => {
      const mockResponse = {
        success: true,
        data: { userId: 'user123' }
      };

      tokenService.getUserData.and.returnValue(mockUser);

      const httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
      httpClient.get.and.returnValue(of(mockResponse));

      const user = await firstValueFrom(service.getCurrentUser());
      
      expect(httpClient.get).toHaveBeenCalledWith(`${environment.apiUrl}/auth/profile`);
      expect(user).toBeTruthy();
      if (user) {
        expect(user._id).toBe('user123');
        expect(user.email).toBe('test@example.com');
      }
    });

    it('should create minimal user object when no stored data', async () => {
      const mockResponse = {
        success: true,
        data: { userId: 'user123' }
      };

      tokenService.getUserData.and.returnValue(null);

      const httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
      httpClient.get.and.returnValue(of(mockResponse));

      const user = await firstValueFrom(service.getCurrentUser());
      
      expect(httpClient.get).toHaveBeenCalledWith(`${environment.apiUrl}/auth/profile`);
      expect(user).toBeTruthy();
      if (user) {
        expect(user._id).toBe('user123');
        expect(user.email).toBe('');
        expect(user.firstName).toBe('');
        expect(user.lastName).toBe('');
      }
    });

    it('should handle profile fetch errors', async () => {
      const errorResponse = {
        status: 401,
        error: { message: 'Unauthorized' }
      };

      const httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
      httpClient.get.and.returnValue(throwError(() => errorResponse));

      try {
        await firstValueFrom(service.getCurrentUser());
        fail('should have failed');
      } catch (error: any) {
        expect(error.status).toBe(401);
      }
    });
  });

  describe('initializeAuth', () => {
    beforeEach(() => {
      // Reset spy call counts before each test
      tokenService.getAccessToken.calls.reset();
      tokenService.getUserData.calls.reset();
      tokenService.isTokenExpired.calls.reset();
      tokenService.shouldRefreshToken.calls.reset();
    });

    it('should initialize auth service only once', () => {
      // Reset the initialization flag to test the logic
      (service as any).isInitialized = false;
      
      service.initializeAuth();
      service.initializeAuth(); // Second call should be ignored

      // The first call should work, the second should be ignored
      expect(tokenService.getAccessToken).toHaveBeenCalledTimes(1);
    });

    it('should load user profile when valid token exists but no user data', () => {
      tokenService.getAccessToken.and.returnValue('valid-token');
      tokenService.isTokenExpired.and.returnValue(false);
      tokenService.getUserData.and.returnValue(null); // No user data
      tokenService.shouldRefreshToken.and.returnValue(false); // Token doesn't need refresh
      
      // Spy on the private method indirectly by checking if getCurrentUser is called
      spyOn(service, 'getCurrentUser').and.returnValue(of(mockUser));

      service.initializeAuth();
      
      // The service should call getCurrentUser when there's a valid token but no user data
      expect(service.getCurrentUser).toHaveBeenCalled();
    });

    it('should not load user profile when valid token and user data exist', () => {
      tokenService.getAccessToken.and.returnValue('valid-token');
      tokenService.isTokenExpired.and.returnValue(false);
      tokenService.getUserData.and.returnValue(mockUser); // User data exists
      tokenService.shouldRefreshToken.and.returnValue(false); // Token doesn't need refresh
      
      spyOn(service, 'getCurrentUser').and.returnValue(of(mockUser));

      service.initializeAuth();
      
      expect(service.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should attempt token refresh when token is expired', () => {
      tokenService.getAccessToken.and.returnValue('expired-token');
      tokenService.shouldRefreshToken.and.returnValue(true);
      spyOn(service as any, 'refreshTokenInternal').and.stub();

      service.initializeAuth();
      
      // The service should call refreshTokenInternal when shouldRefreshToken returns true
      expect((service as any).refreshTokenInternal).toHaveBeenCalled();
    });

    it('should clear tokens when refresh fails', (done) => {
      tokenService.getAccessToken.and.returnValue('expired-token');
      tokenService.shouldRefreshToken.and.returnValue(true);
      
      // Mock the tokenService.refreshAccessToken to return an error
      tokenService.refreshAccessToken.and.returnValue(throwError(() => new Error('Refresh failed')));

      service.initializeAuth();
      
      // Wait for the async operation to complete
      setTimeout(() => {
        // The error should be handled gracefully - the service should call logout which clears tokens
        expect(tokenService.clearAccessToken).toHaveBeenCalled();
        expect(tokenService.clearUserData).toHaveBeenCalled();
        done();
      }, 200);
    });

    it('should not initialize when no token exists', () => {
      tokenService.getAccessToken.and.returnValue(null);

      service.initializeAuth();

      expect(tokenService.isTokenExpired).not.toHaveBeenCalled();
    });
  });

  describe('observables', () => {
    it('should emit current user changes', async () => {
      service['currentUserSubject'].next(mockUser);
      
      const user = await firstValueFrom(service.currentUser$);
      expect(user).toEqual(mockUser);
    });

    it('should emit authentication status changes', async () => {
      service['currentUserSubject'].next(mockUser);
      
      const isAuthenticated = await firstValueFrom(service.isAuthenticated$);
      expect(isAuthenticated).toBe(true);
    });
  });
});
