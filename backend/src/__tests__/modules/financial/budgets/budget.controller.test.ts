import { Response } from 'express';
import { BudgetController } from '../../../../modules/financial/budgets/controllers/budget.controller';
import { BudgetService } from '../../../../modules/financial/budgets/services/budget.service';
import { AuthenticatedRequest } from '../../../../modules/auth/auth.middleware';

// Mock the budget service
jest.mock('../../../../modules/financial/budgets/services/budget.service');

// Mock the validation module
jest.mock('../../../../modules/financial/budgets/validation/budget.validation', () => ({
  validateBudgetInput: {
    createBudget: jest.fn().mockReturnValue({ error: null, value: {} }),
    updateBudget: jest.fn().mockReturnValue({ error: null, value: {} }),
    updateCategoryAllocation: jest.fn().mockReturnValue({ error: null, value: {} }),
  },
}));

describe('Budget Controller', () => {
  let budgetController: BudgetController;
  let mockBudgetService: jest.Mocked<BudgetService>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockValidation: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock service
    mockBudgetService = {
      createBudget: jest.fn(),
      getBudgetById: jest.fn(),
      getBudgets: jest.fn(),
      updateBudget: jest.fn(),
      deleteBudget: jest.fn(),
      getBudgetSummary: jest.fn(),
      getBudgetStatistics: jest.fn(),
          checkBudgetAlerts: jest.fn(),
    updateCategoryAllocation: jest.fn(),
  } as any;

    // Create controller instance with mocked service
    budgetController = new BudgetController(mockBudgetService);

    // Create mock request, response
    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: { userId: 'test-user-id' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Reset validation mocks
    const validationModule = require('../../../../modules/financial/budgets/validation/budget.validation');
    mockValidation = validationModule.validateBudgetInput;
    mockValidation.createBudget.mockReturnValue({ error: null, value: {} });
    mockValidation.updateBudget.mockReturnValue({ error: null, value: {} });
  });

  describe('createBudget', () => {
    it('should create a budget successfully', async () => {
      const budgetData = {
        name: 'Monthly Budget',
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [
          {
            categoryId: 'category-id',
            allocatedAmount: 500,
          },
        ],
      };

      const createdBudget = {
        _id: 'budget-id',
        ...budgetData,
        startDate: new Date(budgetData.startDate),
        endDate: new Date(budgetData.endDate),
        userId: 'test-user-id',
        status: 'active',
        alertThreshold: 80,
        isActive: true,
        autoAdjust: false,
        allowRollover: false,
        rolloverAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = budgetData;
      mockValidation.createBudget.mockReturnValue({ error: null, value: budgetData });
      mockBudgetService.createBudget.mockResolvedValue(createdBudget as any);

      await budgetController.createBudget(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockBudgetService.createBudget).toHaveBeenCalledWith(
        'test-user-id',
        budgetData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Budget created successfully',
        data: createdBudget,
      });
    });

    it('should handle validation errors', async () => {
      const budgetData = {
        name: 'Monthly Budget',
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [],
      };

      mockRequest.body = budgetData;
      mockValidation.createBudget.mockReturnValue({ 
        error: { details: [{ message: 'Validation failed' }] }, 
        value: null 
      });

      await budgetController.createBudget(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['Validation failed'],
      });
    });

    it('should handle service errors', async () => {
      const budgetData = {
        name: 'Monthly Budget',
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [],
      };

      mockRequest.body = budgetData;
      mockValidation.createBudget.mockReturnValue({ error: null, value: budgetData });
      mockBudgetService.createBudget.mockRejectedValue(new Error('Service error'));

      await budgetController.createBudget(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });
  });

  describe('getBudgetById', () => {
    it('should get a budget by ID successfully', async () => {
      const budgetId = 'budget-id';
      const budget = {
        _id: budgetId,
        name: 'Monthly Budget',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: 1000,
        currency: 'USD',
        categoryAllocations: [],
        userId: 'test-user-id',
        status: 'active',
        alertThreshold: 80,
        isActive: true,
        autoAdjust: false,
        allowRollover: false,
        rolloverAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: budgetId };
      mockBudgetService.getBudgetById.mockResolvedValue(budget as any);

      await budgetController.getBudgetById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockBudgetService.getBudgetById).toHaveBeenCalledWith(
        'test-user-id',
        budgetId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: budget,
      });
    });

    it('should handle service errors', async () => {
      const budgetId = 'budget-id';
      mockRequest.params = { id: budgetId };
      mockBudgetService.getBudgetById.mockRejectedValue(new Error('Service error'));

      await budgetController.getBudgetById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });

    it('should handle unauthorized requests', async () => {
      const budgetId = 'budget-id';
      mockRequest.params = { id: budgetId };
      mockRequest.user = undefined;

      await budgetController.getBudgetById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
      });
    });

    it('should handle missing budget ID', async () => {
      mockRequest.params = {};

      await budgetController.getBudgetById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Budget ID is required',
      });
    });

    it('should handle not found errors', async () => {
      const budgetId = 'budget-id';
      mockRequest.params = { id: budgetId };
      const notFoundError = new Error('Budget not found');
      mockBudgetService.getBudgetById.mockRejectedValue(notFoundError);

      await budgetController.getBudgetById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Budget not found',
      });
    });

    it('should handle access denied errors', async () => {
      const budgetId = 'budget-id';
      mockRequest.params = { id: budgetId };
      const accessDeniedError = new Error('access denied');
      mockBudgetService.getBudgetById.mockRejectedValue(accessDeniedError);

      await budgetController.getBudgetById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'access denied',
      });
    });
  });

  describe('getBudgets', () => {
    it('should get budgets successfully', async () => {
      const budgets = [
        {
          _id: 'budget-id-1',
          name: 'Monthly Budget 1',
          period: 'monthly',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          totalAmount: 1000,
          currency: 'USD',
          categoryAllocations: [],
          userId: 'test-user-id',
          status: 'active',
          alertThreshold: 80,
          isActive: true,
          autoAdjust: false,
          allowRollover: false,
          rolloverAmount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: 'budget-id-2',
          name: 'Monthly Budget 2',
          period: 'monthly',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-29'),
          totalAmount: 1200,
          currency: 'USD',
          categoryAllocations: [],
          userId: 'test-user-id',
          status: 'active',
          alertThreshold: 80,
          isActive: true,
          autoAdjust: false,
          allowRollover: false,
          rolloverAmount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const paginatedResult = {
        budgets,
        total: 2,
        page: 1,
        totalPages: 1,
      };

      mockRequest.query = { page: '1', limit: '20' };
      mockBudgetService.getBudgets.mockResolvedValue(paginatedResult as any);

      await budgetController.getBudgets(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockBudgetService.getBudgets).toHaveBeenCalledWith(
        'test-user-id',
        {},
        1,
        20,
        'createdAt',
        'desc'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: budgets,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should handle service errors', async () => {
      mockRequest.query = { page: '1', limit: '20' };
      mockBudgetService.getBudgets.mockRejectedValue(new Error('Service error'));

      await budgetController.getBudgets(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });
  });

  describe('updateBudget', () => {
    it('should update a budget successfully', async () => {
      const budgetId = 'budget-id';
      const updateData = {
        name: 'Updated Budget',
        totalAmount: 1500,
      };

      const updatedBudget = {
        _id: budgetId,
        ...updateData,
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        currency: 'USD',
        categoryAllocations: [],
        userId: 'test-user-id',
        status: 'active',
        alertThreshold: 80,
        isActive: true,
        autoAdjust: false,
        allowRollover: false,
        rolloverAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: budgetId };
      mockRequest.body = updateData;
      mockValidation.updateBudget.mockReturnValue({ error: null, value: updateData });
      mockBudgetService.updateBudget.mockResolvedValue(updatedBudget as any);

      await budgetController.updateBudget(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockBudgetService.updateBudget).toHaveBeenCalledWith(
        'test-user-id',
        budgetId,
        updateData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Budget updated successfully',
        data: updatedBudget,
      });
    });

    it('should handle validation errors', async () => {
      const budgetId = 'budget-id';
      const updateData = { name: 'Updated Budget' };

      mockRequest.params = { id: budgetId };
      mockRequest.body = updateData;
      mockValidation.updateBudget.mockReturnValue({ 
        error: { details: [{ message: 'Validation failed' }] }, 
        value: null 
      });

      await budgetController.updateBudget(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['Validation failed'],
      });
    });

    it('should handle service errors', async () => {
      const budgetId = 'budget-id';
      const updateData = { name: 'Updated Budget' };

      mockRequest.params = { id: budgetId };
      mockRequest.body = updateData;
      mockValidation.updateBudget.mockReturnValue({ error: null, value: updateData });
      mockBudgetService.updateBudget.mockRejectedValue(new Error('Service error'));

      await budgetController.updateBudget(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });
  });

  describe('deleteBudget', () => {
    it('should delete a budget successfully', async () => {
      const budgetId = 'budget-id';
      mockRequest.params = { id: budgetId };
      mockBudgetService.deleteBudget.mockResolvedValue(true);

      await budgetController.deleteBudget(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockBudgetService.deleteBudget).toHaveBeenCalledWith(
        'test-user-id',
        budgetId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Budget deleted successfully',
      });
    });

    it('should handle service errors', async () => {
      const budgetId = 'budget-id';
      mockRequest.params = { id: budgetId };
      mockBudgetService.deleteBudget.mockRejectedValue(new Error('Service error'));

      await budgetController.deleteBudget(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });
  });

  describe('getBudgetSummary', () => {
    it('should get budget summary successfully', async () => {
      const summary = {
        totalBudgets: 5,
        activeBudgets: 3,
        totalBudgetAmount: 5000,
        totalSpentAmount: 2000,
        totalRemainingAmount: 3000,
        overBudgetCount: 1,
        upcomingDeadlines: [],
      };

      mockBudgetService.getBudgetSummary.mockResolvedValue(summary as any);

      await budgetController.getBudgetSummary(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockBudgetService.getBudgetSummary).toHaveBeenCalledWith('test-user-id');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: summary,
      });
    });

    it('should handle service errors', async () => {
      mockBudgetService.getBudgetSummary.mockRejectedValue(new Error('Service error'));

      await budgetController.getBudgetSummary(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });
  });

  describe('getBudgetStatistics', () => {
    it('should get budget statistics successfully', async () => {
      const year = 2024;
      const statistics = {
        monthlyStats: [
          {
            month: 'January',
            year: 2024,
            totalBudgeted: 1000,
            totalSpent: 800,
            totalSaved: 200,
            budgetCount: 1,
          },
        ],
        categoryStats: [],
        spendingPatterns: [],
      };

      mockRequest.query = { year: year.toString() };
      mockBudgetService.getBudgetStatistics.mockResolvedValue(statistics as any);

      await budgetController.getBudgetStatistics(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockBudgetService.getBudgetStatistics).toHaveBeenCalledWith(
        'test-user-id',
        year
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: statistics,
      });
    });

    it('should handle service errors', async () => {
      const year = 2024;
      mockRequest.query = { year: year.toString() };
      mockBudgetService.getBudgetStatistics.mockRejectedValue(new Error('Service error'));

      await budgetController.getBudgetStatistics(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });
  });

  describe('checkBudgetAlerts', () => {
    it('should check budget alerts successfully', async () => {
      const alerts = [
        {
          type: 'threshold',
          message: 'Budget "Monthly Budget" is 85% used',
          severity: 'medium',
          currentAmount: 850,
          limitAmount: 1000,
        },
      ];

      mockBudgetService.checkBudgetAlerts.mockResolvedValue(alerts as any);

      await budgetController.checkBudgetAlerts(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockBudgetService.checkBudgetAlerts).toHaveBeenCalledWith('test-user-id');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: alerts,
      });
    });

    it('should handle service errors', async () => {
      mockBudgetService.checkBudgetAlerts.mockRejectedValue(new Error('Service error'));

      await budgetController.checkBudgetAlerts(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });
  });

  describe('updateCategoryAllocation', () => {
    it('should update category allocation successfully', async () => {
      const budgetId = 'budget-id';
      const categoryId = 'category-id';
      const updateData = {
        allocatedAmount: 600,
        isFlexible: true,
        priority: 2,
      };

      const existingBudget = {
        _id: budgetId,
        name: 'Monthly Budget',
        categoryBreakdown: [
          {
            categoryId: categoryId,
            allocatedAmount: 500,
            isFlexible: false,
            priority: 1,
          },
        ],
      };

      const updatedBudget = {
        ...existingBudget,
        categoryBreakdown: [
          {
            categoryId: categoryId,
            allocatedAmount: 600,
            isFlexible: true,
            priority: 2,
          },
        ],
      };

      mockRequest.params = { id: budgetId, categoryId };
      mockRequest.body = updateData;
      mockValidation.updateCategoryAllocation.mockReturnValue({ error: null, value: updateData });
      mockBudgetService.getBudgetById.mockResolvedValue(existingBudget as any);
      mockBudgetService.updateBudget.mockResolvedValue(updatedBudget as any);

      await budgetController.updateCategoryAllocation(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockBudgetService.getBudgetById).toHaveBeenCalledWith('test-user-id', budgetId);
      expect(mockBudgetService.updateBudget).toHaveBeenCalledWith('test-user-id', budgetId, {
        categoryAllocations: [
          {
            categoryId: categoryId,
            allocatedAmount: 600,
            isFlexible: true,
            priority: 2,
          },
        ],
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category allocation updated successfully',
        data: updatedBudget,
      });
    });

    it('should handle unauthorized requests', async () => {
      const budgetId = 'budget-id';
      const categoryId = 'category-id';
      mockRequest.params = { id: budgetId, categoryId };
      mockRequest.user = undefined;

      await budgetController.updateCategoryAllocation(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
      });
    });

    it('should handle missing budget ID', async () => {
      const categoryId = 'category-id';
      mockRequest.params = { categoryId };

      await budgetController.updateCategoryAllocation(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Budget ID and Category ID are required',
      });
    });

    it('should handle missing category ID', async () => {
      const budgetId = 'budget-id';
      mockRequest.params = { id: budgetId };

      await budgetController.updateCategoryAllocation(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Budget ID and Category ID are required',
      });
    });

    it('should handle validation errors', async () => {
      const budgetId = 'budget-id';
      const categoryId = 'category-id';
      const updateData = { allocatedAmount: 600 };
      mockRequest.params = { id: budgetId, categoryId };
      mockRequest.body = updateData;
      mockValidation.updateCategoryAllocation.mockReturnValue({
        error: { details: [{ message: 'Invalid amount' }] },
        value: null,
      });

      await budgetController.updateCategoryAllocation(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['Invalid amount'],
      });
    });

    it('should handle category allocation not found', async () => {
      const budgetId = 'budget-id';
      const categoryId = 'category-id';
      const updateData = { allocatedAmount: 600 };
      const existingBudget = {
        _id: budgetId,
        name: 'Monthly Budget',
        categoryBreakdown: [],
      };

      mockRequest.params = { id: budgetId, categoryId };
      mockRequest.body = updateData;
      mockValidation.updateCategoryAllocation.mockReturnValue({ error: null, value: updateData });
      mockBudgetService.getBudgetById.mockResolvedValue(existingBudget as any);

      await budgetController.updateCategoryAllocation(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Category allocation not found in this budget',
      });
    });

    it('should handle not found errors', async () => {
      const budgetId = 'budget-id';
      const categoryId = 'category-id';
      const updateData = { allocatedAmount: 600 };
      const existingBudget = {
        _id: budgetId,
        name: 'Monthly Budget',
        categoryBreakdown: [
          {
            categoryId: categoryId,
            allocatedAmount: 500,
          },
        ],
      };

      mockRequest.params = { id: budgetId, categoryId };
      mockRequest.body = updateData;
      mockValidation.updateCategoryAllocation.mockReturnValue({ error: null, value: updateData });
      mockBudgetService.getBudgetById.mockResolvedValue(existingBudget as any);
      const notFoundError = new Error('Budget not found');
      mockBudgetService.updateBudget.mockRejectedValue(notFoundError);

      await budgetController.updateCategoryAllocation(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Budget not found',
      });
    });

    it('should handle access denied errors', async () => {
      const budgetId = 'budget-id';
      const categoryId = 'category-id';
      const updateData = { allocatedAmount: 600 };
      const existingBudget = {
        _id: budgetId,
        name: 'Monthly Budget',
        categoryBreakdown: [
          {
            categoryId: categoryId,
            allocatedAmount: 500,
          },
        ],
      };

      mockRequest.params = { id: budgetId, categoryId };
      mockRequest.body = updateData;
      mockValidation.updateCategoryAllocation.mockReturnValue({ error: null, value: updateData });
      mockBudgetService.getBudgetById.mockResolvedValue(existingBudget as any);
      const accessDeniedError = new Error('access denied');
      mockBudgetService.updateBudget.mockRejectedValue(accessDeniedError);

      await budgetController.updateCategoryAllocation(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'access denied',
      });
    });

    it('should handle service errors during update category allocation', async () => {
      const budgetId = 'budget-id';
      const categoryId = 'category-id';
      const updateData = { allocatedAmount: 600 };
      const existingBudget = {
        _id: budgetId,
        name: 'Monthly Budget',
        categoryBreakdown: [
          {
            categoryId: categoryId,
            allocatedAmount: 500,
          },
        ],
      };

      mockRequest.params = { id: budgetId, categoryId };
      mockRequest.body = updateData;
      mockValidation.updateCategoryAllocation.mockReturnValue({ error: null, value: updateData });
      mockBudgetService.getBudgetById.mockResolvedValue(existingBudget as any);
      const serviceError = new Error('Service error');
      mockBudgetService.updateBudget.mockRejectedValue(serviceError);

      await budgetController.updateCategoryAllocation(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });

    it('should handle missing allocatedAmount in body', async () => {
      const budgetId = 'budget-id';
      const categoryId = 'category-id';
      const updateData = {};

      mockRequest.params = { id: budgetId, categoryId };
      mockRequest.body = updateData;

      await budgetController.updateCategoryAllocation(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Should still proceed with validation
      expect(mockValidation.updateCategoryAllocation).toHaveBeenCalledWith(updateData);
    });
  });
});
