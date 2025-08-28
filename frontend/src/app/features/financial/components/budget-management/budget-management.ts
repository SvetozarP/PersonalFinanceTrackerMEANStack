import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  Transaction, 
  TransactionType, 
  Category, 
  BudgetAnalysis,
  FinancialDashboard
} from '../../../../core/models/financial.model';
import { FinancialService } from '../../../../core/services/financial.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';

interface Budget {
  _id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BudgetProgress {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: 'under' | 'at' | 'over';
  daysRemaining: number;
}

@Component({
  selector: 'app-budget-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './budget-management.html',
  styleUrls: ['./budget-management.scss']
})
export class BudgetManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private financialService = inject(FinancialService);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  // Data
  budgets: Budget[] = [];
  categories: Category[] = [];
  transactions: Transaction[] = [];
  budgetProgress: BudgetProgress[] = [];
  
  // Forms
  budgetForm!: FormGroup;
  editBudgetForm!: FormGroup;
  
  // UI State
  isLoading: boolean = false;
  showAddBudget: boolean = false;
  editingBudgetId: string | null = null;
  selectedPeriod: 'monthly' | 'quarterly' | 'yearly' = 'monthly';
  selectedCategory: string = '';
  
  // Budget Statistics
  totalBudget: number = 0;
  totalSpent: number = 0;
  totalRemaining: number = 0;
  overallProgress: number = 0;
  
  // Available periods
  periods = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  ngOnInit(): void {
    this.initializeForms();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.budgetForm = this.fb.group({
      categoryId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      period: ['monthly', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });

    this.editBudgetForm = this.fb.group({
      categoryId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      period: ['monthly', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
  }

  private loadData(): void {
    this.isLoading = true;

    // Load categories
    this.categoryService.getUserCategories().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (categories) => {
        this.categories = categories || [];
        this.loadBudgets();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
      }
    });
  }

  private loadBudgets(): void {
    // In a real app, you'd have a budget service
    // For now, we'll create mock data
    this.budgets = this.createMockBudgets();
    this.loadTransactions();
  }

  private loadTransactions(): void {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.transactionService.getUserTransactions({
      startDate: startOfMonth,
      endDate: endOfMonth
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.transactions = response.data || [];
        this.calculateBudgetProgress();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });
  }

  private createMockBudgets(): Budget[] {
    return [
      {
        _id: '1',
        categoryId: '1',
        categoryName: 'Food & Dining',
        amount: 500,
        period: 'monthly',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 11, 31),
        isActive: true,
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '2',
        categoryId: '2',
        categoryName: 'Transportation',
        amount: 300,
        period: 'monthly',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 11, 31),
        isActive: true,
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '3',
        categoryId: '3',
        categoryName: 'Entertainment',
        amount: 200,
        period: 'monthly',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 11, 31),
        isActive: true,
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private calculateBudgetProgress(): void {
    this.budgetProgress = this.budgets.map(budget => {
      const categoryTransactions = this.transactions.filter(t => 
        t.categoryId === budget.categoryId && 
        t.type === TransactionType.EXPENSE
      );

      const spentAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const remainingAmount = budget.amount - spentAmount;
      const percentageUsed = (spentAmount / budget.amount) * 100;

      let status: 'under' | 'at' | 'over' = 'under';
      if (percentageUsed >= 100) {
        status = percentageUsed === 100 ? 'at' : 'over';
      }

      const daysRemaining = this.calculateDaysRemaining(budget.endDate);

      return {
        categoryId: budget.categoryId,
        categoryName: budget.categoryName,
        budgetAmount: budget.amount,
        spentAmount,
        remainingAmount,
        percentageUsed,
        status,
        daysRemaining
      };
    });

    this.calculateOverallProgress();
  }

  private calculateOverallProgress(): void {
    this.totalBudget = this.budgets.reduce((sum, b) => sum + b.amount, 0);
    this.totalSpent = this.budgetProgress.reduce((sum, p) => sum + p.spentAmount, 0);
    this.totalRemaining = this.totalBudget - this.totalSpent;
    this.overallProgress = (this.totalSpent / this.totalBudget) * 100;
  }

  private calculateDaysRemaining(endDate: Date): number {
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  onPeriodChange(period: 'monthly' | 'quarterly' | 'yearly'): void {
    this.selectedPeriod = period;
    this.filterBudgetsByPeriod();
  }

  onCategoryFilter(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.filterBudgetsByCategory();
  }

  private filterBudgetsByPeriod(): void {
    // Filter budgets by selected period
    // Implementation would depend on your data structure
  }

  private filterBudgetsByCategory(): void {
    // Filter budgets by selected category
    // Implementation would depend on your data structure
  }

  showAddBudgetForm(): void {
    this.showAddBudget = true;
    this.budgetForm.reset({
      period: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
  }

  hideAddBudgetForm(): void {
    this.showAddBudget = false;
    this.budgetForm.reset();
  }

  onSubmitBudget(): void {
    if (this.budgetForm.valid) {
      const formValue = this.budgetForm.value;
      const category = this.categories.find(c => c._id === formValue.categoryId);
      
      const newBudget: Budget = {
        _id: Date.now().toString(),
        categoryId: formValue.categoryId,
        categoryName: category?.name || 'Unknown Category',
        amount: formValue.amount,
        period: formValue.period,
        startDate: new Date(formValue.startDate),
        endDate: new Date(formValue.endDate),
        isActive: true,
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.budgets.push(newBudget);
      this.calculateBudgetProgress();
      this.hideAddBudgetForm();
    }
  }

  editBudget(budget: Budget): void {
    this.editingBudgetId = budget._id;
    this.editBudgetForm.patchValue({
      categoryId: budget.categoryId,
      amount: budget.amount,
      period: budget.period,
      startDate: budget.startDate.toISOString().split('T')[0],
      endDate: budget.endDate.toISOString().split('T')[0]
    });
  }

  cancelEdit(): void {
    this.editingBudgetId = null;
    this.editBudgetForm.reset();
  }

  updateBudget(): void {
    if (this.editBudgetForm.valid && this.editingBudgetId) {
      const formValue = this.editBudgetForm.value;
      const category = this.categories.find(c => c._id === formValue.categoryId);
      
      const budgetIndex = this.budgets.findIndex(b => b._id === this.editingBudgetId);
      if (budgetIndex !== -1) {
        this.budgets[budgetIndex] = {
          ...this.budgets[budgetIndex],
          categoryId: formValue.categoryId,
          categoryName: category?.name || 'Unknown Category',
          amount: formValue.amount,
          period: formValue.period,
          startDate: new Date(formValue.startDate),
          endDate: new Date(formValue.endDate),
          updatedAt: new Date()
        };

        this.calculateBudgetProgress();
        this.cancelEdit();
      }
    }
  }

  deleteBudget(budgetId: string): void {
    if (confirm('Are you sure you want to delete this budget?')) {
      this.budgets = this.budgets.filter(b => b._id !== budgetId);
      this.calculateBudgetProgress();
    }
  }

  toggleBudgetStatus(budget: Budget): void {
    budget.isActive = !budget.isActive;
    budget.updatedAt = new Date();
    this.calculateBudgetProgress();
  }

  getStatusColor(status: 'under' | 'at' | 'over'): string {
    switch (status) {
      case 'under': return '#28a745';
      case 'at': return '#ffc107';
      case 'over': return '#dc3545';
      default: return '#6c757d';
    }
  }

  getStatusIcon(status: 'under' | 'at' | 'over'): string {
    switch (status) {
      case 'under': return 'fa-check-circle';
      case 'at': return 'fa-exclamation-circle';
      case 'over': return 'fa-times-circle';
      default: return 'fa-circle';
    }
  }

  getProgressBarColor(percentage: number): string {
    if (percentage >= 90) return '#dc3545';
    if (percentage >= 75) return '#ffc107';
    return '#28a745';
  }

  exportBudgetReport(): void {
    console.log('Exporting budget report...');
    // Implementation for export functionality
  }

  printBudgetReport(): void {
    window.print();
  }

  getOnTrackCount(): number {
    return this.budgetProgress.filter(p => p.status === 'under').length;
  }
  
  getOverBudgetCount(): number {
    return this.budgetProgress.filter(p => p.status === 'over').length;
  }
  
  getBudgetProgress(categoryId: string): BudgetProgress | undefined {
    return this.budgetProgress.find(p => p.categoryId === categoryId);
  }
}