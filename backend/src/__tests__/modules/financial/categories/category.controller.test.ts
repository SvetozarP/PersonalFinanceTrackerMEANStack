import { Request, Response } from 'express';
import { CategoryController } from '../../../../modules/financial/categories/controllers/category.controller';
import { CategoryService } from '../../../../modules/financial/categories/service/category.service';
import { logger } from '../../../../shared/services/logger.service';
import { categoryValidation } from '../../../../modules/financial/categories/validators/category.validation';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../../../modules/financial/categories/service/category.service');
jest.mock('../../../../shared/services/logger.service');
jest.mock('../../../../modules/financial/categories/validators/category.validation');

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

describe('CategoryController', () => {
  let categoryController: CategoryController;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create controller instance
    categoryController = new CategoryController();

    // Setup request and response mocks
    mockRequest = {
      user: { userId: 'user123' },
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createCategory', () => {
    const validCategoryData = {
      name: 'Test Category',
      description: 'Test Description',
      color: '#FF0000',
      icon: 'test-icon',
    };

    it('should create category successfully', async () => {
      // Setup mocks
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Category',
        description: 'Test Description',
        color: '#FF0000',
        icon: 'test-icon',
        userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        level: 0,
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
      };

      (categoryValidation.create.validate as jest.Mock).mockReturnValue({
        error: null,
        value: validCategoryData,
      });

      (CategoryService.prototype.createCategory as jest.Mock).mockResolvedValue(mockCategory);

      mockRequest.body = validCategoryData;

      // Execute
      await categoryController.createCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Verify
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category created successfully',
        data: mockCategory,
      });
      expect(logger.info).toHaveBeenCalledWith('Category created via API', {
        categoryId: mockCategory._id,
        userId: 'user123',
        name: mockCategory.name,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await categoryController.createCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should return 400 when body validation fails', async () => {
      const validationError = {
        details: [
          {
            path: ['name'],
            message: 'Name is required',
          },
        ],
      };

      (categoryValidation.create.validate as jest.Mock).mockReturnValue({
        error: validationError,
        value: {},
      });

      mockRequest.body = {};

      await categoryController.createCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: [
          {
            field: 'name',
            message: 'Name is required',
          },
        ],
      });
    });

    it('should handle service errors (duplicate name)', async () => {
      (categoryValidation.create.validate as jest.Mock).mockReturnValue({
        error: null,
        value: validCategoryData,
      });

      (CategoryService.prototype.createCategory as jest.Mock).mockRejectedValue(
        new Error('Category with this name already exists at this level')
      );

      mockRequest.body = validCategoryData;

      await categoryController.createCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category with this name already exists at this level',
      });
    });

    it('should handle service errors (parent not found)', async () => {
      (categoryValidation.create.validate as jest.Mock).mockReturnValue({
        error: null,
        value: { ...validCategoryData, parentId: '507f1f77bcf86cd799439011' },
      });

      (CategoryService.prototype.createCategory as jest.Mock).mockRejectedValue(
        new Error('Parent category not found')
      );

      mockRequest.body = { ...validCategoryData, parentId: '507f1f77bcf86cd799439011' };

      await categoryController.createCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Parent category not found',
      });
    });

    it('should handle unknown errors', async () => {
      (categoryValidation.create.validate as jest.Mock).mockReturnValue({
        error: null,
        value: validCategoryData,
      });

      (CategoryService.prototype.createCategory as jest.Mock).mockRejectedValue('Unknown error');

      mockRequest.body = validCategoryData;

      await categoryController.createCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('getCategoryById', () => {
    const categoryId = new mongoose.Types.ObjectId().toString();
    const mockCategory = {
      _id: categoryId,
      name: 'Test Category',
      userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    };

    it('should get category by ID successfully', async () => {
      (categoryValidation.id.validate as jest.Mock).mockReturnValue({
        error: null,
        value: { id: categoryId },
      });

      (CategoryService.prototype.getCategoryById as jest.Mock).mockResolvedValue(mockCategory);

      mockRequest.params = { id: categoryId };

      await categoryController.getCategoryById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCategory,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await categoryController.getCategoryById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should return 400 when ID validation fails', async () => {
      const validationError = {
        details: [
          {
            path: ['id'],
            message: 'Invalid category ID',
          },
        ],
      };

      (categoryValidation.id.validate as jest.Mock).mockReturnValue({
        error: validationError,
        value: {},
      });

      mockRequest.params = { id: 'invalid-id' };

      await categoryController.getCategoryById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid category ID',
        errors: [
          {
            field: 'id',
            message: 'Invalid category ID',
          },
        ],
      });
    });

    it('should handle category not found error', async () => {
      (categoryValidation.id.validate as jest.Mock).mockReturnValue({
        error: null,
        value: { id: categoryId },
      });

      (CategoryService.prototype.getCategoryById as jest.Mock).mockRejectedValue(
        new Error('Category not found')
      );

      mockRequest.params = { id: categoryId };

      await categoryController.getCategoryById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found',
      });
    });

    it('should handle access denied error', async () => {
      (categoryValidation.id.validate as jest.Mock).mockReturnValue({
        error: null,
        value: { id: categoryId },
      });

      (CategoryService.prototype.getCategoryById as jest.Mock).mockRejectedValue(
        new Error('Access denied')
      );

      mockRequest.params = { id: categoryId };

      await categoryController.getCategoryById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied',
      });
    });
  });

  describe('getUserCategories', () => {
    it('should get user categories successfully', async () => {
      const mockResult = {
        categories: [
          { _id: '1', name: 'Category 1' },
          { _id: '2', name: 'Category 2' },
        ],
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      };

      // Mock query validation
      (categoryValidation.query.validate as jest.Mock).mockReturnValue({
        error: null,
        value: { page: 1, limit: 20 },
      });

      (CategoryService.prototype.getUserCategories as jest.Mock).mockResolvedValue(mockResult);

      mockRequest.query = { page: '1', limit: '20' };

      await categoryController.getUserCategories(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.categories,
        pagination: {
          page: mockResult.page,
          limit: 20,
          total: mockResult.total,
          totalPages: mockResult.totalPages,
        },
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await categoryController.getUserCategories(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should handle service errors', async () => {
      (CategoryService.prototype.getUserCategories as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      await categoryController.getUserCategories(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('getCategoryTree', () => {
    it('should get category tree successfully', async () => {
      const mockTree = [
        {
          _id: '1',
          name: 'Parent Category',
          children: [
            {
              _id: '2',
              name: 'Child Category',
            },
          ],
        },
      ];

      (CategoryService.prototype.getCategoryTree as jest.Mock).mockResolvedValue(mockTree);

      await categoryController.getCategoryTree(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockTree,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await categoryController.getCategoryTree(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should handle service errors', async () => {
      (CategoryService.prototype.getCategoryTree as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      await categoryController.getCategoryTree(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('updateCategory', () => {
    const categoryId = new mongoose.Types.ObjectId().toString();
    const updateData = {
      name: 'Updated Category',
      description: 'Updated Description',
    };

    it('should update category successfully', async () => {
      const mockUpdatedCategory = {
        _id: categoryId,
        name: 'Updated Category',
        description: 'Updated Description',
      };

      (categoryValidation.id.validate as jest.Mock).mockReturnValue({
        error: null,
        value: { id: categoryId },
      });

      (categoryValidation.update.validate as jest.Mock).mockReturnValue({
        error: null,
        value: updateData,
      });

      (CategoryService.prototype.updateCategory as jest.Mock).mockResolvedValue(mockUpdatedCategory);

      mockRequest.params = { id: categoryId };
      mockRequest.body = updateData;

      await categoryController.updateCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category updated successfully',
        data: mockUpdatedCategory,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await categoryController.updateCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should return 400 when ID validation fails', async () => {
      const validationError = {
        details: [
          {
            path: ['id'],
            message: 'Invalid category ID',
          },
        ],
      };

      (categoryValidation.id.validate as jest.Mock).mockReturnValue({
        error: validationError,
        value: {},
      });

      mockRequest.params = { id: 'invalid-id' };

      await categoryController.updateCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid category ID',
        errors: [
          {
            field: 'id',
            message: 'Invalid category ID',
          },
        ],
      });
    });

    it('should return 400 when body validation fails', async () => {
      const testId = '507f1f77bcf86cd799439011';
      
      (categoryValidation.id.validate as jest.Mock).mockReturnValue({
        error: null,
        value: { id: testId },
      });

      const validationError = {
        details: [
          {
            path: ['name'],
            message: 'Name must be at least 1 character',
          },
        ],
      };

      (categoryValidation.update.validate as jest.Mock).mockReturnValue({
        error: validationError,
        value: {},
      });

      mockRequest.params = { id: testId };
      mockRequest.body = { name: '' };

      await categoryController.updateCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid category ID',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should handle category not found error', async () => {
      (categoryValidation.id.validate as jest.Mock).mockReturnValue({
        error: null,
        value: { id: categoryId },
      });

      (categoryValidation.update.validate as jest.Mock).mockReturnValue({
        error: null,
        value: updateData,
      });

      (CategoryService.prototype.updateCategory as jest.Mock).mockRejectedValue(
        new Error('Category not found')
      );

      mockRequest.params = { id: categoryId };
      mockRequest.body = updateData;

      await categoryController.updateCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found',
      });
    });
  });

  describe('deleteCategory', () => {
    const categoryId = new mongoose.Types.ObjectId().toString();

    it('should delete category successfully', async () => {
      (categoryValidation.id.validate as jest.Mock).mockReturnValue({
        error: null,
        value: { id: categoryId },
      });

      (CategoryService.prototype.deleteCategory as jest.Mock).mockResolvedValue(undefined);

      mockRequest.params = { id: categoryId };

      await categoryController.deleteCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category deleted successfully',
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await categoryController.deleteCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should return 400 when ID validation fails', async () => {
      const validationError = {
        details: [
          {
            path: ['id'],
            message: 'Invalid category ID',
          },
        ],
      };

      (categoryValidation.id.validate as jest.Mock).mockReturnValue({
        error: validationError,
        value: {},
      });

      mockRequest.params = { id: 'invalid-id' };

      await categoryController.deleteCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid category ID',
        errors: [
          {
            field: 'id',
            message: 'Invalid category ID',
          },
        ],
      });
    });

    it('should handle category with subcategories error', async () => {
      (categoryValidation.id.validate as jest.Mock).mockReturnValue({
        error: null,
        value: { id: categoryId },
      });

      (CategoryService.prototype.deleteCategory as jest.Mock).mockRejectedValue(
        new Error('Cannot delete category with subcategories first')
      );

      mockRequest.params = { id: categoryId };

      await categoryController.deleteCategory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot delete category with subcategories first',
      });
    });
  });

  describe('bulkCreateCategories', () => {
    it('should bulk create categories successfully', async () => {
      const categoriesData = [
        { name: 'Category 1', description: 'Description 1' },
        { name: 'Category 2', description: 'Description 2' },
      ];

      const mockCreatedCategories = [
        { _id: '1', name: 'Category 1', description: 'Description 1' },
        { _id: '2', name: 'Category 2', description: 'Description 2' },
      ];

      // Mock individual category validation for each category
      (categoryValidation.create.validate as jest.Mock)
        .mockReturnValueOnce({ error: null, value: categoriesData[0] })
        .mockReturnValueOnce({ error: null, value: categoriesData[1] });

      (CategoryService.prototype.bulkCreateCategories as jest.Mock).mockResolvedValue(mockCreatedCategories);

      mockRequest.body = { categories: categoriesData };

      await categoryController.bulkCreateCategories(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully created 2 categories',
        data: mockCreatedCategories,
        summary: {
          requested: 2,
          created: 2,
          failed: 0,
        },
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await categoryController.bulkCreateCategories(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should return 400 when validation fails', async () => {
      const validationError = {
        details: [
          {
            path: ['categories'],
            message: 'Categories array is required',
          },
        ],
      };

      // Mock validation error for the first category
      (categoryValidation.create.validate as jest.Mock).mockReturnValue({
        error: validationError,
        value: {},
      });

      mockRequest.body = {};

      await categoryController.bulkCreateCategories(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Categories array is required and must not be empty',
      });
    });
  });

  describe('getCategoryStats', () => {
    it('should get category stats successfully', async () => {
      const mockStats = {
        totalCategories: 10,
        activeCategories: 8,
        rootCategories: 3,
        maxDepth: 2,
        categoriesByLevel: {
          0: 3,
          1: 5,
          2: 2,
        },
      };

      (CategoryService.prototype.getCategoryStats as jest.Mock).mockResolvedValue(mockStats);

      await categoryController.getCategoryStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await categoryController.getCategoryStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should handle service errors', async () => {
      (CategoryService.prototype.getCategoryStats as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      await categoryController.getCategoryStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });
});
