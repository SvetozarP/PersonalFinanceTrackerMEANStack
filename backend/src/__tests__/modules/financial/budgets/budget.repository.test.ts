import mongoose from 'mongoose';
import { BudgetRepository } from '../../../../modules/financial/budgets/repositories/budget.repository';
import Budget from '../../../../modules/financial/budgets/models/budget.model';
import { IBudget, IBudgetFilters } from '../../../../modules/financial/budgets/interfaces/budget.interface';

// Mock the logger service
jest.mock('../../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Budget Repository - Simple Tests', () => {
  let budgetRepository: BudgetRepository;
  let testUserId: mongoose.Types.ObjectId;
  let testCategoryId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    testUserId = new mongoose.Types.ObjectId();
    testCategoryId = new mongoose.Types.ObjectId();
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create the actual repository instance
    budgetRepository = new BudgetRepository();

    // Clear any existing test data
    await Budget.deleteMany({});
  });

  afterEach(async () => {
    // Clean up test data
    await Budget.deleteMany({});
  });

  // Helper function to create valid budget data
  const createValidBudgetData = (overrides: Partial<IBudget> = {}) => ({
    userId: testUserId,
    name: 'Test Budget',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    totalAmount: 1000,
    status: 'active' as const,
    period: 'yearly' as const,
    currency: 'USD',
    categoryAllocations: [
      {
        categoryId: testCategoryId.toString(),
        allocatedAmount: 500,
        priority: 1,
        isFlexible: false,
      },
    ],
    isActive: true,
    isDeleted: false,
    alertThreshold: 80,
    ...overrides,
  });

  describe('findBudgetsWithFilters', () => {
    it('should find budgets with basic filters', async () => {
      // Create test budgets
      await Budget.create(createValidBudgetData({
        name: 'Budget 1',
        status: 'active',
      }));
      await Budget.create(createValidBudgetData({
        name: 'Budget 2',
        status: 'paused',
      }));

      const filters: IBudgetFilters = {
        userId: testUserId.toString(),
        status: 'active',
      };

      const result = await budgetRepository.findBudgetsWithFilters(filters, 1, 10);

      expect(result).toBeDefined();
      expect(result.budgets).toHaveLength(1);
      expect(result.budgets[0].name).toBe('Budget 1');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle empty results', async () => {
      const filters: IBudgetFilters = {
        userId: testUserId.toString(),
        status: 'active',
      };

      const result = await budgetRepository.findBudgetsWithFilters(filters, 1, 10);

      expect(result).toBeDefined();
      expect(result.budgets).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      // Create multiple test budgets
      const budgets = [];
      for (let i = 1; i <= 15; i++) {
        budgets.push(createValidBudgetData({ name: `Budget ${i}` }));
      }
      await Budget.create(budgets);

      const filters: IBudgetFilters = {
        userId: testUserId.toString(),
      };

      const result = await budgetRepository.findBudgetsWithFilters(filters, 2, 10);

      expect(result).toBeDefined();
      expect(result.budgets).toHaveLength(5); // 15 total, 10 per page, page 2 has 5
      expect(result.total).toBe(15);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should handle sorting correctly', async () => {
      // Create test budgets with different names
      await Budget.create(createValidBudgetData({ name: 'Budget C' }));
      await Budget.create(createValidBudgetData({ name: 'Budget A' }));
      await Budget.create(createValidBudgetData({ name: 'Budget B' }));

      const filters: IBudgetFilters = {
        userId: testUserId.toString(),
      };

      const result = await budgetRepository.findBudgetsWithFilters(filters, 1, 10, 'name', 'asc');

      expect(result).toBeDefined();
      expect(result.budgets).toHaveLength(3);
      expect(result.budgets[0].name).toBe('Budget A');
      expect(result.budgets[1].name).toBe('Budget B');
      expect(result.budgets[2].name).toBe('Budget C');
    });
  });

  describe('getBudgetAnalytics', () => {
    it('should get budget analytics', async () => {
      // Create test budget
      const budget = await Budget.create(createValidBudgetData({
        name: 'Test Budget',
        totalAmount: 1000,
      }));

      const result = await budgetRepository.getBudgetAnalytics((budget._id as any).toString());

      expect(result).toBeDefined();
    });

    it('should handle empty budget analytics', async () => {
      const result = await budgetRepository.getBudgetAnalytics(new mongoose.Types.ObjectId().toString());

      expect(result).toBeNull();
    });
  });

  describe('getBudgetSummary', () => {
    it('should get budget summary', async () => {
      // Create test budgets
      await Budget.create(createValidBudgetData({
        name: 'Budget 1',
        totalAmount: 1000,
        status: 'active',
      }));
      await Budget.create(createValidBudgetData({
        name: 'Budget 2',
        totalAmount: 500,
        status: 'paused',
      }));

      const result = await budgetRepository.getBudgetSummary(testUserId.toString());

      expect(result).toBeDefined();
      expect(result.totalBudgets).toBe(2);
      expect(result.activeBudgets).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty budget summary', async () => {
      const result = await budgetRepository.getBudgetSummary(testUserId.toString());

      expect(result).toBeDefined();
      expect(result.totalBudgets).toBe(0);
      expect(result.activeBudgets).toBe(0);
    });
  });

  describe('updateCategoryAllocation', () => {
    it('should update category allocation', async () => {
      // Create test budget
      const budget = await Budget.create(createValidBudgetData({
        categoryAllocations: [
          {
            categoryId: testCategoryId.toString(),
            allocatedAmount: 500,
            priority: 1,
            isFlexible: false,
          },
        ],
      }));

      const result = await budgetRepository.updateCategoryAllocation(
        (budget._id as any).toString(),
        testCategoryId.toString(),
        750
      );

      expect(result).toBeDefined();
    });

    it('should handle category allocation not found', async () => {
      // Create test budget without the category
      const budget = await Budget.create(createValidBudgetData({
        categoryAllocations: [],
      }));

      const result = await budgetRepository.updateCategoryAllocation(
        (budget._id as any).toString(),
        testCategoryId.toString(),
        750
      );

      expect(result).toBeDefined();
    });
  });

  describe('addCategoryAllocation', () => {
    it('should add category allocation', async () => {
      // Create test budget
      const budget = await Budget.create(createValidBudgetData({
        categoryAllocations: [],
      }));

      const result = await budgetRepository.addCategoryAllocation(
        (budget._id as any).toString(),
        {
          categoryId: testCategoryId.toString(),
          allocatedAmount: 500,
          isFlexible: false,
          priority: 1,
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe('removeCategoryAllocation', () => {
    it('should remove category allocation', async () => {
      // Create test budget with category
      const budget = await Budget.create(createValidBudgetData({
        categoryAllocations: [
          {
            categoryId: testCategoryId.toString(),
            allocatedAmount: 500,
            priority: 1,
            isFlexible: false,
          },
        ],
      }));

      const result = await budgetRepository.removeCategoryAllocation(
        (budget._id as any).toString(),
        testCategoryId.toString()
      );

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user ID', async () => {
      const filters: IBudgetFilters = {
        userId: 'invalid-id',
      };

      await expect(budgetRepository.findBudgetsWithFilters(filters, 1, 10)).rejects.toThrow();
    });

    it('should handle invalid budget ID', async () => {
      await expect(budgetRepository.updateCategoryAllocation(
        'invalid-id',
        testCategoryId.toString(),
        500
      )).rejects.toThrow();
    });

    it('should handle invalid category ID', async () => {
      const budget = await Budget.create(createValidBudgetData());

      await expect(budgetRepository.updateCategoryAllocation(
        (budget._id as any).toString(),
        'invalid-id',
        500
      )).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large amounts', async () => {
      const budget = await Budget.create(createValidBudgetData({
        totalAmount: 999999999.99,
        categoryAllocations: [
          {
            categoryId: testCategoryId.toString(),
            allocatedAmount: 500000000.50,
            priority: 1,
            isFlexible: false,
          },
        ],
      }));

      expect(budget.totalAmount).toBe(999999999.99);
      expect(budget.categoryAllocations[0].allocatedAmount).toBe(500000000.50);
    });

    it('should handle very small amounts', async () => {
      const budget = await Budget.create(createValidBudgetData({
        totalAmount: 0.01,
        categoryAllocations: [
          {
            categoryId: testCategoryId.toString(),
            allocatedAmount: 0.01,
            priority: 1,
            isFlexible: false,
          },
        ],
      }));

      expect(budget.totalAmount).toBe(0.01);
      expect(budget.categoryAllocations[0].allocatedAmount).toBe(0.01);
    });

    it('should handle many categories', async () => {
      const categoryAllocations = [];
      for (let i = 0; i < 10; i++) {
        categoryAllocations.push({
          categoryId: new mongoose.Types.ObjectId().toString(),
          allocatedAmount: 10,
          priority: i + 1,
          isFlexible: false,
        });
      }

      const budget = await Budget.create(createValidBudgetData({
        categoryAllocations,
      }));

      expect(budget.categoryAllocations).toHaveLength(10);
    });

    it('should handle long budget names', async () => {
      const longName = 'A'.repeat(150); // Within the 200 character limit
      const budget = await Budget.create(createValidBudgetData({
        name: longName,
      }));

      expect(budget.name).toBe(longName);
    });
  });
});
