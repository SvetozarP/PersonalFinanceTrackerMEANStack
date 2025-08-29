import mongoose from 'mongoose';
import { BudgetService } from '../../../../modules/financial/budgets/services/budget.service';
import { BudgetRepository } from '../../../../modules/financial/budgets/repositories/budget.repository';
import { TransactionRepository } from '../../../../modules/financial/transactions/repositories/transaction.repository';
import { CategoryRepository } from '../../../../modules/financial/categories/repositories/category.repository';

// Mock the repositories
jest.mock('../../../../modules/financial/budgets/repositories/budget.repository');
jest.mock('../../../../modules/financial/transactions/repositories/transaction.repository');
jest.mock('../../../../modules/financial/categories/repositories/category.repository');

describe('Budget Service', () => {
  let budgetService: BudgetService;
  let mockBudgetRepository: jest.Mocked<BudgetRepository>;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock repositories
    mockBudgetRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      findBudgetsWithFilters: jest.fn(),
      findWithPagination: jest.fn(),
      getBudgetSummary: jest.fn(),
      findActiveBudgetsInRange: jest.fn(),
      getMonthlyBudgetStats: jest.fn(),
    } as any;

    mockTransactionRepository = {
      findByDateRange: jest.fn(),
    } as any;

    mockCategoryRepository = {
      findById: jest.fn(),
    } as any;

    // Create service instance with mocked repositories
    budgetService = new BudgetService(
      mockBudgetRepository,
      mockTransactionRepository,
      mockCategoryRepository
    );
  });

  describe('createBudget', () => {
    it('should create a budget successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetData = {
        name: 'Monthly Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId().toString(),
            allocatedAmount: 500,
          },
        ],
      };

      const createdBudget = { 
        ...budgetData, 
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
        alertThreshold: 80,
        isActive: true,
        autoAdjust: false,
        allowRollover: false,
        rolloverAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
      
      mockBudgetRepository.create.mockResolvedValue(createdBudget);
      mockCategoryRepository.findById.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(userId),
      } as any);

      const result = await budgetService.createBudget(userId, budgetData);

      expect(mockBudgetRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...budgetData,
          userId: expect.any(mongoose.Types.ObjectId),
          categoryAllocations: expect.arrayContaining([
            expect.objectContaining({
              isFlexible: false,
              priority: 1,
            }),
          ]),
        })
      );
      expect(result).toEqual(createdBudget);
    });

    it('should handle repository errors during creation', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetData = {
        name: 'Monthly Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [],
      };

      mockBudgetRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(budgetService.createBudget(userId, budgetData)).rejects.toThrow('Database error');
      expect(mockBudgetRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...budgetData,
          userId: expect.any(mongoose.Types.ObjectId),
        })
      );
    });
  });

  describe('getBudgetById', () => {
    it('should get a budget by ID successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetId = new mongoose.Types.ObjectId().toString();
      const budget = {
        _id: new mongoose.Types.ObjectId(budgetId),
        name: 'Monthly Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [],
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
        alertThreshold: 80,
        isActive: true,
        autoAdjust: false,
        allowRollover: false,
        rolloverAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockBudgetRepository.findById.mockResolvedValue(budget);
      mockTransactionRepository.findByDateRange.mockResolvedValue([]);

      const result = await budgetService.getBudgetById(userId, budgetId);

      expect(mockBudgetRepository.findById).toHaveBeenCalledWith(budgetId);
      expect(result).toBeDefined();
      expect(result.budgetId).toBe(budgetId);
    });

    it('should throw error when budget not found', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetId = new mongoose.Types.ObjectId().toString();
      
      mockBudgetRepository.findById.mockResolvedValue(null);

      await expect(budgetService.getBudgetById(userId, budgetId)).rejects.toThrow('Budget not found or access denied');
      expect(mockBudgetRepository.findById).toHaveBeenCalledWith(budgetId);
    });

    it('should throw error when access denied', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetId = new mongoose.Types.ObjectId().toString();
      const budget = {
        _id: new mongoose.Types.ObjectId(budgetId),
        userId: new mongoose.Types.ObjectId(), // Different user
        name: 'Monthly Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [],
        status: 'active',
        alertThreshold: 80,
        isActive: true,
        autoAdjust: false,
        allowRollover: false,
        rolloverAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockBudgetRepository.findById.mockResolvedValue(budget);

      await expect(budgetService.getBudgetById(userId, budgetId)).rejects.toThrow('Budget not found or access denied');
    });
  });

  describe('getBudgets', () => {
    it('should get budgets successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgets = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Monthly Budget',
          period: 'monthly',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          totalAmount: 1000,
          currency: 'USD',
          categoryAllocations: [],
          userId: new mongoose.Types.ObjectId(userId),
          status: 'active',
          alertThreshold: 80,
          isActive: true,
          autoAdjust: false,
          allowRollover: false,
          rolloverAmount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ];

      const paginatedResult = {
        budgets,
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockBudgetRepository.findBudgetsWithFilters.mockResolvedValue(paginatedResult);

      const result = await budgetService.getBudgets(userId);

      expect(mockBudgetRepository.findBudgetsWithFilters).toHaveBeenCalledWith(
        { userId },
        1,
        20,
        'createdAt',
        'desc'
      );
      expect(result).toEqual(paginatedResult);
    });

    it('should handle repository errors during retrieval', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      mockBudgetRepository.findBudgetsWithFilters.mockRejectedValue(new Error('Database error'));

      await expect(budgetService.getBudgets(userId)).rejects.toThrow('Database error');
      expect(mockBudgetRepository.findBudgetsWithFilters).toHaveBeenCalledWith(
        { userId },
        1,
        20,
        'createdAt',
        'desc'
      );
    });
  });

  describe('updateBudget', () => {
    it('should update a budget successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        name: 'Updated Budget',
        totalAmount: 1500,
      };

      const existingBudget = {
        _id: new mongoose.Types.ObjectId(budgetId),
        userId: new mongoose.Types.ObjectId(userId),
        name: 'Monthly Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [],
        status: 'active',
        alertThreshold: 80,
        isActive: true,
        autoAdjust: false,
        allowRollover: false,
        rolloverAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const updatedBudget = { ...existingBudget, ...updateData };

      mockBudgetRepository.findById.mockResolvedValue(existingBudget);
      mockBudgetRepository.updateById.mockResolvedValue(updatedBudget);

      const result = await budgetService.updateBudget(userId, budgetId, updateData);

      expect(mockBudgetRepository.findById).toHaveBeenCalledWith(budgetId);
      expect(mockBudgetRepository.updateById).toHaveBeenCalledWith(budgetId, updateData);
      expect(result).toEqual(updatedBudget);
    });

    it('should handle repository errors during update', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetId = new mongoose.Types.ObjectId().toString();
      const updateData = { name: 'Updated Budget' };

      mockBudgetRepository.findById.mockResolvedValue(null);

      await expect(budgetService.updateBudget(userId, budgetId, updateData)).rejects.toThrow('Budget not found or access denied');
    });
  });

  describe('deleteBudget', () => {
    it('should delete a budget successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetId = new mongoose.Types.ObjectId().toString();
      
      const existingBudget = {
        _id: new mongoose.Types.ObjectId(budgetId),
        userId: new mongoose.Types.ObjectId(userId),
        name: 'Monthly Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [],
        status: 'active',
        alertThreshold: 80,
        isActive: true,
        autoAdjust: false,
        allowRollover: false,
        rolloverAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockBudgetRepository.findById.mockResolvedValue(existingBudget);
      mockBudgetRepository.deleteById.mockResolvedValue(existingBudget);

      const result = await budgetService.deleteBudget(userId, budgetId);

      expect(mockBudgetRepository.findById).toHaveBeenCalledWith(budgetId);
      expect(mockBudgetRepository.deleteById).toHaveBeenCalledWith(budgetId);
      expect(result).toBe(true);
    });

    it('should handle repository errors during deletion', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetId = new mongoose.Types.ObjectId().toString();

      mockBudgetRepository.findById.mockResolvedValue(null);

      await expect(budgetService.deleteBudget(userId, budgetId)).rejects.toThrow('Budget not found or access denied');
    });
  });

  describe('getBudgetSummary', () => {
    it('should get budget summary successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const summary = {
        totalBudgets: 5,
        activeBudgets: 3,
        totalBudgetAmount: 5000,
        totalSpentAmount: 0,
        totalRemainingAmount: 5000,
        overBudgetCount: 0,
        upcomingDeadlines: [],
      };

      const activeBudgets: any[] = [];

      mockBudgetRepository.getBudgetSummary.mockResolvedValue(summary as any);
      mockBudgetRepository.findActiveBudgetsInRange.mockResolvedValue(activeBudgets);

      const result = await budgetService.getBudgetSummary(userId);

      expect(mockBudgetRepository.getBudgetSummary).toHaveBeenCalledWith(userId);
      expect(result).toEqual(summary);
    });

    it('should handle repository errors during summary retrieval', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      mockBudgetRepository.getBudgetSummary.mockRejectedValue(new Error('Database error'));

      await expect(budgetService.getBudgetSummary(userId)).rejects.toThrow('Database error');
      expect(mockBudgetRepository.getBudgetSummary).toHaveBeenCalledWith(userId);
    });
  });

  describe('getBudgetStatistics', () => {
    it('should get budget statistics successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const year = 2024;
      const monthlyStats = [
        {
          month: 1,
          totalBudgeted: 1000,
          totalSpent: 0,
          totalSaved: 0,
          budgetCount: 1,
        },
      ];

      mockBudgetRepository.getMonthlyBudgetStats.mockResolvedValue(monthlyStats);

      const result = await budgetService.getBudgetStatistics(userId, year);

      expect(mockBudgetRepository.getMonthlyBudgetStats).toHaveBeenCalledWith(userId, year);
      expect(result).toBeDefined();
      expect(result.monthlyStats).toHaveLength(1);
    });

    it('should handle repository errors during statistics retrieval', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const year = 2024;
      mockBudgetRepository.getMonthlyBudgetStats.mockRejectedValue(new Error('Database error'));

      await expect(budgetService.getBudgetStatistics(userId, year)).rejects.toThrow('Database error');
      expect(mockBudgetRepository.getMonthlyBudgetStats).toHaveBeenCalledWith(userId, year);
    });
  });

  describe('checkBudgetAlerts', () => {
    it('should check budget alerts successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const activeBudgets: any[] = [];

      mockBudgetRepository.findActiveBudgetsInRange.mockResolvedValue(activeBudgets);

      const result = await budgetService.checkBudgetAlerts(userId);

      expect(mockBudgetRepository.findActiveBudgetsInRange).toHaveBeenCalledWith(
        userId,
        expect.any(Date),
        expect.any(Date)
      );
      expect(result).toEqual([]);
    });

    it('should handle repository errors during alert checking', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      mockBudgetRepository.findActiveBudgetsInRange.mockRejectedValue(new Error('Database error'));

      await expect(budgetService.checkBudgetAlerts(userId)).rejects.toThrow('Database error');
      expect(mockBudgetRepository.findActiveBudgetsInRange).toHaveBeenCalledWith(
        userId,
        expect.any(Date),
        expect.any(Date)
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty budget data gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const emptyBudgetData = {};

      await expect(budgetService.createBudget(userId, emptyBudgetData as any)).rejects.toThrow();
    });

    it('should handle null values in budget data gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetDataWithNulls = {
        name: null,
        period: null,
        totalAmount: null,
        startDate: null,
        endDate: null,
        categoryAllocations: null,
      };

      await expect(budgetService.createBudget(userId, budgetDataWithNulls as any)).rejects.toThrow();
    });

    it('should handle undefined values in budget data gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetDataWithUndefined = {
        name: undefined,
        period: undefined,
        totalAmount: undefined,
        startDate: undefined,
        endDate: undefined,
        categoryAllocations: undefined,
      };

      await expect(budgetService.createBudget(userId, budgetDataWithUndefined as any)).rejects.toThrow();
    });

    it('should handle invalid ObjectId strings gracefully', async () => {
      const invalidUserId = 'invalid-id';
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        categoryAllocations: [],
      };

      await expect(budgetService.createBudget(invalidUserId, budgetData)).rejects.toThrow();
    });

    it('should handle database connection errors gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        categoryAllocations: [],
      };
      const connectionError = new Error('ECONNREFUSED');
      mockBudgetRepository.create.mockRejectedValue(connectionError);

      await expect(budgetService.createBudget(userId, budgetData)).rejects.toThrow('ECONNREFUSED');
    });

    it('should handle validation errors gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        categoryAllocations: [],
      };
      const validationError = new Error('Validation failed');
      mockBudgetRepository.create.mockRejectedValue(validationError);

      await expect(budgetService.createBudget(userId, budgetData)).rejects.toThrow('Validation failed');
    });

    it('should handle cast errors gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        categoryAllocations: [],
      };
      const castError = new Error('Cast to ObjectId failed');
      mockBudgetRepository.create.mockRejectedValue(castError);

      await expect(budgetService.createBudget(userId, budgetData)).rejects.toThrow('Cast to ObjectId failed');
    });

    it('should handle duplicate key errors gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        categoryAllocations: [],
      };
      const duplicateError = new Error('E11000 duplicate key error');
      mockBudgetRepository.create.mockRejectedValue(duplicateError);

      await expect(budgetService.createBudget(userId, budgetData)).rejects.toThrow('E11000 duplicate key error');
    });

    it('should handle extreme pagination parameters gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const extremeOptions = {
        page: 999999,
        limit: 999999,
      };

      mockBudgetRepository.findBudgetsWithFilters.mockResolvedValue({
        budgets: [],
        total: 0,
        page: 999999,
        totalPages: 0,
      });

      const result = await budgetService.getBudgets(userId, extremeOptions as any);
      expect(result.budgets).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle empty search terms gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const optionsWithEmptySearch = {
        search: '',
      };

      mockBudgetRepository.findBudgetsWithFilters.mockResolvedValue({
        budgets: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const result = await budgetService.getBudgets(userId, {}, 1, 20, 'createdAt', 'desc');
      expect(result.budgets).toEqual([]);
    });

    it('should handle whitespace-only search terms gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const optionsWithWhitespaceSearch = {
        search: '   ',
      };

      mockBudgetRepository.findBudgetsWithFilters.mockResolvedValue({
        budgets: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const result = await budgetService.getBudgets(userId, {}, 1, 20, 'createdAt', 'desc');
      expect(result.budgets).toEqual([]);
    });

    it('should handle very long search terms gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const longSearchTerm = 'a'.repeat(1000);
      const optionsWithLongSearch = {
        search: longSearchTerm,
      };

      mockBudgetRepository.findBudgetsWithFilters.mockResolvedValue({
        budgets: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const result = await budgetService.getBudgets(userId, {}, 1, 20, 'createdAt', 'desc');
      expect(result.budgets).toEqual([]);
    });

    it('should handle complex sort orders gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const optionsWithComplexSort = {
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      mockBudgetRepository.findBudgetsWithFilters.mockResolvedValue({
        budgets: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const result = await budgetService.getBudgets(userId, {}, 1, 20, 'name', 'asc');
      expect(result.budgets).toEqual([]);
    });

    it('should handle invalid sort fields gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const optionsWithInvalidSort = {
        sortBy: 'invalidField',
        sortOrder: 'asc',
      };

      mockBudgetRepository.findBudgetsWithFilters.mockResolvedValue({
        budgets: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const result = await budgetService.getBudgets(userId, {}, 1, 20, 'invalid', 'desc');
      expect(result.budgets).toEqual([]);
    });

    it('should handle invalid sort orders gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const optionsWithInvalidOrder = {
        sortBy: 'name',
        sortOrder: 'invalid',
      };

      mockBudgetRepository.findBudgetsWithFilters.mockResolvedValue({
        budgets: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const result = await budgetService.getBudgets(userId, {}, 1, 20, 'name', 'invalid' as any);
      expect(result.budgets).toEqual([]);
    });

    it('should handle missing budget data gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const partialBudgetData = {
        name: 'Test Budget',
        // Missing required fields
      };

      await expect(budgetService.createBudget(userId, partialBudgetData as any)).rejects.toThrow();
    });

    it('should handle partial budget data gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const partialBudgetData = {
        name: 'Test Budget',
        period: 'monthly',
        // Missing totalAmount
      };

      await expect(budgetService.createBudget(userId, partialBudgetData as any)).rejects.toThrow();
    });

    it('should handle invalid amount values gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetDataWithInvalidAmount = {
        name: 'Test Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: -1000,
        categoryAllocations: [],
      };

      await expect(budgetService.createBudget(userId, budgetDataWithInvalidAmount)).rejects.toThrow();
    });

    it('should handle zero amount values gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetDataWithZeroAmount = {
        name: 'Test Budget',
        period: 'monthly' as const,
        totalAmount: 0,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId().toString(),
            allocatedAmount: 0,
          },
        ],
      };

      await expect(budgetService.createBudget(userId, budgetDataWithZeroAmount)).rejects.toThrow();
    });

    it('should handle very small amount values gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetDataWithSmallAmount = {
        name: 'Test Budget',
        period: 'monthly' as const,
        totalAmount: 0.001,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId().toString(),
            allocatedAmount: 0.001,
          },
        ],
      };

      await expect(budgetService.createBudget(userId, budgetDataWithSmallAmount)).rejects.toThrow();
    });

    it('should handle very large amount values gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetDataWithLargeAmount = {
        name: 'Test Budget',
        period: 'monthly' as const,
        totalAmount: 999999999999,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId().toString(),
            allocatedAmount: 999999999999,
          },
        ],
      };

      await expect(budgetService.createBudget(userId, budgetDataWithLargeAmount)).rejects.toThrow();
    });

    it('should handle invalid currency codes gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetDataWithInvalidCurrency = {
        name: 'Test Budget',
        period: 'monthly' as const,
        totalAmount: 1000,
        currency: 'INVALID',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId().toString(),
            allocatedAmount: 1000,
          },
        ],
      };

      await expect(budgetService.createBudget(userId, budgetDataWithInvalidCurrency)).rejects.toThrow();
    });

    it('should handle invalid period values gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetDataWithInvalidPeriod = {
        name: 'Test Budget',
        period: 'invalid-period' as any,
        totalAmount: 1000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId().toString(),
            allocatedAmount: 1000,
          },
        ],
      };

      await expect(budgetService.createBudget(userId, budgetDataWithInvalidPeriod)).rejects.toThrow();
    });

    it('should handle invalid status values gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetDataWithInvalidStatus = {
        name: 'Test Budget',
        period: 'monthly' as const,
        totalAmount: 1000,
        status: 'invalid-status' as any,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId().toString(),
            allocatedAmount: 1000,
          },
        ],
      };

      await expect(budgetService.createBudget(userId, budgetDataWithInvalidStatus)).rejects.toThrow();
    });

    it('should handle future dates gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const budgetDataWithFutureDate = {
        name: 'Test Budget',
        period: 'monthly' as const,
        totalAmount: 1000,
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId().toString(),
            allocatedAmount: 1000,
          },
        ],
      };

      await expect(budgetService.createBudget(userId, budgetDataWithFutureDate)).rejects.toThrow();
    });

    it('should handle very old dates gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const oldDate = new Date('1900-01-01');
      const budgetDataWithOldDate = {
        name: 'Test Budget',
        period: 'monthly' as const,
        totalAmount: 1000,
        startDate: oldDate,
        endDate: new Date(oldDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId().toString(),
            allocatedAmount: 1000,
          },
        ],
      };

      await expect(budgetService.createBudget(userId, budgetDataWithOldDate)).rejects.toThrow();
    });

    it('should handle invalid date ranges gracefully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const budgetDataWithInvalidDateRange = {
        name: 'Test Budget',
        period: 'monthly' as const,
        totalAmount: 1000,
        startDate: new Date('2024-01-31'),
        endDate: new Date('2024-01-01'), // End before start
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId().toString(),
            allocatedAmount: 1000,
          },
        ],
      };

      await expect(budgetService.createBudget(userId, budgetDataWithInvalidDateRange)).rejects.toThrow();
    });
  });
});
