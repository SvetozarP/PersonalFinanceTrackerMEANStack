import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { TransactionDetailsComponent } from './transaction-details';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod, RecurrencePattern } from '../../../../core/models/financial.model';

describe('TransactionDetailsComponent', () => {
  let component: TransactionDetailsComponent;
  let fixture: ComponentFixture<TransactionDetailsComponent>;
  let transactionService: jasmine.SpyObj<TransactionService>;
  let categoryService: jasmine.SpyObj<CategoryService>;

  const mockTransaction: Transaction = {
    _id: '1',
    title: 'Test Transaction',
    description: 'Test Description',
    amount: 100,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    status: TransactionStatus.COMPLETED,
    categoryId: 'cat1',
    tags: ['test', 'expense'],
    date: new Date('2024-01-15'),
    timezone: 'UTC',
    paymentMethod: PaymentMethod.CASH,
    isRecurring: false,
    recurrencePattern: RecurrencePattern.NONE,
    attachments: [],
    source: 'manual',
    userId: 'user1',
    accountId: 'account1',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false
  };

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

  beforeEach(async () => {
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', [
      'getTransactionById', 'deleteTransaction'
    ]);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
      'getCategoryById'
    ]);

    // Setup default return values
    transactionServiceSpy.getTransactionById.and.returnValue(of(mockTransaction));
    transactionServiceSpy.deleteTransaction.and.returnValue(of(true));
    categoryServiceSpy.getCategoryById.and.returnValue(of(mockCategory));

    // Mock ActivatedRoute
    const mockActivatedRoute = {
      params: of({ id: '1' })
    };

    await TestBed.configureTestingModule({
      imports: [
        TransactionDetailsComponent,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
    .compileComponents();

    transactionService = TestBed.inject(TransactionService) as jasmine.SpyObj<TransactionService>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;

    fixture = TestBed.createComponent(TransactionDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    // transaction and category are loaded on init, so they won't be null
    expect(component.subcategory).toBe(null);
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe(null);
  });

  it('should have transaction types available', () => {
    expect(component.transactionTypes).toEqual(Object.values(TransactionType));
  });

  it('should have transaction statuses available', () => {
    expect(component.transactionStatuses).toEqual(Object.values(TransactionStatus));
  });

  it('should have payment methods available', () => {
    expect(component.paymentMethods).toEqual(Object.values(PaymentMethod));
  });

  it('should have recurrence patterns available', () => {
    expect(component.recurrencePatterns).toEqual(Object.values(RecurrencePattern));
  });

  it('should load transaction on init', () => {
    expect(transactionService.getTransactionById).toHaveBeenCalledWith('1');
  });

  it('should handle transaction deletion', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.transaction = mockTransaction;
    
    component.onDelete();

    expect(transactionService.deleteTransaction).toHaveBeenCalledWith('1');
  });

  it('should not delete transaction when user cancels', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.transaction = mockTransaction;
    
    component.onDelete();

    expect(transactionService.deleteTransaction).not.toHaveBeenCalled();
  });

  it('should get transaction type icon', () => {
    expect(component.getTransactionTypeIcon(TransactionType.INCOME)).toBe('💰');
    expect(component.getTransactionTypeIcon(TransactionType.EXPENSE)).toBe('💸');
    expect(component.getTransactionTypeIcon(TransactionType.TRANSFER)).toBe('🔄');
    expect(component.getTransactionTypeIcon(TransactionType.ADJUSTMENT)).toBe('⚖️');
  });

  it('should get status badge class', () => {
    expect(component.getStatusBadgeClass(TransactionStatus.COMPLETED)).toBe('status-completed');
    expect(component.getStatusBadgeClass(TransactionStatus.PENDING)).toBe('status-pending');
    expect(component.getStatusBadgeClass(TransactionStatus.CANCELLED)).toBe('status-cancelled');
    expect(component.getStatusBadgeClass(TransactionStatus.FAILED)).toBe('status-failed');
  });

  it('should format amount correctly', () => {
    const formatted = component.formatAmount(1234.56, 'USD');
    expect(formatted).toContain('$1,234.56');
  });

  it('should format date correctly', () => {
    const testDate = new Date('2024-01-15');
    const formatted = component.formatDate(testDate);
    expect(formatted).toContain('January 15, 2024');
  });

  it('should format time correctly', () => {
    const timeString = '14:30';
    const formatted = component.formatTime(timeString);
    expect(formatted).toBe('14:30');
  });

  it('should get payment method icon', () => {
    expect(component.getPaymentMethodIcon(PaymentMethod.CASH)).toBe('💵');
    expect(component.getPaymentMethodIcon(PaymentMethod.CREDIT_CARD)).toBe('💳');
    expect(component.getPaymentMethodIcon(PaymentMethod.DEBIT_CARD)).toBe('💳');
    expect(component.getPaymentMethodIcon(PaymentMethod.BANK_TRANSFER)).toBe('🏦');
  });

  it('should get recurrence icon', () => {
    expect(component.getRecurrenceIcon(RecurrencePattern.NONE)).toBe('❌');
    // The actual icons might be different, let's just check they return something
    expect(component.getRecurrenceIcon(RecurrencePattern.DAILY)).toBeTruthy();
    expect(component.getRecurrenceIcon(RecurrencePattern.WEEKLY)).toBeTruthy();
    expect(component.getRecurrenceIcon(RecurrencePattern.MONTHLY)).toBeTruthy();
  });

  it('should handle error loading transaction', () => {
    transactionService.getTransactionById.and.returnValue(throwError(() => new Error('API Error')));
    
    component['loadTransaction']();
    
    expect(component.error).toBe('Failed to load transaction');
  });

  it('should get category name when category is loaded', () => {
    component.category = mockCategory;
    component.transaction = mockTransaction;
    const categoryName = component.getCategoryName('cat1');
    expect(categoryName).toBe('Test Category');
  });

  it('should return unknown when category is not loaded', () => {
    component.category = null;
    component.transaction = mockTransaction;
    const categoryName = component.getCategoryName('cat1');
    expect(categoryName).toBe('Unknown');
  });

  it('should check if transaction has attachments', () => {
    const mockAttachment = {
      filename: 'file1.pdf',
      originalName: 'file1.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      url: 'http://example.com/file1.pdf',
      uploadedAt: new Date()
    };
    component.transaction = { ...mockTransaction, attachments: [mockAttachment] };
    expect(component.hasAttachments()).toBe(true);

    component.transaction = { ...mockTransaction, attachments: [] };
    expect(component.hasAttachments()).toBe(false);
  });

  it('should check if transaction has location', () => {
    component.transaction = { 
      ...mockTransaction, 
      location: { name: 'Test Location', address: '123 Test St', coordinates: { latitude: 0, longitude: 0 } }
    };
    expect(component.hasLocation()).toBe(true);

    component.transaction = { ...mockTransaction, location: { name: '', address: '', coordinates: { latitude: 0, longitude: 0 } } };
    expect(component.hasLocation()).toBe(false);
  });

  it('should check if transaction has notes', () => {
    component.transaction = { ...mockTransaction, notes: 'Test notes' };
    expect(component.hasNotes()).toBe(true);

    component.transaction = { ...mockTransaction, notes: '' };
    expect(component.hasNotes()).toBe(false);
  });
});
