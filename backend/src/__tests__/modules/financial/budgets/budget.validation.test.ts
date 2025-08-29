import { budgetValidation, validateBudgetInput } from '../../../../modules/financial/budgets/validation/budget.validation';
import { Types } from 'mongoose';

describe('Budget Validation Schemas', () => {
  const validBudgetData = {
    name: 'Monthly Budget',
    description: 'Monthly budget for groceries and utilities',
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    totalAmount: 1000.50,
    currency: 'USD',
    categoryAllocations: [
      {
        categoryId: new Types.ObjectId().toString(),
        allocatedAmount: 500.25,
        isFlexible: true,
        priority: 1,
      },
      {
        categoryId: new Types.ObjectId().toString(),
        allocatedAmount: 500.25,
        isFlexible: false,
        priority: 2,
      },
    ],
    alertThreshold: 80,
    autoAdjust: false,
    allowRollover: true,
    rolloverAmount: 100.00,
  };

  describe('createBudget Schema', () => {
    it('should validate valid budget data', () => {
      const result = validateBudgetInput.createBudget(validBudgetData);
      expect(result.error).toBeUndefined();
      // Joi converts string dates to Date objects, so we need to check individual fields
      expect(result.value.name).toBe(validBudgetData.name);
      expect(result.value.period).toBe(validBudgetData.period);
      expect(result.value.totalAmount).toBe(validBudgetData.totalAmount);
      expect(result.value.currency).toBe(validBudgetData.currency);
      expect(result.value.categoryAllocations).toHaveLength(2);
    });

    it('should reject missing required fields', () => {
      const invalidData = { name: 'Test Budget' };
      const result = validateBudgetInput.createBudget(invalidData);
      expect(result.error).toBeDefined();
      
      // Joi validates fields one by one, so we only get the first error
      // Check that we have at least one validation error
      expect(result.error?.details.length).toBeGreaterThan(0);
      expect(result.error?.details[0].path).toContain('period');
    });

    it('should reject invalid period values', () => {
      const invalidData = { ...validBudgetData, period: 'invalid' };
      const result = validateBudgetInput.createBudget(invalidData);
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.path.includes('period'))).toBe(true);
    });

    it('should reject negative total amount', () => {
      const invalidData = { ...validBudgetData, totalAmount: -100 };
      const result = validateBudgetInput.createBudget(invalidData);
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.path.includes('totalAmount'))).toBe(true);
    });

    it('should reject invalid currency length', () => {
      const invalidData = { ...validBudgetData, currency: 'US' };
      const result = validateBudgetInput.createBudget(invalidData);
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.path.includes('currency'))).toBe(true);
    });

    it('should reject invalid category allocation priority', () => {
      const invalidData = {
        ...validBudgetData,
        categoryAllocations: [
          {
            ...validBudgetData.categoryAllocations[0],
            priority: 15,
          },
        ],
      };
      const result = validateBudgetInput.createBudget(invalidData);
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.path.includes('priority'))).toBe(true);
    });

    it('should reject invalid ObjectId for category', () => {
      const invalidData = {
        ...validBudgetData,
        categoryAllocations: [
          {
            ...validBudgetData.categoryAllocations[0],
            categoryId: 'invalid-id',
          },
        ],
      };
      const result = validateBudgetInput.createBudget(invalidData);
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.path.includes('categoryId'))).toBe(true);
    });

    it('should reject when total allocated exceeds total budget', () => {
      const invalidData = {
        ...validBudgetData,
        totalAmount: 500,
        categoryAllocations: [
          {
            categoryId: new Types.ObjectId().toString(),
            allocatedAmount: 300,
            isFlexible: true,
            priority: 1,
          },
          {
            categoryId: new Types.ObjectId().toString(),
            allocatedAmount: 300,
            isFlexible: false,
            priority: 2,
          },
        ],
      };
      const result = validateBudgetInput.createBudget(invalidData);
      expect(result.error).toBeDefined();
      
      // The custom validation error message is in the context.message
      expect(result.error?.details[0]?.context?.message).toContain('Total allocated amount cannot exceed total budget amount');
    });

    it('should accept minimal valid data', () => {
      const minimalData = {
        name: 'Minimal Budget',
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        totalAmount: 1000,
        categoryAllocations: [
          {
            categoryId: new Types.ObjectId().toString(),
            allocatedAmount: 1000,
          },
        ],
      };
      const result = validateBudgetInput.createBudget(minimalData);
      expect(result.error).toBeUndefined();
    });

    it('should convert currency to uppercase', () => {
      const dataWithLowercaseCurrency = { ...validBudgetData, currency: 'usd' };
      const result = validateBudgetInput.createBudget(dataWithLowercaseCurrency);
      expect(result.error).toBeUndefined();
      expect(result.value.currency).toBe('USD');
    });

    it('should set default values for optional fields', () => {
      const dataWithoutDefaults = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        totalAmount: 1000,
        categoryAllocations: [
          {
            categoryId: new Types.ObjectId().toString(),
            allocatedAmount: 1000,
          },
        ],
      };
      const result = validateBudgetInput.createBudget(dataWithoutDefaults);
      expect(result.error).toBeUndefined();
      expect(result.value.currency).toBe('USD');
      expect(result.value.alertThreshold).toBe(80);
      expect(result.value.autoAdjust).toBe(false);
      expect(result.value.allowRollover).toBe(false);
      expect(result.value.rolloverAmount).toBe(0);
    });
  });

  describe('updateBudget Schema', () => {
    const validUpdateData = {
      name: 'Updated Budget',
      description: 'Updated description',
      status: 'active',
      totalAmount: 1500,
      categoryAllocations: [
        {
          categoryId: new Types.ObjectId().toString(),
          allocatedAmount: 750,
          isFlexible: true,
          priority: 1,
        },
        {
          categoryId: new Types.ObjectId().toString(),
          allocatedAmount: 750,
          isFlexible: false,
          priority: 2,
        },
      ],
      alertThreshold: 90,
      autoAdjust: true,
      allowRollover: false,
      rolloverAmount: 0,
    };

    it('should validate valid update data', () => {
      const result = validateBudgetInput.updateBudget(validUpdateData);
      expect(result.error).toBeUndefined();
      expect(result.value.name).toBe(validUpdateData.name);
      expect(result.value.status).toBe(validUpdateData.status);
      expect(result.value.totalAmount).toBe(validUpdateData.totalAmount);
    });

    it('should accept partial updates', () => {
      const partialData = { name: 'New Name' };
      const result = validateBudgetInput.updateBudget(partialData);
      expect(result.error).toBeUndefined();
      expect(result.value.name).toBe('New Name');
    });

    it('should reject invalid status values', () => {
      const invalidData = { ...validUpdateData, status: 'invalid' };
      const result = validateBudgetInput.updateBudget(invalidData);
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.path.includes('status'))).toBe(true);
    });

    it('should reject negative amounts', () => {
      const invalidData = { ...validUpdateData, totalAmount: -100 };
      const result = validateBudgetInput.updateBudget(invalidData);
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.path.includes('totalAmount'))).toBe(true);
    });

    it('should validate custom validation for category allocations', () => {
      const invalidData = {
        ...validUpdateData,
        totalAmount: 500,
        categoryAllocations: [
          {
            categoryId: new Types.ObjectId().toString(),
            allocatedAmount: 600,
          },
        ],
      };
      const result = validateBudgetInput.updateBudget(invalidData);
      expect(result.error).toBeDefined();
      
      // The custom validation error message is in the context.message
      expect(result.error?.details[0]?.context?.message).toContain('Total allocated amount cannot exceed total budget amount');
    });

    it('should allow empty string for description', () => {
      const dataWithEmptyDescription = { name: 'Test Budget', description: '' };
      const result = validateBudgetInput.updateBudget(dataWithEmptyDescription);
      expect(result.error).toBeUndefined();
      expect(result.value.description).toBe('');
    });
  });

  describe('updateCategoryAllocation Schema', () => {
    const validAllocationData = {
      allocatedAmount: 500.50,
      isFlexible: true,
      priority: 3,
    };

    it('should validate valid allocation data', () => {
      const result = validateBudgetInput.updateCategoryAllocation(validAllocationData);
      expect(result.error).toBeUndefined();
      expect(result.value).toEqual(validAllocationData);
    });

    it('should reject missing allocated amount', () => {
      const invalidData = { isFlexible: true };
      const result = validateBudgetInput.updateCategoryAllocation(invalidData);
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.path.includes('allocatedAmount'))).toBe(true);
    });

    it('should reject negative allocated amount', () => {
      const invalidData = { ...validAllocationData, allocatedAmount: -100 };
      const result = validateBudgetInput.updateCategoryAllocation(invalidData);
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.path.includes('allocatedAmount'))).toBe(true);
    });

    it('should reject invalid priority values', () => {
      const invalidData = { ...validAllocationData, priority: 15 };
      const result = validateBudgetInput.updateCategoryAllocation(invalidData);
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.path.includes('priority'))).toBe(true);
    });

    it('should accept minimal valid data', () => {
      const minimalData = { allocatedAmount: 100 };
      const result = validateBudgetInput.updateCategoryAllocation(minimalData);
      expect(result.error).toBeUndefined();
    });
  });

  describe('budgetFilters Schema', () => {
    const validFilters = {
      status: 'active',
      period: 'monthly',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      categoryId: new Types.ObjectId().toString(),
      isActive: true,
    };

    it('should validate valid filters', () => {
      const result = validateBudgetInput.budgetFilters(validFilters);
      expect(result.error).toBeUndefined();
      // Check individual fields since dates get converted
      expect(result.value.status).toBe(validFilters.status);
      expect(result.value.period).toBe(validFilters.period);
      expect(result.value.categoryId).toBe(validFilters.categoryId);
      expect(result.value.isActive).toBe(validFilters.isActive);
    });

    it('should accept partial filters', () => {
      const partialFilters = { status: 'active' };
      const result = validateBudgetInput.budgetFilters(partialFilters);
      expect(result.error).toBeUndefined();
      expect(result.value.status).toBe('active');
    });

    it('should reject invalid status values', () => {
      const invalidFilters = { ...validFilters, status: 'invalid' };
      const result = validateBudgetInput.budgetFilters(invalidFilters);
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.path.includes('status'))).toBe(true);
    });

    it('should reject invalid period values', () => {
      const invalidFilters = { ...validFilters, period: 'invalid' };
      const result = validateBudgetInput.budgetFilters(invalidFilters);
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.path.includes('period'))).toBe(true);
    });

    it('should reject invalid ObjectId for category', () => {
      const invalidFilters = { ...validFilters, categoryId: 'invalid-id' };
      const result = validateBudgetInput.budgetFilters(invalidFilters);
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.path.includes('categoryId'))).toBe(true);
    });

    it('should accept empty filters object', () => {
      const emptyFilters = {};
      const result = validateBudgetInput.budgetFilters(emptyFilters);
      expect(result.error).toBeUndefined();
      expect(result.value).toEqual({});
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values gracefully', () => {
      const nullData = {
        name: null,
        period: null,
        startDate: null,
        endDate: null,
        totalAmount: null,
        categoryAllocations: null,
      };
      const result = validateBudgetInput.createBudget(nullData);
      expect(result.error).toBeDefined();
    });

    it('should handle undefined values gracefully', () => {
      const undefinedData = {
        name: undefined,
        period: undefined,
        startDate: undefined,
        endDate: undefined,
        totalAmount: undefined,
        categoryAllocations: undefined,
      };
      const result = validateBudgetInput.createBudget(undefinedData);
      expect(result.error).toBeDefined();
    });

    it('should handle empty objects gracefully', () => {
      const emptyData = {};
      const result = validateBudgetInput.createBudget(emptyData);
      expect(result.error).toBeDefined();
    });

    it('should handle extra fields gracefully', () => {
      const extraFieldsData = {
        ...validBudgetData,
        extraField: 'should be ignored',
        anotherField: 123,
      };
      const result = validateBudgetInput.createBudget(extraFieldsData);
      // Joi is strict by default, so extra fields are not allowed
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.message.includes('extraField'))).toBe(true);
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        ...validBudgetData,
        metadata: {
          tags: ['important', 'monthly'],
          notes: {
            created: '2024-01-01',
            updated: '2024-01-15',
          },
        },
      };
      const result = validateBudgetInput.createBudget(complexData);
      // Joi is strict by default, so extra fields are not allowed
      expect(result.error).toBeDefined();
      expect(result.error?.details.some(d => d.message.includes('metadata'))).toBe(true);
    });

    it('should handle array validation', () => {
      const arrayData = {
        ...validBudgetData,
        categoryAllocations: [
          {
            categoryId: new Types.ObjectId().toString(),
            allocatedAmount: 1000,
          },
        ],
      };
      const result = validateBudgetInput.createBudget(arrayData);
      expect(result.error).toBeUndefined();
      expect(Array.isArray(result.value.categoryAllocations)).toBe(true);
    });

    it('should handle validation with custom error messages', () => {
      const invalidData = { name: '' };
      const result = validateBudgetInput.createBudget(invalidData);
      expect(result.error).toBeDefined();
      const nameError = result.error?.details.find(d => d.path.includes('name'));
      expect(nameError?.message).toContain('Budget name is required');
    });

    it('should handle multiple validation errors', () => {
      const invalidData = {
        name: '',
        period: 'invalid',
        totalAmount: -100,
      };
      const result = validateBudgetInput.createBudget(invalidData);
      expect(result.error).toBeDefined();
      // At least one validation error should be present
      expect(result.error?.details.length).toBeGreaterThan(0);
    });

    it('should handle validation with nested field paths', () => {
      const invalidData = {
        ...validBudgetData,
        categoryAllocations: [
          {
            categoryId: 'invalid-id',
            allocatedAmount: -100,
          },
        ],
      };
      const result = validateBudgetInput.createBudget(invalidData);
      expect(result.error).toBeDefined();
      const categoryError = result.error?.details.find(d => d.path.includes('categoryAllocations'));
      expect(categoryError).toBeDefined();
    });
  });
});
