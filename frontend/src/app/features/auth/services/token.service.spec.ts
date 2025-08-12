import { TestBed, inject } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';

import { TokenService } from './token.service';
import { User } from '../../../core/models/auth.models';

describe('TokenService', () => {
  let service: TokenService;
  let platformId: Object;

  const mockUser: User = {
    _id: 'user123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockTokens = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-123'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TokenService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideZonelessChangeDetection()
      ]
    });
    service = TestBed.inject(TokenService);
    platformId = TestBed.inject(PLATFORM_ID);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('browser platform', () => {
    it('should store and retrieve tokens', () => {
      service.setTokens(mockTokens);
      
      expect(service.getAccessToken()).toBe(mockTokens.accessToken);
      expect(service.getRefreshToken()).toBe(mockTokens.refreshToken);
    });

    it('should store and retrieve access token', () => {
      service.setAccessToken(mockTokens.accessToken);
      
      expect(service.getAccessToken()).toBe(mockTokens.accessToken);
    });

    it('should store and retrieve user data', () => {
      service.setUserData(mockUser);
      
      const retrievedUser = service.getUserData();
      expect(retrievedUser).toBeTruthy();
      expect(retrievedUser?._id).toBe(mockUser._id);
      expect(retrievedUser?.email).toBe(mockUser.email);
      expect(retrievedUser?.firstName).toBe(mockUser.firstName);
      expect(retrievedUser?.lastName).toBe(mockUser.lastName);
      expect(retrievedUser?.isActive).toBe(mockUser.isActive);
      // Dates might be serialized differently, so check they exist
      expect(retrievedUser?.createdAt).toBeTruthy();
      expect(retrievedUser?.updatedAt).toBeTruthy();
    });

    it('should clear tokens', () => {
      service.setTokens(mockTokens);
      service.clearTokens();
      
      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });

    it('should clear access token', () => {
      service.setAccessToken(mockTokens.accessToken);
      service.clearAccessToken();
      
      expect(service.getAccessToken()).toBeNull();
    });

    it('should clear user data', () => {
      service.setUserData(mockUser);
      service.clearUserData();
      
      expect(service.getUserData()).toBeNull();
    });

    it('should clear all data', () => {
      service.setTokens(mockTokens);
      service.setUserData(mockUser);
      service.clearAll();
      
      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
      expect(service.getUserData()).toBeNull();
    });
  });

  describe('server platform', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          TokenService,
          { provide: PLATFORM_ID, useValue: 'server' },
          provideZonelessChangeDetection()
        ]
      });
      service = TestBed.inject(TokenService);
    });

    it('should handle server platform gracefully', () => {
      // All methods should work without throwing errors on server
      expect(() => service.setTokens(mockTokens)).not.toThrow();
      expect(() => service.setAccessToken('token')).not.toThrow();
      expect(() => service.setUserData(mockUser)).not.toThrow();
      expect(() => service.getUserData()).not.toThrow();
      expect(() => service.getAccessToken()).not.toThrow();
      expect(() => service.getRefreshToken()).not.toThrow();
      expect(() => service.clearTokens()).not.toThrow();
      expect(() => service.clearAccessToken()).not.toThrow();
      expect(() => service.clearUserData()).not.toThrow();
      expect(() => service.clearAll()).not.toThrow();
    });

    it('should return null for getters on server platform', () => {
      expect(service.getUserData()).toBeNull();
      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('token validation', () => {
    it('should return false for valid token', () => {
      // Create a token that expires in 1 hour
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;
      
      const result = service.isTokenExpired(validToken);
      
      expect(result).toBe(false);
    });

    it('should return true for expired token', () => {
      // Create a token that expired 1 hour ago
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = `header.${btoa(JSON.stringify({ exp: pastTime }))}.signature`;
      
      const result = service.isTokenExpired(expiredToken);
      
      expect(result).toBe(true);
    });

    it('should return true for invalid token format', () => {
      const invalidToken = 'invalid-token-format';
      
      const result = service.isTokenExpired(invalidToken);
      
      expect(result).toBe(true);
    });

    it('should return true for token with invalid payload', () => {
      const invalidPayloadToken = `header.${btoa('invalid-json')}.signature`;
      
      const result = service.isTokenExpired(invalidPayloadToken);
      
      expect(result).toBe(true);
    });

    it('should return false for token without exp claim', () => {
      const noExpToken = `header.${btoa(JSON.stringify({ sub: 'user123' }))}.signature`;
      
      const result = service.isTokenExpired(noExpToken);
      
      expect(result).toBe(false);
    });
  });

  describe('shouldRefreshToken', () => {
    it('should return false when no token exists', () => {
      // Clear any existing token
      service.clearAccessToken();
      
      const result = service.shouldRefreshToken();
      
      expect(result).toBe(false);
    });

    it('should return false when token expires in more than 5 minutes', () => {
      // Create a token that expires in 10 minutes
      const futureTime = Math.floor(Date.now() / 1000) + 600;
      const validToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;
      
      service.setAccessToken(validToken);
      
      const result = service.shouldRefreshToken();
      
      expect(result).toBe(false);
    });

    it('should return true when token expires in less than 5 minutes', () => {
      // Create a token that expires in 2 minutes
      const futureTime = Math.floor(Date.now() / 1000) + 120;
      const expiringToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;
      
      service.setAccessToken(expiringToken);
      
      const result = service.shouldRefreshToken();
      
      expect(result).toBe(true);
    });

    it('should return true when token is expired', () => {
      // Create a token that expired 1 minute ago
      const pastTime = Math.floor(Date.now() / 1000) - 60;
      const expiredToken = `header.${btoa(JSON.stringify({ exp: pastTime }))}.signature`;
      
      service.setAccessToken(expiredToken);
      
      const result = service.shouldRefreshToken();
      
      expect(result).toBe(true);
    });

    it('should return true when token has invalid format', () => {
      const invalidToken = 'invalid-token-format';
      
      service.setAccessToken(invalidToken);
      
      const result = service.shouldRefreshToken();
      
      expect(result).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string tokens', () => {
      expect(() => service.isTokenExpired('')).not.toThrow();
      expect(service.isTokenExpired('')).toBe(true);
    });

    it('should handle null tokens', () => {
      expect(() => service.isTokenExpired(null as any)).not.toThrow();
      expect(service.isTokenExpired(null as any)).toBe(true);
    });

    it('should handle undefined tokens', () => {
      expect(() => service.isTokenExpired(undefined as any)).not.toThrow();
      expect(service.isTokenExpired(undefined as any)).toBe(true);
    });

    it('should handle malformed JWT tokens', () => {
      const malformedToken = 'not.a.valid.jwt.token';
      
      expect(() => service.isTokenExpired(malformedToken)).not.toThrow();
      expect(service.isTokenExpired(malformedToken)).toBe(true);
    });
  });
});
