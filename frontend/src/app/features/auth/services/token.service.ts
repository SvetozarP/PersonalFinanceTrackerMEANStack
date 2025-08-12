import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { User } from '../../../core/models/auth.models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_DATA_KEY = 'user_data';
  
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  public refreshToken$ = this.refreshTokenSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    this.initializeRefreshToken();
  }

  private getStorage(): Storage | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage;
    }
    return null;
  }

  private initializeRefreshToken(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.refreshTokenSubject.next(refreshToken);
    }
  }

  setTokens(tokens: { accessToken: string; refreshToken: string }): void {
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
      storage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
      this.refreshTokenSubject.next(tokens.refreshToken);
    }
  }

  setAccessToken(accessToken: string): void {
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    }
  }

  setUserData(user: User): void {
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(this.USER_DATA_KEY, JSON.stringify(user));
    }
  }

  getUserData(): User | null {
    const storage = this.getStorage();
    if (storage) {
      const userData = storage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  getAccessToken(): string | null {
    const storage = this.getStorage();
    return storage ? storage.getItem(this.ACCESS_TOKEN_KEY) : null;
  }

  getRefreshToken(): string | null {
    const storage = this.getStorage();
    return storage ? storage.getItem(this.REFRESH_TOKEN_KEY) : null;
  }

  clearTokens(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(this.ACCESS_TOKEN_KEY);
      storage.removeItem(this.REFRESH_TOKEN_KEY);
      this.refreshTokenSubject.next(null);
    }
  }

  clearAccessToken(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(this.ACCESS_TOKEN_KEY);
    }
  }

  clearUserData(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(this.USER_DATA_KEY);
    }
  }

  clearAll(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(this.ACCESS_TOKEN_KEY);
      storage.removeItem(this.REFRESH_TOKEN_KEY);
      storage.removeItem(this.USER_DATA_KEY);
      this.refreshTokenSubject.next(null);
    }
  }

  isTokenExpired(token: string | null | undefined): boolean {
    // Handle null, undefined, or empty tokens
    if (!token || token.trim() === '') {
      return true;
    }

    try {
      // Check if token has the correct JWT format (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true;
      }

      // Try to decode and parse the payload
      let payload;
      try {
        const decodedPayload = atob(parts[1]);
        payload = JSON.parse(decodedPayload);
      } catch (parseError) {
        // If we can't parse the payload, consider the token invalid/expired
        return true;
      }

      // Check if payload has expiration time
      if (!payload.exp || typeof payload.exp !== 'number') {
        return false; // No expiration time means token doesn't expire
      }

      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const isExpired = expirationTime < currentTime;
      
      // Add buffer time (5 minutes) to refresh before actual expiration
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      return isExpired || (expirationTime - currentTime < bufferTime);
    } catch (error) {
      console.error('Error parsing token:', error);
      return true; // Consider invalid tokens as expired
    }
  }

  shouldRefreshToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    return this.isTokenExpired(token);
  }

  refreshAccessToken(): Observable<{ accessToken: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<{ accessToken: string }>(`${environment.apiUrl}/auth/refresh-token`, {}, {
      withCredentials: true // Include HTTP-only cookies
    }).pipe(
      tap(response => {
        if (response.accessToken) {
          this.setAccessToken(response.accessToken);
        }
      }),
      catchError(error => {
        // If refresh fails, clear all tokens
        this.clearAll();
        return throwError(() => error);
      })
    );
  }

  // Get token expiration time for debugging
  getTokenExpirationTime(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  // Check if token will expire soon (within 10 minutes)
  isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      const warningThreshold = 10 * 60 * 1000; // 10 minutes
      
      return timeUntilExpiry < warningThreshold;
    } catch (error) {
      return false;
    }
  }
}