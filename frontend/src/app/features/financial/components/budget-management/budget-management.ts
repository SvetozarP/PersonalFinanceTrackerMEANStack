import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  Transaction, 
  TransactionType, 
  Category, 
  BudgetAnalysis,
  FinancialDashboard,
  Budget,
  BudgetAnalytics,
  BudgetSummary
} from '../../../../core/models/financial.model';
import { FinancialService } from '../../../../core/services/financial.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { BudgetService } from '../../../../core/services/budget.service';
import { BudgetWizardComponent } from '../budget-wizard/budget-wizard';

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
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, BudgetWizardComponent],
  templateUrl: './budget-management.html',
  styleUrls: ['./budget-management.scss']
})
export class BudgetManagementComponent implements OnInit, OnDestroy {
  @ViewChild(BudgetWizardComponent) budgetWizard!: BudgetWizardComponent;
  
  private destroy$ = new Subject<void>();
  private financialService = inject(FinancialService);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private budgetService = inject(BudgetService);
  private fb = inject(FormBuilder);

  // Data
  budgets: Budget[] = [];
  categories: Category[] = [];
  transactions: Transaction[] = [];
  budgetProgress: BudgetProgress[] = [];
  budgetSummary: BudgetSummary | null = null;
  budgetAnalytics: Map<string, BudgetAnalytics> = new Map();
  
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
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      categoryId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      period: ['monthly', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      currency: ['USD', Validators.required]
    });

    this.editBudgetForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      period: ['monthly', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      totalAmount: ['', [Validators.required, Validators.min(0.01)]],
      currency: ['USD', Validators.required]
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
    // Load budgets from the budget service
    this.budgetService.getBudgets().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.budgets = response.budgets || [];
        this.loadBudgetSummary();
        this.loadTransactions();
      },
      error: (error) => {
        console.error('Error loading budgets:', error);
        // Fallback to mock data for development
        this.budgets = this.createMockBudgets();
        this.loadTransactions();
      }
    });
  }

  private loadBudgetSummary(): void {
    this.budgetService.getBudgetSummary().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (summary) => {
        this.budgetSummary = summary;
      },
      error: (error) => {
        console.error('Error loading budget summary:', error);
      }
    });
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
        name: 'Monthly Household Budget',
        description: 'Monthly budget for household expenses',
        period: 'monthly',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 0, 31),
        totalAmount: 2000,
        currency: 'USD',
        categoryAllocations: [
          { categoryId: '1', allocatedAmount: 500, isFlexible: false, priority: 1 },
          { categoryId: '2', allocatedAmount: 300, isFlexible: false, priority: 2 },
          { categoryId: '3', allocatedAmount: 200, isFlexible: true, priority: 3 }
        ],
        status: 'active',
        alertThreshold: 80,
        userId: 'user1',
        isActive: true,
        autoAdjust: false,
        allowRollover: false,
        rolloverAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private calculateBudgetProgress(): void {
    this.budgetProgress = [];
    
    this.budgets.forEach(budget => {
      budget.categoryAllocations.forEach(allocation => {
        const categoryTransactions = this.transactions.filter(t => 
          t.categoryId === allocation.categoryId && 
          t.type === TransactionType.EXPENSE
        );

        const spentAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
        const remainingAmount = allocation.allocatedAmount - spentAmount;
        const percentageUsed = allocation.allocatedAmount > 0 ? (spentAmount / allocation.allocatedAmount) * 100 : 0;

        let status: 'under' | 'at' | 'over' = 'under';
        if (percentageUsed >= 100) {
          status = percentageUsed === 100 ? 'at' : 'over';
        }

        const daysRemaining = this.calculateDaysRemaining(budget.endDate);
        const category = this.categories.find(c => c._id === allocation.categoryId);

        this.budgetProgress.push({
          categoryId: allocation.categoryId,
          categoryName: category?.name || 'Unknown Category',
          budgetAmount: allocation.allocatedAmount,
          spentAmount,
          remainingAmount,
          percentageUsed,
          status,
          daysRemaining
        });
      });
    });

    this.calculateOverallProgress();
  }

  private calculateOverallProgress(): void {
    this.totalBudget = this.budgets.reduce((sum, b) => sum + b.totalAmount, 0);
    this.totalSpent = this.budgetProgress.reduce((sum, p) => sum + p.spentAmount, 0);
    this.totalRemaining = this.totalBudget - this.totalSpent;
    this.overallProgress = this.totalBudget > 0 ? (this.totalSpent / this.totalBudget) * 100 : 0;
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
      endDate: new Date().toISOString().split('T')[0],
      currency: 'USD'
    });
  }

  showBudgetWizard(): void {
    if (this.budgetWizard) {
      this.budgetWizard.openWizard();
    }
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
        name: formValue.name || 'New Budget',
        description: formValue.description,
        period: formValue.period,
        startDate: new Date(formValue.startDate),
        endDate: new Date(formValue.endDate),
        totalAmount: formValue.amount,
        currency: 'USD',
        categoryAllocations: [{
          categoryId: formValue.categoryId,
          allocatedAmount: formValue.amount,
          isFlexible: false,
          priority: 1
        }],
        status: 'active',
        alertThreshold: 80,
        userId: 'user1',
        isActive: true,
        autoAdjust: false,
        allowRollover: false,
        rolloverAmount: 0,
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
      name: budget.name,
      description: budget.description,
      period: budget.period,
      startDate: budget.startDate.toISOString().split('T')[0],
      endDate: budget.endDate.toISOString().split('T')[0],
      totalAmount: budget.totalAmount,
      currency: budget.currency
    });
  }

  cancelEdit(): void {
    this.editingBudgetId = null;
    this.editBudgetForm.reset();
  }

  updateBudget(): void {
    if (this.editBudgetForm.valid && this.editingBudgetId) {
      const formValue = this.editBudgetForm.value;
      
      const budgetIndex = this.budgets.findIndex(b => b._id === this.editingBudgetId);
      if (budgetIndex !== -1) {
        this.budgets[budgetIndex] = {
          ...this.budgets[budgetIndex],
          name: formValue.name,
          description: formValue.description,
          period: formValue.period,
          startDate: new Date(formValue.startDate),
          endDate: new Date(formValue.endDate),
          totalAmount: formValue.totalAmount,
          currency: formValue.currency,
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
      case 'under': return 'fas fa-check-circle';
      case 'at': return 'fas fa-exclamation-circle';
      case 'over': return 'fas fa-times-circle';
      default: return 'fas fa-circle';
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

  onBudgetCreated(budget: Budget): void {
    // Refresh the budget list
    this.loadBudgets();
    
    // Show success message or navigate to budget details
    console.log('New budget created:', budget);
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category?.name || 'Unknown Category';
  }
}