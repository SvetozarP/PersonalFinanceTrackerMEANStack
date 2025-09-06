import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { provideZonelessChangeDetection } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

import { RegisterComponent } from './register';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../../../core/models/auth.models';
import { mockRouter } from '../../../../test-setup';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
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

  const mockRegisterRequest: RegisterRequest = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    password: 'Password123!'
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    const routerSpy = { ...mockRouter };
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { url: [] },
      url: of([])
    });

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
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

    fixture = TestBed.createComponent(RegisterComponent);
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
    authService.register.calls.reset();
    snackBar.open.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize form with default values', () => {
      expect(component.registerForm).toBeDefined();
      expect(component.registerForm.get('firstName')?.value).toBe('');
      expect(component.registerForm.get('lastName')?.value).toBe('');
      expect(component.registerForm.get('email')?.value).toBe('');
      expect(component.registerForm.get('password')?.value).toBe('');
      expect(component.registerForm.get('confirmPassword')?.value).toBe('');
      expect(component.registerForm.get('acceptTerms')?.value).toBe(false);
    });

    it('should set initial loading state to false', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should set initial password visibility to hidden', () => {
      expect(component.hidePassword).toBe(true);
    });
  });

  describe('form validation', () => {
    it('should validate required fields', () => {
      const form = component.registerForm;
      
      // Initially form should be invalid
      expect(form.valid).toBe(false);
      
      // Fill in required fields
      form.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        acceptTerms: true
      });
      
      expect(form.valid).toBe(true);
    });

    it('should validate email format', () => {
      const emailControl = component.registerForm.get('email');
      
      emailControl?.setValue('invalid-email');
      expect(emailControl?.errors?.['email']).toBeTruthy();
      
      emailControl?.setValue('valid@email.com');
      expect(emailControl?.errors?.['email']).toBeFalsy();
    });

    it('should validate password minimum length', () => {
      const passwordControl = component.registerForm.get('password');
      
      passwordControl?.setValue('short');
      expect(passwordControl?.errors?.['minlength']).toBeTruthy();
      
      passwordControl?.setValue('LongEnoughPassword123!');
      expect(passwordControl?.errors?.['minlength']).toBeFalsy();
    });

    it('should validate password complexity pattern', () => {
      const passwordControl = component.registerForm.get('password');
      
      passwordControl?.setValue('simplepassword');
      expect(passwordControl?.errors?.['pattern']).toBeTruthy();
      
      passwordControl?.setValue('ComplexPassword123!');
      expect(passwordControl?.errors?.['pattern']).toBeFalsy();
    });

    it('should validate password confirmation matches', () => {
      const passwordControl = component.registerForm.get('password');
      const confirmPasswordControl = component.registerForm.get('confirmPassword');
      
      passwordControl?.setValue('Password123!');
      confirmPasswordControl?.setValue('DifferentPassword123!');
      
      expect(component.registerForm.errors?.['passwordMismatch']).toBeTruthy();
      
      confirmPasswordControl?.setValue('Password123!');
      expect(component.registerForm.errors?.['passwordMismatch']).toBeFalsy();
    });

    it('should validate terms acceptance', () => {
      const termsControl = component.registerForm.get('acceptTerms');
      
      termsControl?.setValue(false);
      expect(termsControl?.errors?.['required']).toBeTruthy();
      
      termsControl?.setValue(true);
      expect(termsControl?.errors?.['required']).toBeFalsy();
    });

    it('should validate firstName minimum length', () => {
      const firstNameControl = component.registerForm.get('firstName');
      
      firstNameControl?.setValue('A');
      expect(firstNameControl?.errors?.['minlength']).toBeTruthy();
      
      firstNameControl?.setValue('John');
      expect(firstNameControl?.errors?.['minlength']).toBeFalsy();
    });

    it('should validate lastName minimum length', () => {
      const lastNameControl = component.registerForm.get('lastName');
      
      lastNameControl?.setValue('B');
      expect(lastNameControl?.errors?.['minlength']).toBeTruthy();
      
      lastNameControl?.setValue('Doe');
      expect(lastNameControl?.errors?.['minlength']).toBeFalsy();
    });
  });

  describe('form submission', () => {
    it('should submit when form is valid', () => {
      // Fill in valid form data
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      // Mock successful registration
      authService.register.and.returnValue(of({ user: mockUser, tokens: { accessToken: 'token', refreshToken: '' } }));
      
      component.onSubmit();
      
      expect(authService.register).toHaveBeenCalledWith(mockRegisterRequest);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should not submit when form is invalid', () => {
      // Leave form invalid
      component.onSubmit();
      
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should set loading state during submission', () => {
      // Fill in valid form data
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      // Mock successful registration
      authService.register.and.returnValue(of({ user: mockUser, tokens: { accessToken: 'token', refreshToken: '' } }));
      
      component.onSubmit();
      
      // Check that loading state was set and then cleared
      expect(authService.register).toHaveBeenCalledWith(mockRegisterRequest);
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('password strength', () => {
    it('should return correct strength class for weak passwords', () => {
      component.registerForm.patchValue({ password: 'weak' });
      expect(component.getPasswordStrengthClass()).toBe('weak');
      
      component.registerForm.patchValue({ password: 'Weak1' });
      expect(component.getPasswordStrengthClass()).toBe('weak');
    });

    it('should return correct strength class for medium passwords', () => {
      component.registerForm.patchValue({ password: 'Medium1!' });
      expect(component.getPasswordStrengthClass()).toBe('medium');
    });

    it('should return correct strength class for strong passwords', () => {
      component.registerForm.patchValue({ password: 'VeryStrongPassword123!' });
      expect(component.getPasswordStrengthClass()).toBe('strong');
    });

    it('should return empty string for empty password', () => {
      component.registerForm.patchValue({ password: '' });
      expect(component.getPasswordStrengthClass()).toBe('');
    });

    it('should return correct strength text', () => {
      component.registerForm.patchValue({ password: 'weak' });
      expect(component.getPasswordStrengthText()).toBe('Password must be at least 8 characters');
      
      component.registerForm.patchValue({ password: 'Medium1!' });
      expect(component.getPasswordStrengthText()).toBe('Medium strength password');
      
      component.registerForm.patchValue({ password: 'VeryStrongPassword123!' });
      expect(component.getPasswordStrengthText()).toBe('Strong password');
    });
  });

  describe('password matching validation', () => {
    it('should validate password confirmation matches', () => {
      const passwordControl = component.registerForm.get('password');
      const confirmPasswordControl = component.registerForm.get('confirmPassword');
      
      passwordControl?.setValue('Password123!');
      confirmPasswordControl?.setValue('Password123!');
      
      expect(component.registerForm.errors?.['passwordMismatch']).toBeFalsy();
    });

    it('should handle password matching with empty confirm password', () => {
      const passwordControl = component.registerForm.get('password');
      const confirmPasswordControl = component.registerForm.get('confirmPassword');
      
      passwordControl?.setValue('Password123!');
      confirmPasswordControl?.setValue('');
      
      expect(component.registerForm.errors?.['passwordMismatch']).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle form with only some fields filled', () => {
      component.registerForm.patchValue({
        firstName: 'John',
        email: 'test@example.com'
        // Missing other required fields
      });
      
      expect(component.registerForm.valid).toBe(false);
    });

    it('should handle password mismatch', () => {
      component.registerForm.patchValue({
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!'
      });
      
      expect(component.registerForm.errors?.['passwordMismatch']).toBeTruthy();
    });

    it('should handle weak password', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('weak');
      
      expect(passwordControl?.errors?.['pattern']).toBeTruthy();
    });

    it('should handle rapid form submissions', () => {
      // Fill in valid form data
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      // Mock successful registration with a delayed observable to test guard logic
      authService.register.and.returnValue(timer(10).pipe(
        map(() => ({ user: mockUser, tokens: { accessToken: 'token', refreshToken: '' } }))
      ));
      
      // Submit multiple times rapidly
      component.onSubmit();
      component.onSubmit();
      component.onSubmit();
      
      // Should only call service once due to loading state protection
      expect(authService.register).toHaveBeenCalledTimes(1);
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
      component.ngOnDestroy();
      
      // Should not throw error on second call
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle registration errors with error message', () => {
      // Fill in valid form data
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      // Mock error response
      const errorResponse = { error: { message: 'Email already exists' } };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(component.isLoading).toBeFalse();
      expect(snackBar.open).toHaveBeenCalledWith('Email already exists', 'Close', jasmine.any(Object));
    });

    it('should handle registration errors with detailed error messages', () => {
      // Fill in valid form data
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      // Mock error response with detailed errors
      const errorResponse = {
        error: {
          errors: [
            { field: 'email', message: 'Email is invalid' },
            { field: 'password', message: 'Password too weak' }
          ]
        }
      };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(component.isLoading).toBeFalse();
      expect(snackBar.open).toHaveBeenCalledWith('Email is invalid, Password too weak', 'Close', jasmine.any(Object));
    });

    it('should handle registration errors with fallback message', () => {
      // Fill in valid form data
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      // Mock error response with no message
      const errorResponse = { error: {} };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(component.isLoading).toBeFalse();
      expect(snackBar.open).toHaveBeenCalledWith('Registration failed. Please try again.', 'Close', jasmine.any(Object));
    });

    it('should handle registration errors with generic message', () => {
      // Fill in valid form data
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      // Mock error response with status
      const errorResponse = { status: 500 };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(component.isLoading).toBeFalse();
      expect(snackBar.open).toHaveBeenCalledWith('Registration failed. Please try again.', 'Close', jasmine.any(Object));
    });

    it('should reset loading state on error', () => {
      // Fill in valid form data
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      // Mock error response
      authService.register.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));
      
      component.onSubmit();
      
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete registration flow', () => {
      // Fill in valid form data
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      // Mock successful registration
      authService.register.and.returnValue(of({ user: mockUser, tokens: { accessToken: 'token', refreshToken: '' } }));
      
      component.onSubmit();
      
      expect(authService.register).toHaveBeenCalledWith(mockRegisterRequest);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(snackBar.open).toHaveBeenCalledWith('Account created successfully!', 'Close', jasmine.any(Object));
    });

    it('should handle registration error flow', () => {
      // Fill in valid form data
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      // Mock error response
      const errorResponse = { error: { message: 'Email already exists' } };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(component.isLoading).toBeFalse();
      expect(snackBar.open).toHaveBeenCalledWith('Email already exists', 'Close', jasmine.any(Object));
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
