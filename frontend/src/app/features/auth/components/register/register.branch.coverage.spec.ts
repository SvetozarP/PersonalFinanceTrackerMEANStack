import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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

describe('RegisterComponent - Branch Coverage', () => {
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

  describe('passwordMatchValidator', () => {
    it('should return null when passwords match', () => {
      const form = component.registerForm;
      form.patchValue({
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });
      
      const result = component.passwordMatchValidator(form);
      expect(result).toBeNull();
    });

    it('should return passwordMismatch error when passwords do not match', () => {
      const form = component.registerForm;
      form.patchValue({
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!'
      });
      
      const result = component.passwordMatchValidator(form);
      expect(result).toEqual({ passwordMismatch: true });
    });

    it('should return null when password control is null', () => {
      const form = component.registerForm;
      form.removeControl('password');
      
      const result = component.passwordMatchValidator(form);
      expect(result).toBeNull();
    });

    it('should return null when confirmPassword control is null', () => {
      const form = component.registerForm;
      form.removeControl('confirmPassword');
      
      const result = component.passwordMatchValidator(form);
      expect(result).toBeNull();
    });

    it('should return null when both controls are null', () => {
      const form = component.registerForm;
      form.removeControl('password');
      form.removeControl('confirmPassword');
      
      const result = component.passwordMatchValidator(form);
      expect(result).toBeNull();
    });
  });

  describe('getPasswordStrengthClass', () => {
    it('should return empty string for empty password', () => {
      component.registerForm.patchValue({ password: '' });
      expect(component.getPasswordStrengthClass()).toBe('');
    });

    it('should return empty string for null password', () => {
      component.registerForm.patchValue({ password: null });
      expect(component.getPasswordStrengthClass()).toBe('');
    });

    it('should return empty string for undefined password', () => {
      component.registerForm.patchValue({ password: undefined });
      expect(component.getPasswordStrengthClass()).toBe('');
    });

    it('should return weak for password less than 8 characters', () => {
      component.registerForm.patchValue({ password: 'weak' });
      expect(component.getPasswordStrengthClass()).toBe('weak');
    });

    it('should return weak for password with 8 characters but not complex', () => {
      component.registerForm.patchValue({ password: 'password' });
      expect(component.getPasswordStrengthClass()).toBe('weak');
    });

    it('should return weak for password with 8 characters but missing uppercase', () => {
      component.registerForm.patchValue({ password: 'password1!' });
      expect(component.getPasswordStrengthClass()).toBe('weak');
    });

    it('should return weak for password with 8 characters but missing lowercase', () => {
      component.registerForm.patchValue({ password: 'PASSWORD1!' });
      expect(component.getPasswordStrengthClass()).toBe('weak');
    });

    it('should return weak for password with 8 characters but missing number', () => {
      component.registerForm.patchValue({ password: 'Password!' });
      expect(component.getPasswordStrengthClass()).toBe('weak');
    });

    it('should return weak for password with 8 characters but missing special character', () => {
      component.registerForm.patchValue({ password: 'Password1' });
      expect(component.getPasswordStrengthClass()).toBe('weak');
    });

    it('should return medium for complex password with 8-11 characters', () => {
      component.registerForm.patchValue({ password: 'Password1!' });
      expect(component.getPasswordStrengthClass()).toBe('medium');
    });

    it('should return strong for complex password with 12+ characters', () => {
      component.registerForm.patchValue({ password: 'VeryStrongPassword123!' });
      expect(component.getPasswordStrengthClass()).toBe('strong');
    });
  });

  describe('getPasswordStrengthText', () => {
    it('should return empty string for empty password', () => {
      component.registerForm.patchValue({ password: '' });
      expect(component.getPasswordStrengthText()).toBe('');
    });

    it('should return empty string for null password', () => {
      component.registerForm.patchValue({ password: null });
      expect(component.getPasswordStrengthText()).toBe('');
    });

    it('should return empty string for undefined password', () => {
      component.registerForm.patchValue({ password: undefined });
      expect(component.getPasswordStrengthText()).toBe('');
    });

    it('should return length message for password less than 8 characters', () => {
      component.registerForm.patchValue({ password: 'weak' });
      expect(component.getPasswordStrengthText()).toBe('Password must be at least 8 characters');
    });

    it('should return complexity message for password with 8+ characters but not complex', () => {
      component.registerForm.patchValue({ password: 'password' });
      expect(component.getPasswordStrengthText()).toBe('Password must contain uppercase, lowercase, number, and special character');
    });

    it('should return medium message for complex password with 8-11 characters', () => {
      component.registerForm.patchValue({ password: 'Password1!' });
      expect(component.getPasswordStrengthText()).toBe('Medium strength password');
    });

    it('should return strong message for complex password with 12+ characters', () => {
      component.registerForm.patchValue({ password: 'VeryStrongPassword123!' });
      expect(component.getPasswordStrengthText()).toBe('Strong password');
    });
  });

  describe('isPasswordComplex', () => {
    it('should return false for password missing lowercase', () => {
      const result = component['isPasswordComplex']('PASSWORD1!');
      expect(result).toBe(false);
    });

    it('should return false for password missing uppercase', () => {
      const result = component['isPasswordComplex']('password1!');
      expect(result).toBe(false);
    });

    it('should return false for password missing number', () => {
      const result = component['isPasswordComplex']('Password!');
      expect(result).toBe(false);
    });

    it('should return false for password missing special character', () => {
      const result = component['isPasswordComplex']('Password1');
      expect(result).toBe(false);
    });

    it('should return true for password with all requirements', () => {
      const result = component['isPasswordComplex']('Password1!');
      expect(result).toBe(true);
    });

    it('should return false for empty password', () => {
      const result = component['isPasswordComplex']('');
      expect(result).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('should not submit when form is invalid', () => {
      component.registerForm.patchValue({
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        password: 'weak',
        confirmPassword: 'different',
        acceptTerms: false
      });
      
      component.onSubmit();
      
      expect(authService.register).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBe(false);
      expect(component.isLoading).toBe(false);
    });

    it('should not submit when already submitting', () => {
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      component.isSubmitting = true;
      component.onSubmit();
      
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      const markAsTouchedSpy = spyOn(component.registerForm.get('firstName')!, 'markAsTouched');
      const markAsTouchedSpy2 = spyOn(component.registerForm.get('lastName')!, 'markAsTouched');
      const markAsTouchedSpy3 = spyOn(component.registerForm.get('email')!, 'markAsTouched');
      const markAsTouchedSpy4 = spyOn(component.registerForm.get('password')!, 'markAsTouched');
      const markAsTouchedSpy5 = spyOn(component.registerForm.get('confirmPassword')!, 'markAsTouched');
      const markAsTouchedSpy6 = spyOn(component.registerForm.get('acceptTerms')!, 'markAsTouched');
      
      component.onSubmit();
      
      expect(markAsTouchedSpy).toHaveBeenCalled();
      expect(markAsTouchedSpy2).toHaveBeenCalled();
      expect(markAsTouchedSpy3).toHaveBeenCalled();
      expect(markAsTouchedSpy4).toHaveBeenCalled();
      expect(markAsTouchedSpy5).toHaveBeenCalled();
      expect(markAsTouchedSpy6).toHaveBeenCalled();
    });

    it('should handle control being null when marking as touched', () => {
      component.registerForm.removeControl('firstName');
      
      expect(() => component.onSubmit()).not.toThrow();
    });
  });

  describe('hasError', () => {
    it('should return true when field is invalid and touched', () => {
      const field = component.registerForm.get('firstName');
      field?.setValue('');
      field?.markAsTouched();
      
      expect(component.hasError('firstName')).toBe(true);
    });

    it('should return false when field is valid', () => {
      const field = component.registerForm.get('firstName');
      field?.setValue('John');
      field?.markAsTouched();
      
      expect(component.hasError('firstName')).toBe(false);
    });

    it('should return false when field is invalid but not touched', () => {
      const field = component.registerForm.get('firstName');
      field?.setValue('');
      
      expect(component.hasError('firstName')).toBe(false);
    });

    it('should return false when field does not exist', () => {
      expect(component.hasError('nonExistentField')).toBe(false);
    });

    it('should return false when field is null', () => {
      component.registerForm.removeControl('firstName');
      expect(component.hasError('firstName')).toBe(false);
    });
  });

  describe('getFieldError', () => {
    it('should return empty string when field does not exist', () => {
      expect(component.getFieldError('nonExistentField')).toBe('');
    });

    it('should return empty string when field is null', () => {
      component.registerForm.removeControl('firstName');
      expect(component.getFieldError('firstName')).toBe('');
    });

    it('should return empty string when field has no errors', () => {
      const field = component.registerForm.get('firstName');
      field?.setValue('John');
      field?.markAsTouched();
      
      expect(component.getFieldError('firstName')).toBe('');
    });

    it('should return empty string when field is not touched', () => {
      const field = component.registerForm.get('firstName');
      field?.setValue('');
      
      expect(component.getFieldError('firstName')).toBe('');
    });

    it('should return required error message', () => {
      const field = component.registerForm.get('firstName');
      field?.setValue('');
      field?.markAsTouched();
      
      expect(component.getFieldError('firstName')).toBe('firstName is required');
    });

    it('should return email error message', () => {
      const field = component.registerForm.get('email');
      field?.setValue('invalid-email');
      field?.markAsTouched();
      
      expect(component.getFieldError('email')).toBe('Please enter a valid email');
    });

    it('should return minlength error message', () => {
      const field = component.registerForm.get('firstName');
      field?.setValue('A');
      field?.markAsTouched();
      
      expect(component.getFieldError('firstName')).toBe('firstName must be at least 2 characters');
    });

    it('should return password pattern error message', () => {
      const field = component.registerForm.get('password');
      field?.setValue('simplepassword');
      field?.markAsTouched();
      
      expect(component.getFieldError('password')).toBe('Password must contain uppercase, lowercase, number, and special character');
    });

    it('should return generic pattern error message for non-password fields', () => {
      // Create a custom field with pattern error
      const fb = new FormBuilder();
      component.registerForm.addControl('customField', fb.control('invalid', [Validators.pattern(/^[0-9]+$/)]));
      const field = component.registerForm.get('customField');
      field?.markAsTouched();
      
      expect(component.getFieldError('customField')).toBe('customField format is invalid');
    });

    it('should return password mismatch error message', () => {
      component.registerForm.patchValue({
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!'
      });
      component.registerForm.markAsTouched();
      component.registerForm.get('confirmPassword')?.markAsTouched();
      
      expect(component.getFieldError('confirmPassword')).toBe('Passwords do not match');
    });

    it('should return empty string for unknown error type', () => {
      const field = component.registerForm.get('firstName');
      field?.setValue('');
      field?.markAsTouched();
      // Manually add an unknown error
      field?.setErrors({ unknownError: true });
      
      expect(component.getFieldError('firstName')).toBe('');
    });
  });

  describe('error handling in onSubmit', () => {
    it('should handle error with array of error objects with message property', () => {
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
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
      
      expect(snackBar.open).toHaveBeenCalledWith('Email is invalid, Password too weak', 'Close', jasmine.any(Object));
    });

    it('should handle error with array of error strings', () => {
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      const errorResponse = {
        error: {
          errors: ['Email is invalid', 'Password too weak']
        }
      };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(snackBar.open).toHaveBeenCalledWith('Email is invalid, Password too weak', 'Close', jasmine.any(Object));
    });

    it('should handle error with empty errors array', () => {
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      const errorResponse = {
        error: {
          errors: []
        }
      };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(snackBar.open).toHaveBeenCalledWith('Registration failed. Please try again.', 'Close', jasmine.any(Object));
    });

    it('should handle error with non-array errors', () => {
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      const errorResponse = {
        error: {
          errors: 'Not an array'
        }
      };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(snackBar.open).toHaveBeenCalledWith('Registration failed. Please try again.', 'Close', jasmine.any(Object));
    });

    it('should handle error with error.message', () => {
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      const errorResponse = {
        message: 'Network error'
      };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(snackBar.open).toHaveBeenCalledWith('Network error', 'Close', jasmine.any(Object));
    });

    it('should handle error with no message properties', () => {
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      const errorResponse = {
        status: 500
      };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(snackBar.open).toHaveBeenCalledWith('Registration failed. Please try again.', 'Close', jasmine.any(Object));
    });

    it('should handle error with null error object', () => {
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      const errorResponse = {
        error: null
      };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(snackBar.open).toHaveBeenCalledWith('Registration failed. Please try again.', 'Close', jasmine.any(Object));
    });

    it('should handle error with undefined error object', () => {
      component.registerForm.patchValue(mockRegisterRequest);
      component.registerForm.get('confirmPassword')?.setValue('Password123!');
      component.registerForm.get('acceptTerms')?.setValue(true);
      
      const errorResponse = {
        error: undefined
      };
      authService.register.and.returnValue(throwError(() => errorResponse));
      
      component.onSubmit();
      
      expect(snackBar.open).toHaveBeenCalledWith('Registration failed. Please try again.', 'Close', jasmine.any(Object));
    });
  });

  describe('form initialization', () => {
    it('should set isFormLoading to true initially', () => {
      expect(component.isFormLoading).toBe(true);
    });

    it('should set isFormLoading to false after timeout', (done) => {
      setTimeout(() => {
        expect(component.isFormLoading).toBe(false);
        done();
      }, 600);
    });
  });

  describe('valueChanges subscription', () => {
    it('should clear error when form value changes', () => {
      component.error = 'Some error';
      
      component.registerForm.patchValue({ firstName: 'John' });
      
      expect(component.error).toBeNull();
    });

    it('should not clear error when error is null', () => {
      component.error = null;
      
      component.registerForm.patchValue({ firstName: 'John' });
      
      expect(component.error).toBeNull();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should not throw error on multiple destroy calls', () => {
      component.ngOnDestroy();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
