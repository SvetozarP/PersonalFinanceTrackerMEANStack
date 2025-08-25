import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod, RecurrencePattern } from '../../../../core/models/financial.model';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
  ],
  templateUrl: './transaction-form.html',
  styleUrls: ['./transaction-form.scss']
})
export class TransactionFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  transactionForm!: FormGroup;
  categories: any[] = [];
  subcategories: any[] = [];
  isEditMode = false;
  transactionId: string | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;

  // Enums for template
  transactionTypes = Object.values(TransactionType);
  transactionStatuses = Object.values(TransactionStatus);
  paymentMethods = Object.values(PaymentMethod);
  recurrencePatterns = Object.values(RecurrencePattern);

  // Form field names for easy access
  readonly formFields = {
    title: 'title',
    description: 'description',
    amount: 'amount',
    currency: 'currency',
    type: 'type',
    status: 'status',
    categoryId: 'categoryId',
    subcategoryId: 'subcategoryId',
    tags: 'tags',
    date: 'date',
    time: 'time',
    timezone: 'timezone',
    location: 'location',
    paymentMethod: 'paymentMethod',
    paymentReference: 'paymentReference',
    merchantName: 'merchantName',
    isRecurring: 'isRecurring',
    recurrencePattern: 'recurrencePattern',
    recurrenceInterval: 'recurrenceInterval',
    recurrenceEndDate: 'recurrenceEndDate',
    notes: 'notes'
  };

  ngOnInit(): void {
    this.initializeForm();
    this.loadCategories();
    this.checkEditMode();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.transactionForm = this.fb.group({
      [this.formFields.title]: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      [this.formFields.description]: ['', [Validators.maxLength(500)]],
      [this.formFields.amount]: ['', [Validators.required, Validators.min(0.01)]],
      [this.formFields.currency]: ['USD', [Validators.required]],
      [this.formFields.type]: [TransactionType.EXPENSE, [Validators.required]],
      [this.formFields.status]: [TransactionStatus.COMPLETED, [Validators.required]],
      [this.formFields.categoryId]: ['', [Validators.required]],
      [this.formFields.subcategoryId]: [''],
      [this.formFields.tags]: [''],
      [this.formFields.date]: [new Date().toISOString().split('T')[0], [Validators.required]],
      [this.formFields.time]: [''],
      [this.formFields.timezone]: [Intl.DateTimeFormat().resolvedOptions().timeZone, [Validators.required]],
      [this.formFields.location]: this.fb.group({
        name: [''],
        address: [''],
        coordinates: this.fb.group({
          latitude: [''],
          longitude: ['']
        })
      }),
      [this.formFields.paymentMethod]: [PaymentMethod.CASH, [Validators.required]],
      [this.formFields.paymentReference]: [''],
      [this.formFields.merchantName]: [''],
      [this.formFields.isRecurring]: [false],
      [this.formFields.recurrencePattern]: [RecurrencePattern.NONE],
      [this.formFields.recurrenceInterval]: [1],
      [this.formFields.recurrenceEndDate]: [''],
      [this.formFields.notes]: ['']
    });
  }

  private checkEditMode(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const id = params['id'];
        if (id && id !== 'new') {
          this.isEditMode = true;
          this.transactionId = id;
          return this.transactionService.getTransactionById(id);
        }
        return of(null);
      })
    ).subscribe({
      next: (transaction) => {
        if (transaction) {
          this.populateForm(transaction);
        }
      },
      error: (error) => {
        console.error('Error loading transaction:', error);
        this.error = 'Failed to load transaction';
      }
    });
  }

  private populateForm(transaction: Transaction): void {
    // Convert date to YYYY-MM-DD format for input
    const transactionDate = new Date(transaction.date);
    const formattedDate = transactionDate.toISOString().split('T')[0];

    this.transactionForm.patchValue({
      [this.formFields.title]: transaction.title,
      [this.formFields.description]: transaction.description,
      [this.formFields.amount]: transaction.amount,
      [this.formFields.currency]: transaction.currency,
      [this.formFields.type]: transaction.type,
      [this.formFields.status]: transaction.status,
      [this.formFields.categoryId]: transaction.categoryId,
      [this.formFields.subcategoryId]: transaction.subcategoryId,
      [this.formFields.tags]: transaction.tags.join(', '),
      [this.formFields.date]: formattedDate,
      [this.formFields.time]: transaction.time,
      [this.formFields.timezone]: transaction.timezone,
      [this.formFields.location]: {
        name: transaction.location?.name || '',
        address: transaction.location?.address || '',
        coordinates: {
          latitude: transaction.location?.coordinates?.latitude || '',
          longitude: transaction.location?.coordinates?.longitude || ''
        }
      },
      [this.formFields.paymentMethod]: transaction.paymentMethod,
      [this.formFields.paymentReference]: transaction.paymentReference,
      [this.formFields.merchantName]: transaction.merchantName,
      [this.formFields.isRecurring]: transaction.isRecurring,
      [this.formFields.recurrencePattern]: transaction.recurrencePattern,
      [this.formFields.recurrenceInterval]: transaction.recurrenceInterval,
      [this.formFields.recurrenceEndDate]: transaction.recurrenceEndDate ? 
        new Date(transaction.recurrenceEndDate).toISOString().split('T')[0] : '',
      [this.formFields.notes]: transaction.notes
    });

    // Load subcategories if category is selected
    if (transaction.categoryId) {
      this.onCategoryChange(transaction.categoryId);
    }
  }

  private loadCategories(): void {
    this.categoryService.getUserCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.error = 'Failed to load categories';
        }
      });
  }

  private setupFormSubscriptions(): void {
    // Watch for category changes to load subcategories
    this.transactionForm.get(this.formFields.categoryId)?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(categoryId => {
        this.onCategoryChange(categoryId);
      });

    // Watch for recurring changes to show/hide recurrence fields
    this.transactionForm.get(this.formFields.isRecurring)?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isRecurring => {
        this.toggleRecurrenceFields(isRecurring);
      });

    // Watch for recurrence pattern changes
    this.transactionForm.get(this.formFields.recurrencePattern)?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(pattern => {
        this.onRecurrencePatternChange(pattern);
      });
  }

  private onCategoryChange(categoryId: string): void {
    if (categoryId) {
      this.categoryService.getCategoriesByParent(categoryId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(subcategories => {
          this.subcategories = subcategories;
          
          // Clear subcategory if it's no longer valid
          const currentSubcategory = this.transactionForm.get(this.formFields.subcategoryId)?.value;
          if (currentSubcategory && !subcategories.find(s => s._id === currentSubcategory)) {
            this.transactionForm.patchValue({ [this.formFields.subcategoryId]: '' });
          }
        });
    } else {
      this.subcategories = [];
      this.transactionForm.patchValue({ [this.formFields.subcategoryId]: '' });
    }
  }

  private toggleRecurrenceFields(isRecurring: boolean): void {
    const recurrenceFields = [
      this.formFields.recurrencePattern,
      this.formFields.recurrenceInterval,
      this.formFields.recurrenceEndDate
    ];

    recurrenceFields.forEach(field => {
      const control = this.transactionForm.get(field);
      if (control) {
        if (isRecurring) {
          control.enable();
        } else {
          control.disable();
          control.setValue(field === this.formFields.recurrencePattern ? RecurrencePattern.NONE : '');
        }
      }
    });
  }

  private onRecurrencePatternChange(pattern: RecurrencePattern): void {
    const intervalControl = this.transactionForm.get(this.formFields.recurrenceInterval);
    if (intervalControl) {
      if (pattern === RecurrencePattern.DAILY) {
        intervalControl.setValue(1);
        intervalControl.disable();
      } else {
        intervalControl.enable();
      }
    }
  }

  onSubmit(): void {
    if (this.transactionForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const formValue = this.transactionForm.value;
    
    // Process tags
    const tags = formValue[this.formFields.tags] ? 
      formValue[this.formFields.tags].split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : 
      [];

    // Prepare transaction data
    const transactionData: Partial<Transaction> = {
      title: formValue[this.formFields.title],
      description: formValue[this.formFields.description],
      amount: parseFloat(formValue[this.formFields.amount]),
      currency: formValue[this.formFields.currency],
      type: formValue[this.formFields.type],
      status: formValue[this.formFields.status],
      categoryId: formValue[this.formFields.categoryId],
      subcategoryId: formValue[this.formFields.subcategoryId] || undefined,
      tags,
      date: new Date(formValue[this.formFields.date]),
      time: formValue[this.formFields.time] || undefined,
      timezone: formValue[this.formFields.timezone],
      location: formValue[this.formFields.location],
      paymentMethod: formValue[this.formFields.paymentMethod],
      paymentReference: formValue[this.formFields.paymentReference] || undefined,
      merchantName: formValue[this.formFields.merchantName] || undefined,
      isRecurring: formValue[this.formFields.isRecurring],
      recurrencePattern: formValue[this.formFields.recurrencePattern],
      recurrenceInterval: formValue[this.formFields.recurrenceInterval] || undefined,
      recurrenceEndDate: formValue[this.formFields.recurrenceEndDate] ? 
        new Date(formValue[this.formFields.recurrenceEndDate]) : undefined,
      notes: formValue[this.formFields.notes] || undefined
    };

    const request$ = this.isEditMode && this.transactionId ?
      this.transactionService.updateTransaction(this.transactionId, transactionData) :
      this.transactionService.createTransaction(transactionData);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (transaction) => {
        this.isSubmitting = false;
        this.router.navigate(['/financial/transactions']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.error = 'Failed to save transaction';
        console.error('Error saving transaction:', error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/financial/transactions']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.transactionForm.controls).forEach(key => {
      const control = this.transactionForm.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouchedRecursive(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  private markFormGroupTouchedRecursive(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouchedRecursive(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.transactionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.transactionForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `Maximum length is ${field.errors['maxlength'].requiredLength} characters`;
      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
    }
    return '';
  }

  getFieldControl(fieldName: string): AbstractControl | null {
    return this.transactionForm.get(fieldName);
  }
}