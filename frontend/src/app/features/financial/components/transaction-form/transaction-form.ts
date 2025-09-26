import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  // Initialize the form group
  transactionForm!: FormGroup;

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
    this.initializeForm();
    this.loadCategories();
    this.checkEditMode();
  }

  private initializeForm(): void {
    this.transactionForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
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
      locationName: [''],
      locationAddress: [''],
      locationLatitude: [null],
      locationLongitude: [null],
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
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.isCategoriesLoading = false;
          this.error = 'Failed to load categories';
          this.cdr.detectChanges();
        }
      });
  }

  private loadSubcategories(categoryId: string): void {
    if (!categoryId) {
      this.subcategories = [];
      return;
    }

    this.isSubcategoriesLoading = true;

    this.categoryService.getCategoriesByParent(categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (subcategories) => {
          this.subcategories = subcategories.filter(cat => cat.isActive);
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
      date: this.formatDateForInput(transaction.date),
      time: transaction.time || '',
      timezone: transaction.timezone || 'UTC',
      locationName: transaction.location?.name || '',
      locationAddress: transaction.location?.address || '',
      locationLatitude: transaction.location?.coordinates?.latitude || null,
      locationLongitude: transaction.location?.coordinates?.longitude || null,
      paymentMethod: transaction.paymentMethod,
      paymentReference: transaction.paymentReference || '',
      merchantName: transaction.merchantName || '',
      merchantId: transaction.merchantId || '',
      tags: transaction.tags || [],
      isRecurring: transaction.isRecurring || false,
      recurrencePattern: transaction.recurrencePattern || RecurrencePattern.NONE,
      recurrenceInterval: transaction.recurrenceInterval || 1,
      recurrenceEndDate: transaction.recurrenceEndDate ? this.formatDateForInput(transaction.recurrenceEndDate) : null,
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
        recurrenceInterval: undefined,
        recurrenceEndDate: undefined
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

  private processTags(tags: any): string[] {
    if (!tags) return [];
    
    if (Array.isArray(tags)) {
      return tags.filter(tag => tag && tag.trim());
    }
    
    if (typeof tags === 'string') {
      if (!tags.trim()) return [];
      
      // Split by comma only, preserve semicolons and spaces within tags
      return tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }
    
    return [];
  }

  private formatDateForInput(date: Date | string): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided:', date);
      return '';
    }
    
    // Format as yyyy-MM-dd for HTML date input
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      this.isSubmitting = true;
      this.error = null;

      const formData = this.transactionForm.value;
      
      // Prepare the transaction data with proper transformations
      const transactionData: Partial<Transaction> = {
        title: formData.title,
        description: formData.description,
        amount: typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount,
        currency: formData.currency,
        type: formData.type,
        status: formData.status,
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId || undefined,
        date: formData.date instanceof Date ? formData.date : new Date(formData.date),
        time: formData.time || null,
        timezone: formData.timezone,
        location: (formData.locationName || formData.locationAddress) ? {
          name: formData.locationName || '',
          address: formData.locationAddress || '',
          coordinates: (formData.locationLatitude && formData.locationLongitude) ? {
            latitude: formData.locationLatitude,
            longitude: formData.locationLongitude
          } : undefined
        } : undefined,
        paymentMethod: formData.paymentMethod,
        paymentReference: formData.paymentReference || null,
        merchantName: formData.merchantName || null,
        merchantId: formData.merchantId || null,
        tags: this.processTags(formData.tags),
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.recurrencePattern,
        recurrenceInterval: formData.recurrenceInterval,
        recurrenceEndDate: formData.recurrenceEndDate ? (formData.recurrenceEndDate instanceof Date ? formData.recurrenceEndDate : new Date(formData.recurrenceEndDate)) : undefined,
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
              this.error = 'Failed to save transaction';
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
        date: this.formatDateForInput(new Date()),
        time: '',
        timezone: 'UTC',
        locationName: '',
        locationAddress: '',
        locationLatitude: null,
        locationLongitude: null,
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

  // Template helper methods
  getFieldControl(fieldName: string): AbstractControl | null {
    return this.transactionForm.get(fieldName);
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.getFieldControl(fieldName);
    return control ? control.invalid && (control.touched || control.dirty) : false;
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
  get titleError(): string {
    return this.getFieldError('title');
  }

  get amountError(): string {
    return this.getFieldError('amount');
  }

  get categoryError(): string {
    return this.getFieldError('categoryId');
  }

  get dateError(): string {
    return this.getFieldError('date');
  }
}