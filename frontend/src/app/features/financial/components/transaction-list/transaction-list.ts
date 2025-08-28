import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod, QueryOptions } from '../../../../core/models/financial.model';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { SkeletonContentLoaderComponent } from '../../../../shared';


@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SkeletonContentLoaderComponent,
  ],
  templateUrl: './transaction-list.html',
  styleUrls: ['./transaction-list.scss']
})
export class TransactionListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);

  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  categories: any[] = [];
  
  // Granular loading states
  isTransactionsLoading = false;
  isCategoriesLoading = false;
  isFiltering = false;
  isDeleting = false;
  isExporting = false;
  
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;
  
  // Filtering
  searchTerm = '';
  selectedType: TransactionType | '' = '';
  selectedStatus: TransactionStatus | '' = '';
  selectedCategory = '';
  dateRange = { start: '', end: '' };
  
  // Sorting
  sortBy = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Transaction types and statuses for filter dropdowns
  transactionTypes = Object.values(TransactionType);
  transactionStatuses = Object.values(TransactionStatus);
  paymentMethods = Object.values(PaymentMethod);

  ngOnInit(): void {
    this.loadCategories();
    this.loadTransactions();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    // Debounce search input to avoid too many API calls
    // This would be implemented with a form control in a real scenario
  }

  private loadCategories(): void {
    this.isCategoriesLoading = true;
    
    this.categoryService.getUserCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.isCategoriesLoading = false;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.isCategoriesLoading = false;
        }
      });
  }

  private loadTransactions(): void {
    this.isTransactionsLoading = true;
    this.error = null;

    const options: QueryOptions & {
      type?: TransactionType;
      status?: TransactionStatus;
      categoryId?: string;
    } = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      search: this.searchTerm || undefined,
      startDate: this.dateRange.start ? new Date(this.dateRange.start) : undefined,
      endDate: this.dateRange.end ? new Date(this.dateRange.end) : undefined,
      type: this.selectedType || undefined,
      status: this.selectedStatus || undefined,
      categoryId: this.selectedCategory || undefined
    };

    this.transactionService.getUserTransactions(options)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.transactions = response.data || [];
          this.filteredTransactions = response.data || [];
          
          // Safely access pagination properties with fallbacks
          if (response.pagination) {
            this.totalItems = response.pagination.total || 0;
            this.totalPages = response.pagination.totalPages || 1;
          } else {
            // Fallback if pagination is missing
            this.totalItems = response.data?.length || 0;
            this.totalPages = 1;
          }
          
          this.isTransactionsLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load transactions';
          this.isTransactionsLoading = false;
          console.error('Error loading transactions:', error);
        }
      });
  }

  onSearch(): void {
    this.isFiltering = true;
    this.currentPage = 1; // Reset to first page when searching
    
    // Simulate a small delay to show loading state
    setTimeout(() => {
      this.loadTransactions();
      this.isFiltering = false;
    }, 300);
  }

  onFilterChange(): void {
    this.onSearch();
  }

  onSortChange(): void {
    this.loadTransactions();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTransactions();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.loadTransactions();
  }

  deleteTransaction(transactionId: string): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.isDeleting = true;
      
      this.transactionService.deleteTransaction(transactionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Remove from local arrays
            this.transactions = this.transactions.filter(t => t._id !== transactionId);
            this.filteredTransactions = this.filteredTransactions.filter(t => t._id !== transactionId);
            this.totalItems = Math.max(0, this.totalItems - 1);
            this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
            
            // If current page is now empty and not the first page, go to previous page
            if (this.transactions.length === 0 && this.currentPage > 1) {
              this.currentPage--;
            }
            
            this.isDeleting = false;
          },
          error: (error) => {
            this.error = 'Failed to delete transaction';
            this.isDeleting = false;
            console.error('Error deleting transaction:', error);
          }
        });
    }
  }

  exportTransactions(): void {
    this.isExporting = true;
    
    // Simulate export process
    setTimeout(() => {
      // This would trigger actual export logic
      console.log('Exporting transactions...');
      this.isExporting = false;
    }, 2000);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.selectedCategory = '';
    this.dateRange = { start: '', end: '' };
    this.currentPage = 1;
    this.onSearch();
  }

  // Helper methods
  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category ? category.name : 'Unknown';
  }

  getCategoryColor(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category?.color || '#667eea';
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

  getTransactionTypeIcon(type: TransactionType): string {
    switch (type) {
      case TransactionType.INCOME: return '💰';
      case TransactionType.EXPENSE: return '💸';
      case TransactionType.TRANSFER: return '🔄';
      case TransactionType.ADJUSTMENT: return '⚖️';
      default: return '';
    }
  }

  getTransactionStatusClass(status: TransactionStatus): string {
    switch (status) {
      case TransactionStatus.COMPLETED: return 'status-completed';
      case TransactionStatus.PENDING: return 'status-pending';
      case TransactionStatus.FAILED: return 'status-failed';
      case TransactionStatus.CANCELLED: return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  // Computed properties for loading states
  get isLoading(): boolean {
    return this.isTransactionsLoading || this.isCategoriesLoading;
  }

  get isAnyActionLoading(): boolean {
    return this.isFiltering || this.isDeleting || this.isExporting;
  }

  get hasTransactions(): boolean {
    return this.transactions.length > 0;
  }

  get hasCategories(): boolean {
    return this.categories.length > 0;
  }

  get showPagination(): boolean {
    return this.totalPages > 1;
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      const end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  // Pagination helper methods
  getPaginationStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      const end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  // Sorting method
  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.onSortChange();
  }

  // Format amount method
  formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Amount class method - replaces the problematic [class] binding
  getAmountClass(type: TransactionType): string {
    if (type === TransactionType.EXPENSE) {
      return 'negative';
    } else if (type === TransactionType.INCOME) {
      return 'positive';
    }
    return 'neutral';
  }

  // Status badge class method
  getStatusBadgeClass(status: TransactionStatus): string {
    switch (status) {
      case TransactionStatus.COMPLETED: return 'status-completed';
      case TransactionStatus.PENDING: return 'status-pending';
      case TransactionStatus.FAILED: return 'status-failed';
      case TransactionStatus.CANCELLED: return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  // Transaction delete method
  onTransactionDelete(transactionId: string): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.isDeleting = true;
      
      this.transactionService.deleteTransaction(transactionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Remove from local arrays
            this.transactions = this.transactions.filter(t => t._id !== transactionId);
            this.filteredTransactions = this.filteredTransactions.filter(t => t._id !== transactionId);
            this.totalItems--;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            
            // If current page is now empty and not the first page, go to previous page
            if (this.transactions.length === 0 && this.currentPage > 1) {
              this.currentPage--;
            }
            
            this.isDeleting = false;
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