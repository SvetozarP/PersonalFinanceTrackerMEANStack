import { CategoryService } from '../../../../modules/financial/categories/service/category.service';
import { CategoryRepository } from '../../../../modules/financial/categories/repositories/category.repository';
import { ICategory } from '../../../../modules/financial/categories/interfaces/category.interface';
import mongoose from 'mongoose';

// Mock the category repository
jest.mock('../../../../modules/financial/categories/repositories/category.repository');
jest.mock('../../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const MockedCategoryRepository = CategoryRepository as jest.MockedClass<typeof CategoryRepository>;

describe('Category Service', () => {
  let categoryService: CategoryService;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryRepository = new MockedCategoryRepository() as jest.Mocked<CategoryRepository>;
    categoryService = new CategoryService();
    (categoryService as any).categoryRepository = mockCategoryRepository;
    
    // Setup default mock implementations
    mockCategoryRepository.findById.mockResolvedValue(null);
    mockCategoryRepository.findOne.mockResolvedValue(null);
    mockCategoryRepository.create.mockResolvedValue({} as any);
    mockCategoryRepository.updateById.mockResolvedValue({} as any);
    mockCategoryRepository.deleteById.mockResolvedValue({} as any);
    mockCategoryRepository.find.mockResolvedValue([]);
    mockCategoryRepository.count.mockResolvedValue(0);
  });

  describe('createCategory', () => {
    const mockCategoryData = {
      name: 'Test Category',
      description: 'Test Description',
      color: '#FF0000',
      icon: 'test-icon',
    };

    const mockUserId = '507f1f77bcf86cd799439011';

    it('should create a category successfully without parent', async () => {
      const mockCreatedCategory = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Category',
        description: 'Test Description',
        color: '#FF0000',
        icon: 'test-icon',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(null);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue(mockCreatedCategory);

      const result = await categoryService.createCategory(mockCategoryData, mockUserId);

      expect(result).toEqual(mockCreatedCategory);
      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        ...mockCategoryData,
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
      });
    });

    it('should create a category successfully with parent', async () => {
      const parentId = '507f1f77bcf86cd799439012';
      const mockParentCategory = {
        _id: new mongoose.Types.ObjectId(parentId),
        name: 'Parent Category',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['Parent Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const mockCreatedCategory = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Category',
        parentId: new mongoose.Types.ObjectId(parentId),
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 1,
        path: ['Parent Category', 'Test Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(mockParentCategory);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue(mockCreatedCategory);

      const result = await categoryService.createCategory(
        { ...mockCategoryData, parentId: new mongoose.Types.ObjectId(parentId) },
        mockUserId
      );

      expect(result).toEqual(mockCreatedCategory);
      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        ...mockCategoryData,
        parentId: new mongoose.Types.ObjectId(parentId),
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 1,
        path: ['Parent Category', 'Parent Category', 'Test Category'],
        isActive: true,
        isSystem: false,
      });
    });

    it('should throw error when parent category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(
        categoryService.createCategory({ ...mockCategoryData, parentId: 'invalid-id' as any }, mockUserId)
      ).rejects.toThrow('Parent category not found or access denied');
    });

    it('should throw error when parent category belongs to different user', async () => {
      const parentId = '507f1f77bcf86cd799439012';
      const mockParentCategory = {
        _id: new mongoose.Types.ObjectId(parentId),
        name: 'Parent Category',
        userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), // Different user
        level: 0,
        path: ['Parent Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(mockParentCategory);

      await expect(
        categoryService.createCategory({ ...mockCategoryData, parentId: new mongoose.Types.ObjectId(parentId) }, mockUserId)
      ).rejects.toThrow('Parent category not found or access denied');
    });

    it('should throw error when category name already exists at same level', async () => {
      const existingCategory = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Category',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(null);
      mockCategoryRepository.findOne.mockResolvedValue(existingCategory);

      await expect(
        categoryService.createCategory(mockCategoryData, mockUserId)
      ).rejects.toThrow('Category with this name already exists at this level');
    });

    it('should throw error when category name already exists under same parent', async () => {
      const parentId = '507f1f77bcf86cd799439012';
      const mockParentCategory = {
        _id: new mongoose.Types.ObjectId(parentId),
        name: 'Parent Category',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['Parent Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const existingCategory = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439014'),
        name: 'Test Category',
        parentId: new mongoose.Types.ObjectId(parentId),
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 1,
        path: ['Parent Category', 'Test Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(mockParentCategory);
      mockCategoryRepository.findOne.mockResolvedValue(existingCategory);

      await expect(
        categoryService.createCategory({ ...mockCategoryData, parentId: new mongoose.Types.ObjectId(parentId) }, mockUserId)
      ).rejects.toThrow('Category with this name already exists at this level');
    });

    it('should handle repository errors during creation', async () => {
      const mockError = new Error('Repository error');
      mockCategoryRepository.findById.mockResolvedValue(null);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockRejectedValue(mockError);

      await expect(
        categoryService.createCategory(mockCategoryData, mockUserId)
      ).rejects.toThrow('Repository error');
    });
  });

  describe('getCategoryById', () => {
    const mockUserId = '507f1f77bcf86cd799439011';
    const mockCategoryId = '507f1f77bcf86cd799439012';

    it('should get category by ID successfully', async () => {
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(mockCategoryId),
        name: 'Test Category',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await categoryService.getCategoryById(mockCategoryId, mockUserId);

      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(mockCategoryId);
    });

    it('should throw error when category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(
        categoryService.getCategoryById(mockCategoryId, mockUserId)
      ).rejects.toThrow('Category not found');
    });

    it('should throw error when category belongs to different user', async () => {
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(mockCategoryId),
        name: 'Test Category',
        userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), // Different user
        level: 0,
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);

      await expect(
        categoryService.getCategoryById(mockCategoryId, mockUserId)
      ).rejects.toThrow('Access denied');
    });

    it('should handle repository errors during retrieval', async () => {
      const mockError = new Error('Repository error');
      mockCategoryRepository.findById.mockRejectedValue(mockError);

      await expect(
        categoryService.getCategoryById(mockCategoryId, mockUserId)
      ).rejects.toThrow('Repository error');
    });
  });

  describe('updateCategory', () => {
    const mockUserId = '507f1f77bcf86cd799439011';
    const mockCategoryId = '507f1f77bcf86cd799439012';

    it('should update category successfully', async () => {
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(mockCategoryId),
        name: 'Test Category',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const updateData = { name: 'Updated Category' };
      const mockUpdatedCategory = { ...mockCategory, ...updateData };

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.updateById.mockResolvedValue(mockUpdatedCategory);

      const result = await categoryService.updateCategory(mockCategoryId, updateData, mockUserId);

      expect(result).toEqual(mockUpdatedCategory);
      expect(mockCategoryRepository.updateById).toHaveBeenCalledWith(mockCategoryId, updateData, { new: true, runValidators: true });
    });

    it('should throw error when category not found during update', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(
        categoryService.updateCategory(mockCategoryId, { name: 'Updated' }, mockUserId)
      ).rejects.toThrow('Category not found');
    });

    it('should throw error when category belongs to different user during update', async () => {
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(mockCategoryId),
        name: 'Test Category',
        userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), // Different user
        level: 0,
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);

      await expect(
        categoryService.updateCategory(mockCategoryId, { name: 'Updated' }, mockUserId)
      ).rejects.toThrow('Access denied');
    });

    it('should throw error when updated name conflicts with existing category under new parent', async () => {
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(mockCategoryId),
        name: 'Test Category',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['Test Category'],
        parentId: null,
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const newParentId = '507f1f77bcf86cd799439014';
      const newParentCategory = {
        _id: new mongoose.Types.ObjectId(newParentId),
        name: 'New Parent',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['New Parent'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const existingCategory = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439015'),
        name: 'Updated Category',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 1,
        path: ['New Parent', 'Updated Category'],
        parentId: new mongoose.Types.ObjectId(newParentId),
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById
        .mockResolvedValueOnce(mockCategory) // First call for existing category
        .mockResolvedValueOnce(newParentCategory); // Second call for new parent
      mockCategoryRepository.findOne.mockResolvedValue(existingCategory);

      await expect(
        categoryService.updateCategory(mockCategoryId, { 
          name: 'Updated Category', 
          parentId: new mongoose.Types.ObjectId(newParentId) 
        }, mockUserId)
      ).rejects.toThrow('Category with this name already exists at this level');
    });

    it('should handle repository errors during update', async () => {
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(mockCategoryId),
        name: 'Test Category',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const mockError = new Error('Repository error');
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.updateById.mockRejectedValue(mockError);

      await expect(
        categoryService.updateCategory(mockCategoryId, { name: 'Updated' }, mockUserId)
      ).rejects.toThrow('Repository error');
    });
  });

  describe('deleteCategory', () => {
    const mockUserId = '507f1f77bcf86cd799439011';
    const mockCategoryId = '507f1f77bcf86cd799439012';

    it('should delete category successfully', async () => {
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(mockCategoryId),
        name: 'Test Category',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.updateById.mockResolvedValue(mockCategory);

      await categoryService.deleteCategory(mockCategoryId, mockUserId);

      expect(mockCategoryRepository.updateById).toHaveBeenCalledWith(mockCategoryId, {
        isActive: false,
        deletedAt: expect.any(Date),
      });
    });

    it('should throw error when category not found during deletion', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(
        categoryService.deleteCategory(mockCategoryId, mockUserId)
      ).rejects.toThrow('Category not found');
    });

    it('should throw error when category belongs to different user during deletion', async () => {
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(mockCategoryId),
        name: 'Test Category',
        userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), // Different user
        level: 0,
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);

      await expect(
        categoryService.deleteCategory(mockCategoryId, mockUserId)
      ).rejects.toThrow('Access denied');
    });

    it('should throw error when trying to delete system category', async () => {
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(mockCategoryId),
        name: 'System Category',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['System Category'],
        isActive: true,
        isSystem: true, // System category
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);

      await expect(
        categoryService.deleteCategory(mockCategoryId, mockUserId)
      ).rejects.toThrow('System categories cannot be deleted');
    });

    it('should throw error when category has child categories', async () => {
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(mockCategoryId),
        name: 'Parent Category',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['Parent Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const childCategory = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439014'),
        name: 'Child Category',
        parentId: new mongoose.Types.ObjectId(mockCategoryId),
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 1,
        path: ['Parent Category', 'Child Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockCategoryRepository.findOne.mockResolvedValue(childCategory);

      await expect(
        categoryService.deleteCategory(mockCategoryId, mockUserId)
      ).rejects.toThrow('Cannot delete category with subcategories. Please delete subcategories first.');
    });

    it('should handle repository errors during deletion', async () => {
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(mockCategoryId),
        name: 'Test Category',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const mockError = new Error('Repository error');
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.updateById.mockRejectedValue(mockError);

      await expect(
        categoryService.deleteCategory(mockCategoryId, mockUserId)
      ).rejects.toThrow('Repository error');
    });
  });

  describe('getUserCategories', () => {
    const mockUserId = '507f1f77bcf86cd799439011';

    it('should get user categories successfully', async () => {
      const mockCategories = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Category 1',
          userId: new mongoose.Types.ObjectId(mockUserId),
          level: 0,
          path: ['Category 1'],
          isActive: true,
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Category 2',
          userId: new mongoose.Types.ObjectId(mockUserId),
          level: 0,
          path: ['Category 2'],
          isActive: true,
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any[];

      const mockResult = {
        categories: mockCategories,
        total: 2,
        page: 1,
        totalPages: 1,
      };

      mockCategoryRepository.count.mockResolvedValue(2);
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await categoryService.getUserCategories(mockUserId, {});

      expect(result).toEqual(mockResult);
      expect(mockCategoryRepository.count).toHaveBeenCalledWith(
        { userId: new mongoose.Types.ObjectId(mockUserId) }
      );
      expect(mockCategoryRepository.find).toHaveBeenCalledWith(
        { userId: new mongoose.Types.ObjectId(mockUserId) },
        {
          skip: 0,
          limit: 20,
          sort: { level: 1, name: 1 },
        }
      );
    });

    it('should handle custom pagination parameters', async () => {
      const mockCategories: any[] = [];
      const mockResult = {
        categories: mockCategories,
        total: 0,
        page: 2,
        totalPages: 0,
      };

      mockCategoryRepository.count.mockResolvedValue(0);
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await categoryService.getUserCategories(mockUserId, {
        page: 2,
        limit: 5,
      });

      expect(result).toEqual(mockResult);
      expect(mockCategoryRepository.count).toHaveBeenCalledWith(
        { userId: new mongoose.Types.ObjectId(mockUserId) }
      );
      expect(mockCategoryRepository.find).toHaveBeenCalledWith(
        { userId: new mongoose.Types.ObjectId(mockUserId) },
        {
          skip: 5,
          limit: 5,
          sort: { level: 1, name: 1 },
        }
      );
    });

    it('should handle repository errors during retrieval', async () => {
      const mockError = new Error('Repository error');
      mockCategoryRepository.count.mockRejectedValue(mockError);

      await expect(
        categoryService.getUserCategories(mockUserId, {})
      ).rejects.toThrow('Repository error');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    const mockUserId = '507f1f77bcf86cd799439011';

    it('should handle empty category data', async () => {
      const mockCreatedCategory = {
        _id: new mongoose.Types.ObjectId(),
        name: '',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: [''],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(null);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue(mockCreatedCategory);

      const result = await categoryService.createCategory({ name: '' }, mockUserId);

      expect(result).toEqual(mockCreatedCategory);
    });

    it('should handle null values in category data', async () => {
      const mockCreatedCategory = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Category',
        description: undefined,
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(null);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue(mockCreatedCategory);

      const result = await categoryService.createCategory(
        { name: 'Test Category', description: undefined },
        mockUserId
      );

      expect(result).toEqual(mockCreatedCategory);
    });

    it('should handle undefined values in category data', async () => {
      const mockCreatedCategory = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Category',
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCategoryRepository.findById.mockResolvedValue(null);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue(mockCreatedCategory);

      const result = await categoryService.createCategory(
        { name: 'Test Category', description: undefined },
        mockUserId
      );

      expect(result).toEqual(mockCreatedCategory);
    });

    it('should handle invalid ObjectId strings gracefully', async () => {
      await expect(
        categoryService.getCategoryById('invalid-id', mockUserId)
      ).rejects.toThrow();
    });

    it('should handle database connection errors', async () => {
      const mockError = new Error('Database connection failed');
      mockCategoryRepository.findById.mockRejectedValue(mockError);

      await expect(
        categoryService.getCategoryById('507f1f77bcf86cd799439011', mockUserId)
      ).rejects.toThrow('Database connection failed');
    });
  });
});
