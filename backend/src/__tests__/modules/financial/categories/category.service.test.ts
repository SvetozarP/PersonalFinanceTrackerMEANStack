import mongoose from 'mongoose';
import { CategoryService } from '../../../../modules/financial/categories/service/category.service';
import { CategoryRepository } from '../../../../modules/financial/categories/repositories/category.repository';
import { ICategory } from '../../../../modules/financial/categories/interfaces/category.interface';

// Mock the CategoryRepository
jest.mock('../../../../modules/financial/categories/repositories/category.repository');
jest.mock('../../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const MockedCategoryRepository = CategoryRepository as jest.MockedClass<typeof CategoryRepository>;

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;

  const mockUserId = 'user123';
  const mockCategoryId = '507f1f77bcf86cd799439011';
  const mockParentId = '507f1f77bcf86cd799439012';

  const mockCategory = {
    _id: new mongoose.Types.ObjectId(mockCategoryId),
    name: 'Test Category',
    description: 'Test Description',
    color: '#FF0000',
    icon: 'test-icon',
    userId: new mongoose.Types.ObjectId(mockUserId),
    parentId: undefined,
    level: 0,
    path: ['Test Category'],
    isActive: true,
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ICategory;

  const mockParentCategory = {
    ...mockCategory,
    _id: new mongoose.Types.ObjectId(mockParentId),
    name: 'Parent Category',
    level: 0,
    path: ['Parent Category'],
  } as ICategory;

  const mockChildCategory = {
    ...mockCategory,
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
    name: 'Child Category',
    parentId: new mongoose.Types.ObjectId(mockParentId),
    level: 1,
    path: ['Parent Category', 'Child Category'],
  } as ICategory;

  beforeEach(() => {
    // Create a fresh instance of the service
    categoryService = new CategoryService();
    
    // Get the mocked repository instance
    mockCategoryRepository = (categoryService as any).categoryRepository;
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    const categoryData = {
      name: 'New Category',
      description: 'New Description',
      color: '#00FF00',
      icon: 'new-icon',
    };

    it('should create a category successfully without parent', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue(mockCategory);

      const result = await categoryService.createCategory(categoryData, mockUserId);

      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        userId: new mongoose.Types.ObjectId(mockUserId),
        parentId: null,
        name: categoryData.name,
      });
      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        ...categoryData,
        userId: new mongoose.Types.ObjectId(mockUserId),
        level: 0,
        path: [categoryData.name],
        isActive: true,
        isSystem: false,
      });
    });

    it('should create a category successfully with parent', async () => {
      const categoryDataWithParent = {
        ...categoryData,
        parentId: new mongoose.Types.ObjectId(mockParentId),
      };

      mockCategoryRepository.findById.mockResolvedValue(mockParentCategory);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue(mockChildCategory);

      const result = await categoryService.createCategory(categoryDataWithParent, mockUserId);

      expect(result).toEqual(mockChildCategory);
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(mockParentId);
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        userId: new mongoose.Types.ObjectId(mockUserId),
        parentId: new mongoose.Types.ObjectId(mockParentId),
        name: categoryData.name,
      });
    });

    it('should throw error when parent category not found', async () => {
      const categoryDataWithParent = {
        ...categoryData,
        parentId: new mongoose.Types.ObjectId(mockParentId),
      };

      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(
        categoryService.createCategory(categoryDataWithParent, mockUserId)
      ).rejects.toThrow('Parent category not found or access denied');
    });

    it('should throw error when parent category belongs to different user', async () => {
      const categoryDataWithParent = {
        ...categoryData,
        parentId: new mongoose.Types.ObjectId(mockParentId),
      };

      const differentUserParent = {
        ...mockParentCategory,
        userId: new mongoose.Types.ObjectId('different-user'),
      } as ICategory;

      mockCategoryRepository.findById.mockResolvedValue(differentUserParent);

      await expect(
        categoryService.createCategory(categoryDataWithParent, mockUserId)
      ).rejects.toThrow('Parent category not found or access denied');
    });

    it('should throw error when duplicate category name exists at same level', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      await expect(
        categoryService.createCategory(categoryData, mockUserId)
      ).rejects.toThrow('Category with this name already exists at this level');
    });

    it('should calculate correct level and path for nested category', async () => {
      const categoryDataWithParent = {
        ...categoryData,
        parentId: new mongoose.Types.ObjectId(mockParentId),
      };

      mockCategoryRepository.findById.mockResolvedValue(mockParentCategory);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue(mockChildCategory);

      await categoryService.createCategory(categoryDataWithParent, mockUserId);

      expect(mockCategoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 1,
          path: ['Parent Category', 'New Category'],
        })
      );
    });
  });

  describe('getCategoryById', () => {
    it('should get category by ID successfully', async () => {
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
      const differentUserCategory = {
        ...mockCategory,
        userId: new mongoose.Types.ObjectId('different-user'),
      } as ICategory;

      mockCategoryRepository.findById.mockResolvedValue(differentUserCategory);

      await expect(
        categoryService.getCategoryById(mockCategoryId, mockUserId)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('getUserCategories', () => {
    const defaultOptions = {
      parentId: undefined,
      level: undefined,
      isActive: undefined,
      search: undefined,
      page: 1,
      limit: 20,
    };

    it('should get user categories with default options', async () => {
      const mockResult = {
        categories: [mockCategory],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockCategoryRepository.count.mockResolvedValue(1);
      mockCategoryRepository.find.mockResolvedValue([mockCategory]);

      const result = await categoryService.getUserCategories(mockUserId);

      expect(result).toEqual(mockResult);
      expect(mockCategoryRepository.count).toHaveBeenCalledWith({
        userId: new mongoose.Types.ObjectId(mockUserId),
      });
      expect(mockCategoryRepository.find).toHaveBeenCalledWith(
        { userId: new mongoose.Types.ObjectId(mockUserId) },
        {
          skip: 0,
          limit: 20,
          sort: { level: 1, name: 1 },
        }
      );
    });

    it('should get user categories with custom options', async () => {
      const customOptions = {
        parentId: mockParentId,
        level: 1,
        isActive: true,
        search: 'test',
        page: 2,
        limit: 10,
      };

      const mockResult = {
        categories: [mockCategory],
        total: 1,
        page: 2,
        totalPages: 1,
      };

      mockCategoryRepository.count.mockResolvedValue(1);
      mockCategoryRepository.find.mockResolvedValue([mockCategory]);

      const result = await categoryService.getUserCategories(mockUserId, customOptions);

      expect(result).toEqual(mockResult);
      expect(mockCategoryRepository.count).toHaveBeenCalledWith({
        userId: new mongoose.Types.ObjectId(mockUserId),
        parentId: mockParentId,
        level: 1,
        isActive: true,
        $or: [
          { name: { $regex: 'test', $options: 'i' } },
          { description: { $regex: 'test', $options: 'i' } },
        ],
      });
      expect(mockCategoryRepository.find).toHaveBeenCalledWith(
        expect.any(Object),
        {
          skip: 10,
          limit: 10,
          sort: { level: 1, name: 1 },
        }
      );
    });

    it('should handle null parentId correctly', async () => {
      const options = { parentId: null as any };
      mockCategoryRepository.count.mockResolvedValue(1);
      mockCategoryRepository.find.mockResolvedValue([mockCategory]);

      await categoryService.getUserCategories(mockUserId, options);

      expect(mockCategoryRepository.count).toHaveBeenCalledWith({
        userId: new mongoose.Types.ObjectId(mockUserId),
        parentId: null,
      });
    });

    it('should calculate total pages correctly', async () => {
      mockCategoryRepository.count.mockResolvedValue(25);
      mockCategoryRepository.find.mockResolvedValue([mockCategory]);

      const result = await categoryService.getUserCategories(mockUserId, { limit: 10 });

      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10)
    });
  });

  describe('getCategoryTree', () => {
    it('should get category tree successfully', async () => {
      const mockTree = [
        {
          _id: mockCategory._id,
          name: mockCategory.name,
          children: [],
        },
      ];

      mockCategoryRepository.getCategoryTree.mockResolvedValue(mockTree);

      const result = await categoryService.getCategoryTree(mockUserId);

      expect(result).toEqual(mockTree);
      expect(mockCategoryRepository.getCategoryTree).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('updateCategory', () => {
    const updateData = {
      name: 'Updated Category',
      description: 'Updated Description',
    };

    it('should update category successfully', async () => {
      const updatedCategory = { ...mockCategory, ...updateData };
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockCategoryRepository.updateById.mockResolvedValue(updatedCategory as any);

      const result = await categoryService.updateCategory(mockCategoryId, updateData, mockUserId);

      expect(result).toEqual(updatedCategory);
      expect(mockCategoryRepository.updateById).toHaveBeenCalledWith(
        mockCategoryId,
        updateData,
        { new: true, runValidators: true }
      );
    });

    it('should throw error when updating system category', async () => {
      const systemCategory = { ...mockCategory, isSystem: true } as ICategory;
      mockCategoryRepository.findById.mockResolvedValue(systemCategory);

      await expect(
        categoryService.updateCategory(mockCategoryId, updateData, mockUserId)
      ).rejects.toThrow('System categories cannot be modified');
    });

    it('should validate parent category when changing parent', async () => {
      const updateDataWithParent = {
        ...updateData,
        parentId: new mongoose.Types.ObjectId('new-parent-id'),
      };

      mockCategoryRepository.findById
        .mockResolvedValueOnce(mockCategory) // First call for existing category
        .mockResolvedValueOnce(mockParentCategory); // Second call for new parent
      mockCategoryRepository.updateById.mockResolvedValue(mockCategory);

      await categoryService.updateCategory(mockCategoryId, updateDataWithParent, mockUserId);

      expect(mockCategoryRepository.findById).toHaveBeenCalledTimes(2);
    });

    it('should throw error when new parent not found', async () => {
      const updateDataWithParent = {
        ...updateData,
        parentId: new mongoose.Types.ObjectId('new-parent-id'),
      };

      mockCategoryRepository.findById
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(null);

      await expect(
        categoryService.updateCategory(mockCategoryId, updateDataWithParent, mockUserId)
      ).rejects.toThrow('Parent category not found or access denied');
    });

    it('should throw error when new parent belongs to different user', async () => {
      const updateDataWithParent = {
        ...updateData,
        parentId: new mongoose.Types.ObjectId('new-parent-id'),
      };

      const differentUserParent = {
        ...mockParentCategory,
        userId: new mongoose.Types.ObjectId('different-user'),
      } as ICategory;

      mockCategoryRepository.findById
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(differentUserParent);

      await expect(
        categoryService.updateCategory(mockCategoryId, updateDataWithParent, mockUserId)
      ).rejects.toThrow('Parent category not found or access denied');
    });

    it('should check for duplicate names under new parent', async () => {
      const updateDataWithParent = {
        ...updateData,
        parentId: new mongoose.Types.ObjectId('new-parent-id'),
      };

      mockCategoryRepository.findById
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(mockParentCategory);
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory); // Duplicate found

      await expect(
        categoryService.updateCategory(mockCategoryId, updateDataWithParent, mockUserId)
      ).rejects.toThrow('Category with this name already exists at this level');
    });

    it('should recalculate level and path when parent changes', async () => {
      const updateDataWithParent = {
        ...updateData,
        parentId: new mongoose.Types.ObjectId('new-parent-id'),
      };

      mockCategoryRepository.findById
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(mockParentCategory);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.updateById.mockResolvedValue(mockCategory);

      await categoryService.updateCategory(mockCategoryId, updateDataWithParent, mockUserId);

      expect(mockCategoryRepository.updateById).toHaveBeenCalledWith(
        mockCategoryId,
        expect.objectContaining({
          level: 1,
          path: ['Parent Category', 'Updated Category'],
        }),
        { new: true, runValidators: true }
      );
    });

    it('should throw error when update fails', async () => {
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockCategoryRepository.updateById.mockResolvedValue(null);

      await expect(
        categoryService.updateCategory(mockCategoryId, updateData, mockUserId)
      ).rejects.toThrow('Failed to update category');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockCategoryRepository.findOne.mockResolvedValue(null); // No children
      mockCategoryRepository.updateById.mockResolvedValue(mockCategory);

      await categoryService.deleteCategory(mockCategoryId, mockUserId);

      expect(mockCategoryRepository.updateById).toHaveBeenCalledWith(mockCategoryId, {
        isActive: false,
        deletedAt: expect.any(Date),
      });
    });

    it('should throw error when deleting system category', async () => {
      const systemCategory = { ...mockCategory, isSystem: true } as ICategory;
      mockCategoryRepository.findById.mockResolvedValue(systemCategory);

      await expect(
        categoryService.deleteCategory(mockCategoryId, mockUserId)
      ).rejects.toThrow('System categories cannot be deleted');
    });

    it('should throw error when category has children', async () => {
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockCategoryRepository.findOne.mockResolvedValue(mockChildCategory as any); // Has children

      await expect(
        categoryService.deleteCategory(mockCategoryId, mockUserId)
      ).rejects.toThrow('Cannot delete category with subcategories. Please delete subcategories first.');
    });
  });

  describe('bulkCreateCategories', () => {
    const categoriesData = [
      { name: 'Category 1', description: 'Description 1' },
      { name: 'Category 2', description: 'Description 2' },
    ];

    it('should create categories in bulk successfully', async () => {
      const createdCategories = [
        { ...mockCategory, name: 'Category 1' },
        { ...mockCategory, name: 'Category 2' },
      ];

      mockCategoryRepository.findOne.mockResolvedValue(null); // No duplicates
      mockCategoryRepository.create
        .mockResolvedValueOnce(createdCategories[0] as any)
        .mockResolvedValueOnce(createdCategories[1] as any);

      const result = await categoryService.bulkCreateCategories(categoriesData, mockUserId);

      expect(result).toEqual(createdCategories);
      expect(mockCategoryRepository.create).toHaveBeenCalledTimes(2);
    });

    it('should continue processing when some categories fail', async () => {
      const createdCategories = [{ ...mockCategory, name: 'Category 1' }];

      mockCategoryRepository.findOne
        .mockResolvedValueOnce(null) // First category succeeds
        .mockResolvedValueOnce(mockCategory); // Second category fails (duplicate)
      mockCategoryRepository.create.mockResolvedValueOnce(createdCategories[0] as any);

      const result = await categoryService.bulkCreateCategories(categoriesData, mockUserId);

      expect(result).toEqual(createdCategories);
      expect(result.length).toBe(1);
    });
  });

  describe('getCategoryStats', () => {
    it('should get category statistics successfully', async () => {
      const mockStats = {
        totalCategories: 10,
        activeCategories: 8,
        rootCategories: 3,
        maxDepth: 2,
        categoriesByLevel: { 0: 3, 1: 5, 2: 2 },
      };

      mockCategoryRepository.count
        .mockResolvedValueOnce(10) // totalCategories
        .mockResolvedValueOnce(8) // activeCategories
        .mockResolvedValueOnce(3); // rootCategories
      mockCategoryRepository.findOne.mockResolvedValue({ level: 2 } as any);
      mockCategoryRepository.aggregate.mockResolvedValue([
        { _id: 0, count: 3 },
        { _id: 1, count: 5 },
        { _id: 2, count: 2 },
      ]);

      const result = await categoryService.getCategoryStats(mockUserId);

      expect(result).toEqual(mockStats);
      expect(mockCategoryRepository.count).toHaveBeenCalledTimes(3);
      expect(mockCategoryRepository.aggregate).toHaveBeenCalledWith([
        { $match: { userId: new mongoose.Types.ObjectId(mockUserId) } },
        { $group: { _id: '$level', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);
    });

    it('should handle case when no categories exist', async () => {
      mockCategoryRepository.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.aggregate.mockResolvedValue([]);

      const result = await categoryService.getCategoryStats(mockUserId);

      expect(result.maxDepth).toBe(0);
      expect(result.categoriesByLevel).toEqual({});
    });
  });

  describe('Private helper methods', () => {
    describe('calculateLevel', () => {
      it('should calculate level correctly', async () => {
        mockCategoryRepository.findById.mockResolvedValue(mockParentCategory);

        const level = await (categoryService as any).calculateLevel(mockParentId);

        expect(level).toBe(1); // parent.level + 1
      });

      it('should return 0 when parent not found', async () => {
        mockCategoryRepository.findById.mockResolvedValue(null);

        const level = await (categoryService as any).calculateLevel(mockParentId);

        expect(level).toBe(0);
      });
    });

    describe('calculatePath', () => {
      it('should calculate path correctly', async () => {
        mockCategoryRepository.findById.mockResolvedValue(mockParentCategory);

        const path = await (categoryService as any).calculatePath(mockParentId);

        expect(path).toEqual(['Parent Category']);
      });

      it('should return empty array when parent not found', async () => {
        mockCategoryRepository.findById.mockResolvedValue(null);

        const path = await (categoryService as any).calculatePath(mockParentId);

        expect(path).toEqual([]);
      });
    });

    describe('wouldCreateCircularReference', () => {
      it('should detect circular reference', async () => {
        const parent1 = { ...mockParentCategory, parentId: new mongoose.Types.ObjectId('parent2') } as ICategory;
        const parent2 = { ...mockParentCategory, _id: new mongoose.Types.ObjectId('parent2'), parentId: new mongoose.Types.ObjectId(mockCategoryId) } as ICategory;

        mockCategoryRepository.findById
          .mockResolvedValueOnce(parent1)
          .mockResolvedValueOnce(parent2);

        const result = await (categoryService as any).wouldCreateCircularReference(
          mockCategoryId,
          mockParentId
        );

        expect(result).toBe(true);
      });

      it('should not detect circular reference when none exists', async () => {
        const parent1 = { ...mockParentCategory, parentId: undefined } as ICategory;

        mockCategoryRepository.findById.mockResolvedValue(parent1);

        const result = await (categoryService as any).wouldCreateCircularReference(
          mockCategoryId,
          mockParentId
        );

        expect(result).toBe(false);
      });
    });

    describe('updateChildPaths', () => {
      it('should update child paths recursively', async () => {
        const children = [mockChildCategory];
        const newParentPath = ['New Parent', 'New Category'];

        mockCategoryRepository.find.mockResolvedValue(children);
        mockCategoryRepository.updateById.mockResolvedValue(mockChildCategory);

        await (categoryService as any).updateChildPaths(mockCategoryId, newParentPath);

        expect(mockCategoryRepository.updateById).toHaveBeenCalledWith(
          mockChildCategory._id?.toString(),
          { path: ['New Parent', 'New Category', 'Child Category'] }
        );
      });
    });
  });
});
