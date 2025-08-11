import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse, TokenResponse } from '../../../core/models/auth.models';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));
  private isInitialized = false;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) {
    console.log('AuthService: Constructor called');
    // Don't auto-initialize in constructor to avoid multiple calls
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      map(response => {
        // Transform backend response to match AuthResponse interface
        const authResponse: AuthResponse = {
          user: response.data.user,
          tokens: {
            accessToken: response.data.accessToken,
            refreshToken: '' // Refresh token is handled by HTTP-only cookie
          }
        };
        
        // Set only the access token (refresh token is in HTTP-only cookie)
        if (authResponse.tokens.accessToken) {
          this.tokenService.setAccessToken(authResponse.tokens.accessToken);
          // Store complete user data in localStorage for persistence
          this.tokenService.setUserData(authResponse.user);
          this.currentUserSubject.next(authResponse.user);
        }
        
        return authResponse;
      }),
      catchError(this.handleError)
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, userData).pipe(
      map(response => {
        // Transform backend response to match AuthResponse interface
        const authResponse: AuthResponse = {
          user: response.data.user,
          tokens: {
            accessToken: response.data.accessToken || '',
            refreshToken: '' // Refresh token is handled by HTTP-only cookie
          }
        };
        
        // Set only the access token (refresh token is in HTTP-only cookie)
        if (authResponse.tokens.accessToken) {
          this.tokenService.setAccessToken(authResponse.tokens.accessToken);
          // Store complete user data in localStorage for persistence
          this.tokenService.setUserData(authResponse.user);
          this.currentUserSubject.next(authResponse.user);
        }
        
        return authResponse;
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    try {
      this.tokenService.clearAccessToken();
      this.tokenService.clearUserData(); // Clear user data on logout
      this.currentUserSubject.next(null);
      // Use a more robust navigation approach
      if (this.router) {
        this.router.navigate(['/auth/login']).catch(err => {
          console.error('Navigation error:', err);
          // Fallback: reload the page to go to login
          window.location.href = '/auth/login';
        });
      } else {
        // Fallback if router is not available
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear tokens and reload
      this.tokenService.clearAccessToken();
      this.tokenService.clearUserData(); // Clear user data on logout
      this.currentUserSubject.next(null);
      window.location.href = '/auth/login';
    }
  }

  refreshToken(): Observable<any> {
    // Refresh token is automatically sent via HTTP-only cookie
    return this.http.post<any>(`${environment.apiUrl}/auth/refresh-token`, {}).pipe(
      map(response => {
        // Backend returns { success: true, data: { accessToken } }
        return response.data.accessToken;
      }),
      tap(accessToken => {
        // Only update the access token (refresh token remains in HTTP-only cookie)
        this.tokenService.setAccessToken(accessToken);
      }),
      catchError(this.handleError)
    );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<any>(`${environment.apiUrl}/auth/profile`).pipe(
      map(response => {
        // Backend returns { success: true, data: { userId } }
        // For now, create a minimal user object with the userId
        // TODO: Implement proper user profile endpoint that returns full user data
        
        // Try to get stored user data first
        const storedUser = this.tokenService.getUserData();
        
        if (storedUser && storedUser._id === response.data.userId) {
          // Use stored user data if it matches the userId from backend
          console.log('AuthService: Using stored user data for profile');
          return storedUser;
        }
        
        // Fallback: create minimal user object with the userId
        const user: User = {
          _id: response.data.userId,
          email: storedUser?.email || '', // Use stored email if available
          firstName: storedUser?.firstName || '', // Use stored firstName if available
          lastName: storedUser?.lastName || '', // Use stored lastName if available
          isActive: true,
          createdAt: storedUser?.createdAt || new Date(),
          updatedAt: storedUser?.updatedAt || new Date()
        };
        
        // Update stored user data with the new userId if it's different
        if (!storedUser || storedUser._id !== response.data.userId) {
          this.tokenService.setUserData(user);
        }
        
        return user;
      }),
      tap(user => this.currentUserSubject.next(user)),
      catchError(this.handleError)
    );
  }

  public initializeAuth(): void {
    if (this.isInitialized) {
      console.log('AuthService: Already initialized, skipping');
      return;
    }
    
    console.log('AuthService: Initializing auth service');
    this.isInitialized = true;
    
    const token = this.tokenService.getAccessToken();
    console.log('AuthService: Found token:', token ? 'Yes' : 'No');
    
    if (token) {
      const isExpired = this.tokenService.isTokenExpired(token);
      console.log('AuthService: Token expired:', isExpired);
      
      if (!isExpired) {
        console.log('AuthService: Loading user profile with valid token');
        this.loadUserProfile();
      } else {
        console.log('AuthService: Token expired, attempting refresh');
        // Token exists but is expired, try to refresh it
        this.refreshToken().subscribe({
          next: (tokenResponse) => {
            console.log('AuthService: Token refreshed successfully');
            // Token refreshed successfully, now load user profile
            this.loadUserProfile();
          },
          error: (error) => {
            console.log('AuthService: Token refresh failed, clearing tokens');
            // Refresh failed, clear tokens and stay logged out
            this.tokenService.clearAccessToken();
            this.tokenService.clearUserData(); // Clear user data when token refresh fails
            this.currentUserSubject.next(null);
          }
        });
      }
    } else {
      console.log('AuthService: No token found, user remains unauthenticated');
    }
  }

  private loadUserProfile(): void {
    console.log('AuthService: Starting to load user profile');
    this.getCurrentUser().subscribe({
      next: (user) => {
        console.log('AuthService: User profile loaded successfully:', user);
        this.currentUserSubject.next(user);
      },
      error: (error) => {
        console.log('AuthService: Failed to load user profile:', error);
        // Only logout on 401 errors, other errors might be temporary
        if (error.status === 401) {
          console.log('AuthService: 401 error, clearing tokens and logging out');
          this.tokenService.clearAccessToken();
          this.tokenService.clearUserData(); // Clear user data on 401 error
          this.currentUserSubject.next(null);
        }
      }
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('Auth Service Error:', error);
    return throwError(() => error);
  }
}
