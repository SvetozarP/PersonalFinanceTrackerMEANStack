import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Observable } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

import { LoginComponent } from './login';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../../../core/models/auth.models';
import { mockRouter } from '../../../../test-setup';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockUser = {
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
    password: 'password123',
    rememberMe: false
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = { ...mockRouter };
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { url: [] },
      url: of([])
    });

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    
    // Trigger component initialization
    fixture.detectChanges();
  });

  beforeEach(() => {
    // Reset spies before each test
    router.navigate.calls.reset();
    authService.login.calls.reset();
    snackBar.open.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize form with default values', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
      expect(component.loginForm.get('rememberMe')?.value).toBe(false);
    });

    it('should set initial loading state to false', () => {
      expect(component.isFormLoading).toBe(false);
    });

    it('should set initial password visibility to hidden', () => {
      expect(component.hidePassword).toBe(true);
    });
  });

  describe('form validation', () => {
    it('should validate required fields', () => {
      const form = component.loginForm;
      
      expect(form.valid).toBe(false);
      
      form.patchValue({ email: 'test@example.com' });
      expect(form.valid).toBe(false);
      
      form.patchValue({ password: 'password123' });
      expect(form.valid).toBe(true);
    });

    it('should validate email format', () => {
      const emailControl = component.loginForm.get('email');
      
      emailControl?.setValue('invalid-email');
      expect(emailControl?.errors?.['email']).toBeTruthy();
      
      emailControl?.setValue('valid@email.com');
      expect(emailControl?.errors?.['email']).toBeFalsy();
    });

    it('should validate password is required', () => {
      const passwordControl = component.loginForm.get('password');
      
      passwordControl?.setValue('');
      expect(passwordControl?.errors?.['required']).toBeTruthy();
      
      passwordControl?.setValue('password123');
      expect(passwordControl?.errors?.['required']).toBeFalsy();
    });

    it('should mark form as invalid when fields are empty', () => {
      const form = component.loginForm;
      
      form.patchValue({ email: '', password: '' });
      expect(form.valid).toBe(false);
    });

    it('should mark form as valid when all required fields are filled', () => {
      const form = component.loginForm;
      
      form.patchValue({ email: 'test@example.com', password: 'password123' });
      expect(form.valid).toBe(true);
    });
  });

  describe('form submission', () => {
    it('should submit when form is valid', () => {
      const form = component.loginForm;
      form.patchValue(mockLoginRequest);
      
      authService.login.and.returnValue(of({ user: mockUser, tokens: { accessToken: 'token', refreshToken: '' } }));
      
      component.onSubmit();
      
      expect(authService.login).toHaveBeenCalledWith(mockLoginRequest);
    });

    it('should set loading state during submission', (done) => {
      const form = component.loginForm;
      form.patchValue(mockLoginRequest);
      
      // Mock slow login using delayed Observable
      authService.login.and.returnValue(new Observable(observer => {
        setTimeout(() => {
          observer.next({ user: mockUser, tokens: { accessToken: 'token', refreshToken: '' } });
          observer.complete();
        }, 100);
      }));
      
      component.onSubmit();
      
      // Check that loading state was set to true
      expect(component.isSubmitting).toBe(true);
      
      // Wait for completion
      setTimeout(() => {
        expect(component.isSubmitting).toBe(false);
        done();
      }, 150);
    });

    it('should not submit when form is invalid', () => {
      const form = component.loginForm;
      form.patchValue({ email: 'test@example.com' }); // Missing password
      
      component.onSubmit();
      
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should handle successful login with remember me checked', () => {
      const form = component.loginForm;
      form.patchValue({ ...mockLoginRequest, rememberMe: true });
      
      authService.login.and.returnValue(of({ user: mockUser, tokens: { accessToken: 'token', refreshToken: '' } }));
      
      component.onSubmit();
      
      expect(authService.login).toHaveBeenCalledWith({ ...mockLoginRequest, rememberMe: true });
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(snackBar.open).toHaveBeenCalledWith('Login successful!', 'Close', jasmine.any(Object));
    });
  });

  describe('error handling', () => {
    it('should handle login errors with detailed error messages', () => {
      const form = component.loginForm;
      form.patchValue(mockLoginRequest);
      
      const errorResponse = {
        error: {
          errors: ['Invalid credentials', 'Account locked']
        }
      };
      
      authService.login.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(snackBar.open).toHaveBeenCalledWith('Invalid credentials, Account locked', 'Close', jasmine.any(Object));
    });

    it('should handle login errors with error message', () => {
      const form = component.loginForm;
      form.patchValue(mockLoginRequest);
      
      const errorResponse = {
        error: {
          message: 'Authentication failed'
        }
      };
      
      authService.login.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(snackBar.open).toHaveBeenCalledWith('Authentication failed', 'Close', jasmine.any(Object));
    });

    it('should handle login errors with generic error message', () => {
      const form = component.loginForm;
      form.patchValue(mockLoginRequest);
      
      const errorResponse = {
        message: 'Network error'
      };
      
      authService.login.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(snackBar.open).toHaveBeenCalledWith('Network error', 'Close', jasmine.any(Object));
    });

    it('should handle login errors with fallback message', () => {
      const form = component.loginForm;
      form.patchValue(mockLoginRequest);
      
      const errorResponse = {};
      
      authService.login.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(snackBar.open).toHaveBeenCalledWith('Login failed. Please try again.', 'Close', jasmine.any(Object));
    });

    it('should reset loading state on error', () => {
      const form = component.loginForm;
      form.patchValue(mockLoginRequest);
      
      authService.login.and.returnValue(throwError(() => ({})));
      
      component.onSubmit();
      
      expect(component.isSubmitting).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete login flow', () => {
      const form = component.loginForm;
      form.patchValue(mockLoginRequest);
      
      authService.login.and.returnValue(of({ user: mockUser, tokens: { accessToken: 'token', refreshToken: '' } }));
      
      component.onSubmit();
      
      expect(authService.login).toHaveBeenCalledWith(mockLoginRequest);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(snackBar.open).toHaveBeenCalledWith('Login successful!', 'Close', jasmine.any(Object));
    });

    it('should handle login error flow', () => {
      const form = component.loginForm;
      form.patchValue(mockLoginRequest);
      
      authService.login.and.returnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
      
      component.onSubmit();
      
      expect(authService.login).toHaveBeenCalledWith(mockLoginRequest);
      expect(router.navigate).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Invalid credentials', 'Close', jasmine.any(Object));
    });
  });

  describe('edge cases', () => {
    it('should handle form with only email filled', () => {
      const form = component.loginForm;
      form.patchValue({ email: 'test@example.com', password: '' });
      
      component.onSubmit();
      
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should handle form with only password filled', () => {
      const form = component.loginForm;
      form.patchValue({ email: '', password: 'password123' });
      
      component.onSubmit();
      
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should handle form with invalid email format', () => {
      const form = component.loginForm;
      form.patchValue({ email: 'invalid-email', password: 'password123' });
      
      component.onSubmit();
      
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should handle rapid form submissions', (done) => {
      const form = component.loginForm;
      form.patchValue(mockLoginRequest);
      
      // Mock slow login using delayed Observable
      authService.login.and.returnValue(new Observable(observer => {
        setTimeout(() => {
          observer.next({ user: mockUser, tokens: { accessToken: 'token', refreshToken: '' } });
          observer.complete();
        }, 100);
      }));
      
      // Submit multiple times rapidly
      component.onSubmit();
      component.onSubmit();
      component.onSubmit();
      
      // Should only call login service once due to loading state
      expect(authService.login).toHaveBeenCalledTimes(1);
      
      setTimeout(() => {
        done();
      }, 150);
    });
  });

  describe('lifecycle', () => {
    it('should complete destroy$ subject on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should not throw error if destroy$ is already completed', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      // Complete the subject first
      component['destroy$'].complete();
      
      // Should not throw error
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
