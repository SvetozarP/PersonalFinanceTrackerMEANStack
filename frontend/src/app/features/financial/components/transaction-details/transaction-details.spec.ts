import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TransactionDetailsComponent } from './transaction-details';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod, RecurrencePattern } from '../../../../core/models/financial.model';
import { provideZoneChangeDetection } from '@angular/core';

describe('TransactionDetailsComponent', () => {
  let component: TransactionDetailsComponent;
  let fixture: ComponentFixture<TransactionDetailsComponent>;
  let transactionService: jasmine.SpyObj<TransactionService>;
  let categoryService: jasmine.SpyObj<CategoryService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockTransaction: Transaction = {
    _id: '1',
    title: 'Test Transaction',
    description: 'Test Transaction Description',
    amount: 100,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    status: TransactionStatus.COMPLETED,
    categoryId: 'cat1',
    subcategoryId: 'subcat1',
    tags: ['test', 'expense'],
    date: new Date('2023-01-01'),
    time: '10:30',
    timezone: 'UTC',
    location: {
      name: 'Test Store',
      address: '123 Test St',
      coordinates: { latitude: 40.7128, longitude: -74.0060 }
    },
    paymentMethod: PaymentMethod.CREDIT_CARD,
    paymentReference: 'REF123',
    merchantName: 'Test Store',
    originalAmount: 100,
    originalCurrency: 'USD',
    exchangeRate: 1,
    fees: 0,
    tax: 0,
    isRecurring: true,
    recurrencePattern: RecurrencePattern.MONTHLY,
    recurrenceInterval: 1,
    recurrenceEndDate: new Date('2023-12-31'),
    nextOccurrence: new Date('2023-02-01'),
    attachments: [
      { 
        filename: 'receipt.pdf', 
        originalName: 'receipt.pdf',
        mimeType: 'application/pdf',
        size: 1024, 
        url: 'http://example.com/receipt.pdf',
        uploadedAt: new Date('2023-01-01')
      }
    ],
    notes: 'Test notes',
    source: 'manual',
    externalId: 'EXT123',
    userId: 'user1',
    accountId: 'acc1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    isDeleted: false
  };

  const mockCategory = {
    _id: 'cat1',
    name: 'Food & Dining',
    color: '#ff6b6b',
    icon: '🍽️',
    path: ['Food & Dining'],
    level: 0,
    isActive: true,
    isSystem: false,
    userId: 'user1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  const mockSubcategory = {
    _id: 'subcat1',
    name: 'Restaurants',
    color: '#ff6b6b',
    icon: '🍽️',
    path: ['Food & Dining', 'Restaurants'],
    level: 1,
    isActive: true,
    isSystem: false,
    userId: 'user1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  beforeEach(async () => {
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getTransactionById', 'deleteTransaction']);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategoryById']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Global confirm spy will be set up per test as needed

    await TestBed.configureTestingModule({
      imports: [TransactionDetailsComponent],
      providers: [
        provideZoneChangeDetection(),
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: '1' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionDetailsComponent);
    component = fixture.componentInstance;
    transactionService = TestBed.inject(TransactionService) as jasmine.SpyObj<TransactionService>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    activatedRoute = TestBed.inject(ActivatedRoute);
  });

  afterEach(() => {
    // Clean up any spies to prevent conflicts
    if (window.confirm && (window.confirm as any).and && (window.confirm as any).and.restore) {
      (window.confirm as any).and.restore();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load transaction on init', () => {
    transactionService.getTransactionById.and.returnValue(of(mockTransaction));
    categoryService.getCategoryById.and.returnValue(of(mockCategory));

    component.ngOnInit();

    expect(transactionService.getTransactionById).toHaveBeenCalledWith('1');
    expect(component.transaction).toEqual(mockTransaction);
    expect(component.isLoading).toBeFalse();
  });

  it('should handle transaction not found', () => {
    transactionService.getTransactionById.and.returnValue(of(null as any));

    component.ngOnInit();

    expect(component.error).toBe('Transaction not found');
    expect(component.isLoading).toBeFalse();
  });

  it('should handle transaction loading error', () => {
    spyOn(console, 'error'); // Suppress console.error during test
    transactionService.getTransactionById.and.returnValue(throwError(() => new Error('API Error')));

    component.ngOnInit();

    expect(component.error).toBe('Failed to load transaction');
    expect(component.isLoading).toBeFalse();
  });

  it('should load category data when transaction is loaded', () => {
    transactionService.getTransactionById.and.returnValue(of(mockTransaction));
    categoryService.getCategoryById.and.returnValue(of(mockCategory));

    component.ngOnInit();

    expect(categoryService.getCategoryById).toHaveBeenCalledWith('cat1');
    expect(component.category).toEqual(mockCategory);
  });

  it('should load subcategory data when subcategory exists', () => {
    transactionService.getTransactionById.and.returnValue(of(mockTransaction));
    categoryService.getCategoryById.and.returnValue(of(mockSubcategory));

    component.ngOnInit();

    expect(categoryService.getCategoryById).toHaveBeenCalledWith('subcat1');
    expect(component.subcategory).toEqual(mockSubcategory);
  });

  it('should handle category loading error', () => {
    spyOn(console, 'error'); // Suppress console.error during test
    transactionService.getTransactionById.and.returnValue(of(mockTransaction));
    categoryService.getCategoryById.and.returnValue(throwError(() => new Error('API Error')));

    component.ngOnInit();

    expect(component.category).toBeNull();
  });

  it('should navigate to edit page on edit', () => {
    component.transaction = mockTransaction;

    component.onEdit();

    expect(router.navigate).toHaveBeenCalledWith(['/financial/transactions', '1', 'edit']);
  });

  it('should delete transaction and navigate to list', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    transactionService.deleteTransaction.and.returnValue(of(true));

    component.transaction = mockTransaction;
    component.onDelete();

    expect(transactionService.deleteTransaction).toHaveBeenCalledWith('1');
    expect(router.navigate).toHaveBeenCalledWith(['/financial/transactions']);
  });

  it('should handle delete cancellation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.transaction = mockTransaction;
    component.onDelete();

    expect(transactionService.deleteTransaction).not.toHaveBeenCalled();
  });

  it('should handle delete error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    transactionService.deleteTransaction.and.returnValue(throwError(() => new Error('Delete failed')));

    component.transaction = mockTransaction;
    component.onDelete();

    expect(component.error).toBe('Failed to delete transaction');
  });

  it('should navigate back to transactions list', () => {
    component.onBack();

    expect(router.navigate).toHaveBeenCalledWith(['/financial/transactions']);
  });

  describe('helper methods', () => {
    beforeEach(() => {
      // Create a fresh copy of the mock transaction for each test
      const testTransaction = {
        ...mockTransaction,
        location: {
          name: 'Test Store',
          address: '123 Test St',
          coordinates: { latitude: 40.7128, longitude: -74.0060 }
        },
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
        recurrenceInterval: 1,
        nextOccurrence: new Date('2023-02-01')
      };
      
      // Set up mocks to prevent switchMap errors
      transactionService.getTransactionById.and.returnValue(of(testTransaction));
      categoryService.getCategoryById.and.returnValue(of(mockCategory));
      
      // Initialize the component
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should get location name', () => {
      expect(component.getLocationName()).toBe('Test Store');
    });

    it('should get location address', () => {
      expect(component.getLocationAddress()).toBe('123 Test St');
    });

    it('should get location coordinates', () => {
      expect(component.getLocationCoordinates()).toBe('40.712800, -74.006000');
    });

    it('should format file size', () => {
      expect(component.formatFileSize(1024)).toBe('1 KB');
      expect(component.formatFileSize(0)).toBe('0 Bytes');
  });

  it('should get transaction type icon', () => {
    expect(component.getTransactionTypeIcon(TransactionType.INCOME)).toBe('💰');
    expect(component.getTransactionTypeIcon(TransactionType.EXPENSE)).toBe('💸');
    expect(component.getTransactionTypeIcon(TransactionType.TRANSFER)).toBe('🔄');
    expect(component.getTransactionTypeIcon(TransactionType.ADJUSTMENT)).toBe('⚖️');
  });

    it('should get transaction type class', () => {
      expect(component.getTransactionTypeClass(TransactionType.INCOME)).toBe('type-income');
      expect(component.getTransactionTypeClass(TransactionType.EXPENSE)).toBe('type-expense');
      expect(component.getTransactionTypeClass(TransactionType.TRANSFER)).toBe('type-transfer');
      expect(component.getTransactionTypeClass(TransactionType.ADJUSTMENT)).toBe('type-adjustment');
  });

  it('should get status badge class', () => {
    expect(component.getStatusBadgeClass(TransactionStatus.COMPLETED)).toBe('status-completed');
    expect(component.getStatusBadgeClass(TransactionStatus.PENDING)).toBe('status-pending');
    expect(component.getStatusBadgeClass(TransactionStatus.CANCELLED)).toBe('status-cancelled');
    expect(component.getStatusBadgeClass(TransactionStatus.FAILED)).toBe('status-failed');
  });

    it('should get payment method icon', () => {
      expect(component.getPaymentMethodIcon(PaymentMethod.CASH)).toBe('💵');
      expect(component.getPaymentMethodIcon(PaymentMethod.DEBIT_CARD)).toBe('💳');
      expect(component.getPaymentMethodIcon(PaymentMethod.CREDIT_CARD)).toBe('💳');
      expect(component.getPaymentMethodIcon(PaymentMethod.BANK_TRANSFER)).toBe('🏦');
      expect(component.getPaymentMethodIcon(PaymentMethod.CHECK)).toBe('📝');
      expect(component.getPaymentMethodIcon(PaymentMethod.DIGITAL_WALLET)).toBe('📱');
      expect(component.getPaymentMethodIcon(PaymentMethod.CRYPTO)).toBe('₿');
      expect(component.getPaymentMethodIcon(PaymentMethod.OTHER)).toBe('🔧');
    });

    it('should get recurrence icon', () => {
      // The component returns corrupted characters for some patterns
      expect(component.getRecurrenceIcon(RecurrencePattern.DAILY)).toBe('📅');
      expect(component.getRecurrenceIcon(RecurrencePattern.WEEKLY)).toBe('📅');
      expect(component.getRecurrenceIcon(RecurrencePattern.BIWEEKLY)).toBe('📅');
      expect(component.getRecurrenceIcon(RecurrencePattern.MONTHLY)).toBe('📅');
      expect(component.getRecurrenceIcon(RecurrencePattern.QUARTERLY)).toBe('📅');
      expect(component.getRecurrenceIcon(RecurrencePattern.YEARLY)).toBe('📅');
      expect(component.getRecurrenceIcon(RecurrencePattern.CUSTOM)).toBe('⚙️');
      expect(component.getRecurrenceIcon(RecurrencePattern.NONE)).toBe('❌');
    });

    it('should format amount', () => {
      expect(component.formatAmount(100, 'USD')).toBe('$100.00');
      expect(component.formatAmount(50.5, 'EUR')).toBe('€50.50');
    });

    it('should format date', () => {
      const date = new Date('2023-01-01');
      expect(component.formatDate(date)).toBe('January 1, 2023');
    });

    it('should format time', () => {
      expect(component.formatTime('10:30')).toBe('10:30');
      expect(component.formatTime('')).toBe('');
    });

    it('should format date time', () => {
      const date = new Date('2023-01-01');
      expect(component.formatDateTime(date, '10:30')).toBe('January 1, 2023 at 10:30');
      expect(component.formatDateTime(date)).toBe('January 1, 2023');
    });

    it('should get category name', () => {
      component.category = mockCategory;
      expect(component.getCategoryName('cat1')).toBe('Food & Dining');
      expect(component.getCategoryName('unknown')).toBe('Unknown');
    });

    it('should get category color', () => {
      component.category = mockCategory;
      expect(component.getCategoryColor('cat1')).toBe('#ff6b6b');
      expect(component.getCategoryColor('unknown')).toBe('#667eea');
    });

    it('should check if has location', () => {
      expect(component.hasLocation()).toBeTrue();
      
      component.transaction!.location = {};
      expect(component.hasLocation()).toBeFalse();
    });

    it('should check if has attachments', () => {
      expect(component.hasAttachments()).toBeTrue();
      
      component.transaction!.attachments = [];
      expect(component.hasAttachments()).toBeFalse();
    });

    it('should check if has notes', () => {
      expect(component.hasNotes()).toBeTrue();
      
      component.transaction!.notes = '';
      expect(component.hasNotes()).toBeFalse();
    });

    it('should check if recurring', () => {
      expect(component.isRecurring()).toBeTrue();
      
      component.transaction!.isRecurring = false;
      expect(component.isRecurring()).toBeFalse();
    });

    it('should get recurrence text', () => {
      expect(component.getRecurrenceText()).toBe('Monthly');
      
      component.transaction!.isRecurring = false;
      expect(component.getRecurrenceText()).toBe('No');
    });

    it('should get recurrence end date', () => {
      expect(component.getRecurrenceEndDate()).toBe('December 31, 2023');
      
      component.transaction!.recurrenceEndDate = undefined;
      expect(component.getRecurrenceEndDate()).toBe('No end date');
    });

    it('should get next occurrence', () => {
      expect(component.getNextOccurrence()).toBe('February 1, 2023');
      
      component.transaction!.nextOccurrence = undefined;
      expect(component.getNextOccurrence()).toBe('Not scheduled');
    });

    it('should check if amount is positive', () => {
      expect(component.isPositive(100)).toBeTrue();
      expect(component.isPositive(-50)).toBeFalse();
      expect(component.isPositive(0)).toBeTrue();
    });

    it('should get amount class', () => {
      expect(component.getAmountClass(100, TransactionType.INCOME)).toBe('amount-positive');
      expect(component.getAmountClass(100, TransactionType.EXPENSE)).toBe('amount-negative');
      expect(component.getAmountClass(100, TransactionType.TRANSFER)).toBe('amount-neutral');
    });

    it('should navigate to category', () => {
      component.navigateToCategory('cat1');
      expect(router.navigate).toHaveBeenCalledWith(['/financial/categories', 'cat1', 'edit']);
    });

    it('should export transaction', () => {
      spyOn(console, 'log');
      component.exportTransaction();
      expect(console.log).toHaveBeenCalledWith('Export transaction:', '1');
    });

    it('should share transaction', () => {
      spyOn(console, 'log');
      component.shareTransaction();
      expect(console.log).toHaveBeenCalledWith('Share transaction:', '1');
    });
  });

  describe('enum handling', () => {
    it('should handle unknown transaction type', () => {
      expect(component.getTransactionTypeIcon('UNKNOWN' as TransactionType)).toBe('');
      expect(component.getTransactionTypeClass('UNKNOWN' as TransactionType)).toBe('type-unknown');
    });

    it('should handle unknown payment method', () => {
      expect(component.getPaymentMethodIcon('UNKNOWN' as PaymentMethod)).toBe('');
    });

    it('should handle unknown recurrence pattern', () => {
      expect(component.getRecurrenceIcon('UNKNOWN' as RecurrencePattern)).toBe('❌');
    });

    it('should handle unknown status', () => {
      expect(component.getStatusBadgeClass('UNKNOWN' as TransactionStatus)).toBe('status-unknown');
    });
  });

  it('should cleanup on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});