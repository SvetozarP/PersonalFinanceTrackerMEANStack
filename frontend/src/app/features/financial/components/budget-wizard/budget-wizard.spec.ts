import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { BudgetWizardComponent } from './budget-wizard';
import { BudgetService } from '../../../../core/services/budget.service';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/financial.model';

describe('BudgetWizardComponent', () => {
  let component: BudgetWizardComponent;
  let fixture: ComponentFixture<BudgetWizardComponent>;
  let mockBudgetService: jasmine.SpyObj<BudgetService>;
  let mockCategoryService: jasmine.SpyObj<CategoryService>;

  const mockCategories: Category[] = [
    {
      _id: '1',
      name: 'Food & Dining',
      description: 'Food and dining expenses',
      color: '#ff6b6b',
      icon: 'fas fa-utensils',
      path: ['Food & Dining'],
      level: 0,
      isActive: true,
      isSystem: false,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '2',
      name: 'Transportation',
      description: 'Transportation expenses',
      color: '#4ecdc4',
      icon: 'fas fa-car',
      path: ['Transportation'],
      level: 0,
      isActive: true,
      isSystem: false,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(async () => {
    const budgetServiceSpy = jasmine.createSpyObj('BudgetService', [
      'createBudget',
      'calculateBudgetPeriodDates',
      'validateBudgetData'
    ]);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
      'getUserCategories'
    ]);

    await TestBed.configureTestingModule({
      imports: [BudgetWizardComponent, ReactiveFormsModule, FormsModule],
      providers: [
        { provide: BudgetService, useValue: budgetServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetWizardComponent);
    component = fixture.componentInstance;
    mockBudgetService = TestBed.inject(BudgetService) as jasmine.SpyObj<BudgetService>;
    mockCategoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;

    // Setup default mocks
    mockCategoryService.getUserCategories.and.returnValue(of(mockCategories));
    mockBudgetService.calculateBudgetPeriodDates.and.returnValue({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31')
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms on init', () => {
    component.ngOnInit();
    
    expect(component.basicInfoForm).toBeDefined();
    expect(component.categoryAllocationForm).toBeDefined();
    expect(component.settingsForm).toBeDefined();
    expect(component.wizardForm).toBeDefined();
  });

  it('should load categories on init', () => {
    component.ngOnInit();
    
    expect(mockCategoryService.getUserCategories).toHaveBeenCalled();
    expect(component.categories).toEqual(mockCategories);
  });

  it('should show wizard when showBudgetWizard is called', () => {
    component.showBudgetWizard();
    
    expect(component.showWizard).toBeTrue();
    expect(component.currentStep).toBe(1);
  });

  it('should hide wizard when hideBudgetWizard is called', () => {
    component.showWizard = true;
    component.hideBudgetWizard();
    
    expect(component.showWizard).toBeFalse();
    expect(component.currentStep).toBe(1);
  });

  it('should move to next step when nextStep is called with valid form', () => {
    component.ngOnInit();
    component.showBudgetWizard();
    
    // Fill basic info form
    component.basicInfoForm.patchValue({
      name: 'Test Budget',
      period: 'monthly',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      totalAmount: 1000,
      currency: 'USD'
    });
    
    component.nextStep();
    
    expect(component.currentStep).toBe(2);
    expect(component.steps[0].completed).toBeTrue();
  });

  it('should not move to next step when form is invalid', () => {
    component.ngOnInit();
    component.showBudgetWizard();
    
    // Don't fill required fields
    component.nextStep();
    
    expect(component.currentStep).toBe(1);
    expect(component.steps[0].completed).toBeFalse();
  });

  it('should move to previous step when previousStep is called', () => {
    component.currentStep = 2;
    component.previousStep();
    
    expect(component.currentStep).toBe(1);
  });

  it('should not move to previous step when on first step', () => {
    component.currentStep = 1;
    component.previousStep();
    
    expect(component.currentStep).toBe(1);
  });

  it('should update period dates when period changes', () => {
    component.ngOnInit();
    
    component.basicInfoForm.patchValue({ period: 'yearly' });
    
    expect(mockBudgetService.calculateBudgetPeriodDates).toHaveBeenCalledWith('yearly', undefined);
  });

  it('should initialize category allocations when moving to step 2', () => {
    component.ngOnInit();
    component.showBudgetWizard();
    component.currentStep = 2;
    
    component.initializeCategoryAllocations();
    
    const allocationsArray = component.getAllocationsArray();
    expect(allocationsArray.length).toBe(mockCategories.length);
  });

  it('should calculate total allocated amount correctly', () => {
    component.ngOnInit();
    component.showBudgetWizard();
    component.currentStep = 2;
    component.initializeCategoryAllocations();
    
    const allocationsArray = component.getAllocationsArray();
    allocationsArray.controls[0].patchValue({ allocatedAmount: 500 });
    allocationsArray.controls[1].patchValue({ allocatedAmount: 300 });
    
    const total = component.getTotalAllocated();
    expect(total).toBe(800);
  });

  it('should calculate remaining amount correctly', () => {
    component.ngOnInit();
    component.basicInfoForm.patchValue({ totalAmount: 1000 });
    component.showBudgetWizard();
    component.currentStep = 2;
    component.initializeCategoryAllocations();
    
    const allocationsArray = component.getAllocationsArray();
    allocationsArray.controls[0].patchValue({ allocatedAmount: 600 });
    allocationsArray.controls[1].patchValue({ allocatedAmount: 300 });
    
    const remaining = component.getRemainingAmount();
    expect(remaining).toBe(100);
  });

  it('should validate allocation correctly', () => {
    component.ngOnInit();
    component.basicInfoForm.patchValue({ totalAmount: 1000 });
    component.showBudgetWizard();
    component.currentStep = 2;
    component.initializeCategoryAllocations();
    
    const allocationsArray = component.getAllocationsArray();
    allocationsArray.controls[0].patchValue({ allocatedAmount: 500 });
    allocationsArray.controls[1].patchValue({ allocatedAmount: 500 });
    
    expect(component.isAllocationValid()).toBeTrue();
  });

  it('should use suggested amounts when useSuggestedAmounts is called', () => {
    component.ngOnInit();
    component.basicInfoForm.patchValue({ totalAmount: 1000 });
    component.showBudgetWizard();
    component.currentStep = 2;
    component.initializeCategoryAllocations();
    
    component.useSuggestedAmounts();
    
    const allocationsArray = component.getAllocationsArray();
    // Should have allocated amounts based on historical percentages
    expect(allocationsArray.controls[0].get('allocatedAmount')?.value).toBeGreaterThan(0);
  });

  it('should distribute amounts evenly when distributeEvenly is called', () => {
    component.ngOnInit();
    component.basicInfoForm.patchValue({ totalAmount: 1000 });
    component.showBudgetWizard();
    component.currentStep = 2;
    component.initializeCategoryAllocations();
    
    component.distributeEvenly();
    
    const allocationsArray = component.getAllocationsArray();
    const evenAmount = 1000 / allocationsArray.length;
    
    allocationsArray.controls.forEach(control => {
      expect(control.get('allocatedAmount')?.value).toBe(evenAmount);
    });
  });

  it('should clear all allocations when clearAllocations is called', () => {
    component.ngOnInit();
    component.basicInfoForm.patchValue({ totalAmount: 1000 });
    component.showBudgetWizard();
    component.currentStep = 2;
    component.initializeCategoryAllocations();
    
    component.clearAllocations();
    
    const allocationsArray = component.getAllocationsArray();
    allocationsArray.controls.forEach(control => {
      expect(control.get('allocatedAmount')?.value).toBe(0);
    });
  });

  it('should create budget successfully', () => {
    const mockBudget = {
      _id: 'budget1',
      name: 'Test Budget',
      period: 'monthly' as const,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      totalAmount: 1000,
      currency: 'USD',
      categoryAllocations: [],
      status: 'active' as const,
      alertThreshold: 80,
      userId: 'user1',
      isActive: true,
      autoAdjust: false,
      allowRollover: false,
      rolloverAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockBudgetService.createBudget.and.returnValue(of(mockBudget));
    
    component.ngOnInit();
    component.showBudgetWizard();
    
    // Fill all forms
    component.basicInfoForm.patchValue({
      name: 'Test Budget',
      period: 'monthly',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      totalAmount: 1000,
      currency: 'USD'
    });
    
    component.currentStep = 2;
    component.initializeCategoryAllocations();
    
    component.currentStep = 3;
    component.settingsForm.patchValue({
      alertThreshold: 80,
      autoAdjust: false,
      allowRollover: false,
      rolloverAmount: 0
    });
    
    component.currentStep = 4;
    component.createBudget();
    
    expect(mockBudgetService.createBudget).toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
  });

  it('should handle budget creation error', () => {
    mockBudgetService.createBudget.and.returnValue(throwError(() => new Error('Creation failed')));
    
    component.ngOnInit();
    component.showBudgetWizard();
    component.isSubmitting = true;
    
    component.createBudget();
    
    expect(component.isSubmitting).toBeFalse();
  });

  it('should validate all steps correctly', () => {
    component.ngOnInit();
    
    // Initially should be invalid
    expect(component.validateAllSteps()).toBeFalse();
    
    // Fill basic info
    component.basicInfoForm.patchValue({
      name: 'Test Budget',
      period: 'monthly',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      totalAmount: 1000,
      currency: 'USD'
    });
    
    // Still invalid without category allocations
    expect(component.validateAllSteps()).toBeFalse();
    
    // Add category allocations
    component.showBudgetWizard();
    component.currentStep = 2;
    component.initializeCategoryAllocations();
    
    // Should be valid now
    expect(component.validateAllSteps()).toBeTrue();
  });

  it('should get form errors correctly', () => {
    component.ngOnInit();
    
    const form = component.basicInfoForm;
    const fieldName = 'name';
    
    // Touch the field to trigger validation
    form.get(fieldName)?.markAsTouched();
    
    const errors = component.getFormErrors(form, fieldName);
    expect(errors).toContain('name is required');
  });

  it('should check if field is invalid correctly', () => {
    component.ngOnInit();
    
    const form = component.basicInfoForm;
    const fieldName = 'name';
    
    // Initially should not be invalid (not touched)
    expect(component.isFieldInvalid(form, fieldName)).toBeFalse();
    
    // Touch and mark as invalid
    form.get(fieldName)?.markAsTouched();
    form.get(fieldName)?.setErrors({ required: true });
    
    expect(component.isFieldInvalid(form, fieldName)).toBeTrue();
  });

  it('should get category name correctly', () => {
    component.ngOnInit();
    
    const categoryName = component.getCategoryName('1');
    expect(categoryName).toBe('Food & Dining');
  });

  it('should get category color correctly', () => {
    component.ngOnInit();
    
    const categoryColor = component.getCategoryColor('1');
    expect(categoryColor).toBe('#ff6b6b');
  });

  it('should get category icon correctly', () => {
    component.ngOnInit();
    
    const categoryIcon = component.getCategoryIcon('1');
    expect(categoryIcon).toBe('fas fa-utensils');
  });

  it('should get historical percentage correctly', () => {
    component.ngOnInit();
    
    const percentage = component.getHistoricalPercentage('1');
    expect(percentage).toBe(40);
  });

  it('should calculate progress percentage correctly', () => {
    component.currentStep = 2;
    component.totalSteps = 4;
    
    const progress = component.getProgressPercentage();
    expect(progress).toBe(50);
  });

  it('should check if can go next correctly', () => {
    component.ngOnInit();
    component.showBudgetWizard();
    
    // Initially should not be able to go next (invalid form)
    expect(component.canGoNext()).toBeFalse();
    
    // Fill form
    component.basicInfoForm.patchValue({
      name: 'Test Budget',
      period: 'monthly',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      totalAmount: 1000,
      currency: 'USD'
    });
    
    expect(component.canGoNext()).toBeTrue();
  });

  it('should check if can go previous correctly', () => {
    component.currentStep = 1;
    expect(component.canGoPrevious()).toBeFalse();
    
    component.currentStep = 2;
    expect(component.canGoPrevious()).toBeTrue();
  });

  it('should check if is last step correctly', () => {
    component.currentStep = 1;
    expect(component.isLastStep()).toBeFalse();
    
    component.currentStep = 4;
    expect(component.isLastStep()).toBeTrue();
  });

  it('should get current step title correctly', () => {
    component.currentStep = 1;
    expect(component.getCurrentStepTitle()).toBe('Basic Information');
    
    component.currentStep = 2;
    expect(component.getCurrentStepTitle()).toBe('Category Allocation');
  });

  it('should get current step description correctly', () => {
    component.currentStep = 1;
    expect(component.getCurrentStepDescription()).toBe('Set budget name, period, and dates');
    
    component.currentStep = 2;
    expect(component.getCurrentStepDescription()).toBe('Allocate amounts to categories');
  });

  it('should reset wizard correctly', () => {
    component.currentStep = 3;
    component.isSubmitting = true;
    component.showWizard = true;
    
    component.resetWizard();
    
    expect(component.currentStep).toBe(1);
    expect(component.isSubmitting).toBeFalse();
    expect(component.basicInfoForm.get('period')?.value).toBe('monthly');
    expect(component.basicInfoForm.get('currency')?.value).toBe('USD');
  });
});
