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
    // Auto-initialize to check for existing tokens
    this.initializeAuth();
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

  private handleError = (error: any): Observable<never> => {
    console.error('Auth Service Error:', error);
    
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let userFriendly = true;
    
    if (error.error) {
      // Handle structured error responses from the backend
      if (error.error.errors && Array.isArray(error.error.errors)) {
        // Multiple validation errors
        errorMessage = error.error.errors.map((err: any) => err.message || err).join(', ');
      } else if (error.error.message) {
        // Single error message
        errorMessage = error.error.message;
      } else if (error.error.error) {
        // Nested error object
        errorMessage = error.error.error;
      }
    } else if (error.message) {
      // Handle network or other errors
      if (error.message.includes('Network Error') || error.message.includes('Http failure response')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else {
        errorMessage = error.message;
      }
    } else if (error.status) {
      // Handle HTTP status codes
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your input and try again.';
          break;
        case 401:
          errorMessage = 'Invalid credentials. Please check your email and password.';
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          break;
        case 409:
          errorMessage = 'A user with this email already exists.';
          break;
        case 422:
          errorMessage = 'Validation failed. Please check your input and try again.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 503:
          errorMessage = 'Service temporarily unavailable. Please try again later.';
          break;
        default:
          errorMessage = `Request failed with status ${error.status}. Please try again.`;
      }
    }
    
    // Preserve the original error structure but add user-friendly message
    const enhancedError = {
      ...error, // Preserve original error properties
      message: errorMessage,
      timestamp: new Date().toISOString(),
      userFriendly: true
    };
    return throwError(() => enhancedError);
  };

  public initializeAuth(): void {
    if (this.isInitialized) {
      return;
    }

    console.log('AuthService: Initializing authentication...');
    
    // Check if we have a valid access token
    const accessToken = this.tokenService.getAccessToken();
    const userData = this.tokenService.getUserData();
    
    if (accessToken && userData && !this.tokenService.isTokenExpired(accessToken)) {
      console.log('AuthService: Valid token found, restoring user session');
      this.currentUserSubject.next(userData);
    } else if (accessToken && this.tokenService.shouldRefreshToken()) {
      console.log('AuthService: Token needs refresh, attempting to refresh...');
      this.refreshTokenInternal();
    } else if (accessToken && this.tokenService.isTokenExpired(accessToken)) {
      console.log('AuthService: Token expired, clearing session');
      this.logout();
    } else if (accessToken && !this.tokenService.isTokenExpired(accessToken)) {
      // Token exists and is valid, but no user data - fetch user profile
      console.log('AuthService: Valid token found, fetching user profile');
      this.getCurrentUser().subscribe({
        next: (user) => {
          console.log('AuthService: User profile loaded successfully');
        },
        error: (error) => {
          console.error('AuthService: Failed to load user profile:', error);
          this.logout();
        }
      });
    }
    
    this.isInitialized = true;
  }

  // Public method for external token refresh
  public refreshToken(): Observable<any> {
    return this.tokenService.refreshAccessToken().pipe(
      tap(response => {
        console.log('AuthService: Token refreshed successfully');
        // Token is already set in the service, just restore user data
        const userData = this.tokenService.getUserData();
        if (userData) {
          this.currentUserSubject.next(userData);
        }
      }),
      catchError(error => {
        console.error('AuthService: Token refresh failed:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  private refreshTokenInternal(): void {
    this.tokenService.refreshAccessToken().subscribe({
      next: (response) => {
        console.log('AuthService: Token refreshed successfully');
        // Token is already set in the service, just restore user data
        const userData = this.tokenService.getUserData();
        if (userData) {
          this.currentUserSubject.next(userData);
        }
      },
      error: (error) => {
        console.error('AuthService: Token refresh failed:', error);
        this.logout();
      }
    });
  }
}
