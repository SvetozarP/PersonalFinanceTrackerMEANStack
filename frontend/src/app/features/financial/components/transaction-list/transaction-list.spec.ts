import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { TransactionListComponent } from './transaction-list';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod } from '../../../../core/models/financial.model';

describe('TransactionListComponent', () => {
  let component: TransactionListComponent;
  let fixture: ComponentFixture<TransactionListComponent>;
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
    tags: [],
    date: new Date(),
    timezone: 'UTC',
    paymentMethod: PaymentMethod.CASH,
    isRecurring: false,
    recurrencePattern: 'none' as any,
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
      'getUserTransactions', 'deleteTransaction'
    ]);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
      'getUserCategories'
    ]);

    // Setup default return values
    transactionServiceSpy.getUserTransactions.and.returnValue(of({
      data: [mockTransaction],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      }
    }));
    transactionServiceSpy.deleteTransaction.and.returnValue(of(true));
    categoryServiceSpy.getUserCategories.and.returnValue(of([mockCategory]));

    await TestBed.configureTestingModule({
      imports: [
        TransactionListComponent,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy }
      ]
    })
    .compileComponents();

    transactionService = TestBed.inject(TransactionService) as jasmine.SpyObj<TransactionService>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;

    fixture = TestBed.createComponent(TransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.currentPage).toBe(1);
    expect(component.pageSize).toBe(20);
    expect(component.searchTerm).toBe('');
    expect(component.selectedType).toBe('');
    expect(component.selectedStatus).toBe('');
    expect(component.selectedCategory).toBe('');
    expect(component.sortBy).toBe('date');
    expect(component.sortOrder).toBe('desc');
  });

  it('should load categories and transactions on init', () => {
    expect(categoryService.getUserCategories).toHaveBeenCalled();
    expect(transactionService.getUserTransactions).toHaveBeenCalled();
  });

  it('should have transaction types and statuses', () => {
    expect(component.transactionTypes).toEqual(Object.values(TransactionType));
    expect(component.transactionStatuses).toEqual(Object.values(TransactionStatus));
    expect(component.paymentMethods).toEqual(Object.values(PaymentMethod));
  });

  it('should handle search', () => {
    component.searchTerm = 'test';
    component.onSearch();
    
    expect(component.currentPage).toBe(1);
    expect(transactionService.getUserTransactions).toHaveBeenCalled();
  });

  it('should handle filter changes', () => {
    component.selectedType = TransactionType.EXPENSE;
    component.onFilterChange();
    
    expect(component.currentPage).toBe(1);
    expect(transactionService.getUserTransactions).toHaveBeenCalled();
  });

  it('should handle sorting', () => {
    // Test same column sort order change
    component.onSort('date');
    expect(component.sortOrder).toBe('asc');
    
    component.onSort('date');
    expect(component.sortOrder).toBe('desc');
    
    // Test different column
    component.onSort('amount');
    expect(component.sortBy).toBe('amount');
    expect(component.sortOrder).toBe('asc');
  });

  it('should handle page changes', () => {
    component.onPageChange(2);
    expect(component.currentPage).toBe(2);
    expect(transactionService.getUserTransactions).toHaveBeenCalled();
  });

  it('should handle transaction deletion', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.onTransactionDelete('1');
    
    expect(transactionService.deleteTransaction).toHaveBeenCalledWith('1');
  });

  it('should not delete transaction when user cancels', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.onTransactionDelete('1');
    
    expect(transactionService.deleteTransaction).not.toHaveBeenCalled();
  });

  it('should calculate pagination correctly', () => {
    component.currentPage = 2;
    component.pageSize = 20;
    component.totalItems = 50;
    
    expect(component.getPaginationStart()).toBe(21);
    expect(component.getPaginationEnd()).toBe(40);
  });

  it('should get correct transaction type icon', () => {
    expect(component.getTransactionTypeIcon(TransactionType.INCOME)).toBe('💰');
    expect(component.getTransactionTypeIcon(TransactionType.EXPENSE)).toBe('💸');
    expect(component.getTransactionTypeIcon(TransactionType.TRANSFER)).toBe('🔄');
    expect(component.getTransactionTypeIcon(TransactionType.ADJUSTMENT)).toBe('⚖️');
  });

  it('should get correct status badge class', () => {
    expect(component.getStatusBadgeClass(TransactionStatus.COMPLETED)).toBe('badge-success');
    expect(component.getStatusBadgeClass(TransactionStatus.PENDING)).toBe('badge-warning');
    expect(component.getStatusBadgeClass(TransactionStatus.CANCELLED)).toBe('badge-danger');
    expect(component.getStatusBadgeClass(TransactionStatus.FAILED)).toBe('badge-danger');
  });

  it('should format amount correctly', () => {
    const formatted = component.formatAmount(1234.56, 'USD');
    expect(formatted).toContain('$1,234.56');
  });

  it('should format date correctly', () => {
    const testDate = new Date('2024-01-15');
    const formatted = component.formatDate(testDate);
    expect(formatted).toContain('Jan 15, 2024');
  });

  it('should get category name correctly', () => {
    const categoryName = component.getCategoryName('cat1');
    expect(categoryName).toBe('Test Category');
  });

  it('should return unknown for non-existent category', () => {
    const categoryName = component.getCategoryName('non-existent');
    expect(categoryName).toBe('Unknown');
  });

  it('should clear filters correctly', () => {
    component.searchTerm = 'test';
    component.selectedType = TransactionType.EXPENSE;
    component.selectedStatus = TransactionStatus.COMPLETED;
    component.selectedCategory = 'cat1';
    component.dateRange = { start: '2024-01-01', end: '2024-12-31' };
    component.currentPage = 3;
    
    component.clearFilters();
    
    expect(component.searchTerm).toBe('');
    expect(component.selectedType).toBe('');
    expect(component.selectedStatus).toBe('');
    expect(component.selectedCategory).toBe('');
    expect(component.dateRange).toEqual({ start: '', end: '' });
    expect(component.currentPage).toBe(1);
    expect(transactionService.getUserTransactions).toHaveBeenCalled();
  });
});
