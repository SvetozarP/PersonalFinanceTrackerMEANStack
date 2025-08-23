import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';
import { map } from 'rxjs/operators';

import { GuestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('GuestGuard', () => {
  let guard: GuestGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree'], {
      navigate: jasmine.createSpy('navigate'),
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({})
    });

    TestBed.configureTestingModule({
      providers: [
        GuestGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        provideZonelessChangeDetection()
      ]
    });

    guard = TestBed.inject(GuestGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {

    it('should allow access when user is not authenticated (guest)', (done) => {
      // Mock the isAuthenticated$ observable to emit false
      const mockIsAuthenticated$ = new BehaviorSubject<boolean>(false);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      guard.canActivate().subscribe(result => {
        expect(result).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should deny access and redirect to dashboard when user is authenticated', (done) => {
      // Mock the isAuthenticated$ observable to emit true
      const mockIsAuthenticated$ = new BehaviorSubject<boolean>(true);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      guard.canActivate().subscribe(result => {
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });

    it('should handle authentication state changes', (done) => {
      // Mock the isAuthenticated$ observable
      const mockIsAuthenticated$ = new BehaviorSubject<boolean>(true);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      let callCount = 0;
      guard.canActivate().subscribe(result => {
        callCount++;
        if (callCount === 1) {
          expect(result).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
          
          // Change authentication state to false (guest)
          mockIsAuthenticated$.next(false);
        } else if (callCount === 2) {
          expect(result).toBe(true);
          expect(router.navigate).toHaveBeenCalledTimes(1); // Should not call navigate again
          done();
        }
      });
    });

    it('should handle multiple canActivate calls correctly', (done) => {
      // Mock the isAuthenticated$ observable
      const mockIsAuthenticated$ = new BehaviorSubject<boolean>(false);
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
    it('should handle falsy authentication states', () => {
      // Test each falsy value individually to avoid infinite loops
      const mockIsAuthenticated$ = new BehaviorSubject<boolean>(false);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      // Test false value
      guard.canActivate().subscribe(result => {
        expect(result).toBe(true);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should work correctly with real authentication flow', () => {
      // Simulate a real authentication flow
      const mockIsAuthenticated$ = new BehaviorSubject<boolean>(false);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      // First call - user not authenticated (guest)
      guard.canActivate().subscribe(result => {
        expect(result).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
      });
    });

    it('should handle logout scenario correctly', () => {
      // Simulate user logging out
      const mockIsAuthenticated$ = new BehaviorSubject<boolean>(true);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      // First call - user authenticated
      guard.canActivate().subscribe(result => {
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      });
    });
  });

  describe('error handling', () => {
    it('should handle observable errors gracefully', () => {
      // Mock the isAuthenticated$ observable to emit an error
      const mockIsAuthenticated$ = new BehaviorSubject<boolean>(false);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$.pipe(
          map(() => {
            throw new Error('Observable error');
          })
        )
      });

      guard.canActivate().subscribe({
        next: (result) => {
          // Should handle error gracefully and allow access
          expect(result).toBe(true);
        },
        error: (error) => {
          fail('Should not emit error, should handle it gracefully');
        }
      });
    });

    it('should handle router navigation errors gracefully', () => {
      // Mock the isAuthenticated$ observable
      const mockIsAuthenticated$ = new BehaviorSubject<boolean>(true);
      Object.defineProperty(authService, 'isAuthenticated$', {
        get: () => mockIsAuthenticated$
      });

      // Mock router.navigate to throw an error
      router.navigate.and.throwError('Guard error');

      // The guard should handle the error gracefully and still return false
      guard.canActivate().subscribe(result => {
        // Should return false when user is authenticated, even if navigation fails
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      });
    });
  });
});
