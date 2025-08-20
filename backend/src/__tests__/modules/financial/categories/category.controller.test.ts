import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { CategoryController } from '../../../../modules/financial/categories/controllers/category.controller';
import { CategoryService } from '../../../../modules/financial/categories/service/category.service';
import { categoryValidation } from '../../../../modules/financial/categories/validators/category.validation';

// Mock the CategoryService
jest.mock('../../../../modules/financial/categories/service/category.service');
jest.mock('../../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const MockedCategoryService = CategoryService as jest.MockedClass<typeof CategoryService>;

describe('Category Controller', () => {
  let app: express.Application;
  let categoryController: CategoryController;
  let mockCategoryService: jest.Mocked<CategoryService>;

  const mockUser = {
    userId: 'user123',
  };

  const mockCategory = {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    name: 'Test Category',
    description: 'Test Description',
    color: '#FF0000',
    icon: 'test-icon',
    userId: new mongoose.Types.ObjectId('user123'),
    parentId: null,
    level: 0,
    path: ['Test Category'],
    isActive: true,
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Create a fresh instance of the controller
    categoryController = new CategoryController();
    
    // Get the mocked service instance
    mockCategoryService = (categoryController as any).categoryService;
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    const createCategoryRoute = '/categories';
    
    beforeEach(() => {
      app.post(createCategoryRoute, (req, res) => {
        req.user = mockUser;
        categoryController.createCategory(req as any, res);
      });
    });

    it('should create a category successfully', async () => {
      const categoryData = {
        name: 'New Category',
        description: 'New Description',
        color: '#00FF00',
        icon: 'new-icon',
      };

      mockCategoryService.createCategory.mockResolvedValue(mockCategory);

      const response = await request(app)
        .post(createCategoryRoute)
        .set('Content-Type', 'application/json')
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category created successfully');
      expect(response.body.data).toEqual(mockCategory);
      expect(mockCategoryService.createCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: categoryData.name,
          description: categoryData.description,
          color: categoryData.color,
          icon: categoryData.icon,
        }),
        mockUser.userId
      );
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        description: 'Test Description',
      };

      const response = await request(app)
        .post(createCategoryRoute)
        .set('Content-Type', 'application/json')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeDefined();
    });

    it('should handle authentication errors', async () => {
      app.post('/categories-no-auth', (req, res) => {
        req.user = undefined;
        categoryController.createCategory(req as any, res);
      });

      const response = await request(app)
        .post('/categories-no-auth')
        .set('Content-Type', 'application/json')
        .send({ name: 'Test Category' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication required');
    });

    it('should handle duplicate category errors', async () => {
      const categoryData = { name: 'Duplicate Category' };
      const duplicateError = new Error('Category with this name already exists at this level');

      mockCategoryService.createCategory.mockRejectedValue(duplicateError);

      const response = await request(app)
        .post(createCategoryRoute)
        .set('Content-Type', 'application/json')
        .send(categoryData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(duplicateError.message);
    });

    it('should handle parent category not found errors', async () => {
      const categoryData = {
        name: 'Child Category',
        parentId: 'invalid-parent-id',
      };
      const notFoundError = new Error('Parent category not found or access denied');

      mockCategoryService.createCategory.mockRejectedValue(notFoundError);

      const response = await request(app)
        .post(createCategoryRoute)
        .set('Content-Type', 'application/json')
        .send(categoryData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(notFoundError.message);
    });

    it('should handle access denied errors', async () => {
      const categoryData = { name: 'Test Category' };
      const accessDeniedError = new Error('Access denied');

      mockCategoryService.createCategory.mockRejectedValue(accessDeniedError);

      const response = await request(app)
        .post(createCategoryRoute)
        .set('Content-Type', 'application/json')
        .send(categoryData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(accessDeniedError.message);
    });

    it('should handle unknown errors', async () => {
      const categoryData = { name: 'Test Category' };
      const unknownError = new Error('Unknown error');

      mockCategoryService.createCategory.mockRejectedValue(unknownError);

      const response = await request(app)
        .post(createCategoryRoute)
        .set('Content-Type', 'application/json')
        .send(categoryData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(unknownError.message);
    });

    it('should handle non-Error objects', async () => {
      const categoryData = { name: 'Test Category' };

      mockCategoryService.createCategory.mockRejectedValue('String error');

      const response = await request(app)
        .post(createCategoryRoute)
        .set('Content-Type', 'application/json')
        .send(categoryData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('getCategoryById', () => {
    const getCategoryRoute = '/categories/:id';
    
    beforeEach(() => {
      app.get('/categories/:id', (req, res) => {
        req.user = mockUser;
        categoryController.getCategoryById(req as any, res);
      });
    });

    it('should get category by ID successfully', async () => {
      mockCategoryService.getCategoryById.mockResolvedValue(mockCategory);

      const response = await request(app)
        .get(`/categories/${mockCategory._id}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCategory);
      expect(mockCategoryService.getCategoryById).toHaveBeenCalledWith(
        mockCategory._id.toString(),
        mockUser.userId
      );
    });

    it('should handle invalid category ID', async () => {
      const response = await request(app)
        .get('/categories/invalid-id')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid category ID');
    });

    it('should handle category not found', async () => {
      const notFoundError = new Error('Category not found');
      mockCategoryService.getCategoryById.mockRejectedValue(notFoundError);

      const response = await request(app)
        .get(`/categories/${mockCategory._id}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found');
    });

    it('should handle access denied', async () => {
      const accessDeniedError = new Error('Access denied');
      mockCategoryService.getCategoryById.mockRejectedValue(accessDeniedError);

      const response = await request(app)
        .get(`/categories/${mockCategory._id}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied');
    });
  });

  describe('getUserCategories', () => {
    const getUserCategoriesRoute = '/categories';
    
    beforeEach(() => {
      app.get(getUserCategoriesRoute, (req, res) => {
        req.user = mockUser;
        categoryController.getUserCategories(req as any, res);
      });
    });

    it('should get user categories successfully', async () => {
      const mockResult = {
        categories: [mockCategory],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockCategoryService.getUserCategories.mockResolvedValue(mockResult);

      const response = await request(app)
        .get(getUserCategoriesRoute)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult.categories);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should handle query parameters', async () => {
      const mockResult = {
        categories: [mockCategory],
        total: 1,
        page: 2,
        totalPages: 2,
      };

      mockCategoryService.getUserCategories.mockResolvedValue(mockResult);

      const response = await request(app)
        .get(getUserCategoriesRoute)
        .query({
          parentId: 'parent123',
          level: 1,
          isActive: true,
          search: 'test',
          page: 2,
          limit: 10,
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(mockCategoryService.getUserCategories).toHaveBeenCalledWith(
        mockUser.userId,
        {
          parentId: 'parent123',
          level: 1,
          isActive: true,
          search: 'test',
          page: 2,
          limit: 10,
        }
      );
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .get(getUserCategoriesRoute)
        .query({
          page: 'invalid-page', // Invalid: should be number
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid query parameters');
    });
  });

  describe('getCategoryTree', () => {
    const getCategoryTreeRoute = '/categories/tree';
    
    beforeEach(() => {
      app.get(getCategoryTreeRoute, (req, res) => {
        req.user = mockUser;
        categoryController.getCategoryTree(req as any, res);
      });
    });

    it('should get category tree successfully', async () => {
      const mockTree = [
        {
          _id: mockCategory._id,
          name: mockCategory.name,
          children: [],
        },
      ];

      mockCategoryService.getCategoryTree.mockResolvedValue(mockTree);

      const response = await request(app)
        .get(getCategoryTreeRoute)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTree);
      expect(mockCategoryService.getCategoryTree).toHaveBeenCalledWith(mockUser.userId);
    });
  });

  describe('updateCategory', () => {
    const updateCategoryRoute = '/categories/:id';
    
    beforeEach(() => {
      app.put(updateCategoryRoute, (req, res) => {
        req.user = mockUser;
        categoryController.updateCategory(req as any, res);
      });
    });

    it('should update category successfully', async () => {
      const updateData = {
        name: 'Updated Category',
        description: 'Updated Description',
      };

      const updatedCategory = { ...mockCategory, ...updateData };
      mockCategoryService.updateCategory.mockResolvedValue(updatedCategory);

      const response = await request(app)
        .put(`/categories/${mockCategory._id}`)
        .set('Content-Type', 'application/json')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category updated successfully');
      expect(response.body.data).toEqual(updatedCategory);
    });

    it('should handle invalid category ID', async () => {
      const response = await request(app)
        .put('/categories/invalid-id')
        .set('Content-Type', 'application/json')
        .send({ name: 'Updated Category' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid category ID');
    });

    it('should handle validation errors in body', async () => {
      const response = await request(app)
        .put(`/categories/${mockCategory._id}`)
        .set('Content-Type', 'application/json')
        .send({ name: '' }); // Invalid: empty name

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('deleteCategory', () => {
    const deleteCategoryRoute = '/categories/:id';
    
    beforeEach(() => {
      app.delete(deleteCategoryRoute, (req, res) => {
        req.user = mockUser;
        categoryController.deleteCategory(req as any, res);
      });
    });

    it('should delete category successfully', async () => {
      mockCategoryService.deleteCategory.mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/categories/${mockCategory._id}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category deleted successfully');
      expect(mockCategoryService.deleteCategory).toHaveBeenCalledWith(
        mockCategory._id.toString(),
        mockUser.userId
      );
    });

    it('should handle invalid category ID', async () => {
      const response = await request(app)
        .delete('/categories/invalid-id')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid category ID');
    });

    it('should handle category not found', async () => {
      const notFoundError = new Error('Category not found');
      mockCategoryService.deleteCategory.mockRejectedValue(notFoundError);

      const response = await request(app)
        .delete(`/categories/${mockCategory._id}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found');
    });

    it('should handle access denied', async () => {
      const accessDeniedError = new Error('Access denied');
      mockCategoryService.deleteCategory.mockRejectedValue(accessDeniedError);

      const response = await request(app)
        .delete(`/categories/${mockCategory._id}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied');
    });

    it('should handle cannot delete with subcategories', async () => {
      const subcategoryError = new Error('Cannot delete category with subcategories. Please delete subcategories first.');
      mockCategoryService.deleteCategory.mockRejectedValue(subcategoryError);

      const response = await request(app)
        .delete(`/categories/${mockCategory._id}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(subcategoryError.message);
    });
  });

  describe('bulkCreateCategories', () => {
    const bulkCreateRoute = '/categories/bulk';
    
    beforeEach(() => {
      app.post(bulkCreateRoute, (req, res) => {
        req.user = mockUser;
        categoryController.bulkCreateCategories(req as any, res);
      });
    });

    it('should create categories in bulk successfully', async () => {
      const categoriesData = [
        { name: 'Category 1', description: 'Description 1' },
        { name: 'Category 2', description: 'Description 2' },
      ];

      const createdCategories = [
        { ...mockCategory, name: 'Category 1' },
        { ...mockCategory, name: 'Category 2' },
      ];

      mockCategoryService.bulkCreateCategories.mockResolvedValue(createdCategories);

      const response = await request(app)
        .post(bulkCreateRoute)
        .set('Content-Type', 'application/json')
        .send({ categories: categoriesData });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Successfully created 2 categories');
      expect(response.body.data).toEqual(createdCategories);
      expect(response.body.summary).toEqual({
        requested: 2,
        created: 2,
        failed: 0,
      });
    });

    it('should handle missing categories array', async () => {
      const response = await request(app)
        .post(bulkCreateRoute)
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Categories array is required and must not be empty');
    });

    it('should handle empty categories array', async () => {
      const response = await request(app)
        .post(bulkCreateRoute)
        .set('Content-Type', 'application/json')
        .send({ categories: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Categories array is required and must not be empty');
    });

    it('should handle validation errors in categories array', async () => {
      const invalidCategories = [
        { name: 'Valid Category' },
        { name: '' }, // Invalid: empty name
      ];

      const response = await request(app)
        .post(bulkCreateRoute)
        .set('Content-Type', 'application/json')
        .send({ categories: invalidCategories });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation errors in categories array');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('getCategoryStats', () => {
    const getStatsRoute = '/categories/stats';
    
    beforeEach(() => {
      app.get(getStatsRoute, (req, res) => {
        req.user = mockUser;
        categoryController.getCategoryStats(req as any, res);
      });
    });

    it('should get category statistics successfully', async () => {
      const mockStats = {
        totalCategories: 10,
        activeCategories: 8,
        rootCategories: 3,
        maxDepth: 2,
        categoriesByLevel: { 0: 3, 1: 5, 2: 2 },
      };

      mockCategoryService.getCategoryStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get(getStatsRoute)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
      expect(mockCategoryService.getCategoryStats).toHaveBeenCalledWith(mockUser.userId);
    });
  });
});
