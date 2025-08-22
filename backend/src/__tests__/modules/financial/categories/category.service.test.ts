import mongoose from 'mongoose';
import { CategoryService } from '../../../../modules/financial/categories/service/category.service';
import { CategoryRepository } from '../../../../modules/financial/categories/repositories/category.repository';
import { Category } from '../../../../modules/financial/categories/models/category.model';
import { ICategory } from '../../../../modules/financial/categories/interfaces/category.interface';

// Mock the CategoryRepository
jest.mock('../../../../modules/financial/categories/repositories/category.repository');

// Helper function to properly type category with ObjectId
const createTypedCategory = (category: any): ICategory & { _id: mongoose.Types.ObjectId } => {
  return {
    ...category.toObject(),
    _id: category._id as mongoose.Types.ObjectId,
  } as ICategory & { _id: mongoose.Types.ObjectId };
};

describe('Category Service', () => {
  let categoryService: CategoryService;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;
  let testUserId: mongoose.Types.ObjectId;
  let testCategory: ICategory & { _id: mongoose.Types.ObjectId };

  beforeAll(async () => {
    testUserId = new mongoose.Types.ObjectId();
  });

  beforeEach(async () => {
    await Category.deleteMany({});
    
    // Create a test category
    const createdCategory = await Category.create({
      name: 'Test Category',
      userId: testUserId,
      isActive: true,
    });

    // Create a properly typed test category
    testCategory = createTypedCategory(createdCategory);

    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock repository
    mockCategoryRepository = {
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findByUserId: jest.fn(),
      findRootCategories: jest.fn(),
      findByParentId: jest.fn(),
      getCategoryTree: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      exists: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(),
    } as any;

    // Mock the CategoryRepository constructor
    (CategoryRepository as jest.MockedClass<typeof CategoryRepository>).mockImplementation(() => mockCategoryRepository);
    
    categoryService = new CategoryService();
  });

  afterAll(async () => {
    await Category.deleteMany({});
  });

  describe('createCategory', () => {
    it('should create a new category successfully', async () => {
      const categoryData = {
        name: 'New Category',
        description: 'A new category',
        color: '#FF0000',
        icon: 'star',
      };

      const expectedCategory = {
        _id: new mongoose.Types.ObjectId(),
        ...categoryData,
        userId: testUserId,
        level: 0,
        path: ['New Category'],
        isActive: true,
        isSystem: false,
      };

      mockCategoryRepository.findById.mockResolvedValue(null);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue(expectedCategory as ICategory);

      const result = await categoryService.createCategory(categoryData, testUserId.toString());

      expect(result).toEqual(expectedCategory);
      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        ...categoryData,
        userId: testUserId,
        level: 0,
        path: ['New Category'],
        isActive: true,
        isSystem: false,
      });
    });

    it('should create a category with parent successfully', async () => {
      const parentId = new mongoose.Types.ObjectId();
      const categoryData = {
        name: 'Child Category',
        parentId: parentId,
      };

      const parentCategory = {
        _id: parentId,
        userId: testUserId,
        level: 0,
        path: [] as string[],
        name: 'Parent',
        isActive: true,
        isSystem: false,
      } as any;

      const expectedCategory = {
        _id: new mongoose.Types.ObjectId(),
        ...categoryData,
        userId: testUserId,
        level: 1,
        path: ['Parent', 'Child Category'],
        isActive: true,
        isSystem: false,
      };

      mockCategoryRepository.findById.mockResolvedValue(parentCategory);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue(expectedCategory as ICategory);

      const result = await categoryService.createCategory(categoryData, testUserId.toString());

      expect(result).toEqual(expectedCategory);
      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        ...categoryData,
        userId: testUserId,
        level: 1,
        path: ['Parent', 'Child Category'],
        isActive: true,
        isSystem: false,
      });
    });

    it('should throw error when parent category not found', async () => {
      const categoryData = {
        name: 'Child Category',
        parentId: new mongoose.Types.ObjectId(),
      };

      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(categoryService.createCategory(categoryData, testUserId.toString()))
        .rejects.toThrow('Parent category not found or access denied');
    });

    it('should throw error when parent category belongs to different user', async () => {
      const parentId = new mongoose.Types.ObjectId();
      const categoryData = {
        name: 'Child Category',
        parentId: parentId,
      };

      const parentCategory = {
        _id: parentId,
        userId: new mongoose.Types.ObjectId(), // Different user
        level: 0,
        path: ['Parent'],
      } as ICategory;

      mockCategoryRepository.findById.mockResolvedValue(parentCategory);

      await expect(categoryService.createCategory(categoryData, testUserId.toString()))
        .rejects.toThrow('Parent category not found or access denied');
    });

    it('should throw error when duplicate category name exists at same level', async () => {
      const categoryData = {
        name: 'Duplicate Name',
      };

      const existingCategory = {
        _id: new mongoose.Types.ObjectId(),
        userId: testUserId,
        name: 'Duplicate Name',
      } as ICategory;

      mockCategoryRepository.findById.mockResolvedValue(null);
      mockCategoryRepository.findOne.mockResolvedValue(existingCategory);

      await expect(categoryService.createCategory(categoryData, testUserId.toString()))
        .rejects.toThrow('Category with this name already exists at this level');
    });

    it('should handle errors during creation', async () => {
      const categoryData = { name: 'Error Category' };
      const error = new Error('Database error');

      mockCategoryRepository.findById.mockResolvedValue(null);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockRejectedValue(error);

      await expect(categoryService.createCategory(categoryData, testUserId.toString()))
        .rejects.toThrow('Database error');
    });
  });

  describe('getCategoryById', () => {
    it('should get category by ID successfully', async () => {
      mockCategoryRepository.findById.mockResolvedValue(testCategory);

      const result = await categoryService.getCategoryById(testCategory._id.toString(), testUserId.toString());

      expect(result).toEqual(testCategory);
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(testCategory._id.toString());
    });

    it('should throw error when category not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(categoryService.getCategoryById(nonExistentId.toString(), testUserId.toString()))
        .rejects.toThrow('Category not found');
    });

    it('should throw error when category belongs to different user', async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      const otherUserCategory = {
        ...testCategory,
        userId: otherUserId,
      } as ICategory;

      mockCategoryRepository.findById.mockResolvedValue(otherUserCategory);

      await expect(categoryService.getCategoryById(testCategory._id.toString(), testUserId.toString()))
        .rejects.toThrow('Access denied');
    });

    it('should handle errors during retrieval', async () => {
      const error = new Error('Database error');
      mockCategoryRepository.findById.mockRejectedValue(error);

      await expect(categoryService.getCategoryById(testCategory._id.toString(), testUserId.toString()))
        .rejects.toThrow('Database error');
    });
  });

  describe('getUserCategories', () => {
    it('should get user categories successfully', async () => {
      const categories = [testCategory];
      mockCategoryRepository.find.mockResolvedValue(categories);
      mockCategoryRepository.count.mockResolvedValue(1);

      const result = await categoryService.getUserCategories(testUserId.toString());

      expect(result.categories).toEqual(categories);
      expect(mockCategoryRepository.find).toHaveBeenCalled();
    });

    it('should handle errors during retrieval', async () => {
      const error = new Error('Database error');
      mockCategoryRepository.find.mockRejectedValue(error);

      await expect(categoryService.getUserCategories(testUserId.toString()))
        .rejects.toThrow('Database error');
    });
  });

  describe('getCategoryTree', () => {
    it('should get category tree successfully', async () => {
      const tree = [
        {
          _id: testCategory._id,
          name: 'Test Category',
          children: [],
        },
      ];
      mockCategoryRepository.getCategoryTree.mockResolvedValue(tree);

      const result = await categoryService.getCategoryTree(testUserId.toString());

      expect(result).toEqual(tree);
      expect(mockCategoryRepository.getCategoryTree).toHaveBeenCalledWith(testUserId.toString());
    });

    it('should handle errors during tree generation', async () => {
      const error = new Error('Database error');
      mockCategoryRepository.getCategoryTree.mockRejectedValue(error);

      await expect(categoryService.getCategoryTree(testUserId.toString()))
        .rejects.toThrow('Database error');
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
      };

      const updatedCategory = {
        ...testCategory,
        ...updateData,
      } as ICategory;

      mockCategoryRepository.findById.mockResolvedValue(testCategory);
      mockCategoryRepository.updateById.mockResolvedValue(updatedCategory);

      const result = await categoryService.updateCategory(
        testCategory._id.toString(),
        updateData,
        testUserId.toString()
      );

      expect(result).toEqual(updatedCategory);
      expect(mockCategoryRepository.updateById).toHaveBeenCalledWith(
        testCategory._id.toString(),
        updateData,
        { new: true, runValidators: true }
      );
    });

    it('should throw error when category not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(categoryService.updateCategory(
        nonExistentId.toString(),
        { name: 'Updated' },
        testUserId.toString()
      )).rejects.toThrow('Category not found');
    });

    it('should throw error when category belongs to different user', async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      const otherUserCategory = {
        ...testCategory,
        userId: otherUserId,
      } as ICategory;

      mockCategoryRepository.findById.mockResolvedValue(otherUserCategory);

      await expect(categoryService.updateCategory(
        testCategory._id.toString(),
        { name: 'Updated' },
        testUserId.toString()
      )).rejects.toThrow('Access denied');
    });

    it('should handle errors during update', async () => {
      const error = new Error('Database error');
      mockCategoryRepository.findById.mockResolvedValue(testCategory);
      mockCategoryRepository.updateById.mockRejectedValue(error);

      await expect(categoryService.updateCategory(
        testCategory._id.toString(),
        { name: 'Updated' },
        testUserId.toString()
      )).rejects.toThrow('Database error');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      mockCategoryRepository.findById.mockResolvedValue(testCategory);
      mockCategoryRepository.deleteById.mockResolvedValue(testCategory);
      mockCategoryRepository.findByParentId.mockResolvedValue([]);

      await categoryService.deleteCategory(testCategory._id.toString(), testUserId.toString());

      expect(mockCategoryRepository.updateById).toHaveBeenCalledWith(testCategory._id.toString(), {
        isActive: false,
        deletedAt: expect.any(Date),
      });
    });

    it('should throw error when category not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(categoryService.deleteCategory(nonExistentId.toString(), testUserId.toString()))
        .rejects.toThrow('Category not found');
    });

    it('should throw error when category belongs to different user', async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      const otherUserCategory = {
        ...testCategory,
        userId: otherUserId,
      } as ICategory;

      mockCategoryRepository.findById.mockResolvedValue(otherUserCategory);

      await expect(categoryService.deleteCategory(testCategory._id.toString(), testUserId.toString()))
        .rejects.toThrow('Access denied');
    });

    it('should throw error when category has subcategories', async () => {
      const subcategories = [{
        _id: new mongoose.Types.ObjectId(),
        name: 'Subcategory',
        userId: testUserId,
        level: 1,
        path: ['Test Category', 'Subcategory'],
        isActive: true,
        isSystem: false,
      } as ICategory];
      mockCategoryRepository.findById.mockResolvedValue(testCategory);
      mockCategoryRepository.findOne.mockResolvedValue(subcategories[0]);

      await expect(categoryService.deleteCategory(testCategory._id.toString(), testUserId.toString()))
        .rejects.toThrow('Cannot delete category with subcategories');
    });

    it('should handle errors during deletion', async () => {
      const error = new Error('Database error');
      mockCategoryRepository.findById.mockResolvedValue(testCategory);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.updateById.mockRejectedValue(error);

      await expect(categoryService.deleteCategory(testCategory._id.toString(), testUserId.toString()))
        .rejects.toThrow('Database error');
    });
  });

  describe('bulkCreateCategories', () => {
    it('should bulk create categories successfully', async () => {
      const categoriesData = [
        { name: 'Category 1' },
        { name: 'Category 2' },
      ];

      const createdCategories = categoriesData.map((data, index) => ({
        _id: new mongoose.Types.ObjectId(),
        ...data,
        userId: testUserId,
        level: 0,
        path: [data.name],
        isActive: true,
        isSystem: false,
      }));

      mockCategoryRepository.findById.mockResolvedValue(null);
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create
        .mockResolvedValueOnce(createdCategories[0] as ICategory)
        .mockResolvedValueOnce(createdCategories[1] as ICategory);

      const result = await categoryService.bulkCreateCategories(categoriesData, testUserId.toString());

      expect(result).toHaveLength(2);
      expect(mockCategoryRepository.create).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures during bulk creation', async () => {
      const categoriesData = [
        { name: 'Category 1' },
        { name: 'Category 2' },
      ];

      const createdCategory = {
        _id: new mongoose.Types.ObjectId(),
        ...categoriesData[0],
        userId: testUserId,
        level: 0,
        path: [categoriesData[0].name],
        isActive: true,
        isSystem: false,
      };

      mockCategoryRepository.findById.mockResolvedValue(null);
      mockCategoryRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          _id: new mongoose.Types.ObjectId(),
          name: 'Category 2',
          userId: testUserId,
          level: 0,
          path: ['Category 2'],
          isActive: true,
          isSystem: false,
        } as ICategory); // Duplicate
      mockCategoryRepository.create.mockResolvedValue(createdCategory as ICategory);

      const result = await categoryService.bulkCreateCategories(categoriesData, testUserId.toString());

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Category 1');
    });
  });

  describe('getCategoryStats', () => {
    it('should get category stats successfully', async () => {
      const stats = {
        totalCategories: 5,
        activeCategories: 4,
        rootCategories: 2,
        maxDepth: 1,
        categoriesByLevel: { 0: 2, 1: 3 },
      };

      mockCategoryRepository.count
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(4) // active
        .mockResolvedValueOnce(2); // root

      mockCategoryRepository.findOne.mockResolvedValue({ level: 1 } as any);
      mockCategoryRepository.aggregate.mockResolvedValue([
        { _id: 0, count: 2 },
        { _id: 1, count: 3 }
      ]);

      const result = await categoryService.getCategoryStats(testUserId.toString());

      expect(result.totalCategories).toBe(5);
      expect(result.activeCategories).toBe(4);
      expect(result.rootCategories).toBe(2);
    });

    it('should handle errors during stats retrieval', async () => {
      const error = new Error('Database error');
      mockCategoryRepository.count.mockRejectedValue(error);

      await expect(categoryService.getCategoryStats(testUserId.toString()))
        .rejects.toThrow('Database error');
    });
  });

  describe('Private Methods', () => {
    describe('calculateLevel', () => {
      it('should calculate level correctly for root category', async () => {
        const result = await (categoryService as any).calculateLevel(null);
        expect(result).toBe(0);
      });

      it('should calculate level correctly for child category', async () => {
        const parentId = new mongoose.Types.ObjectId();
        const parentCategory = {
          _id: parentId,
          level: 1,
        } as ICategory;

        mockCategoryRepository.findById.mockResolvedValue(parentCategory);

        const result = await (categoryService as any).calculateLevel(parentId.toString());
        expect(result).toBe(2);
      });
    });

    describe('calculatePath', () => {
      it('should calculate path correctly for root category', async () => {
        const result = await (categoryService as any).calculatePath(null);
        expect(result).toEqual([]);
      });

      it('should calculate path correctly for child category', async () => {
        const parentId = new mongoose.Types.ObjectId();
        const parentCategory = {
          _id: parentId,
          path: ['Parent'],
        } as ICategory;

        mockCategoryRepository.findById.mockResolvedValue(parentCategory);

        const result = await (categoryService as any).calculatePath(parentId.toString());
        expect(result).toEqual(['Parent']);
      });
    });
  });
});
