import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { 
  Transaction, 
  TransactionType, 
  TransactionStatus, 
  PaymentMethod,
  RecurrencePattern,
  Category 
} from '../../../../core/models/financial.model';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent
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

  // Initialize the form group
  transactionForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    currency: ['USD', Validators.required],
    type: [TransactionType.EXPENSE, Validators.required],
    status: [TransactionStatus.COMPLETED, Validators.required],
    categoryId: ['', Validators.required],
    subcategoryId: [''],
    date: [new Date(), Validators.required],
    time: [''],
    timezone: ['UTC'],
    location: [''],
    paymentMethod: [PaymentMethod.CASH, Validators.required],
    paymentReference: [''],
    merchantName: [''],
    merchantId: [''],
    tags: [[]],
    isRecurring: [false],
    recurrencePattern: [RecurrencePattern.NONE],
    recurrenceInterval: [1],
    recurrenceEndDate: [null],
    notes: [''],
    source: ['manual']
  });

  transaction: Transaction | null = null;
  categories: Category[] = [];
  subcategories: Category[] = [];
  
  // Granular loading states
  isFormLoading = false;
  isCategoriesLoading = false;
  isSubcategoriesLoading = false;
  isSubmitting = false;
  isDeleting = false;
  
  error: string | null = null;
  
  // Form mode
  isEditMode = false;
  transactionId: string | null = null;
  
  // Enums for template
  transactionTypes = Object.values(TransactionType);
  transactionStatuses = Object.values(TransactionStatus);
  paymentMethods = Object.values(PaymentMethod);
  recurrencePatterns = Object.values(RecurrencePattern);
  
  // Currency options
  currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
  
  // Timezone options
  timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai'
  ];

  // Computed properties for button states
  get isSubmitDisabled(): boolean {
    return !this.transactionForm.valid || this.isAnyActionLoading;
  }

  get isCancelDisabled(): boolean {
    return this.isAnyActionLoading;
  }

  get isDeleteDisabled(): boolean {
    return this.isAnyActionLoading;
  }

  ngOnInit(): void {
    this.loadCategories();
    this.checkEditMode();
    this.setupFormControlStates();
  }

  private setupFormControlStates(): void {
    // Set up disabled states for form controls
    this.transactionForm.get('categoryId')?.disable();
    this.transactionForm.get('subcategoryId')?.disable();
    
    // Enable category control when categories are loaded
    this.categoryService.isLoading$.subscribe(isLoading => {
      if (!isLoading) {
        this.transactionForm.get('categoryId')?.enable();
      }
    });

    // Handle subcategory state based on category selection
    this.transactionForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      const subcategoryControl = this.transactionForm.get('subcategoryId');
      if (categoryId) {
        subcategoryControl?.enable();
      } else {
        subcategoryControl?.disable();
        subcategoryControl?.setValue('');
      }
    });

    // Handle subcategory loading state
    this.categoryService.isLoading$.subscribe(isLoading => {
      const subcategoryControl = this.transactionForm.get('subcategoryId');
      if (isLoading) {
        subcategoryControl?.disable();
      } else if (this.transactionForm.get('categoryId')?.value) {
        subcategoryControl?.enable();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkEditMode(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const id = params.get('id');
          if (id && id !== 'new') {
            this.isEditMode = true;
            this.transactionId = id;
            // loadTransaction returns void, so we need to return an observable
            this.loadTransaction(id);
            return of(null);
          } else {
            return of(null);
          }
        })
      )
      .subscribe();
  }

  private loadTransaction(transactionId: string): void {
    this.isFormLoading = true;
    this.error = null;

    // Use getUserTransactions and filter by ID since getTransactionById might not exist
    this.transactionService.getUserTransactions({ search: transactionId, limit: 1 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            this.transaction = response.data[0];
            this.populateForm(this.transaction);
            this.loadSubcategories(this.transaction.categoryId);
          } else {
            this.error = 'Transaction not found';
          }
          this.isFormLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load transaction';
          this.isFormLoading = false;
          console.error('Error loading transaction:', error);
        }
      });
  }

  private loadCategories(): void {
    this.isCategoriesLoading = true;

    this.categoryService.getUserCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories.filter(cat => cat.isActive);
          this.isCategoriesLoading = false;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.isCategoriesLoading = false;
        }
      });
  }

  private loadSubcategories(categoryId: string): void {
    if (!categoryId) {
      this.subcategories = [];
      return;
    }

    this.isSubcategoriesLoading = true;

    // Filter categories to get subcategories since getSubcategories might not exist
    this.categoryService.getUserCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.subcategories = categories.filter(cat => 
            cat.parentId === categoryId && cat.isActive
          );
          this.isSubcategoriesLoading = false;
        },
        error: (error) => {
          console.error('Error loading subcategories:', error);
          this.isSubcategoriesLoading = false;
        }
      });
  }

  private populateForm(transaction: Transaction): void {
    this.transactionForm.patchValue({
      title: transaction.title,
      description: transaction.description || '',
      amount: transaction.amount,
      currency: transaction.currency || 'USD',
      type: transaction.type,
      status: transaction.status,
      categoryId: transaction.categoryId,
      subcategoryId: transaction.subcategoryId || '',
      date: new Date(transaction.date),
      time: transaction.time || '',
      timezone: transaction.timezone || 'UTC',
      location: transaction.location || '',
      paymentMethod: transaction.paymentMethod,
      paymentReference: transaction.paymentReference || '',
      merchantName: transaction.merchantName || '',
      merchantId: transaction.merchantId || '',
      tags: transaction.tags || [],
      isRecurring: transaction.isRecurring || false,
      recurrencePattern: transaction.recurrencePattern || RecurrencePattern.NONE,
      recurrenceInterval: transaction.recurrenceInterval || 1,
      recurrenceEndDate: transaction.recurrenceEndDate ? new Date(transaction.recurrenceEndDate) : null,
      notes: transaction.notes || '',
      source: transaction.source || 'manual'
    });
  }

  onCategoryChange(categoryId: string): void {
    this.transactionForm.patchValue({ subcategoryId: '' });
    this.loadSubcategories(categoryId);
  }

  onRecurringChange(isRecurring: boolean): void {
    if (!isRecurring) {
      this.transactionForm.patchValue({
        recurrencePattern: RecurrencePattern.NONE,
        recurrenceInterval: 1,
        recurrenceEndDate: null
      });
    }
  }

  onTagAdd(tag: string): void {
    if (tag && tag.trim()) {
      const currentTags = this.transactionForm.get('tags')?.value || [];
      if (!currentTags.includes(tag.trim())) {
        this.transactionForm.patchValue({ tags: [...currentTags, tag.trim()] });
      }
    }
  }

  onTagRemove(tag: string): void {
    const currentTags = this.transactionForm.get('tags')?.value || [];
    this.transactionForm.patchValue({ tags: currentTags.filter((t: string) => t !== tag) });
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      this.isSubmitting = true;
      this.error = null;

      const formData = this.transactionForm.value;
      
      // Prepare the transaction data
      const transactionData: Partial<Transaction> = {
        title: formData.title,
        description: formData.description,
        amount: formData.amount,
        currency: formData.currency,
        type: formData.type,
        status: formData.status,
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId || null,
        date: formData.date,
        time: formData.time || null,
        timezone: formData.timezone,
        location: formData.location || null,
        paymentMethod: formData.paymentMethod,
        paymentReference: formData.paymentReference || null,
        merchantName: formData.merchantName || null,
        merchantId: formData.merchantId || null,
        tags: formData.tags,
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.recurrencePattern,
        recurrenceInterval: formData.recurrenceInterval,
        recurrenceEndDate: formData.recurrenceEndDate,
        notes: formData.notes || null,
        source: formData.source
      };

      if (this.isEditMode && this.transactionId) {
        // Update existing transaction
        this.transactionService.updateTransaction(this.transactionId, transactionData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedTransaction) => {
              this.isSubmitting = false;
              this.router.navigate(['/financial/transactions']);
            },
            error: (error) => {
              this.error = 'Failed to update transaction';
              this.isSubmitting = false;
              console.error('Error updating transaction:', error);
            }
          });
      } else {
        // Create new transaction
        this.transactionService.createTransaction(transactionData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (newTransaction) => {
              this.isSubmitting = false;
              this.router.navigate(['/financial/transactions']);
            },
            error: (error) => {
              this.error = 'Failed to create transaction';
              this.isSubmitting = false;
              console.error('Error creating transaction:', error);
            }
          });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onDelete(): void {
    if (this.transaction && this.transactionId) {
      if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
        this.isDeleting = true;
        this.error = null;

        this.transactionService.deleteTransaction(this.transactionId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.isDeleting = false;
              this.router.navigate(['/financial/transactions']);
            },
            error: (error) => {
              this.error = 'Failed to delete transaction';
              this.isDeleting = false;
              console.error('Error deleting transaction:', error);
            }
          });
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/financial/transactions']);
  }

  resetForm(): void {
    if (this.transaction) {
      this.populateForm(this.transaction);
    } else {
      this.transactionForm.reset({
        title: '',
        description: '',
        amount: null,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        status: TransactionStatus.COMPLETED,
        categoryId: '',
        subcategoryId: '',
        date: new Date(),
        time: '',
        timezone: 'UTC',
        location: '',
        paymentMethod: PaymentMethod.CASH,
        paymentReference: '',
        merchantName: '',
        merchantId: '',
        tags: [],
        isRecurring: false,
        recurrencePattern: RecurrencePattern.NONE,
        recurrenceInterval: 1,
        recurrenceEndDate: null,
        notes: '',
        source: 'manual'
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.transactionForm.controls).forEach(key => {
      const control = this.transactionForm.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched();
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Template helper methods
  getFieldControl(fieldName: string): AbstractControl | null {
    return this.transactionForm.get(fieldName);
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.getFieldControl(fieldName);
    return control ? control.invalid && control.touched : false;
  }

  getFieldError(fieldName: string): string {
    const control = this.getFieldControl(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength']) return `Minimum length is ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['maxlength']) return `Maximum length is ${control.errors['maxlength'].requiredLength} characters`;
    if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;
    
    return 'Invalid input';
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category ? category.name : 'Unknown';
  }

  getSubcategoryName(subcategoryId: string): string {
    const subcategory = this.subcategories.find(c => c._id === subcategoryId);
    return subcategory ? subcategory.name : 'Unknown';
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Computed properties for loading states
  get isLoading(): boolean {
    return this.isFormLoading || this.isCategoriesLoading || this.isSubcategoriesLoading;
  }

  get isAnyActionLoading(): boolean {
    return this.isSubmitting || this.isDeleting;
  }

  get canDelete(): boolean {
    return this.isEditMode && this.transaction !== null;
  }

  get formTitle(): string {
    return this.isEditMode ? 'Edit Transaction' : 'New Transaction';
  }

  get submitButtonText(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Updating...' : 'Creating...';
    }
    return this.isEditMode ? 'Update Transaction' : 'Create Transaction';
  }

  get deleteButtonText(): string {
    return this.isDeleting ? 'Deleting...' : 'Delete Transaction';
  }

  // Form validation helpers - using the proper methods
  get titleError(): string | null {
    return this.getFieldError('title');
  }

  get amountError(): string | null {
    return this.getFieldError('amount');
  }

  get categoryError(): string | null {
    return this.getFieldError('categoryId');
  }

  get dateError(): string | null {
    return this.getFieldError('date');
  }
}