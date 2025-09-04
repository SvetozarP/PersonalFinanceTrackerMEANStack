import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../../../core/models/auth.models';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  isLoading = false;
  isFormLoading = false;
  isSubmitting = false;
  hidePassword = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();



  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('RegisterComponent: ngOnInit called');
    // Initialize form here to ensure proper setup
    this.initForm();
    
    // GuestGuard already handles authentication check, no need to duplicate here
    
    // Clear errors when user starts typing
    this.registerForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.error) {
        this.error = null;
      }
    });
  }

  private initForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
    
    // Simulate initial form loading if needed
    this.isFormLoading = true;
    setTimeout(() => {
      this.isFormLoading = false;
    }, 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  getPasswordStrengthClass(): string {
    const password = this.registerForm.get('password')?.value;
    if (!password) return '';

    if (password.length < 8) return 'weak';
    if (!this.isPasswordComplex(password)) return 'weak';
    if (password.length < 12) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const password = this.registerForm.get('password')?.value;
    if (!password) return '';

    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!this.isPasswordComplex(password)) return 'Password must contain uppercase, lowercase, number, and special character';
    if (password.length < 12) return 'Medium strength password';
    return 'Strong password';
  }

  private isPasswordComplex(password: string): boolean {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    return hasLower && hasUpper && hasNumber && hasSpecial;
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.isLoading = true;
      this.error = null;
      
      // Only send the fields the backend expects
      const userData: RegisterRequest = {
        email: this.registerForm.get('email')?.value,
        password: this.registerForm.get('password')?.value,
        firstName: this.registerForm.get('firstName')?.value,
        lastName: this.registerForm.get('lastName')?.value
      };

      this.authService.register(userData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.isLoading = false;
          
          this.snackBar.open('Account created successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.isLoading = false;
          
          console.error('Registration error:', error);
          
          // Show more detailed error message
          let errorMessage = 'Registration failed. Please try again.';
          if (error.error && error.error.errors && Array.isArray(error.error.errors)) {
            // Handle array of error objects with field and message properties
            if (error.error.errors.length > 0 && typeof error.error.errors[0] === 'object' && 'message' in error.error.errors[0]) {
              errorMessage = error.error.errors.map((err: any) => err.message).join(', ');
            } else {
              errorMessage = error.error.errors.join(', ');
            }
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.error = errorMessage;
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      });
    } else {
      // Mark all fields as touched to trigger validation display
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  // Helper method to check if a field has errors
  hasError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Helper method to get field error message
  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['email']) return 'Please enter a valid email';
    if (field.errors['minlength']) {
      const requiredLength = field.errors['minlength'].requiredLength;
      return `${fieldName} must be at least ${requiredLength} characters`;
    }
    if (field.errors['pattern']) {
      if (fieldName === 'password') {
        return 'Password must contain uppercase, lowercase, number, and special character';
      }
      return `${fieldName} format is invalid`;
    }
    if (field.errors['passwordMismatch']) return 'Passwords do not match';

    return '';
  }


}