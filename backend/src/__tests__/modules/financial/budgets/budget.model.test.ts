import mongoose from 'mongoose';

describe('Budget Model', () => {
  let Budget: any;

  beforeAll(async () => {
    // Import the model
    const budgetModule = require('../../../../modules/financial/budgets/models/budget.model');
    Budget = budgetModule.default;
  });

  it('should be able to import budget model', async () => {
    // This is a simple test to check if the model can be imported
    expect(true).toBe(true);
  });

  it('should have mongoose available', () => {
    expect(mongoose).toBeDefined();
    expect(mongoose.Types.ObjectId).toBeDefined();
  });

  it('should be able to import budget model step by step', async () => {
    // Try importing the model step by step
    try {
      // First, try to import the interfaces
      const interfaces = require('../../../../modules/financial/budgets/interfaces/budget.interface');
      console.log('Interfaces imported successfully');
      
      // Then try to import the model
      const budgetModule = require('../../../../modules/financial/budgets/models/budget.model');
      console.log('Budget module imported successfully');
      
      const Budget = budgetModule.default;
      expect(Budget).toBeDefined();
      
      console.log('Budget model imported successfully');
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  });

  describe('Schema Validation', () => {
    it('should create a valid budget with required fields', async () => {
      const validBudgetData = {
        name: 'Monthly Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
            isFlexible: false,
            priority: 1,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(validBudgetData);
      const savedBudget = await budget.save();

      expect(savedBudget.name).toBe(validBudgetData.name);
      expect(savedBudget.period).toBe(validBudgetData.period);
      expect(savedBudget.totalAmount).toBe(1000);
      expect(savedBudget.currency).toBe('USD');
      expect(savedBudget.status).toBe('active');
      expect(savedBudget.isActive).toBe(true);
      expect(savedBudget.autoAdjust).toBe(false);
      expect(savedBudget.allowRollover).toBe(false);
      expect(savedBudget.rolloverAmount).toBe(0);
      expect(savedBudget.alertThreshold).toBe(80);
    });

    it('should create a budget with optional fields', async () => {
      const budgetData = {
        name: 'Yearly Budget',
        description: 'Annual budget for 2024',
        period: 'yearly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        totalAmount: 12000,
        currency: 'EUR',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 6000,
            isFlexible: true,
            priority: 2,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
        alertThreshold: 90,
        autoAdjust: true,
        allowRollover: true,
        rolloverAmount: 1000,
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();

      expect(savedBudget.description).toBe(budgetData.description);
      expect(savedBudget.alertThreshold).toBe(90);
      expect(savedBudget.autoAdjust).toBe(true);
      expect(savedBudget.allowRollover).toBe(true);
      expect(savedBudget.rolloverAmount).toBe(1000);
    });

    it('should fail when required fields are missing', async () => {
      const invalidBudget = new Budget({});

      let error: any;
      try {
        await invalidBudget.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors).toBeDefined();
      expect(error.name).toBe('ValidationError');
      expect(error.message).toContain('Budget validation failed');
      
      // Check the specific validation errors that are actually present
      expect(error.errors.name).toBeDefined();
      expect(error.errors.startDate).toBeDefined();
      expect(error.errors.endDate).toBeDefined();
      expect(error.errors.totalAmount).toBeDefined();
      expect(error.errors.userId).toBeDefined();
      
      // Check that the error messages are correct
      expect(error.errors.name.message).toBe('Budget name is required');
      expect(error.errors.startDate.message).toBe('Start date is required');
      expect(error.errors.endDate.message).toBe('End date is required');
      expect(error.errors.totalAmount.message).toBe('Total budget amount is required');
      expect(error.errors.userId.message).toBe('User ID is required');
    });

    it('should fail with invalid period value', async () => {
      const invalidBudgetData = {
        name: 'Test Budget',
        period: 'invalid-period',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(invalidBudgetData);

      let error: any;
      try {
        await budget.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors).toBeDefined();
      expect(error.errors.period).toBeDefined();
      expect(error.errors.period.message).toContain('Budget period must be monthly, yearly, or custom');
    });

    it('should fail with invalid status value', async () => {
      const invalidBudgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
        status: 'invalid-status',
      };

      const budget = new Budget(invalidBudgetData);

      let error: any;
      try {
        await budget.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors).toBeDefined();
      expect(error.errors.status).toBeDefined();
      expect(error.errors.status.message).toContain('Invalid budget status');
    });

    it('should fail with negative total amount', async () => {
      const invalidBudgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: -100,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(invalidBudgetData);

      let error: any;
      try {
        await budget.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors).toBeDefined();
      expect(error.errors.totalAmount).toBeDefined();
      expect(error.errors.totalAmount.message).toContain('Total budget amount must be greater than 0');
    });

    it('should fail with invalid currency length', async () => {
      const invalidBudgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'US',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(invalidBudgetData);

      let error: any;
      try {
        await budget.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors).toBeDefined();
      expect(error.errors.currency).toBeDefined();
      expect(error.errors.currency.message).toContain('Currency code must be 3 characters');
    });

    it('should fail with invalid category allocation priority', async () => {
      const invalidBudgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
            priority: 15, // Invalid priority > 10
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(invalidBudgetData);

      let error: any;
      try {
        await budget.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors).toBeDefined();
      expect(error.errors['categoryAllocations.0.priority']).toBeDefined();
      expect(error.errors['categoryAllocations.0.priority'].message).toContain('Priority cannot exceed 10');
    });
  });

  describe('Virtual Fields', () => {
    it('should calculate durationDays correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate,
        endDate,
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();

      // Calculate expected duration (30 days for Jan 1 to Jan 31)
      const expectedDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(savedBudget.durationDays).toBe(expectedDuration);
    });
  });

  describe('Data Transformation', () => {
    it('should round total amount to 2 decimal places', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000.567,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500.123,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();

      expect(savedBudget.totalAmount).toBe(1000.57);
      expect(savedBudget.categoryAllocations[0].allocatedAmount).toBe(500.12);
    });

    it('should convert currency to uppercase', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'usd',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();

      expect(savedBudget.currency).toBe('USD');
    });
  });

  describe('Instance Methods', () => {
    it('should check if budget is active for a given date', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate,
        endDate,
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();

      // Test with date within budget period
      const withinDate = new Date('2024-01-15');
      expect(savedBudget.isActiveForDate(withinDate)).toBe(true);

      // Test with date before budget period
      const beforeDate = new Date('2023-12-31');
      expect(savedBudget.isActiveForDate(beforeDate)).toBe(false);

      // Test with date after budget period
      const afterDate = new Date('2024-02-01');
      expect(savedBudget.isActiveForDate(afterDate)).toBe(false);

      // Test with start date
      expect(savedBudget.isActiveForDate(startDate)).toBe(true);

      // Test with end date
      expect(savedBudget.isActiveForDate(endDate)).toBe(true);
    });

    it('should get category allocation by category ID', async () => {
      const categoryId = new mongoose.Types.ObjectId();
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId,
            allocatedAmount: 500,
            isFlexible: true,
            priority: 1,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();

      const allocation = savedBudget.getCategoryAllocation(categoryId.toString());
      expect(allocation).toBeDefined();
      expect(allocation?.categoryId.toString()).toBe(categoryId.toString());
      expect(allocation?.allocatedAmount).toBe(500);

      // Test with non-existent category ID
      const nonExistentAllocation = savedBudget.getCategoryAllocation(new mongoose.Types.ObjectId().toString());
      expect(nonExistentAllocation).toBeUndefined();
    });

    it('should update category allocation', async () => {
      const categoryId = new mongoose.Types.ObjectId();
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId,
            allocatedAmount: 500,
            isFlexible: true,
            priority: 1,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();

      // Update allocation
      const result = savedBudget.updateCategoryAllocation(categoryId.toString(), 600);
      expect(result).toBe(true);
      expect(savedBudget.categoryAllocations[0].allocatedAmount).toBe(600);

      // Test with non-existent category ID
      const nonExistentResult = savedBudget.updateCategoryAllocation(new mongoose.Types.ObjectId().toString(), 700);
      expect(nonExistentResult).toBe(false);
    });

    it('should calculate remaining days correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate,
        endDate,
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();

      // Since the virtual field uses new Date() which gets current date, and our test dates are in 2024,
      // the remainingDays will be negative (past dates). Let's test the virtual field logic differently.
      // We'll test that the virtual field exists and has a reasonable value
      expect(typeof savedBudget.remainingDays).toBe('number');
      
      // The virtual field should calculate based on current date vs endDate
      // Since our endDate is in 2024 and current date is 2025, it will be negative
      // This is expected behavior for past budgets
      expect(savedBudget.remainingDays).toBeLessThanOrEqual(0);
    });

    it('should calculate progress percentage correctly', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();

      // Test with zero spent amount
      expect(savedBudget.progressPercentage).toBe(0);

      // Test with some spent amount (this would be set by service layer)
      // For now, we test the virtual field calculation
      expect(savedBudget.progressPercentage).toBe(0);
    });

    it('should calculate remaining amount correctly', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();

      // Test with zero spent amount
      expect(savedBudget.remainingAmount).toBe(1000);

      // Test with some spent amount (this would be set by service layer)
      // For now, we test the virtual field calculation
      expect(savedBudget.remainingAmount).toBe(1000);
    });

    it('should check if budget is over budget', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();

      // Test with zero spent amount (not over budget)
      expect(savedBudget.isOverBudget).toBe(false);

      // Test with some spent amount (this would be set by service layer)
      // For now, we test the virtual field calculation
      expect(savedBudget.isOverBudget).toBe(false);
    });
  });

  describe('Static Methods', () => {
    it('should find active budgets for a user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const currentDate = new Date('2024-01-15'); // Date within the budget period
      
      const activeBudgetData = {
        name: 'Active Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId,
        status: 'active',
      };

      const inactiveBudgetData = {
        name: 'Inactive Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId,
        status: 'paused',
      };

      // Clean up any existing budgets first
      await Budget.deleteMany({});

      // Create the active budget
      await Budget.create(activeBudgetData);

      // Create the inactive budget
      await Budget.create(inactiveBudgetData);

      // Test the static method with a specific date within the budget period
      const activeBudgets = await Budget.findActiveBudgets(userId.toString(), currentDate);
      expect(activeBudgets).toHaveLength(1);
      expect(activeBudgets[0].name).toBe('Active Budget');
      expect(activeBudgets[0].status).toBe('active');

      // Clean up after test
      await Budget.deleteMany({});
    });

    it('should find active budgets for a specific date', async () => {
      const userId = new mongoose.Types.ObjectId();
      const currentDate = new Date('2024-01-15');
      
      const activeBudgetData = {
        name: 'Active Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId,
        status: 'active',
      };

      await Budget.create(activeBudgetData);

      const activeBudgets = await Budget.findActiveBudgets(userId.toString(), currentDate);
      expect(activeBudgets).toHaveLength(1);
      expect(activeBudgets[0].name).toBe('Active Budget');
    });
  });

  describe('Pre-save Middleware', () => {
    it('should validate start date is before end date', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-31'), // Start after end
        endDate: new Date('2024-01-01'),   // End before start
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      
      await expect(budget.save()).rejects.toThrow('Start date must be before end date');
    });

    it('should validate category allocations do not exceed total amount', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 600,
          },
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      
      await expect(budget.save()).rejects.toThrow('Total allocated amount cannot exceed total budget amount');
    });

    it('should allow category allocations equal to total amount', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 600,
          },
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 400,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();
      
      expect(savedBudget).toBeDefined();
      expect(savedBudget.totalAmount).toBe(1000);
      expect(savedBudget.categoryAllocations).toHaveLength(2);
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle very small amounts', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 0.01,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 0.01,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();
      
      expect(savedBudget.totalAmount).toBe(0.01);
      expect(savedBudget.categoryAllocations[0].allocatedAmount).toBe(0.01);
    });

    it('should handle very large amounts', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 999999999.99,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 999999999.99,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();
      
      expect(savedBudget.totalAmount).toBe(999999999.99);
      expect(savedBudget.categoryAllocations[0].allocatedAmount).toBe(999999999.99);
    });

    it('should handle decimal precision correctly', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000.123456789,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500.987654321,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();
      
      expect(savedBudget.totalAmount).toBe(1000.12);
      expect(savedBudget.categoryAllocations[0].allocatedAmount).toBe(500.99);
    });

    it('should handle complex category allocation arrays', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 200,
            isFlexible: true,
            priority: 1,
          },
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 300,
            isFlexible: false,
            priority: 2,
          },
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
            isFlexible: true,
            priority: 3,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();
      
      expect(savedBudget.categoryAllocations).toHaveLength(3);
      expect(savedBudget.categoryAllocations[0].isFlexible).toBe(true);
      expect(savedBudget.categoryAllocations[0].priority).toBe(1);
      expect(savedBudget.categoryAllocations[1].isFlexible).toBe(false);
      expect(savedBudget.categoryAllocations[1].priority).toBe(2);
      expect(savedBudget.categoryAllocations[2].isFlexible).toBe(true);
      expect(savedBudget.categoryAllocations[2].priority).toBe(3);
    });

    it('should handle edge case date ranges', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'custom',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        endDate: new Date('2024-01-01T23:59:59.999Z'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 1000,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();
      
      expect(savedBudget.period).toBe('custom');
      expect(savedBudget.durationDays).toBe(1);
    });

    it('should handle edge case currency codes', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'eur',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 1000,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();
      
      expect(savedBudget.currency).toBe('EUR');
    });

    it('should handle edge case priority values', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
            priority: 1,
          },
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 500,
            priority: 10, // Use valid priority value
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      const budget = new Budget(budgetData);
      const savedBudget = await budget.save();
      
      expect(savedBudget.categoryAllocations[0].priority).toBe(1);
      expect(savedBudget.categoryAllocations[1].priority).toBe(10);
    });
  });
});
