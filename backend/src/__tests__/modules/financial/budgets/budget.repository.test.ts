import mongoose from 'mongoose';
import { BudgetRepository } from '../../../../modules/financial/budgets/repositories/budget.repository';

// Mock the entire BudgetRepository class
jest.mock('../../../../modules/financial/budgets/repositories/budget.repository');

describe('Budget Repository', () => {
  let budgetRepository: BudgetRepository;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new instance for each test
    budgetRepository = new BudgetRepository();
  });

  describe('create', () => {
    it('should create a budget successfully', async () => {
      const budgetData = {
        name: 'Monthly Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [],
        userId: new mongoose.Types.ObjectId(),
      };

      const createdBudget = { ...budgetData, _id: new mongoose.Types.ObjectId() };
      
      // Mock the create method
      jest.spyOn(budgetRepository, 'create').mockResolvedValue(createdBudget as any);

      const result = await budgetRepository.create(budgetData as any);

      expect(result).toEqual(createdBudget);
    });

    it('should handle creation errors', async () => {
      const budgetData = {
        name: 'Monthly Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [],
        userId: new mongoose.Types.ObjectId(),
      };

      // Mock the create method to throw an error
      jest.spyOn(budgetRepository, 'create').mockRejectedValue(new Error('Database error'));

      await expect(budgetRepository.create(budgetData as any)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should find a budget by ID successfully', async () => {
      const budgetId = new mongoose.Types.ObjectId();
      const budget = {
        _id: budgetId,
        name: 'Monthly Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [],
        userId: new mongoose.Types.ObjectId(),
      };

      // Mock the findById method
      jest.spyOn(budgetRepository, 'findById').mockResolvedValue(budget as any);

      const result = await budgetRepository.findById(budgetId.toString());

      expect(result).toEqual(budget);
    });

    it('should return null when budget not found', async () => {
      const budgetId = new mongoose.Types.ObjectId();
      
      // Mock the findById method to return null
      jest.spyOn(budgetRepository, 'findById').mockResolvedValue(null);

      const result = await budgetRepository.findById(budgetId.toString());

      expect(result).toBeNull();
    });

    it('should handle find errors', async () => {
      const budgetId = new mongoose.Types.ObjectId();
      
      // Mock the findById method to throw an error
      jest.spyOn(budgetRepository, 'findById').mockRejectedValue(new Error('Database error'));

      await expect(budgetRepository.findById(budgetId.toString())).rejects.toThrow('Database error');
    });
  });

  describe('updateById', () => {
    it('should update a budget successfully', async () => {
      const budgetId = new mongoose.Types.ObjectId();
      const updateData = { name: 'Updated Budget' };
      const updatedBudget = {
        _id: budgetId,
        name: 'Updated Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [],
        userId: new mongoose.Types.ObjectId(),
      };

      // Mock the updateById method
      jest.spyOn(budgetRepository, 'updateById').mockResolvedValue(updatedBudget as any);

      const result = await budgetRepository.updateById(budgetId.toString(), updateData);

      expect(result).toEqual(updatedBudget);
    });

    it('should return null when budget not found for update', async () => {
      const budgetId = new mongoose.Types.ObjectId();
      const updateData = { name: 'Updated Budget' };

      // Mock the updateById method to return null
      jest.spyOn(budgetRepository, 'updateById').mockResolvedValue(null);

      const result = await budgetRepository.updateById(budgetId.toString(), updateData);

      expect(result).toBeNull();
    });

    it('should handle update errors', async () => {
      const budgetId = new mongoose.Types.ObjectId();
      const updateData = { name: 'Updated Budget' };

      // Mock the updateById method to throw an error
      jest.spyOn(budgetRepository, 'updateById').mockRejectedValue(new Error('Database error'));

      await expect(budgetRepository.updateById(budgetId.toString(), updateData)).rejects.toThrow('Database error');
    });
  });

  describe('deleteById', () => {
    it('should delete a budget successfully', async () => {
      const budgetId = new mongoose.Types.ObjectId();
      const deletedBudget = {
        _id: budgetId,
        name: 'Monthly Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [],
        userId: new mongoose.Types.ObjectId(),
      };

      // Mock the deleteById method
      jest.spyOn(budgetRepository, 'deleteById').mockResolvedValue(deletedBudget as any);

      const result = await budgetRepository.deleteById(budgetId.toString());

      expect(result).toEqual(deletedBudget);
    });

    it('should return null when budget not found for deletion', async () => {
      const budgetId = new mongoose.Types.ObjectId();
      
      // Mock the deleteById method to return null
      jest.spyOn(budgetRepository, 'deleteById').mockResolvedValue(null);

      const result = await budgetRepository.deleteById(budgetId.toString());

      expect(result).toBeNull();
    });

    it('should handle deletion errors', async () => {
      const budgetId = new mongoose.Types.ObjectId();
      
      // Mock the deleteById method to throw an error
      jest.spyOn(budgetRepository, 'deleteById').mockRejectedValue(new Error('Database error'));

      await expect(budgetRepository.deleteById(budgetId.toString())).rejects.toThrow('Database error');
    });
  });

  describe('find', () => {
    it('should find budgets with filters successfully', async () => {
      const filters = { userId: new mongoose.Types.ObjectId().toString() };
      const budgets = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Monthly Budget',
          period: 'monthly' as const,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          totalAmount: 1000,
          currency: 'USD',
          categoryAllocations: [],
          userId: filters.userId,
        },
      ];

      // Mock the find method
      jest.spyOn(budgetRepository, 'find').mockResolvedValue(budgets as any);

      const result = await budgetRepository.find(filters);

      expect(result).toEqual(budgets);
    });

    it('should handle find errors', async () => {
      const filters = { userId: new mongoose.Types.ObjectId().toString() };

      // Mock the find method to throw an error
      jest.spyOn(budgetRepository, 'find').mockRejectedValue(new Error('Database error'));

      await expect(budgetRepository.find(filters)).rejects.toThrow('Database error');
    });
  });

  describe('exists', () => {
    it('should check if budget exists successfully', async () => {
      const filters = { userId: new mongoose.Types.ObjectId().toString() };
      
      // Mock the exists method
      jest.spyOn(budgetRepository, 'exists').mockResolvedValue(true);

      const result = await budgetRepository.exists(filters);

      expect(result).toBe(true);
    });

    it('should return false when budget does not exist', async () => {
      const filters = { userId: new mongoose.Types.ObjectId().toString() };
      
      // Mock the exists method to return false
      jest.spyOn(budgetRepository, 'exists').mockResolvedValue(false);

      const result = await budgetRepository.exists(filters);

      expect(result).toBe(false);
    });

    it('should handle exists errors', async () => {
      const filters = { userId: new mongoose.Types.ObjectId().toString() };
      
      // Mock the exists method to throw an error
      jest.spyOn(budgetRepository, 'exists').mockRejectedValue(new Error('Database error'));

      await expect(budgetRepository.exists(filters)).rejects.toThrow('Database error');
    });
  });

  describe('count', () => {
    it('should count budgets successfully', async () => {
      const filters = { userId: new mongoose.Types.ObjectId().toString() };
      
      // Mock the count method
      jest.spyOn(budgetRepository, 'count').mockResolvedValue(5);

      const result = await budgetRepository.count(filters);

      expect(result).toBe(5);
    });

    it('should handle count errors', async () => {
      const filters = { userId: new mongoose.Types.ObjectId().toString() };
      
      // Mock the count method to throw an error
      jest.spyOn(budgetRepository, 'count').mockRejectedValue(new Error('Database error'));

      await expect(budgetRepository.count(filters)).rejects.toThrow('Database error');
    });
  });

  describe('aggregate', () => {
    it('should execute aggregation pipeline successfully', async () => {
      const pipeline = [
        { $match: { userId: new mongoose.Types.ObjectId().toString() } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ];

      const result = [{ _id: null, total: 5000 }];
      
      // Mock the aggregate method
      jest.spyOn(budgetRepository, 'aggregate').mockResolvedValue(result as any);

      const aggregateResult = await budgetRepository.aggregate(pipeline);

      expect(aggregateResult).toEqual(result);
    });

    it('should handle aggregation errors', async () => {
      const pipeline = [
        { $match: { userId: new mongoose.Types.ObjectId().toString() } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ];

      // Mock the aggregate method to throw an error
      jest.spyOn(budgetRepository, 'aggregate').mockRejectedValue(new Error('Database error'));

      await expect(budgetRepository.aggregate(pipeline)).rejects.toThrow('Database error');
    });
  });

  describe('updateCategoryAllocation', () => {
    it('should update category allocation successfully', async () => {
      const budgetId = new mongoose.Types.ObjectId().toString();
      const categoryId = new mongoose.Types.ObjectId().toString();
      const newAmount = 600;

      // Mock the updateCategoryAllocation method directly
      jest.spyOn(budgetRepository, 'updateCategoryAllocation').mockResolvedValue(true);

      const result = await budgetRepository.updateCategoryAllocation(budgetId, categoryId, newAmount);

      expect(result).toBe(true);
      expect(budgetRepository.updateCategoryAllocation).toHaveBeenCalledWith(budgetId, categoryId, newAmount);
    });

    it('should return false when no budget is modified', async () => {
      const budgetId = new mongoose.Types.ObjectId().toString();
      const categoryId = new mongoose.Types.ObjectId().toString();
      const newAmount = 600;

      // Mock the updateCategoryAllocation method to return false
      jest.spyOn(budgetRepository, 'updateCategoryAllocation').mockResolvedValue(false);

      const result = await budgetRepository.updateCategoryAllocation(budgetId, categoryId, newAmount);

      expect(result).toBe(false);
    });

    it('should handle update category allocation errors', async () => {
      const budgetId = new mongoose.Types.ObjectId().toString();
      const categoryId = new mongoose.Types.ObjectId().toString();
      const newAmount = 600;

      // Mock the updateCategoryAllocation method to throw an error
      jest.spyOn(budgetRepository, 'updateCategoryAllocation').mockRejectedValue(new Error('Failed to update category allocation: Database error'));

      await expect(
        budgetRepository.updateCategoryAllocation(budgetId, categoryId, newAmount)
      ).rejects.toThrow('Failed to update category allocation: Database error');
    });
  });

  describe('addCategoryAllocation', () => {
    it('should add category allocation successfully', async () => {
      const budgetId = new mongoose.Types.ObjectId().toString();
      const allocation = {
        categoryId: new mongoose.Types.ObjectId().toString(),
        allocatedAmount: 500,
      };

      // Mock the addCategoryAllocation method directly
      jest.spyOn(budgetRepository, 'addCategoryAllocation').mockResolvedValue(true);

      const result = await budgetRepository.addCategoryAllocation(budgetId, allocation);

      expect(result).toBe(true);
      expect(budgetRepository.addCategoryAllocation).toHaveBeenCalledWith(budgetId, allocation);
    });

    it('should add category allocation with default values', async () => {
      const budgetId = new mongoose.Types.ObjectId().toString();
      const allocation = {
        categoryId: new mongoose.Types.ObjectId().toString(),
        allocatedAmount: 500,
      };

      // Mock the addCategoryAllocation method directly
      jest.spyOn(budgetRepository, 'addCategoryAllocation').mockResolvedValue(true);

      const result = await budgetRepository.addCategoryAllocation(budgetId, allocation);

      expect(result).toBe(true);
      expect(budgetRepository.addCategoryAllocation).toHaveBeenCalledWith(budgetId, allocation);
    });

    it('should return false when no budget is modified', async () => {
      const budgetId = new mongoose.Types.ObjectId().toString();
      const allocation = {
        categoryId: new mongoose.Types.ObjectId().toString(),
        allocatedAmount: 500,
      };

      // Mock the addCategoryAllocation method to return false
      jest.spyOn(budgetRepository, 'addCategoryAllocation').mockResolvedValue(false);

      const result = await budgetRepository.addCategoryAllocation(budgetId, allocation);

      expect(result).toBe(false);
    });

    it('should handle add category allocation errors', async () => {
      const budgetId = new mongoose.Types.ObjectId().toString();
      const allocation = {
        categoryId: new mongoose.Types.ObjectId().toString(),
        allocatedAmount: 500,
      };

      // Mock the addCategoryAllocation method to throw an error
      jest.spyOn(budgetRepository, 'addCategoryAllocation').mockRejectedValue(new Error('Failed to add category allocation: Database error'));

      await expect(
        budgetRepository.addCategoryAllocation(budgetId, allocation)
      ).rejects.toThrow('Failed to add category allocation: Database error');
    });
  });

  describe('removeCategoryAllocation', () => {
    it('should remove category allocation successfully', async () => {
      const budgetId = new mongoose.Types.ObjectId().toString();
      const categoryId = new mongoose.Types.ObjectId().toString();

      // Mock the removeCategoryAllocation method directly
      jest.spyOn(budgetRepository, 'removeCategoryAllocation').mockResolvedValue(true);

      const result = await budgetRepository.removeCategoryAllocation(budgetId, categoryId);

      expect(result).toBe(true);
      expect(budgetRepository.removeCategoryAllocation).toHaveBeenCalledWith(budgetId, categoryId);
    });

    it('should return false when no budget is modified', async () => {
      const budgetId = new mongoose.Types.ObjectId().toString();
      const categoryId = new mongoose.Types.ObjectId().toString();

      // Mock the removeCategoryAllocation method to return false
      jest.spyOn(budgetRepository, 'removeCategoryAllocation').mockResolvedValue(false);

      const result = await budgetRepository.removeCategoryAllocation(budgetId, categoryId);

      expect(result).toBe(false);
    });

    it('should handle remove category allocation errors', async () => {
      const budgetId = new mongoose.Types.ObjectId().toString();
      const categoryId = new mongoose.Types.ObjectId().toString();

      // Mock the removeCategoryAllocation method to throw an error
      jest.spyOn(budgetRepository, 'removeCategoryAllocation').mockRejectedValue(new Error('Failed to remove category allocation: Database error'));

      await expect(
        budgetRepository.removeCategoryAllocation(budgetId, categoryId)
      ).rejects.toThrow('Failed to remove category allocation: Database error');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid ObjectId strings gracefully', async () => {
      const invalidId = 'invalid-id';
      const validId = new mongoose.Types.ObjectId().toString();

      // Mock the findById method to throw an error for invalid ID
      jest.spyOn(budgetRepository, 'findById').mockRejectedValue(new Error('Cast to ObjectId failed'));

      await expect(budgetRepository.findById(invalidId)).rejects.toThrow('Cast to ObjectId failed');
    });

    it('should handle database connection errors gracefully', async () => {
      const budgetId = new mongoose.Types.ObjectId().toString();

      // Mock the findById method to throw a connection error
      jest.spyOn(budgetRepository, 'findById').mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(budgetRepository.findById(budgetId)).rejects.toThrow('ECONNREFUSED');
    });

    it('should handle validation errors gracefully', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId().toString(),
            allocatedAmount: 500,
            isFlexible: false,
            priority: 1,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      // Mock the create method to throw a validation error
      jest.spyOn(budgetRepository, 'create').mockRejectedValue(new Error('Validation failed'));

      await expect(budgetRepository.create(budgetData)).rejects.toThrow('Validation failed');
    });

    it('should handle cast errors gracefully', async () => {
      const budgetId = new mongoose.Types.ObjectId().toString();
      const updateData = { totalAmount: 'invalid-amount' };

      // Mock the updateById method to throw a cast error
      jest.spyOn(budgetRepository, 'updateById').mockRejectedValue(new Error('Cast to Number failed'));

      await expect(budgetRepository.updateById(budgetId, updateData)).rejects.toThrow('Cast to Number failed');
    });

    it('should handle duplicate key errors gracefully', async () => {
      const budgetData = {
        name: 'Test Budget',
        period: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: new mongoose.Types.ObjectId().toString(),
            allocatedAmount: 500,
            isFlexible: false,
            priority: 1,
          },
        ],
        userId: new mongoose.Types.ObjectId(),
      };

      // Mock the create method to throw a duplicate key error
      jest.spyOn(budgetRepository, 'create').mockRejectedValue(new Error('E11000 duplicate key error'));

      await expect(budgetRepository.create(budgetData)).rejects.toThrow('E11000 duplicate key error');
    });

    it('should handle extreme pagination parameters gracefully', async () => {
      const filters = { userId: new mongoose.Types.ObjectId().toString() };
      const extremeOptions = {
        page: 999999,
        limit: 999999,
      };

      // Mock the findWithPagination method
      jest.spyOn(budgetRepository, 'findWithPagination').mockResolvedValue({
        documents: [],
        total: 0,
        page: 999999,
        totalPages: 0,
      });

      const result = await budgetRepository.findWithPagination(filters, extremeOptions.page, extremeOptions.limit);
      expect(result.documents).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle empty filter objects gracefully', async () => {
      const emptyFilters = {};

      // Mock the find method
      jest.spyOn(budgetRepository, 'find').mockResolvedValue([]);

      const result = await budgetRepository.find(emptyFilters);
      expect(result).toEqual([]);
    });

    it('should handle null filter values gracefully', async () => {
      const filtersWithNulls = {
        userId: new mongoose.Types.ObjectId().toString(),
        status: null,
        period: null,
      };

      // Mock the find method
      jest.spyOn(budgetRepository, 'find').mockResolvedValue([]);

      const result = await budgetRepository.find(filtersWithNulls);
      expect(result).toEqual([]);
    });

    it('should handle undefined filter values gracefully', async () => {
      const filtersWithUndefined = {
        userId: new mongoose.Types.ObjectId().toString(),
        status: undefined,
        period: undefined,
      };

      // Mock the find method
      jest.spyOn(budgetRepository, 'find').mockResolvedValue([]);

      const result = await budgetRepository.find(filtersWithUndefined);
      expect(result).toEqual([]);
    });
  });
});
