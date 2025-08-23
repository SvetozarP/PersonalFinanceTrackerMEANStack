import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod, QueryOptions } from '../../../../core/models/financial.model';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
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
  isLoading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  
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
    this.categoryService.getUserCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  private loadTransactions(): void {
    this.isLoading = true;
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
          this.transactions = response.data;
          this.filteredTransactions = this.transactions;
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.totalPages;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load transactions';
          this.isLoading = false;
          console.error('Error loading transactions:', error);
        }
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadTransactions();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.loadTransactions();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTransactions();
  }

  onTransactionDelete(transactionId: string): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.transactionService.deleteTransaction(transactionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadTransactions();
          },
          error: (error) => {
            console.error('Error deleting transaction:', error);
            this.error = 'Failed to delete transaction';
          }
        });
    }
  }

  // Pagination helper methods
  getPaginationStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
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

  getStatusBadgeClass(status: TransactionStatus): string {
    switch (status) {
      case TransactionStatus.COMPLETED: return 'badge-success';
      case TransactionStatus.PENDING: return 'badge-warning';
      case TransactionStatus.CANCELLED: return 'badge-danger';
      case TransactionStatus.FAILED: return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category ? category.name : 'Unknown';
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.selectedCategory = '';
    this.dateRange = { start: '', end: '' };
    this.currentPage = 1;
    this.loadTransactions();
  }
}