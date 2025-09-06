import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder, FormArray } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';

import { BudgetWizardComponent } from './budget-wizard';
import { BudgetService } from '../../../../core/services/budget.service';
import { CategoryService } from '../../../../core/services/category.service';
import { CreateBudgetDto } from '../../../../core/models/financial.model';

describe('BudgetWizardComponent - Branch Coverage', () => {
  let component: BudgetWizardComponent;
  let fixture: ComponentFixture<BudgetWizardComponent>;
  let budgetService: jasmine.SpyObj<BudgetService>;
  let categoryService: jasmine.SpyObj<CategoryService>;

  const mockCategories = [
    { 
      _id: '1', 
      name: 'Food', 
      type: 'expense', 
      color: '#ff0000', 
      icon: 'fas fa-utensils',
      path: ['food'],
      level: 0,
      isActive: true,
      isSystem: false,
      parentId: undefined,
      children: [],
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      _id: '2', 
      name: 'Transportation', 
      type: 'expense', 
      color: '#00ff00', 
      icon: 'fas fa-car',
      path: ['transportation'],
      level: 0,
      isActive: true,
      isSystem: false,
      parentId: undefined,
      children: [],
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      _id: '3', 
      name: 'Entertainment', 
      type: 'expense', 
      color: '#0000ff', 
      icon: 'fas fa-gamepad',
      path: ['entertainment'],
      level: 0,
      isActive: true,
      isSystem: false,
      parentId: undefined,
      children: [],
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockBudget = {
    _id: '1',
    name: 'Test Budget',
    description: 'Test Description',
    period: 'monthly' as 'monthly' | 'yearly' | 'custom',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    totalAmount: 1000,
    currency: 'USD',
    categoryAllocations: [
      { categoryId: '1', allocatedAmount: 500, isFlexible: false, priority: 1 },
      { categoryId: '2', allocatedAmount: 300, isFlexible: false, priority: 2 },
      { categoryId: '3', allocatedAmount: 200, isFlexible: true, priority: 3 }
    ],
    status: 'active' as 'active' | 'paused' | 'archived' | 'completed',
    alertThreshold: 80,
    userId: 'user1',
    isActive: true,
    autoAdjust: false,
    allowRollover: false,
    rolloverAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const budgetServiceSpy = jasmine.createSpyObj('BudgetService', ['createBudget', 'calculateBudgetPeriodDates']);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getUserCategories']);

    // Mock calculateBudgetPeriodDates
    budgetServiceSpy.calculateBudgetPeriodDates.and.returnValue({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31')
    });

    await TestBed.configureTestingModule({
      imports: [
        BudgetWizardComponent,
        ReactiveFormsModule
      ],
      providers: [
        { provide: BudgetService, useValue: budgetServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetWizardComponent);
    component = fixture.componentInstance;
    budgetService = TestBed.inject(BudgetService) as jasmine.SpyObj<BudgetService>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;

    // Setup default mocks
    categoryService.getUserCategories.and.returnValue(of(mockCategories));
    budgetService.createBudget.and.returnValue(of(mockBudget));

    fixture.detectChanges();
  });

  describe('initializeForms', () => {
    it('should initialize all forms with correct validators', () => {
      expect(component.basicInfoForm).toBeDefined();
      expect(component.categoryAllocationForm).toBeDefined();
      expect(component.settingsForm).toBeDefined();
      expect(component.wizardForm).toBeDefined();

      // Test basic info form validators
      expect(component.basicInfoForm.get('name')?.hasError('required')).toBe(true);
      expect(component.basicInfoForm.get('totalAmount')?.hasError('required')).toBe(true);
      expect(component.basicInfoForm.get('period')?.value).toBe('monthly');
      expect(component.basicInfoForm.get('currency')?.value).toBe('USD');

      // Test settings form validators
      expect(component.settingsForm.get('alertThreshold')?.value).toBe(80);
      expect(component.settingsForm.get('autoAdjust')?.value).toBe(false);
      expect(component.settingsForm.get('allowRollover')?.value).toBe(false);
    });
  });

  describe('setupFormValueChanges', () => {
    it('should update period dates when period changes', () => {
      spyOn(component, 'updatePeriodDates' as any);

      component.basicInfoForm.get('period')?.setValue('yearly');

      expect(component['updatePeriodDates']).toHaveBeenCalledWith('yearly');
    });

    it('should update rollover amount validators when allowRollover changes', () => {
      const rolloverAmountControl = component.settingsForm.get('rolloverAmount');

      // Test enabling rollover
      component.settingsForm.get('allowRollover')?.setValue(true);
      expect(rolloverAmountControl?.hasError('min')).toBe(false);

      // Test disabling rollover
      component.settingsForm.get('allowRollover')?.setValue(false);
      expect(rolloverAmountControl?.value).toBe(0);
    });
  });

  describe('updatePeriodDates', () => {
    it('should update start and end dates based on period', () => {
      component['updatePeriodDates']('monthly');

      expect(component.basicInfoForm.get('startDate')?.value).toBe('2024-01-01');
      expect(component.basicInfoForm.get('endDate')?.value).toBe('2024-01-31');
    });
  });

  describe('updateTotalAmount', () => {
    it('should calculate total from allocations', () => {
      component.basicInfoForm.patchValue({ totalAmount: 0 });
      component.initializeCategoryAllocations();
      
      const allocationsArray = component.getAllocationsArray();
      allocationsArray.at(0).get('allocatedAmount')?.setValue(500);
      allocationsArray.at(1).get('allocatedAmount')?.setValue(300);

      component['updateTotalAmount']();

      expect(component.basicInfoForm.get('totalAmount')?.value).toBe(800);
    });

    it('should handle empty allocations', () => {
      component.basicInfoForm.patchValue({ totalAmount: 0 });
      const fb = new FormBuilder();
      component.categoryAllocationForm = fb.group({
        allocations: fb.array([])
      });

      component['updateTotalAmount']();

      expect(component.basicInfoForm.get('totalAmount')?.value).toBe(0);
    });
  });

  describe('wizard navigation', () => {
    it('should show wizard and reset to step 1', () => {
      component.showBudgetWizard();

      expect(component.showWizard).toBe(true);
      expect(component.currentStep).toBe(1);
    });

    it('should hide wizard and reset', () => {
      component.showWizard = true;
      spyOn(component, 'resetWizard' as any);

      component.hideBudgetWizard();

      expect(component.showWizard).toBe(false);
      expect(component['resetWizard']).toHaveBeenCalled();
    });

    it('should go to next step when current step is valid', () => {
      component.basicInfoForm.patchValue({
        name: 'Test Budget',
        totalAmount: 1000,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      component.nextStep();

      expect(component.currentStep).toBe(2);
    });

    it('should not go to next step when current step is invalid', () => {
      component.basicInfoForm.patchValue({
        name: '',
        totalAmount: 0
      });

      component.nextStep();

      expect(component.currentStep).toBe(1);
    });

    it('should not exceed total steps', () => {
      component.currentStep = 4;

      component.nextStep();

      expect(component.currentStep).toBe(4);
    });

    it('should go to previous step', () => {
      component.currentStep = 2;

      component.previousStep();

      expect(component.currentStep).toBe(1);
    });

    it('should not go below step 1', () => {
      component.currentStep = 1;

      component.previousStep();

      expect(component.currentStep).toBe(1);
    });

    it('should go to step when it is completed or current', () => {
      component.steps[0].completed = true;
      component.steps[1].completed = true; // Step 1 must be completed to go to step 2
      component.currentStep = 1;

      component.goToStep(2);

      expect(component.currentStep).toBe(2);
    });

    it('should not go to step when it is not completed and not current', () => {
      component.steps[0].completed = false;
      component.currentStep = 1;

      component.goToStep(3);

      expect(component.currentStep).toBe(1);
    });
  });

  describe('validateCurrentStep', () => {
    it('should validate step 1 correctly', () => {
      component.currentStep = 1;
      component.basicInfoForm.patchValue({
        name: 'Test Budget',
        totalAmount: 1000,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(component['validateCurrentStep']()).toBe(true);
    });

    it('should validate step 2 correctly', () => {
      component.currentStep = 2;
      component.initializeCategoryAllocations();
      const allocationsArray = component.getAllocationsArray();
      allocationsArray.at(0).get('allocatedAmount')?.setValue(500);

      expect(component['validateCurrentStep']()).toBe(true);
    });

    it('should validate step 3 correctly', () => {
      component.currentStep = 3;
      component.settingsForm.patchValue({
        alertThreshold: 80,
        autoAdjust: false,
        allowRollover: false
      });

      expect(component['validateCurrentStep']()).toBe(true);
    });

    it('should validate step 4 correctly', () => {
      component.currentStep = 4;

      expect(component['validateCurrentStep']()).toBe(true);
    });

    it('should return false for invalid step', () => {
      component.currentStep = 5;

      expect(component['validateCurrentStep']()).toBe(false);
    });
  });

  describe('markCurrentStepCompleted', () => {
    it('should mark current step as completed', () => {
      component.currentStep = 1;

      component['markCurrentStepCompleted']();

      expect(component.steps[0].completed).toBe(true);
    });
  });

  describe('updateStepStates', () => {
    it('should update step states correctly', () => {
      component.currentStep = 2;

      component['updateStepStates']();

      expect(component.steps[0].current).toBe(false);
      expect(component.steps[1].current).toBe(true);
      expect(component.steps[2].current).toBe(false);
    });
  });

  describe('isStepCompleted', () => {
    it('should return true for completed step', () => {
      component.steps[0].completed = true;

      expect(component['isStepCompleted'](0)).toBe(true);
    });

    it('should return false for incomplete step', () => {
      component.steps[0].completed = false;

      expect(component['isStepCompleted'](0)).toBe(false);
    });

    it('should return false for non-existent step', () => {
      expect(component['isStepCompleted'](10)).toBe(false);
    });
  });

  describe('initializeCategoryAllocations', () => {
    it('should create allocations for all categories', () => {
      component.basicInfoForm.patchValue({ totalAmount: 1000 });
      component.initializeCategoryAllocations();

      const allocationsArray = component.getAllocationsArray();
      expect(allocationsArray.length).toBe(3);
    });

    it('should use historical data for suggested amounts', () => {
      component.basicInfoForm.patchValue({ totalAmount: 1000 });
      component.initializeCategoryAllocations();

      const allocationsArray = component.getAllocationsArray();
      const firstAllocation = allocationsArray.at(0);
      expect(firstAllocation.get('allocatedAmount')?.value).toBe(400); // 1000 * 40 / 100
    });

    it('should use 0 for categories without historical data', () => {
      component.basicInfoForm.patchValue({ totalAmount: 1000 });
      component.historicalSpending = []; // No historical data
      component.initializeCategoryAllocations();

      const allocationsArray = component.getAllocationsArray();
      const firstAllocation = allocationsArray.at(0);
      expect(firstAllocation.get('allocatedAmount')?.value).toBe(0);
    });
  });

  describe('getAllocationsArray', () => {
    it('should return form array', () => {
      const array = component.getAllocationsArray();
      expect(array).toBeInstanceOf(FormArray);
    });
  });

  describe('getCategoryName', () => {
    it('should return category name for existing category', () => {
      expect(component.getCategoryName('1')).toBe('Food');
    });

    it('should return unknown for non-existing category', () => {
      expect(component.getCategoryName('999')).toBe('Unknown Category');
    });
  });

  describe('getCategoryColor', () => {
    it('should return category color for existing category', () => {
      expect(component.getCategoryColor('1')).toBe('#ff0000');
    });

    it('should return default color for non-existing category', () => {
      expect(component.getCategoryColor('999')).toBe('#6c757d');
    });
  });

  describe('getCategoryIcon', () => {
    it('should return category icon for existing category', () => {
      expect(component.getCategoryIcon('1')).toBe('fas fa-utensils');
    });

    it('should return default icon for non-existing category', () => {
      expect(component.getCategoryIcon('999')).toBe('fas fa-folder');
    });
  });

  describe('getHistoricalPercentage', () => {
    it('should return historical percentage for existing category', () => {
      expect(component.getHistoricalPercentage('1')).toBe(40);
    });

    it('should return 0 for non-existing category', () => {
      expect(component.getHistoricalPercentage('999')).toBe(0);
    });
  });

  describe('useSuggestedAmounts', () => {
    it('should update allocations with suggested amounts', () => {
      component.basicInfoForm.patchValue({ totalAmount: 1000 });
      component.initializeCategoryAllocations();

      component.useSuggestedAmounts();

      const allocationsArray = component.getAllocationsArray();
      const firstAllocation = allocationsArray.at(0);
      expect(firstAllocation.get('allocatedAmount')?.value).toBe(400);
    });

    it('should not update when allocations array is empty', () => {
      const fb = new FormBuilder();
      component.categoryAllocationForm = fb.group({
        allocations: fb.array([])
      });

      expect(() => component.useSuggestedAmounts()).not.toThrow();
    });
  });

  describe('distributeEvenly', () => {
    it('should distribute total amount evenly among allocations', () => {
      component.basicInfoForm.patchValue({ totalAmount: 900 });
      component.initializeCategoryAllocations();

      component.distributeEvenly();

      const allocationsArray = component.getAllocationsArray();
      allocationsArray.controls.forEach(control => {
        expect(control.get('allocatedAmount')?.value).toBe(300); // 900 / 3
      });
    });

    it('should not distribute when allocations array is empty', () => {
      const fb = new FormBuilder();
      component.categoryAllocationForm = fb.group({
        allocations: fb.array([])
      });

      expect(() => component.distributeEvenly()).not.toThrow();
    });
  });

  describe('clearAllocations', () => {
    it('should clear all allocation amounts', () => {
      component.initializeCategoryAllocations();
      const allocationsArray = component.getAllocationsArray();
      allocationsArray.at(0).get('allocatedAmount')?.setValue(500);

      component.clearAllocations();

      allocationsArray.controls.forEach(control => {
        expect(control.get('allocatedAmount')?.value).toBe(0);
      });
    });
  });

  describe('getFormErrors', () => {
    it('should return required error', () => {
      const form = component.basicInfoForm;
      form.get('name')?.setValue('');
      form.get('name')?.markAsTouched();

      const errors = component.getFormErrors(form, 'name');
      expect(errors).toContain('name is required');
    });

    it('should return minlength error', () => {
      const form = component.basicInfoForm;
      form.get('name')?.setValue('ab');
      form.get('name')?.markAsTouched();

      const errors = component.getFormErrors(form, 'name');
      expect(errors).toContain('name must be at least 3 characters');
    });

    it('should return maxlength error', () => {
      const form = component.basicInfoForm;
      form.get('name')?.setValue('a'.repeat(201));
      form.get('name')?.markAsTouched();

      const errors = component.getFormErrors(form, 'name');
      expect(errors).toContain('name must be no more than 200 characters');
    });

    it('should return min error', () => {
      const form = component.basicInfoForm;
      form.get('totalAmount')?.setValue(0);
      form.get('totalAmount')?.markAsTouched();

      const errors = component.getFormErrors(form, 'totalAmount');
      expect(errors).toContain('totalAmount must be at least 0.01');
    });

    it('should return max error', () => {
      const form = component.settingsForm;
      form.get('alertThreshold')?.setValue(101);
      form.get('alertThreshold')?.markAsTouched();

      const errors = component.getFormErrors(form, 'alertThreshold');
      expect(errors).toContain('alertThreshold must be no more than 100');
    });

    it('should return empty array when field is valid', () => {
      const form = component.basicInfoForm;
      form.get('name')?.setValue('Valid Name');

      const errors = component.getFormErrors(form, 'name');
      expect(errors).toEqual([]);
    });

    it('should return empty array when field is not touched', () => {
      const form = component.basicInfoForm;
      form.get('name')?.setValue('');

      const errors = component.getFormErrors(form, 'name');
      expect(errors).toEqual([]);
    });
  });

  describe('isFieldInvalid', () => {
    it('should return true for invalid touched field', () => {
      const form = component.basicInfoForm;
      form.get('name')?.setValue('');
      form.get('name')?.markAsTouched();

      expect(component.isFieldInvalid(form, 'name')).toBe(true);
    });

    it('should return false for valid field', () => {
      const form = component.basicInfoForm;
      form.get('name')?.setValue('Valid Name');

      expect(component.isFieldInvalid(form, 'name')).toBe(false);
    });

    it('should return false for untouched field', () => {
      const form = component.basicInfoForm;
      form.get('name')?.setValue('');

      expect(component.isFieldInvalid(form, 'name')).toBe(false);
    });
  });

  describe('createBudget', () => {
    it('should create budget when all steps are valid', () => {
      component.basicInfoForm.patchValue({
        name: 'Test Budget',
        description: 'Test Description',
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        totalAmount: 1000,
        currency: 'USD'
      });
      component.initializeCategoryAllocations();
      component.settingsForm.patchValue({
        alertThreshold: 80,
        autoAdjust: false,
        allowRollover: false
      });

      component.createBudget();

      expect(budgetService.createBudget).toHaveBeenCalled();
    });

    it('should not create budget when steps are invalid', () => {
      component.basicInfoForm.patchValue({
        name: '',
        totalAmount: 0
      });

      component.createBudget();

      expect(budgetService.createBudget).not.toHaveBeenCalled();
    });

    it('should handle budget creation success', () => {
      spyOn(component.budgetCreated, 'emit');
      spyOn(component, 'hideBudgetWizard');
      component.basicInfoForm.patchValue({
        name: 'Test Budget',
        totalAmount: 1000,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
      component.initializeCategoryAllocations();

      component.createBudget();

      expect(component.isSubmitting).toBe(false);
      expect(component.budgetCreated.emit).toHaveBeenCalledWith(mockBudget);
      expect(component.hideBudgetWizard).toHaveBeenCalled();
    });

    it('should handle budget creation error', () => {
      budgetService.createBudget.and.returnValue(throwError(() => new Error('Creation failed')));
      component.basicInfoForm.patchValue({
        name: 'Test Budget',
        totalAmount: 1000,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
      component.initializeCategoryAllocations();

      component.createBudget();

      expect(component.isSubmitting).toBe(false);
    });
  });

  describe('validateAllSteps', () => {
    it('should return true when all steps are valid', () => {
      component.basicInfoForm.patchValue({
        name: 'Test Budget',
        totalAmount: 1000,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
      component.initializeCategoryAllocations();
      component.settingsForm.patchValue({
        alertThreshold: 80,
        autoAdjust: false,
        allowRollover: false
      });

      expect(component.validateAllSteps()).toBe(true);
    });

    it('should return false when basic info is invalid', () => {
      component.basicInfoForm.patchValue({
        name: '',
        totalAmount: 0
      });

      expect(component.validateAllSteps()).toBe(false);
    });

    it('should return false when allocations are empty', () => {
      component.basicInfoForm.patchValue({
        name: 'Test Budget',
        totalAmount: 1000,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
      const fb = new FormBuilder();
      component.categoryAllocationForm = fb.group({
        allocations: fb.array([])
      });

      expect(component.validateAllSteps()).toBe(false);
    });
  });

  describe('resetWizard', () => {
    it('should reset wizard to initial state', () => {
      component.currentStep = 3;
      component.isSubmitting = true;

      component['resetWizard']();

      expect(component.currentStep).toBe(1);
      expect(component.isSubmitting).toBe(false);
      expect(component.basicInfoForm.get('period')?.value).toBe('monthly');
      expect(component.basicInfoForm.get('currency')?.value).toBe('USD');
    });
  });

  describe('helper methods', () => {
    it('should return current step title', () => {
      component.currentStep = 1;
      expect(component.getCurrentStepTitle()).toBe('Basic Information');
    });

    it('should return current step description', () => {
      component.currentStep = 1;
      expect(component.getCurrentStepDescription()).toBe('Set budget name, period, and dates');
    });

    it('should return empty string for invalid step', () => {
      component.currentStep = 10;
      expect(component.getCurrentStepTitle()).toBe('');
      expect(component.getCurrentStepDescription()).toBe('');
    });

    it('should check if can go next', () => {
      component.currentStep = 1;
      component.basicInfoForm.patchValue({
        name: 'Test Budget',
        totalAmount: 1000,
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      expect(component.canGoNext()).toBe(true);
    });

    it('should check if can go previous', () => {
      component.currentStep = 2;
      expect(component.canGoPrevious()).toBe(true);

      component.currentStep = 1;
      expect(component.canGoPrevious()).toBe(false);
    });

    it('should check if is last step', () => {
      component.currentStep = 4;
      expect(component.isLastStep()).toBe(true);

      component.currentStep = 3;
      expect(component.isLastStep()).toBe(false);
    });

    it('should calculate progress percentage', () => {
      component.currentStep = 2;
      expect(component.getProgressPercentage()).toBe(50);
    });

    it('should calculate total allocated amount', () => {
      component.initializeCategoryAllocations();
      const allocationsArray = component.getAllocationsArray();
      allocationsArray.at(0).get('allocatedAmount')?.setValue(500);
      allocationsArray.at(1).get('allocatedAmount')?.setValue(300);

      expect(component.getTotalAllocated()).toBe(800);
    });

    it('should calculate remaining amount', () => {
      component.basicInfoForm.patchValue({ totalAmount: 1000 });
      component.initializeCategoryAllocations();
      const allocationsArray = component.getAllocationsArray();
      allocationsArray.at(0).get('allocatedAmount')?.setValue(500);
      allocationsArray.at(1).get('allocatedAmount')?.setValue(300);
      // Set the third allocation to 0 to ensure it doesn't interfere
      if (allocationsArray.length > 2) {
        allocationsArray.at(2).get('allocatedAmount')?.setValue(0);
      }

      expect(component.getRemainingAmount()).toBe(200);
    });

    it('should check if allocation is valid', () => {
      component.basicInfoForm.patchValue({ totalAmount: 1000 });
      component.initializeCategoryAllocations();
      const allocationsArray = component.getAllocationsArray();
      allocationsArray.at(0).get('allocatedAmount')?.setValue(500);
      allocationsArray.at(1).get('allocatedAmount')?.setValue(300);
      allocationsArray.at(2).get('allocatedAmount')?.setValue(200);

      expect(component.isAllocationValid()).toBe(true);
    });

    it('should return currency symbol', () => {
      component.basicInfoForm.patchValue({ currency: 'USD' });
      expect(component.getCurrencySymbol()).toBe('$');

      component.basicInfoForm.patchValue({ currency: 'EUR' });
      expect(component.getCurrencySymbol()).toBe('€');
    });

    it('should return default currency symbol for unknown currency', () => {
      component.basicInfoForm.patchValue({ currency: 'UNKNOWN' });
      expect(component.getCurrencySymbol()).toBe('$');
    });

    it('should check if allocation field is invalid', () => {
      component.initializeCategoryAllocations();
      const allocationsArray = component.getAllocationsArray();
      const allocation = allocationsArray.at(0);
      allocation.get('allocatedAmount')?.setValue(-1);
      allocation.get('allocatedAmount')?.markAsTouched();

      expect(component.isAllocationFieldInvalid(allocation, 'allocatedAmount')).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle category loading error', () => {
      categoryService.getUserCategories.and.returnValue(throwError(() => new Error('Category error')));

      component['loadCategories']();

      // The error handler doesn't clear categories, it just logs the error
      expect(component.categories).toBeDefined();
    });
  });
});
