import { CategoryService } from '../../../../modules/financial/categories/service/category.service';
import { CategoryRepository } from '../../../../modules/financial/categories/repositories/category.repository';
import { ICategory } from '../../../../modules/financial/categories/interfaces/category.interface';
import mongoose from 'mongoose';

// Mock the category repository
jest.mock(
  '../../../../modules/financial/categories/repositories/category.repository'
);
// Mock the logger service
jest.mock('../../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const MockedCategoryRepository = CategoryRepository as jest.MockedClass<
  typeof CategoryRepository
>;

describe('Category Service', () => {
  let categoryService: CategoryService;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;
  const mockUserId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryRepository =
      new MockedCategoryRepository() as jest.Mocked<CategoryRepository>;
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
    mockCategoryRepository.getCategoryTree.mockResolvedValue([]);
    mockCategoryRepository.aggregate.mockResolvedValue([]);
  });

  describe('createCategory', () => {
    const mockCategoryData = {
      name: 'Test Category',
      description: 'Test Description',
      color: '#FF0000',
      icon: 'test-icon',
    };

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

      const result = await categoryService.createCategory(
        mockCategoryData,
        mockUserId
      );

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
        {
          ...mockCategoryData,
          parentId: new mongoose.Types.ObjectId(parentId),
        },
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
        categoryService.createCategory(
          { ...mockCategoryData, parentId: 'invalid-id' as any },
          mockUserId
        )
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
        categoryService.createCategory(
          {
            ...mockCategoryData,
            parentId: new mongoose.Types.ObjectId(parentId),
          },
          mockUserId
        )
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
        categoryService.createCategory(
          {
            ...mockCategoryData,
            parentId: new mongoose.Types.ObjectId(parentId),
          },
          mockUserId
        )
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

      const result = await categoryService.getCategoryById(
        mockCategoryId,
        mockUserId
      );

      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(
        mockCategoryId
      );
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

      const result = await categoryService.updateCategory(
        mockCategoryId,
        updateData,
        mockUserId
      );

      expect(result).toEqual(mockUpdatedCategory);
      expect(mockCategoryRepository.updateById).toHaveBeenCalledWith(
        mockCategoryId,
        updateData,
        { new: true, runValidators: true }
      );
    });

    it('should throw error when category not found during update', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(
        categoryService.updateCategory(
          mockCategoryId,
          { name: 'Updated' },
          mockUserId
        )
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
        categoryService.updateCategory(
          mockCategoryId,
          { name: 'Updated' },
          mockUserId
        )
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
        categoryService.updateCategory(
          mockCategoryId,
          {
            name: 'Updated Category',
            parentId: new mongoose.Types.ObjectId(newParentId),
          },
          mockUserId
        )
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
        categoryService.updateCategory(
          mockCategoryId,
          { name: 'Updated' },
          mockUserId
        )
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

      expect(mockCategoryRepository.updateById).toHaveBeenCalledWith(
        mockCategoryId,
        {
          isActive: false,
          deletedAt: expect.any(Date),
        }
      );
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
      ).rejects.toThrow(
        'Cannot delete category with subcategories. Please delete subcategories first.'
      );
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
        { _id: new mongoose.Types.ObjectId(), name: 'Category 1' },
        { _id: new mongoose.Types.ObjectId(), name: 'Category 2' },
      ] as any;

      mockCategoryRepository.count.mockResolvedValue(2);
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await categoryService.getUserCategories(mockUserId);

      expect(result.categories).toEqual(mockCategories);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle custom pagination parameters', async () => {
      const mockCategories = [
        { _id: new mongoose.Types.ObjectId(), name: 'Category 1' },
      ] as any;

      mockCategoryRepository.count.mockResolvedValue(25);
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await categoryService.getUserCategories(mockUserId, {
        page: 2,
        limit: 10,
      });

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should handle parentId filtering when parentId is null', async () => {
      const mockCategories = [
        { _id: new mongoose.Types.ObjectId(), name: 'Root Category' },
      ] as any;

      mockCategoryRepository.count.mockResolvedValue(1);
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await categoryService.getUserCategories(mockUserId, {
        parentId: '',
      });

      expect(result.categories).toEqual(mockCategories);
      expect(mockCategoryRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: new mongoose.Types.ObjectId(mockUserId),
          parentId: null,
        })
      );
    });

    it('should handle parentId filtering when parentId is undefined', async () => {
      const mockCategories = [
        { _id: new mongoose.Types.ObjectId(), name: 'Any Category' },
      ] as any;

      mockCategoryRepository.count.mockResolvedValue(1);
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await categoryService.getUserCategories(mockUserId, {
        parentId: undefined,
      });

      expect(result.categories).toEqual(mockCategories);
      expect(mockCategoryRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: new mongoose.Types.ObjectId(mockUserId),
        })
      );
    });

    it('should handle level filtering', async () => {
      const mockCategories = [
        { _id: new mongoose.Types.ObjectId(), name: 'Level 1 Category' },
      ] as any;

      mockCategoryRepository.count.mockResolvedValue(1);
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await categoryService.getUserCategories(mockUserId, {
        level: 1,
      });

      expect(result.categories).toEqual(mockCategories);
      expect(mockCategoryRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({ level: 1 })
      );
    });

    it('should handle isActive filtering', async () => {
      const mockCategories = [
        { _id: new mongoose.Types.ObjectId(), name: 'Active Category' },
      ] as any;

      mockCategoryRepository.count.mockResolvedValue(1);
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await categoryService.getUserCategories(mockUserId, {
        isActive: true,
      });

      expect(result.categories).toEqual(mockCategories);
      expect(mockCategoryRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true })
      );
    });

    it('should handle search functionality', async () => {
      const mockCategories = [
        { _id: new mongoose.Types.ObjectId(), name: 'Food Category' },
      ] as any;

      mockCategoryRepository.count.mockResolvedValue(1);
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await categoryService.getUserCategories(mockUserId, {
        search: 'food',
      });

      expect(result.categories).toEqual(mockCategories);
      expect(mockCategoryRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { name: { $regex: 'food', $options: 'i' } },
            { description: { $regex: 'food', $options: 'i' } },
          ],
        })
      );
    });

    it('should handle search with description', async () => {
      const mockCategories = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Category',
          description: 'Food related',
        },
      ] as any;

      mockCategoryRepository.count.mockResolvedValue(1);
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await categoryService.getUserCategories(mockUserId, {
        search: 'food',
      });

      expect(result.categories).toEqual(mockCategories);
    });

    it('should handle case-insensitive search', async () => {
      const mockCategories = [
        { _id: new mongoose.Types.ObjectId(), name: 'FOOD Category' },
      ] as any;

      mockCategoryRepository.count.mockResolvedValue(1);
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await categoryService.getUserCategories(mockUserId, {
        search: 'food',
      });

      expect(result.categories).toEqual(mockCategories);
    });

    it('should handle repository errors during retrieval', async () => {
      const mockError = new Error('Database error');
      mockCategoryRepository.count.mockRejectedValue(mockError);

      await expect(
        categoryService.getUserCategories(mockUserId)
      ).rejects.toThrow('Database error');
    });

    it('should handle find repository errors during retrieval', async () => {
      mockCategoryRepository.count.mockResolvedValue(1);
      const mockError = new Error('Find error');
      mockCategoryRepository.find.mockRejectedValue(mockError);

      await expect(
        categoryService.getUserCategories(mockUserId)
      ).rejects.toThrow('Find error');
    });

    it('should handle edge case pagination values', async () => {
      // Test with page 1, limit 1
      mockCategoryRepository.count.mockResolvedValue(1);
      mockCategoryRepository.find.mockResolvedValue([{} as any]);

      const result1 = await categoryService.getUserCategories(mockUserId, {
        page: 1,
        limit: 1,
      });

      expect(result1.totalPages).toBe(1);

      // Test with page 1, limit 10, total 25
      mockCategoryRepository.count.mockResolvedValue(25);
      mockCategoryRepository.find.mockResolvedValue(Array(10).fill({} as any));

      const result2 = await categoryService.getUserCategories(mockUserId, {
        page: 1,
        limit: 10,
      });

      expect(result2.totalPages).toBe(3);
    });

    it('should handle zero total count', async () => {
      mockCategoryRepository.count.mockResolvedValue(0);
      mockCategoryRepository.find.mockResolvedValue([]);

      const result = await categoryService.getUserCategories(mockUserId);

      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.categories).toHaveLength(0);
    });

    it('should handle single page results', async () => {
      mockCategoryRepository.count.mockResolvedValue(5);
      mockCategoryRepository.find.mockResolvedValue(Array(5).fill({} as any));

      const result = await categoryService.getUserCategories(mockUserId, {
        page: 1,
        limit: 10,
      });

      expect(result.totalPages).toBe(1);
    });

    it('should handle multiple page results', async () => {
      mockCategoryRepository.count.mockResolvedValue(25);
      mockCategoryRepository.find.mockResolvedValue(Array(10).fill({} as any));

      const result = await categoryService.getUserCategories(mockUserId, {
        page: 1,
        limit: 10,
      });

      expect(result.totalPages).toBe(3);
    });

    it('should handle last page with remaining items', async () => {
      mockCategoryRepository.count.mockResolvedValue(25);
      mockCategoryRepository.find.mockResolvedValue(Array(5).fill({} as any));

      const result = await categoryService.getUserCategories(mockUserId, {
        page: 3,
        limit: 10,
      });

      expect(result.totalPages).toBe(3);
      expect(result.categories).toHaveLength(5);
    });
  });

  describe('getCategoryStats', () => {
    const mockUserId = '507f1f77bcf86cd799439011';

    it('should get category statistics successfully', async () => {
      const mockLevelGroups = [
        { _id: 0, count: 1 },
        { _id: 1, count: 1 },
      ];

      mockCategoryRepository.count
        .mockResolvedValueOnce(2) // totalCategories
        .mockResolvedValueOnce(2) // activeCategories
        .mockResolvedValueOnce(1); // rootCategories
      mockCategoryRepository.findOne.mockResolvedValue({
        level: 1,
        name: 'Test Category',
        path: ['Test Category'],
        isActive: true,
        isSystem: false,
        userId: new mongoose.Types.ObjectId(mockUserId),
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        description: '',
        color: '',
        icon: '',
        parentId: null,
        children: [],
        transactionCount: 0,
        totalAmount: 0,
        deletedAt: null,
      } as any);
      mockCategoryRepository.aggregate.mockResolvedValue(mockLevelGroups);

      const result = await categoryService.getCategoryStats(mockUserId);

      expect(result).toBeDefined();
      expect(result.totalCategories).toBe(2);
      expect(result.activeCategories).toBe(2);
      expect(result.maxDepth).toBe(1);
      expect(result.categoriesByLevel).toEqual({ 0: 1, 1: 1 });
    });

    it('should handle repository errors in getCategoryStats', async () => {
      const mockError = new Error('Repository error');
      mockCategoryRepository.count.mockRejectedValue(mockError);

      await expect(
        categoryService.getCategoryStats(mockUserId)
      ).rejects.toThrow('Repository error');
    });

    it('should handle empty categories gracefully', async () => {
      mockCategoryRepository.count
        .mockResolvedValueOnce(0) // totalCategories
        .mockResolvedValueOnce(0) // activeCategories
        .mockResolvedValueOnce(0); // rootCategories
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.aggregate.mockResolvedValue([]);

      const result = await categoryService.getCategoryStats(mockUserId);

      expect(result.totalCategories).toBe(0);
      expect(result.activeCategories).toBe(0);
      expect(result.maxDepth).toBe(0);
      expect(result.categoriesByLevel).toEqual({});
    });
  });

  describe('getCategoryTree', () => {
    const mockUserId = '507f1f77bcf86cd799439011';

    it('should get category tree successfully', async () => {
      const mockCategories = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Root Category',
          userId: new mongoose.Types.ObjectId(mockUserId),
          level: 0,
          parentId: null,
          path: ['Root Category'],
          isActive: true,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Child Category',
          userId: new mongoose.Types.ObjectId(mockUserId),
          level: 1,
          parentId: new mongoose.Types.ObjectId(),
          path: ['Root Category', 'Child Category'],
          isActive: true,
        },
      ] as any;

      mockCategoryRepository.getCategoryTree.mockResolvedValue(mockCategories);

      const result = await categoryService.getCategoryTree(mockUserId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('bulkCreateCategories', () => {
    const mockUserId = '507f1f77bcf86cd799439011';

    it('should bulk create categories successfully', async () => {
      const categoriesData = [
        { name: 'Category 1', description: 'First category' },
        { name: 'Category 2', description: 'Second category' },
      ];

      const mockCreatedCategories = categoriesData.map((data, index) => ({
        _id: new mongoose.Types.ObjectId(),
        ...data,
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: [data.name],
        isActive: true,
        isSystem: false,
      })) as any;

      mockCategoryRepository.create.mockResolvedValue(mockCreatedCategories[0]);
      mockCategoryRepository.findOne.mockResolvedValue(null);

      const result = await categoryService.bulkCreateCategories(
        categoriesData,
        mockUserId
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty category data', async () => {
      const emptyData = {};
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue({} as any);

      const result = await categoryService.createCategory(
        emptyData,
        mockUserId
      );

      expect(result).toBeDefined();
    });

    it('should handle null values in category data', async () => {
      const nullData = {
        name: undefined,
        description: undefined,
        parentId: undefined,
      };
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue({} as any);

      const result = await categoryService.createCategory(nullData, mockUserId);

      expect(result).toBeDefined();
    });

    it('should handle undefined values in category data', async () => {
      const undefinedData = {
        name: undefined,
        description: undefined,
        parentId: undefined,
      };
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue({} as any);

      const result = await categoryService.createCategory(
        undefinedData,
        mockUserId
      );

      expect(result).toBeDefined();
    });

    it('should handle invalid ObjectId strings gracefully', async () => {
      const invalidId = 'invalid-id';

      await expect(
        categoryService.getCategoryById(invalidId, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle database connection errors', async () => {
      const mockError = new Error('Connection failed');
      mockCategoryRepository.findById.mockRejectedValue(mockError);

      await expect(
        categoryService.getCategoryById('507f1f77bcf86cd799439011', mockUserId)
      ).rejects.toThrow('Connection failed');
    });

    it('should handle validation errors during creation', async () => {
      const mockError = new Error('Validation failed');
      mockCategoryRepository.create.mockRejectedValue(mockError);

      await expect(
        categoryService.createCategory({ name: 'Test' }, mockUserId)
      ).rejects.toThrow('Validation failed');
    });

    it('should handle validation errors during update', async () => {
      const mockError = new Error('Category not found');
      mockCategoryRepository.findById.mockRejectedValue(mockError);

      await expect(
        categoryService.updateCategory(
          '507f1f77bcf86cd799439011',
          { name: 'Updated' },
          mockUserId
        )
      ).rejects.toThrow('Category not found');
    });

    it('should handle validation errors during deletion', async () => {
      const mockError = new Error('Category not found');
      mockCategoryRepository.findById.mockRejectedValue(mockError);

      await expect(
        categoryService.deleteCategory('507f1f77bcf86cd799439011', mockUserId)
      ).rejects.toThrow('Category not found');
    });
  });
});
