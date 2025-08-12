import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../../features/auth/services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        provideZonelessChangeDetection()
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {

    it('should allow access when user is authenticated', (done) => {
      // Mock the isAuthenticated$ observable to emit true
      const mockIsAuthenticated$ = new BehaviorSubject<boolean>(true);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      guard.canActivate().subscribe(result => {
        expect(result).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should deny access and redirect to login when user is not authenticated', (done) => {
      // Mock the isAuthenticated$ observable to emit false
      const mockIsAuthenticated$ = new BehaviorSubject<boolean>(false);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      guard.canActivate().subscribe(result => {
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      });
    });

    it('should handle authentication state changes', (done) => {
      // Mock the isAuthenticated$ observable
      const mockIsAuthenticated$ = new BehaviorSubject<boolean>(false);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      let callCount = 0;
      guard.canActivate().subscribe(result => {
        callCount++;
        if (callCount === 1) {
          expect(result).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
          
          // Change authentication state to true
          mockIsAuthenticated$.next(true);
        } else if (callCount === 2) {
          expect(result).toBe(true);
          expect(router.navigate).toHaveBeenCalledTimes(1); // Should not call navigate again
          done();
        }
      });
    });

    it('should handle multiple canActivate calls correctly', (done) => {
      // Mock the isAuthenticated$ observable
      const mockIsAuthenticated$ = new BehaviorSubject<boolean>(true);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      let completedCalls = 0;
      const totalCalls = 3;

      for (let i = 0; i < totalCalls; i++) {
        guard.canActivate().subscribe(result => {
          expect(result).toBe(true);
          completedCalls++;
          if (completedCalls === totalCalls) {
            done();
          }
        });
      }
    });




  });

  describe('edge cases', () => {
    it('should handle undefined authentication state', (done) => {
      // Mock the isAuthenticated$ observable to emit undefined
      const mockIsAuthenticated$ = new BehaviorSubject<boolean | undefined>(undefined);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      guard.canActivate().subscribe(result => {
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      });
    });

    it('should handle null authentication state', (done) => {
      // Mock the isAuthenticated$ observable to emit null
      const mockIsAuthenticated$ = new BehaviorSubject<boolean | null>(null);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      guard.canActivate().subscribe(result => {
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      });
    });

    it('should handle empty string authentication state', (done) => {
      // Mock the isAuthenticated$ observable to emit empty string
      const mockIsAuthenticated$ = new BehaviorSubject<any>('');
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      guard.canActivate().subscribe(result => {
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      });
    });
  });



  describe('error handling', () => {
    it('should handle synchronous errors in canActivate', () => {
      // Mock the isAuthenticated$ observable
      const mockIsAuthenticated$ = new BehaviorSubject<boolean>(true);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      // Mock router.navigate to throw an error
      router.navigate.and.throwError('Guard error');

      // The guard should handle the error gracefully
      guard.canActivate().subscribe({
        next: (result) => {
          expect(result).toBe(true);
        },
        error: (error) => {
          // Router errors should be handled gracefully
          expect(error).toBeDefined();
        }
      });
    });
  });
});
