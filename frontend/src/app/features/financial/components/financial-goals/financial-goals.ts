import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  Transaction, 
  TransactionType, 
  Category, 
  FinancialDashboard
} from '../../../../core/models/financial.model';
import { FinancialService } from '../../../../core/services/financial.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';

interface FinancialGoal {
  _id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  startDate: Date;
  targetDate: Date;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  type: 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'other';
  icon: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GoalProgress {
  goalId: string;
  percentageComplete: number;
  daysRemaining: number;
  projectedCompletion: Date;
  isOnTrack: boolean;
  monthlyContribution: number;
  estimatedCompletionDate: Date;
}

@Component({
  selector: 'app-financial-goals',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './financial-goals.html',
  styleUrls: ['./financial-goals.scss']
})
export class FinancialGoalsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private financialService = inject(FinancialService);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  // Data
  goals: FinancialGoal[] = [];
  categories: Category[] = [];
  transactions: Transaction[] = [];
  goalProgress: GoalProgress[] = [];
  
  // Forms
  goalForm!: FormGroup;
  editGoalForm!: FormGroup;
  
  // UI State
  isLoading: boolean = false;
  showAddGoal: boolean = false;
  editingGoalId: string | null = null;
  selectedGoalType: string = 'all';
  selectedStatus: string = 'all';
  selectedPriority: string = 'all';
  
  // Goal Statistics
  totalGoals: number = 0;
  activeGoals: number = 0;
  completedGoals: number = 0;
  totalTargetAmount: number = 0;
  totalCurrentAmount: number = 0;
  overallProgress: number = 0;
  
  // Available goal types
  goalTypes = [
    { value: 'savings', label: 'Savings', icon: 'fas fa-piggy-bank', color: '#28a745' },
    { value: 'debt-payoff', label: 'Debt Payoff', icon: 'fas fa-credit-card', color: '#dc3545' },
    { value: 'investment', label: 'Investment', icon: 'fas fa-chart-line', color: '#007bff' },
    { value: 'purchase', label: 'Purchase', icon: 'fas fa-shopping-cart', color: '#ffc107' },
    { value: 'emergency-fund', label: 'Emergency Fund', icon: 'fas fa-shield-alt', color: '#6f42c1' },
    { value: 'other', label: 'Other', icon: 'fas fa-star', color: '#6c757d' }
  ];

  // Available priorities
  priorities = [
    { value: 'low', label: 'Low', color: '#6c757d' },
    { value: 'medium', label: 'Medium', color: '#ffc107' },
    { value: 'high', label: 'High', color: '#dc3545' }
  ];

  // Available statuses
  statuses = [
    { value: 'active', label: 'Active', color: '#28a745' },
    { value: 'paused', label: 'Paused', color: '#ffc107' },
    { value: 'completed', label: 'Completed', color: '#007bff' },
    { value: 'cancelled', label: 'Cancelled', color: '#6c757d' }
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
    this.goalForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      targetAmount: ['', [Validators.required, Validators.min(0.01)]],
      startDate: ['', Validators.required],
      targetDate: ['', Validators.required],
      category: ['', Validators.required],
      priority: ['medium', Validators.required],
      type: ['savings', Validators.required],
      icon: ['fas fa-star'],
      color: ['#007bff']
    });

    this.editGoalForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      targetAmount: ['', [Validators.required, Validators.min(0.01)]],
      startDate: ['', Validators.required],
      targetDate: ['', Validators.required],
      category: ['', Validators.required],
      priority: ['medium', Validators.required],
      type: ['savings', Validators.required],
      icon: ['fas fa-star'],
      color: ['#007bff']
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
        this.loadGoals();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
      }
    });
  }

  private loadGoals(): void {
    // In a real app, you'd have a goal service
    // For now, we'll create mock data
    this.goals = this.createMockGoals();
    this.loadTransactions();
  }

  private loadTransactions(): void {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    this.transactionService.getUserTransactions({
      startDate: startOfYear,
      endDate: now
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.transactions = response.data || [];
        this.calculateGoalProgress();
        this.calculateGoalStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });
  }

  private createMockGoals(): FinancialGoal[] {
    return [
      {
        _id: '1',
        title: 'Emergency Fund',
        description: 'Build a 6-month emergency fund',
        targetAmount: 15000,
        currentAmount: 8500,
        startDate: new Date(2024, 0, 1),
        targetDate: new Date(2024, 11, 31),
        category: 'Savings',
        priority: 'high',
        status: 'active',
        type: 'emergency-fund',
        icon: 'fas fa-shield-alt',
        color: '#6f42c1',
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '2',
        title: 'Vacation Fund',
        description: 'Save for summer vacation',
        targetAmount: 5000,
        currentAmount: 3200,
        startDate: new Date(2024, 2, 1),
        targetDate: new Date(2024, 5, 31),
        category: 'Entertainment',
        priority: 'medium',
        status: 'active',
        type: 'savings',
        icon: 'fas fa-plane',
        color: '#28a745',
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '3',
        title: 'Credit Card Payoff',
        description: 'Pay off high-interest credit card',
        targetAmount: 8000,
        currentAmount: 6000,
        startDate: new Date(2024, 0, 1),
        targetDate: new Date(2024, 8, 31),
        category: 'Debt',
        priority: 'high',
        status: 'active',
        type: 'debt-payoff',
        icon: 'fas fa-credit-card',
        color: '#dc3545',
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private calculateGoalProgress(): void {
    this.goalProgress = this.goals.map(goal => {
      const percentageComplete = (goal.currentAmount / goal.targetAmount) * 100;
      const daysRemaining = this.calculateDaysRemaining(goal.targetDate);
      const projectedCompletion = this.calculateProjectedCompletion(goal);
      const isOnTrack = this.isGoalOnTrack(goal);
      const monthlyContribution = this.calculateMonthlyContribution(goal);
      const estimatedCompletionDate = this.calculateEstimatedCompletion(goal, monthlyContribution);

      return {
        goalId: goal._id,
        percentageComplete,
        daysRemaining,
        projectedCompletion,
        isOnTrack,
        monthlyContribution,
        estimatedCompletionDate
      };
    });
  }

  private calculateGoalStats(): void {
    this.totalGoals = this.goals.length;
    this.activeGoals = this.goals.filter(g => g.status === 'active').length;
    this.completedGoals = this.goals.filter(g => g.status === 'completed').length;
    this.totalTargetAmount = this.goals.reduce((sum, g) => sum + g.targetAmount, 0);
    this.totalCurrentAmount = this.goals.reduce((sum, g) => sum + g.currentAmount, 0);
    this.overallProgress = (this.totalCurrentAmount / this.totalTargetAmount) * 100;
  }

  private calculateDaysRemaining(targetDate: Date): number {
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  private calculateProjectedCompletion(goal: FinancialGoal): Date {
    const now = new Date();
    const elapsedDays = (now.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const progressRate = goal.currentAmount / elapsedDays;
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const daysToComplete = remainingAmount / progressRate;
    
    const projectedDate = new Date(now.getTime() + (daysToComplete * 24 * 60 * 60 * 1000));
    return projectedDate;
  }

  private isGoalOnTrack(goal: FinancialGoal): boolean {
    const now = new Date();
    const elapsedDays = (now.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const totalDays = (goal.targetDate.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const expectedProgress = (elapsedDays / totalDays) * 100;
    const actualProgress = (goal.currentAmount / goal.targetAmount) * 100;
    
    return actualProgress >= expectedProgress;
  }

  private calculateMonthlyContribution(goal: FinancialGoal): number {
    const now = new Date();
    const elapsedMonths = (now.getFullYear() - goal.startDate.getFullYear()) * 12 + 
                          (now.getMonth() - goal.startDate.getMonth());
    
    if (elapsedMonths === 0) return goal.currentAmount;
    return goal.currentAmount / elapsedMonths;
  }

  private calculateEstimatedCompletion(goal: FinancialGoal, monthlyContribution: number): Date {
    if (monthlyContribution <= 0) return goal.targetDate;
    
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const monthsToComplete = remainingAmount / monthlyContribution;
    const estimatedDate = new Date();
    estimatedDate.setMonth(estimatedDate.getMonth() + monthsToComplete);
    
    return estimatedDate;
  }

  onGoalTypeChange(type: string): void {
    this.selectedGoalType = type;
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
  }

  onPriorityChange(priority: string): void {
    this.selectedPriority = priority;
  }

  getFilteredGoals(): FinancialGoal[] {
    let filtered = this.goals;

    if (this.selectedGoalType !== 'all') {
      filtered = filtered.filter(g => g.type === this.selectedGoalType);
    }

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(g => g.status === this.selectedStatus);
    }

    if (this.selectedPriority !== 'all') {
      filtered = filtered.filter(g => g.priority === this.selectedPriority);
    }

    return filtered;
  }

  showAddGoalForm(): void {
    this.showAddGoal = true;
    this.goalForm.reset({
      priority: 'medium',
      type: 'savings',
      icon: 'fas fa-star',
      color: '#007bff',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  }

  hideAddGoalForm(): void {
    this.showAddGoal = false;
    this.goalForm.reset();
  }

  onSubmitGoal(): void {
    if (this.goalForm.valid) {
      const formValue = this.goalForm.value;
      const goalType = this.goalTypes.find(t => t.value === formValue.type);
      
      const newGoal: FinancialGoal = {
        _id: Date.now().toString(),
        title: formValue.title,
        description: formValue.description,
        targetAmount: formValue.targetAmount,
        currentAmount: 0,
        startDate: new Date(formValue.startDate),
        targetDate: new Date(formValue.targetDate),
        category: formValue.category,
        priority: formValue.priority,
        status: 'active',
        type: formValue.type,
        icon: goalType?.icon || 'fas fa-star',
        color: goalType?.color || '#007bff',
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.goals.push(newGoal);
      this.calculateGoalProgress();
      this.calculateGoalStats();
      this.hideAddGoalForm();
    }
  }

  editGoal(goal: FinancialGoal): void {
    this.editingGoalId = goal._id;
    this.editGoalForm.patchValue({
      title: goal.title,
      description: goal.description,
      targetAmount: goal.targetAmount,
      startDate: goal.startDate.toISOString().split('T')[0],
      targetDate: goal.targetDate.toISOString().split('T')[0],
      category: goal.category,
      priority: goal.priority,
      type: goal.type,
      icon: goal.icon,
      color: goal.color
    });
  }

  cancelEdit(): void {
    this.editingGoalId = null;
    this.editGoalForm.reset();
  }

  updateGoal(): void {
    if (this.editGoalForm.valid && this.editingGoalId) {
      const formValue = this.editGoalForm.value;
      const goalType = this.goalTypes.find(t => t.value === formValue.type);
      
      const goalIndex = this.goals.findIndex(g => g._id === this.editingGoalId);
      if (goalIndex !== -1) {
        this.goals[goalIndex] = {
          ...this.goals[goalIndex],
          title: formValue.title,
          description: formValue.description,
          targetAmount: formValue.targetAmount,
          startDate: new Date(formValue.startDate),
          targetDate: new Date(formValue.targetDate),
          category: formValue.category,
          priority: formValue.priority,
          type: formValue.type,
          icon: goalType?.icon || 'fas fa-star',
          color: goalType?.color || '#007bff',
          updatedAt: new Date()
        };

        this.calculateGoalProgress();
        this.calculateGoalStats();
        this.cancelEdit();
      }
    }
  }

  deleteGoal(goalId: string): void {
    if (confirm('Are you sure you want to delete this goal?')) {
      this.goals = this.goals.filter(g => g._id !== goalId);
      this.calculateGoalProgress();
      this.calculateGoalStats();
    }
  }

  updateGoalProgress(goal: FinancialGoal, amount: number): void {
    goal.currentAmount = Math.max(0, Math.min(goal.targetAmount, goal.currentAmount + amount));
    goal.updatedAt = new Date();
    this.calculateGoalProgress();
    this.calculateGoalStats();
  }

  toggleGoalStatus(goal: FinancialGoal): void {
    if (goal.status === 'active') {
      goal.status = 'paused';
    } else if (goal.status === 'paused') {
      goal.status = 'active';
    }
    goal.updatedAt = new Date();
    this.calculateGoalStats();
  }

  completeGoal(goal: FinancialGoal): void {
    goal.status = 'completed';
    goal.currentAmount = goal.targetAmount;
    goal.updatedAt = new Date();
    this.calculateGoalProgress();
    this.calculateGoalStats();
  }

  getGoalProgress(goalId: string): GoalProgress | undefined {
    return this.goalProgress.find(p => p.goalId === goalId);
  }

  getPriorityColor(priority: string): string {
    const priorityObj = this.priorities.find(p => p.value === priority);
    return priorityObj?.color || '#6c757d';
  }

  getStatusColor(status: string): string {
    const statusObj = this.statuses.find(s => s.value === status);
    return statusObj?.color || '#6c757d';
  }

  getGoalTypeIcon(type: string): string {
    const typeObj = this.goalTypes.find(t => t.value === type);
    return typeObj?.icon || 'fas fa-star';
  }

  getGoalTypeColor(type: string): string {
    const typeObj = this.goalTypes.find(t => t.value === type);
    return typeObj?.color || '#007bff';
  }

  exportGoals(): void {
    console.log('Exporting goals...');
    // Implementation for export functionality
  }

  printGoals(): void {
    window.print();
  }
}