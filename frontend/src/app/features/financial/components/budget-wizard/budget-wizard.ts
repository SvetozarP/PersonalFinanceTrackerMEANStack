import { Component, OnInit, OnDestroy, inject, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  Budget, 
  CategoryAllocation, 
  Category,
  CreateBudgetDto
} from '../../../../core/models/financial.model';
import { BudgetService } from '../../../../core/services/budget.service';
import { CategoryService } from '../../../../core/services/category.service';

interface WizardStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

@Component({
  selector: 'app-budget-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './budget-wizard.html',
  styleUrls: ['./budget-wizard.scss']
})
export class BudgetWizardComponent implements OnInit, OnDestroy {
  @Output() budgetCreated = new EventEmitter<Budget>();
  
  private destroy$ = new Subject<void>();
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  // Wizard state
  currentStep = 1;
  totalSteps = 4;
  isSubmitting = false;
  showWizard = false;
  error: string | null = null;

  // Data
  categories: Category[] = [];
  historicalSpending: { categoryId: string; amount: number; percentage: number }[] = [];

  // Forms
  wizardForm!: FormGroup;
  basicInfoForm!: FormGroup;
  categoryAllocationForm!: FormGroup;
  settingsForm!: FormGroup;

  // Wizard steps
  steps: WizardStep[] = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Set budget name, period, and dates',
      completed: false,
      current: true
    },
    {
      id: 2,
      title: 'Category Allocation',
      description: 'Allocate amounts to categories',
      completed: false,
      current: false
    },
    {
      id: 3,
      title: 'Settings & Alerts',
      description: 'Configure budget settings and alerts',
      completed: false,
      current: false
    },
    {
      id: 4,
      title: 'Review & Create',
      description: 'Review and create your budget',
      completed: false,
      current: false
    }
  ];

  // Available periods
  periods = [
    { value: 'monthly', label: 'Monthly', description: 'Budget for one month' },
    { value: 'yearly', label: 'Yearly', description: 'Budget for one year' },
    { value: 'custom', label: 'Custom', description: 'Set custom start and end dates' }
  ];

  // Currency options (aligned with transaction form)
  currencies = [
    { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
    { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
    { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
    { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
    { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
    { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
    { value: 'CHF', label: 'CHF - Swiss Franc', symbol: 'CHF' },
    { value: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥' }
  ];

  // Timezone options
  timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai'
  ];

  ngOnInit(): void {
    this.initializeForms();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    // Main wizard form
    this.wizardForm = this.fb.group({
      basicInfo: this.fb.group({}),
      categoryAllocations: this.fb.group({}),
      settings: this.fb.group({})
    });

    // Step 1: Basic Information
    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      period: ['monthly', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      totalAmount: ['', [Validators.required, Validators.min(0.01)]],
      currency: ['USD', Validators.required],
      timezone: ['UTC', Validators.required]
    });

    // Step 2: Category Allocation
    this.categoryAllocationForm = this.fb.group({
      allocations: this.fb.array([])
    });

    // Step 3: Settings
    this.settingsForm = this.fb.group({
      alertThreshold: [80, [Validators.min(0), Validators.max(100)]],
      autoAdjust: [false],
      allowRollover: [false],
      rolloverAmount: [0, [Validators.min(0)]]
    });

    // Set up form value changes
    this.setupFormValueChanges();
  }

  private setupFormValueChanges(): void {
    // Update period dates when period changes
    this.basicInfoForm.get('period')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(period => {
      this.updatePeriodDates(period);
    });

    // Note: We don't automatically update total amount when allocations change
    // The total amount should be set by the user, and allocations should be distributed within that total

    // Update rollover amount when allowRollover changes
    this.settingsForm.get('allowRollover')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(allowRollover => {
      const rolloverAmountControl = this.settingsForm.get('rolloverAmount');
      if (allowRollover) {
        rolloverAmountControl?.setValidators([Validators.min(0)]);
      } else {
        rolloverAmountControl?.clearValidators();
        rolloverAmountControl?.setValue(0);
      }
      rolloverAmountControl?.updateValueAndValidity();
    });
  }

  private loadCategories(): void {
    this.categoryService.getUserCategories().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (categories) => {
        this.categories = categories || [];
        this.loadHistoricalSpending();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  private loadHistoricalSpending(): void {
    // In a real app, this would load historical spending data
    // For now, we'll create mock data
    this.historicalSpending = [
      { categoryId: '1', amount: 500, percentage: 40 },
      { categoryId: '2', amount: 300, percentage: 24 },
      { categoryId: '3', amount: 200, percentage: 16 },
      { categoryId: '4', amount: 150, percentage: 12 },
      { categoryId: '5', amount: 100, percentage: 8 }
    ];
  }

  private updatePeriodDates(period: string): void {
    const dates = this.budgetService.calculateBudgetPeriodDates(period as any);
    this.basicInfoForm.patchValue({
      startDate: dates.startDate.toISOString().split('T')[0],
      endDate: dates.endDate.toISOString().split('T')[0]
    });
  }

  private updateTotalAmount(): void {
    const allocations = this.categoryAllocationForm.get('allocations') as FormArray;
    const total = allocations.controls.reduce((sum, control) => {
      return sum + (control.get('allocatedAmount')?.value || 0);
    }, 0);
    
    this.basicInfoForm.patchValue({
      totalAmount: Math.round(total * 100) / 100
    });
  }

  // Wizard navigation
  showBudgetWizard(): void {
    this.showWizard = true;
    this.currentStep = 1;
    this.updateStepStates();
    this.initializeCategoryAllocations();
  }

  // Public method to show wizard from parent component
  public openWizard(): void {
    this.showBudgetWizard();
  }

  hideBudgetWizard(): void {
    this.showWizard = false;
    this.resetWizard();
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      this.markCurrentStepCompleted();
      this.currentStep = Math.min(this.currentStep + 1, this.totalSteps);
      this.updateStepStates();
      
      if (this.currentStep === 2) {
        this.initializeCategoryAllocations();
      }
    }
  }

  previousStep(): void {
    this.currentStep = Math.max(this.currentStep - 1, 1);
    this.updateStepStates();
  }

  goToStep(stepNumber: number): void {
    if (stepNumber <= this.currentStep || this.isStepCompleted(stepNumber - 1)) {
      this.currentStep = stepNumber;
      this.updateStepStates();
      
      if (this.currentStep === 2) {
        this.initializeCategoryAllocations();
      }
    }
  }

  private validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.basicInfoForm.valid;
      case 2:
        return this.categoryAllocationForm.valid && this.getAllocationsArray().length > 0;
      case 3:
        return this.settingsForm.valid;
      case 4:
        return true;
      default:
        return false;
    }
  }

  private markCurrentStepCompleted(): void {
    this.steps[this.currentStep - 1].completed = true;
  }

  private updateStepStates(): void {
    this.steps.forEach((step, index) => {
      step.current = step.id === this.currentStep;
    });
  }

  private isStepCompleted(stepNumber: number): boolean {
    return this.steps[stepNumber]?.completed || false;
  }

  // Category allocation methods
  public initializeCategoryAllocations(): void {
    const allocationsArray = this.getAllocationsArray();
    allocationsArray.clear();

    // Add allocations for each category
    this.categories.forEach(category => {
      const historicalData = this.historicalSpending.find(h => h.categoryId === category._id);
      const suggestedAmount = historicalData ? 
        (this.basicInfoForm.get('totalAmount')?.value * historicalData.percentage / 100) : 0;

      allocationsArray.push(this.fb.group({
        categoryId: [category._id, Validators.required],
        allocatedAmount: [suggestedAmount, [Validators.required, Validators.min(0)]],
        isFlexible: [false],
        priority: [1, [Validators.min(1), Validators.max(10)]]
      }));
    });
  }

  getAllocationsArray(): FormArray {
    return this.categoryAllocationForm.get('allocations') as FormArray;
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category?.name || 'Unknown Category';
  }

  getCategoryColor(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category?.color || '#6c757d';
  }

  getCategoryIcon(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category?.icon || 'fas fa-folder';
  }

  getHistoricalPercentage(categoryId: string): number {
    const historical = this.historicalSpending.find(h => h.categoryId === categoryId);
    return historical?.percentage || 0;
  }

  useSuggestedAmounts(): void {
    const totalAmount = this.basicInfoForm.get('totalAmount')?.value || 0;
    const allocationsArray = this.getAllocationsArray();

    if (allocationsArray.length === 0) {
      return;
    }

    allocationsArray.controls.forEach(control => {
      const categoryId = control.get('categoryId')?.value;
      const historicalData = this.historicalSpending.find(h => h.categoryId === categoryId);
      
      if (historicalData) {
        const suggestedAmount = Math.round((totalAmount * historicalData.percentage / 100) * 100) / 100;
        control.patchValue({
          allocatedAmount: suggestedAmount
        });
      }
    });
    
    // Trigger change detection
    this.cdr.detectChanges();
  }

  distributeEvenly(): void {
    const totalAmount = this.basicInfoForm.get('totalAmount')?.value || 0;
    const allocationsArray = this.getAllocationsArray();
    
    if (allocationsArray.length === 0) {
      return;
    }
    
    const evenAmount = Math.round((totalAmount / allocationsArray.length) * 100) / 100;

    allocationsArray.controls.forEach(control => {
      control.patchValue({
        allocatedAmount: evenAmount
      });
    });
    
    // Trigger change detection
    this.cdr.detectChanges();
  }

  clearAllocations(): void {
    const allocationsArray = this.getAllocationsArray();
    allocationsArray.controls.forEach(control => {
      control.patchValue({
        allocatedAmount: 0
      });
    });
  }

  // Form validation helpers
  getFormErrors(form: FormGroup, fieldName: string): string[] {
    const field = form.get(fieldName);
    const errors: string[] = [];

    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        errors.push(`${fieldName} is required`);
      }
      if (field.errors['minlength']) {
        errors.push(`${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`);
      }
      if (field.errors['maxlength']) {
        errors.push(`${fieldName} must be no more than ${field.errors['maxlength'].requiredLength} characters`);
      }
      if (field.errors['min']) {
        errors.push(`${fieldName} must be at least ${field.errors['min'].min}`);
      }
      if (field.errors['max']) {
        errors.push(`${fieldName} must be no more than ${field.errors['max'].max}`);
      }
    }

    return errors;
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  // Budget creation
  createBudget(): void {
    if (this.validateAllSteps()) {
      this.isSubmitting = true;
      this.error = null;

      // Validate and prepare data
      const startDate = new Date(this.basicInfoForm.get('startDate')?.value);
      const endDate = new Date(this.basicInfoForm.get('endDate')?.value);
      const totalAmount = parseFloat(this.basicInfoForm.get('totalAmount')?.value);
      const currency = this.basicInfoForm.get('currency')?.value;

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid dates provided');
        this.isSubmitting = false;
        return;
      }

      // Validate total amount
      if (isNaN(totalAmount) || totalAmount <= 0) {
        console.error('Invalid total amount:', totalAmount);
        this.isSubmitting = false;
        return;
      }

      const budgetData: CreateBudgetDto = {
        name: this.basicInfoForm.get('name')?.value?.trim(),
        description: this.basicInfoForm.get('description')?.value?.trim() || '',
        period: this.basicInfoForm.get('period')?.value,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalAmount: totalAmount,
        currency: currency || 'USD',
        timezone: this.basicInfoForm.get('timezone')?.value || 'UTC',
        categoryAllocations: this.getAllocationsArray().value
          .filter((allocation: any) => allocation.allocatedAmount > 0) // Only include allocations with positive amounts
          .map((allocation: any) => ({
            ...allocation,
            allocatedAmount: parseFloat(allocation.allocatedAmount),
            priority: parseInt(allocation.priority) || 1 // Ensure priority is an integer
          })),
        alertThreshold: this.settingsForm.get('alertThreshold')?.value || 80,
        autoAdjust: this.settingsForm.get('autoAdjust')?.value || false,
        allowRollover: this.settingsForm.get('allowRollover')?.value || false
      };

      // Validate that we have at least one category allocation
      if (budgetData.categoryAllocations.length === 0) {
        console.error('No category allocations found. Please allocate amounts to at least one category.');
        this.isSubmitting = false;
        return;
      }


      this.budgetService.createBudget(budgetData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (budget) => {
          this.isSubmitting = false;
          this.hideBudgetWizard();
          this.budgetCreated.emit(budget);
        },
        error: (error) => {
          console.error('Error creating budget:', error);
          console.error('Error details:', error.error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Full error response:', JSON.stringify(error, null, 2));
          
          // Show more specific error message to user
          if (error.error && error.error.message) {
            this.error = `Budget creation failed: ${error.error.message}`;
          } else if (error.error && typeof error.error === 'string') {
            this.error = `Budget creation failed: ${error.error}`;
          } else {
            this.error = 'Budget creation failed. Please check your input and try again.';
          }
          
          this.isSubmitting = false;
        }
      });
    }
  }

  validateAllSteps(): boolean {
    return this.basicInfoForm.valid && 
           this.categoryAllocationForm.valid && 
           this.settingsForm.valid &&
           this.getAllocationsArray().length > 0;
  }

  public resetWizard(): void {
    this.currentStep = 1;
    this.isSubmitting = false;
    this.basicInfoForm.reset({
      period: 'monthly',
      currency: 'USD',
      alertThreshold: 80,
      autoAdjust: false,
      allowRollover: false,
      rolloverAmount: 0
    });
    this.categoryAllocationForm.reset();
    this.settingsForm.reset({
      alertThreshold: 80,
      autoAdjust: false,
      allowRollover: false,
      rolloverAmount: 0
    });
    this.updateStepStates();
  }

  // Helper methods for template
  getCurrentStepTitle(): string {
    return this.steps[this.currentStep - 1]?.title || '';
  }

  getCurrentStepDescription(): string {
    return this.steps[this.currentStep - 1]?.description || '';
  }

  canGoNext(): boolean {
    return this.currentStep < this.totalSteps && this.validateCurrentStep();
  }

  canGoPrevious(): boolean {
    return this.currentStep > 1;
  }

  isLastStep(): boolean {
    return this.currentStep === this.totalSteps;
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  getTotalAllocated(): number {
    const allocationsArray = this.getAllocationsArray();
    const total = allocationsArray.controls.reduce((sum, control) => {
      const amount = control.get('allocatedAmount')?.value || 0;
      return sum + amount;
    }, 0);
    return total;
  }

  getRemainingAmount(): number {
    const totalAmount = this.basicInfoForm.get('totalAmount')?.value || 0;
    const totalAllocated = this.getTotalAllocated();
    const remaining = totalAmount - totalAllocated;
    return Math.round(remaining * 100) / 100;
  }

  isAllocationValid(): boolean {
    const totalAmount = this.basicInfoForm.get('totalAmount')?.value || 0;
    const allocated = this.getTotalAllocated();
    return Math.abs(totalAmount - allocated) < 0.01;
  }

  getCurrencySymbol(): string {
    const currency = this.basicInfoForm.get('currency')?.value;
    const currencyObj = this.currencies.find(c => c.value === currency);
    return currencyObj?.symbol || '$';
  }

  isAllocationFieldInvalid(allocation: any, fieldName: string): boolean {
    const field = allocation.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
}
