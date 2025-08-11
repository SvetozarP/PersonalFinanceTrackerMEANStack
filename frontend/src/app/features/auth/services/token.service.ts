import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../../../core/models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_DATA_KEY = 'user_data';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private getStorage(): Storage | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage;
    }
    return null;
  }

  setTokens(tokens: { accessToken: string; refreshToken: string }): void {
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
      storage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
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
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const isExpired = expirationTime < currentTime;
      
      return isExpired;
    } catch (error) {
      return true;
    }
  }

  shouldRefreshToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      // Refresh if token expires in less than 5 minutes
      return timeUntilExpiry < 5 * 60 * 1000;
    } catch {
      return true;
    }
  }
}