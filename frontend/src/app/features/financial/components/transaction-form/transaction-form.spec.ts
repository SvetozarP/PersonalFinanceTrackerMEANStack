import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionFormComponent } from './transaction-form';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { of, throwError } from 'rxjs';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod, RecurrencePattern } from '../../../../core/models/financial.model';

describe('TransactionFormComponent', () => {
  let component: TransactionFormComponent;
  let fixture: ComponentFixture<TransactionFormComponent>;
  let mockTransactionService: jasmine.SpyObj<TransactionService>;
  let mockCategoryService: jasmine.SpyObj<CategoryService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

  const mockCategory = {
    _id: 'cat1',
    name: 'Test Category',
    description: 'Test Description',
    color: '#FF0000',
    icon: 'test-icon',
    path: ['Test Category'],
    level: 1,
    isActive: true,
    isSystem: false,
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockSubcategory = {
    _id: 'subcat1',
    name: 'Test Subcategory',
    description: 'Test Subcategory Description',
    color: '#00FF00',
    icon: 'sub-icon',
    path: ['Test Category', 'Test Subcategory'],
    level: 2,
    isActive: true,
    isSystem: false,
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockTransaction: Transaction = {
    _id: '1',
    title: 'Test Transaction',
    description: 'Test Description',
    amount: 100,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    status: TransactionStatus.COMPLETED,
    categoryId: 'cat1',
    subcategoryId: 'subcat1',
    tags: ['test', 'sample'],
    date: new Date('2024-01-15'),
    time: '10:30',
    timezone: 'UTC',
    location: {
      name: 'Test Location',
      address: '123 Test St',
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    },
    paymentMethod: PaymentMethod.CASH,
    paymentReference: 'REF123',
    merchantName: 'Test Merchant',
    isRecurring: true,
    recurrencePattern: RecurrencePattern.MONTHLY,
    recurrenceInterval: 1,
    recurrenceEndDate: new Date('2024-12-31'),
    attachments: [],
    source: 'manual',
    userId: 'user1',
    accountId: 'account1',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false
  };

  beforeEach(async () => {
    mockTransactionService = jasmine.createSpyObj('TransactionService', [
      'getTransactionById',
      'createTransaction',
      'updateTransaction'
    ]);

    mockCategoryService = jasmine.createSpyObj('CategoryService', [
      'getUserCategories',
      'getCategoriesByParent'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      params: of({ id: 'new' })
    });

    mockCategoryService.getUserCategories.and.returnValue(of([mockCategory]));
    mockCategoryService.getCategoriesByParent.and.returnValue(of([mockSubcategory]));

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        TransactionFormComponent
      ],
      providers: [
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have enums available for template', () => {
    expect(component.transactionTypes).toBeDefined();
    expect(component.transactionStatuses).toBeDefined();
    expect(component.paymentMethods).toBeDefined();
    expect(component.recurrencePatterns).toBeDefined();
  });

  it('should have form field names accessible', () => {
    expect(component.formFields).toBeDefined();
    expect(component.formFields.title).toBe('title');
    expect(component.formFields.amount).toBe('amount');
    expect(component.formFields.categoryId).toBe('categoryId');
  });

  it('should initialize with default values', () => {
    expect(component.isEditMode).toBeFalse();
    expect(component.transactionId).toBeNull();
    expect(component.isLoading).toBeFalse();
    expect(component.isSubmitting).toBeFalse();
    expect(component.error).toBeNull();
    expect(component.categories).toEqual([]);
    expect(component.subcategories).toEqual([]);
  });

  it('should initialize form on ngOnInit', () => {
    component.ngOnInit();
    expect(component.transactionForm).toBeDefined();
    expect(component.transactionForm.get('title')).toBeDefined();
    expect(component.transactionForm.get('amount')).toBeDefined();
    expect(component.transactionForm.get('categoryId')).toBeDefined();
  });

  it('should load categories on init', () => {
    component.ngOnInit();
    expect(mockCategoryService.getUserCategories).toHaveBeenCalled();
    expect(component.categories).toEqual([mockCategory]);
  });

  it('should cleanup on destroy', () => {
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should have form validation methods', () => {
    component.ngOnInit();
    
    expect(component.isFieldInvalid).toBeDefined();
    expect(component.getFieldError).toBeDefined();
    expect(component.getFieldControl).toBeDefined();
    expect(component['markFormGroupTouched']).toBeDefined();
  });

  it('should validate required fields', () => {
    component.ngOnInit();
    const titleControl = component.transactionForm.get('title');
    const amountControl = component.transactionForm.get('amount');
    
    expect(titleControl?.hasError('required')).toBeTrue();
    expect(amountControl?.hasError('required')).toBeTrue();
  });

  it('should validate field length constraints', () => {
    component.ngOnInit();
    const titleControl = component.transactionForm.get('title');
    
    titleControl?.setValue('ab'); // Less than min length 3
    expect(titleControl?.hasError('minlength')).toBeTrue();
    
    titleControl?.setValue('a'.repeat(101)); // More than max length 100
    expect(titleControl?.hasError('maxlength')).toBeTrue();
  });

  it('should validate amount constraints', () => {
    component.ngOnInit();
    const amountControl = component.transactionForm.get('amount');
    
    amountControl?.setValue(0); // Less than min 0.01
    expect(amountControl?.hasError('min')).toBeTrue();
    
    amountControl?.setValue(0.01); // Valid amount
    expect(amountControl?.hasError('min')).toBeFalse();
  });

  it('should have default form values', () => {
    component.ngOnInit();
    
    expect(component.transactionForm.get('currency')?.value).toBe('USD');
    expect(component.transactionForm.get('type')?.value).toBeDefined();
    expect(component.transactionForm.get('status')?.value).toBeDefined();
    expect(component.transactionForm.get('paymentMethod')?.value).toBeDefined();
  });

  it('should have location form group structure', () => {
    component.ngOnInit();
    
    const locationGroup = component.transactionForm.get('location');
    expect(locationGroup).toBeDefined();
    
    const coordinatesGroup = locationGroup?.get('coordinates');
    expect(coordinatesGroup).toBeDefined();
    
    expect(locationGroup?.get('name')).toBeDefined();
    expect(locationGroup?.get('address')).toBeDefined();
    expect(coordinatesGroup?.get('latitude')).toBeDefined();
    expect(coordinatesGroup?.get('longitude')).toBeDefined();
  });

  it('should have recurrence form controls', () => {
    component.ngOnInit();
    
    expect(component.transactionForm.get('isRecurring')).toBeDefined();
    expect(component.transactionForm.get('recurrencePattern')).toBeDefined();
    expect(component.transactionForm.get('recurrenceInterval')).toBeDefined();
    expect(component.transactionForm.get('recurrenceEndDate')).toBeDefined();
  });

  it('should handle category change and load subcategories', () => {
    component.ngOnInit();
    component['onCategoryChange']('cat1');

    expect(mockCategoryService.getCategoriesByParent).toHaveBeenCalledWith('cat1');
    expect(component.subcategories).toEqual([mockSubcategory]);
  });

  it('should clear subcategories when category is cleared', () => {
    component.ngOnInit();
    component.subcategories = [mockSubcategory];
    component.transactionForm.patchValue({ subcategoryId: 'subcat1' });
    
    component['onCategoryChange']('');
    
    expect(component.subcategories).toEqual([]);
    expect(component.transactionForm.get('subcategoryId')?.value).toBe('');
  });

  it('should clear invalid subcategory when category changes', () => {
    component.ngOnInit();
    component.subcategories = [mockSubcategory];
    component.transactionForm.patchValue({ subcategoryId: 'invalid-subcat' });
    
    component['onCategoryChange']('cat1');
    
    expect(component.transactionForm.get('subcategoryId')?.value).toBe('');
  });

  it('should handle category loading error', () => {
    mockCategoryService.getUserCategories.and.returnValue(throwError(() => new Error('API Error')));
    
    // Recreate component to trigger error
    fixture = TestBed.createComponent(TransactionFormComponent);
    component = fixture.componentInstance;
    component.ngOnInit();

    expect(component.error).toBe('Failed to load categories');
  });

  it('should handle onCancel navigation', () => {
    component.onCancel();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/financial/transactions']);
  });

  it('should not submit invalid form', () => {
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: '', // Invalid - required field
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    component.onSubmit();

    expect(mockTransactionService.createTransaction).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
  });

  it('should handle form submission for new transaction', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'New Transaction',
      description: 'New Description',
      amount: 50,
      currency: 'USD',
      type: TransactionType.INCOME,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      isRecurring: false
    });

    component.onSubmit();

    expect(mockTransactionService.createTransaction).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/financial/transactions']);
  });

  it('should handle form submission for existing transaction', () => {
    mockTransactionService.updateTransaction.and.returnValue(of(mockTransaction));
    component.transactionId = '1';
    component.isEditMode = true;
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Updated Transaction',
      description: 'Updated Description',
      amount: 75,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      isRecurring: false
    });

    component.onSubmit();

    expect(mockTransactionService.updateTransaction).toHaveBeenCalledWith('1', jasmine.any(Object));
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/financial/transactions']);
  });

  it('should process tags correctly on submission', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      tags: 'tag1, tag2, tag3'
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.tags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('should handle empty tags on submission', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      tags: ''
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.tags).toEqual([]);
  });

  it('should handle form submission errors', () => {
    mockTransactionService.createTransaction.and.returnValue(throwError(() => new Error('API Error')));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      isRecurring: false
    });
    
    component.onSubmit();
    
    expect(component.error).toBe('Failed to save transaction');
    expect(component.isSubmitting).toBeFalse();
  });

  it('should toggle recurrence fields when isRecurring changes', () => {
    component.ngOnInit();
    const recurrencePatternControl = component.transactionForm.get('recurrencePattern');
    const recurrenceIntervalControl = component.transactionForm.get('recurrenceInterval');
    const recurrenceEndDateControl = component.transactionForm.get('recurrenceEndDate');

    // Initially enabled
    expect(recurrencePatternControl?.disabled).toBeFalse();
    expect(recurrenceIntervalControl?.disabled).toBeFalse();
    expect(recurrenceEndDateControl?.disabled).toBeFalse();

    // Disable recurring
    component['toggleRecurrenceFields'](false);
    expect(recurrencePatternControl?.disabled).toBeTrue();
    expect(recurrenceIntervalControl?.disabled).toBeTrue();
    expect(recurrenceEndDateControl?.disabled).toBeTrue();
    expect(recurrencePatternControl?.value).toBe(RecurrencePattern.NONE);
  });

  it('should handle recurrence pattern changes', () => {
    component.ngOnInit();
    const intervalControl = component.transactionForm.get('recurrenceInterval');
    
    // Set to daily pattern
    component['onRecurrencePatternChange'](RecurrencePattern.DAILY);
    expect(intervalControl?.value).toBe(1);
    expect(intervalControl?.disabled).toBeTrue();

    // Set to monthly pattern
    component['onRecurrencePatternChange'](RecurrencePattern.MONTHLY);
    expect(intervalControl?.disabled).toBeFalse();
  });

  it('should handle form submission with location data', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      location: {
        name: 'Test Location',
        address: '123 Test St',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      }
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.location?.name).toBe('Test Location');
    expect(callArgs.location?.coordinates?.latitude).toBe(40.7128);
  });

  it('should handle form submission with recurrence data', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      isRecurring: true,
      recurrencePattern: RecurrencePattern.MONTHLY,
      recurrenceInterval: 2,
      recurrenceEndDate: '2024-12-31'
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.isRecurring).toBeTrue();
    expect(callArgs.recurrencePattern).toBe(RecurrencePattern.MONTHLY);
    expect(callArgs.recurrenceInterval).toBe(2);
  });

  it('should handle form submission with optional fields', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      description: 'Test Description',
      time: '10:30',
      paymentReference: 'REF123',
      merchantName: 'Test Merchant',
      notes: 'Test Notes'
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.description).toBe('Test Description');
    expect(callArgs.time).toBe('10:30');
    expect(callArgs.paymentReference).toBe('REF123');
    expect(callArgs.merchantName).toBe('Test Merchant');
    expect(callArgs.notes).toBe('Test Notes');
  });

  it('should validate form field errors correctly', () => {
    component.ngOnInit();
    
    const titleControl = component.transactionForm.get('title');
    titleControl?.setValue('ab'); // Invalid length
    
    expect(component.isFieldInvalid('title')).toBeFalse(); // Not touched yet
    
    titleControl?.markAsTouched();
    expect(component.isFieldInvalid('title')).toBeTrue();
    
    expect(component.getFieldError('title')).toContain('Minimum length is 3 characters');
  });

  it('should handle form field control access', () => {
    component.ngOnInit();
    
    const titleControl = component.getFieldControl('title');
    expect(titleControl).toBeDefined();
    expect(titleControl?.value).toBe('');
    
    const nonExistentControl = component.getFieldControl('nonExistent');
    expect(nonExistentControl).toBeNull();
  });

  it('should handle form submission with subcategory', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.subcategories = [mockSubcategory];
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      subcategoryId: 'subcat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.subcategoryId).toBe('subcat1');
  });

  it('should handle form submission without subcategory', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      subcategoryId: '',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.subcategoryId).toBeUndefined();
  });

  it('should handle form submission with different transaction types', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.INCOME,
      status: TransactionStatus.PENDING,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CREDIT_CARD
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.type).toBe(TransactionType.INCOME);
    expect(callArgs.status).toBe(TransactionStatus.PENDING);
    expect(callArgs.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
  });

  it('should handle form submission with different currencies', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'EUR',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.currency).toBe('EUR');
  });

  it('should handle form submission with date parsing', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.date).toEqual(jasmine.any(Date));
    expect(callArgs.date?.getFullYear()).toBe(2024);
    expect(callArgs.date?.getMonth()).toBe(0); // January is 0
    expect(callArgs.date?.getDate()).toBe(15);
  });

  it('should handle form submission with amount parsing', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: '150.75',
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.amount).toBe(150.75);
  });

  it('should handle form submission with different payment methods', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.BANK_TRANSFER
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.paymentMethod).toBe(PaymentMethod.BANK_TRANSFER);
  });

  it('should handle form submission with different currencies', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'EUR',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.currency).toBe('EUR');
  });

  it('should handle form submission with different transaction types', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.INCOME,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.type).toBe(TransactionType.INCOME);
  });

  it('should handle form submission with different transaction statuses', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.PENDING,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.status).toBe(TransactionStatus.PENDING);
  });

  it('should handle form submission with different amounts', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 250.75,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.amount).toBe(250.75);
  });

  it('should handle form submission with different dates', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-12-25',
      paymentMethod: PaymentMethod.CASH
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.date).toEqual(new Date('2024-12-25'));
  });

  it('should validate required fields on form submission', () => {
    component.ngOnInit();
    
    // Try to submit without required fields
    component.onSubmit();
    
    expect(component.transactionForm.get('title')?.invalid).toBe(true);
    expect(component.transactionForm.get('amount')?.invalid).toBe(true);
    expect(mockTransactionService.createTransaction).not.toHaveBeenCalled();
  });

  it('should validate minimum title length', () => {
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'ab', // Less than 3 characters
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    expect(component.transactionForm.get('title')?.invalid).toBe(true);
  });

  it('should validate maximum title length', () => {
    component.ngOnInit();
    const longTitle = 'a'.repeat(101); // More than 100 characters
    component.transactionForm.patchValue({
      title: longTitle,
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    expect(component.transactionForm.get('title')?.invalid).toBe(true);
  });

  it('should validate minimum amount', () => {
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 0, // Less than 0.01
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    expect(component.transactionForm.get('amount')?.invalid).toBe(true);
  });

  it('should validate negative amount', () => {
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: -10, // Negative amount
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    expect(component.transactionForm.get('amount')?.invalid).toBe(true);
  });

  it('should validate maximum description length', () => {
    component.ngOnInit();
    const longDescription = 'a'.repeat(501); // More than 500 characters
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      description: longDescription
    });

    expect(component.transactionForm.get('description')?.invalid).toBe(true);
  });

  it('should handle getFieldControl with valid field name', () => {
    component.ngOnInit();
    const control = component['getFieldControl']('title');
    expect(control).toBe(component.transactionForm.get('title'));
  });

  it('should handle getFieldControl with invalid field name', () => {
    component.ngOnInit();
    const control = component['getFieldControl']('invalidField');
    expect(control).toBeNull();
  });

  it('should handle isFieldInvalid with valid field name', () => {
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'ab', // Invalid - too short
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });
    component.transactionForm.get('title')?.markAsTouched();

    expect(component['isFieldInvalid']('title')).toBe(true);
  });

  it('should handle isFieldInvalid with invalid field name', () => {
    component.ngOnInit();
    expect(component['isFieldInvalid']('invalidField')).toBe(false);
  });

  it('should handle getFieldError with valid field name and error', () => {
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'ab', // Invalid - too short
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });
    component.transactionForm.get('title')?.markAsTouched();

    const error = component['getFieldError']('title');
    expect(error).toBeTruthy();
  });

  it('should handle getFieldError with invalid field name', () => {
    component.ngOnInit();
    const error = component['getFieldError']('invalidField');
    expect(error).toBe('');
  });

  it('should handle getFieldError with field that has no errors', () => {
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Valid Title',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH
    });

    const error = component['getFieldError']('title');
    expect(error).toBe('');
  });

  it('should handle form submission with tags containing commas', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      tags: 'tag1, tag2, tag3'
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.tags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('should handle form submission with tags containing spaces', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      tags: 'tag1  tag2  tag3'
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.tags).toEqual(['tag1  tag2  tag3']);
  });

  it('should handle form submission with mixed tag separators', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      tags: 'tag1, tag2; tag3  tag4'
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.tags).toEqual(['tag1', 'tag2; tag3  tag4']);
  });

  it('should handle form submission with empty tags string', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      tags: ''
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.tags).toEqual([]);
  });

  it('should handle form submission with whitespace-only tags', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      tags: '   '
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.tags).toEqual([]);
  });

  it('should handle form submission with time and timezone', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      time: '14:30',
      timezone: 'America/New_York'
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.time).toBe('14:30');
    expect(callArgs.timezone).toBe('America/New_York');
  });

  it('should handle form submission with location data', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      location: {
        name: 'Test Location',
        address: '123 Test St',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      }
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.location?.name).toBe('Test Location');
    expect(callArgs.location?.address).toBe('123 Test St');
    expect(callArgs.location?.coordinates?.latitude).toBe(40.7128);
    expect(callArgs.location?.coordinates?.longitude).toBe(-74.0060);
  });

  it('should handle form submission with partial location data', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      location: {
        name: 'Test Location',
        address: '',
        coordinates: {
          latitude: 0,
          longitude: 0
        }
      }
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.location?.name).toBe('Test Location');
    expect(callArgs.location?.address).toBe('');
    expect(callArgs.location?.coordinates?.latitude).toBe(0);
    expect(callArgs.location?.coordinates?.longitude).toBe(0);
  });

  it('should handle form submission with recurrence data', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      isRecurring: true,
      recurrencePattern: RecurrencePattern.MONTHLY,
      recurrenceInterval: 2,
      recurrenceEndDate: '2024-12-31'
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.isRecurring).toBe(true);
    expect(callArgs.recurrencePattern).toBe(RecurrencePattern.MONTHLY);
    expect(callArgs.recurrenceInterval).toBe(2);
    expect(callArgs.recurrenceEndDate).toEqual(new Date('2024-12-31'));
  });

  it('should handle form submission with different recurrence patterns', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      isRecurring: true,
      recurrencePattern: RecurrencePattern.WEEKLY,
      recurrenceInterval: 1
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.recurrencePattern).toBe(RecurrencePattern.WEEKLY);
  });

  it('should handle form submission with daily recurrence pattern', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      isRecurring: true,
      recurrencePattern: RecurrencePattern.DAILY,
      recurrenceInterval: 1
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.recurrencePattern).toBe(RecurrencePattern.DAILY);
    expect(callArgs.recurrenceInterval).toBeUndefined();
  });

  it('should handle form submission with yearly recurrence pattern', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      isRecurring: true,
      recurrencePattern: RecurrencePattern.YEARLY,
      recurrenceInterval: 3
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.recurrencePattern).toBe(RecurrencePattern.YEARLY);
    expect(callArgs.recurrenceInterval).toBe(3);
  });

  it('should handle form submission with no recurrence end date', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CASH,
      isRecurring: true,
      recurrencePattern: RecurrencePattern.MONTHLY,
      recurrenceInterval: 1,
      recurrenceEndDate: ''
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.recurrenceEndDate).toBeUndefined();
  });

  it('should handle form submission with different payment methods', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.CREDIT_CARD
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
  });

  it('should handle form submission with debit card payment method', () => {
    mockTransactionService.createTransaction.and.returnValue(of(mockTransaction));
    
    component.ngOnInit();
    component.transactionForm.patchValue({
      title: 'Test Transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      date: '2024-01-15',
      paymentMethod: PaymentMethod.DEBIT_CARD
    });

    component.onSubmit();

    const callArgs = mockTransactionService.createTransaction.calls.mostRecent().args[0];
    expect(callArgs.paymentMethod).toBe(PaymentMethod.DEBIT_CARD);
  });


});
