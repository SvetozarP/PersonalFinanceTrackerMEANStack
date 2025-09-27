import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod, RecurrencePattern } from '../../../../core/models/financial.model';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './transaction-details.html',
  styleUrls: ['./transaction-details.scss']
})
export class TransactionDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  transaction: Transaction | null = null;
  category: any = null;
  subcategory: any = null;
  isLoading = false;
  error: string | null = null;

  // Enums for template
  transactionTypes = Object.values(TransactionType);
  transactionStatuses = Object.values(TransactionStatus);
  paymentMethods = Object.values(PaymentMethod);
  recurrencePatterns = Object.values(RecurrencePattern);

  ngOnInit(): void {
    this.loadTransaction();
    
    // Subscribe to transaction service loading state
    this.transactionService.isLoading$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isLoading => {
      this.isLoading = isLoading;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTransaction(): void {
    this.error = null;

    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const id = params['id'];
        if (id) {
          return this.transactionService.getTransactionById(id);
        }
        return of(null);
      })
    ).subscribe({
      next: (transaction) => {
        if (transaction) {
          this.transaction = transaction;
          this.loadCategoryData();
        } else {
          this.error = 'Transaction not found';
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = 'Failed to load transaction';
        console.error('Error loading transaction:', error);
        this.cdr.detectChanges();
      }
    });
  }

  private loadCategoryData(): void {
    if (!this.transaction) return;

    // Load main category
    this.categoryService.getCategoryById(this.transaction.categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (category) => {
          this.category = category;
        },
        error: (error) => {
          console.error('Error loading category:', error);
        }
      });

    // Load subcategory if exists
    if (this.transaction.subcategoryId) {
      this.categoryService.getCategoryById(this.transaction.subcategoryId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (subcategory) => {
            this.subcategory = subcategory;
          },
          error: (error) => {
            console.error('Error loading subcategory:', error);
          }
        });
    }
  }

  onEdit(): void {
    if (this.transaction) {
      this.router.navigate(['/financial/transactions', this.transaction._id, 'edit']);
    }
  }

  onDelete(): void {
    if (!this.transaction) return;

    if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      this.transactionService.deleteTransaction(this.transaction._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.router.navigate(['/financial/transactions']);
          },
          error: (error) => {
            console.error('Error deleting transaction:', error);
            this.error = 'Failed to delete transaction';
          }
        });
    }
  }

  onBack(): void {
    this.router.navigate(['/financial/transactions']);
  }

  // Safe helper methods for potentially undefined values
  getLocationName(): string | null {
    return this.transaction?.location?.name || null;
  }

  getLocationAddress(): string | null {
    return this.transaction?.location?.address || null;
  }

  getLocationCoordinates(): string | null {
    const coords = this.transaction?.location?.coordinates;
    if (coords?.latitude && coords?.longitude) {
      return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
    }
    return null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Helper methods for template
  getTransactionTypeIcon(type: TransactionType): string {
    switch (type) {
      case TransactionType.INCOME: return '💰';
      case TransactionType.EXPENSE: return '💸';
      case TransactionType.TRANSFER: return '🔄';
      case TransactionType.ADJUSTMENT: return '⚖️';
      default: return '';
    }
  }

  getTransactionTypeClass(type: TransactionType): string {
    switch (type) {
      case TransactionType.INCOME: return 'type-income';
      case TransactionType.EXPENSE: return 'type-expense';
      case TransactionType.TRANSFER: return 'type-transfer';
      case TransactionType.ADJUSTMENT: return 'type-adjustment';
      default: return 'type-unknown';
    }
  }

  getStatusBadgeClass(status: TransactionStatus): string {
    switch (status) {
      case TransactionStatus.COMPLETED: return 'status-completed';
      case TransactionStatus.PENDING: return 'status-pending';
      case TransactionStatus.CANCELLED: return 'status-cancelled';
      case TransactionStatus.FAILED: return 'status-failed';
      default: return 'status-unknown';
    }
  }

  getPaymentMethodIcon(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CASH: return '💵';
      case PaymentMethod.DEBIT_CARD: return '💳';
      case PaymentMethod.CREDIT_CARD: return '💳';
      case PaymentMethod.BANK_TRANSFER: return '🏦';
      case PaymentMethod.CHECK: return '📝';
      case PaymentMethod.DIGITAL_WALLET: return '📱';
      case PaymentMethod.CRYPTO: return '₿';
      case PaymentMethod.OTHER: return '🔧';
      default: return '';
    }
  }

  getRecurrenceIcon(pattern: RecurrencePattern): string {
    switch (pattern) {
      case RecurrencePattern.DAILY: return '📅';
      case RecurrencePattern.WEEKLY: return '📅';
      case RecurrencePattern.BIWEEKLY: return '📅';
      case RecurrencePattern.MONTHLY: return '📅';
      case RecurrencePattern.QUARTERLY: return '📅';
      case RecurrencePattern.YEARLY: return '📅';
      case RecurrencePattern.CUSTOM: return '⚙️';
      case RecurrencePattern.NONE:
      default: return '❌';
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
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    return time;
  }

  formatDateTime(date: Date, time?: string): string {
    const dateStr = this.formatDate(date);
    const timeStr = time ? this.formatTime(time) : '';
    return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
  }

  getCategoryName(categoryId: string): string {
    if (categoryId === this.transaction?.categoryId) {
      return this.category?.name || 'Unknown';
    }
    if (categoryId === this.transaction?.subcategoryId) {
      return this.subcategory?.name || 'Unknown';
    }
    return 'Unknown';
  }

  getCategoryColor(categoryId: string): string {
    if (categoryId === this.transaction?.categoryId) {
      return this.category?.color || '#667eea';
    }
    if (categoryId === this.transaction?.subcategoryId) {
      return this.subcategory?.color || '#667eea';
    }
    return '#667eea';
  }

  hasLocation(): boolean {
    return !!(this.transaction?.location?.name || 
              this.transaction?.location?.address || 
              (this.transaction?.location?.coordinates?.latitude && this.transaction?.location?.coordinates?.longitude));
  }

  hasAttachments(): boolean {
    return !!(this.transaction?.attachments && this.transaction.attachments.length > 0);
  }

  hasNotes(): boolean {
    return !!(this.transaction?.notes && this.transaction.notes.trim().length > 0);
  }

  isRecurring(): boolean {
    return this.transaction?.isRecurring || false;
  }

  getRecurrenceText(): string {
    if (!this.transaction?.isRecurring) return 'No';
    
    const pattern = this.transaction.recurrencePattern;
    const interval = this.transaction.recurrenceInterval || 1;
    
    switch (pattern) {
      case RecurrencePattern.DAILY:
        return interval === 1 ? 'Daily' : `Every ${interval} days`;
      case RecurrencePattern.WEEKLY:
        return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      case RecurrencePattern.BIWEEKLY:
        return 'Bi-weekly';
      case RecurrencePattern.MONTHLY:
        return interval === 1 ? 'Monthly' : `Every ${interval} months`;
      case RecurrencePattern.QUARTERLY:
        return 'Quarterly';
      case RecurrencePattern.YEARLY:
        return interval === 1 ? 'Yearly' : `Every ${interval} years`;
      case RecurrencePattern.CUSTOM:
        return 'Custom pattern';
      default:
        return 'Unknown';
    }
  }

  getRecurrenceEndDate(): string {
    if (!this.transaction?.recurrenceEndDate) return 'No end date';
    return this.formatDate(this.transaction.recurrenceEndDate);
  }

  getNextOccurrence(): string {
    if (!this.transaction?.nextOccurrence) return 'Not scheduled';
    return this.formatDateTime(this.transaction.nextOccurrence);
  }

  // Utility methods
  isPositive(amount: number): boolean {
    return amount >= 0;
  }

  getAmountClass(amount: number, type: TransactionType): string {
    if (type === TransactionType.INCOME) return 'amount-positive';
    if (type === TransactionType.EXPENSE) return 'amount-negative';
    return 'amount-neutral';
  }

  // Navigation helpers
  navigateToCategory(categoryId: string): void {
    this.router.navigate(['/financial/categories', categoryId, 'edit']);
  }

  // Export/Share helpers
  exportTransaction(): void {
    // This would implement transaction export functionality
    console.log('Export transaction:', this.transaction?._id);
  }

  shareTransaction(): void {
    // This would implement transaction sharing functionality
    console.log('Share transaction:', this.transaction?._id);
  }
}