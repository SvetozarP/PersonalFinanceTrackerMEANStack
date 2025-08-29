import mongoose from 'mongoose';
import { CategoryRepository } from '../../../../modules/financial/categories/repositories/category.repository';
import { Category } from '../../../../modules/financial/categories/models/category.model';
import { ICategory } from '../../../../modules/financial/categories/interfaces/category.interface';

// Mock the logger service
jest.mock('../../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Category Repository', () => {
  let categoryRepository: CategoryRepository;
  let testUserId: mongoose.Types.ObjectId;
  let testCategory: any;

  beforeAll(async () => {
    testUserId = new mongoose.Types.ObjectId();
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create the actual repository instance
    categoryRepository = new CategoryRepository();

    // Clear any existing test data
    await Category.deleteMany({});
  });

  afterEach(async () => {
    // Clean up test data
    await Category.deleteMany({});
  });

  describe('findByUserId', () => {
    it('should find categories by user ID', async () => {
      // Create test categories
      const category1 = await Category.create({
        name: 'Test Category 1',
        userId: testUserId,
        parentId: null,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      const category2 = await Category.create({
        name: 'Test Category 2',
        userId: testUserId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 1,
      });

      const categories = await categoryRepository.findByUserId(
        testUserId.toString()
      );

      expect(categories).toHaveLength(2);
      expect(categories[0].name).toBe('Test Category 1');
      expect(categories[1].name).toBe('Test Category 2');
    });

    it('should return empty array for non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();

      const categories = await categoryRepository.findByUserId(
        nonExistentUserId.toString()
      );

      expect(categories).toHaveLength(0);
    });

    it('should only return active categories', async () => {
      // Create active and inactive categories
      await Category.create({
        name: 'Active Category',
        userId: testUserId,
        parentId: null,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      await Category.create({
        name: 'Inactive Category',
        userId: testUserId,
        isActive: false,
        isSystem: false,
        path: [],
        level: 0,
      });

      const categories = await categoryRepository.findByUserId(
        testUserId.toString()
      );

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Active Category');
    });

    it('should sort categories by level and name', async () => {
      // Create categories in different order
      await Category.create({
        name: 'B Category',
        userId: testUserId,
        parentId: null,
        level: 0,
        isActive: true,
        isSystem: false,
        path: [],
      });

      await Category.create({
        name: 'A Category',
        userId: testUserId,
        parentId: null,
        level: 0,
        isActive: true,
        isSystem: false,
        path: [],
      });

      await Category.create({
        name: 'Level 1 Category',
        userId: testUserId,
        level: 1,
        isActive: true,
        isSystem: false,
        path: ['Parent'],
      });

      const categories = await categoryRepository.findByUserId(
        testUserId.toString()
      );

      expect(categories).toHaveLength(3);
      expect(categories[0].level).toBe(0);
      expect(categories[0].name).toBe('A Category');
      expect(categories[1].level).toBe(0);
      expect(categories[1].name).toBe('B Category');
      expect(categories[2].level).toBe(1);
    });
  });

  describe('findRootCategories', () => {
    it('should find root categories (no parent)', async () => {
      // Create root category
      const rootCategory = await Category.create({
        name: 'Root Category',
        userId: testUserId,
        parentId: null,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      await Category.create({
        name: 'Child Category',
        userId: testUserId,
        parentId: rootCategory._id,
        isActive: true,
        isSystem: false,
        path: ['Root Category'],
        level: 1,
      });

      const rootCategories = await categoryRepository.findRootCategories(
        testUserId.toString()
      );

      expect(rootCategories).toHaveLength(1);
      expect(rootCategories[0].name).toBe('Root Category');
      expect(rootCategories[0].parentId).toBeNull();
    });

    it('should return empty array for user with no root categories', async () => {
      const otherUserId = new mongoose.Types.ObjectId();

      const rootCategories = await categoryRepository.findRootCategories(
        otherUserId.toString()
      );

      expect(rootCategories).toHaveLength(0);
    });
  });

  describe('findByParentId', () => {
    it('should find categories by parent ID', async () => {
      // Create parent category first
      const parentCategory = await Category.create({
        name: 'Parent Category',
        userId: testUserId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      // Create child categories
      await Category.create({
        name: 'Child Category 1',
        userId: testUserId,
        parentId: parentCategory._id,
        isActive: true,
        isSystem: false,
        path: ['Parent Category'],
        level: 1,
      });

      await Category.create({
        name: 'Child Category 2',
        userId: testUserId,
        parentId: parentCategory._id,
        isActive: true,
        isSystem: false,
        path: ['Parent Category'],
        level: 1,
      });

      const childCategories = await categoryRepository.findByParentId(
        (parentCategory._id as mongoose.Types.ObjectId).toString(),
        testUserId.toString()
      );

      expect(childCategories).toHaveLength(2);
      expect(childCategories[0].name).toBe('Child Category 1');
      expect(childCategories[1].name).toBe('Child Category 2');
      expect(
        childCategories.every(
          cat =>
            cat.parentId?.toString() ===
            (parentCategory._id as mongoose.Types.ObjectId).toString()
        )
      ).toBe(true);
    });

    it('should return empty array for non-existent parent', async () => {
      const nonExistentParentId = new mongoose.Types.ObjectId();

      const childCategories = await categoryRepository.findByParentId(
        nonExistentParentId.toString(),
        testUserId.toString()
      );

      expect(childCategories).toHaveLength(0);
    });

    it('should only return categories for the specified user', async () => {
      const parentId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();

      // Create child category for other user
      await Category.create({
        name: 'Other User Child',
        userId: otherUserId,
        parentId: parentId,
        isActive: true,
        isSystem: false,
        path: ['Parent Category'],
        level: 1,
      });

      const childCategories = await categoryRepository.findByParentId(
        parentId.toString(),
        testUserId.toString()
      );

      expect(childCategories).toHaveLength(0);
    });
  });

  describe('getCategoryTree', () => {
    it('should get category tree structure', async () => {
      // Mock the model's getCategoryTree method
      const mockTree = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Test Category',
          children: [],
        },
      ];

      jest
        .spyOn(categoryRepository['model'], 'getCategoryTree')
        .mockResolvedValue(mockTree as any);

      const tree = await categoryRepository.getCategoryTree(
        testUserId.toString()
      );

      expect(tree).toEqual(mockTree);
      expect(categoryRepository['model'].getCategoryTree).toHaveBeenCalledWith(
        testUserId.toString()
      );
    });

    it('should handle errors when getting category tree', async () => {
      const error = new Error('Database error');

      jest
        .spyOn(categoryRepository['model'], 'getCategoryTree')
        .mockRejectedValue(error);

      await expect(
        categoryRepository.getCategoryTree(testUserId.toString())
      ).rejects.toThrow('Database error');
    });
  });

  describe('getCategoryPath', () => {
    it('should get category path', async () => {
      // Mock the model's getCategoryPath method
      const mockPath = {
        id: new mongoose.Types.ObjectId(),
        name: 'Test Category',
        path: ['Parent', 'Child'],
        fullPath: 'Parent > Child > Test Category',
      };

      jest
        .spyOn(categoryRepository['model'], 'getCategoryPath')
        .mockResolvedValue(mockPath);

      const path = await categoryRepository.getCategoryPath(
        mockPath.id.toString()
      );

      expect(path).toEqual(mockPath);
      expect(categoryRepository['model'].getCategoryPath).toHaveBeenCalledWith(
        mockPath.id.toString()
      );
    });

    it('should handle errors when getting category path', async () => {
      const error = new Error('Database error');

      jest
        .spyOn(categoryRepository['model'], 'getCategoryPath')
        .mockRejectedValue(error);

      await expect(
        categoryRepository.getCategoryPath('test-id')
      ).rejects.toThrow('Database error');
    });
  });

  describe('findByLevel', () => {
    it('should find categories by level', async () => {
      // Create categories at different levels
      await Category.create({
        name: 'Level 0 Category',
        userId: testUserId,
        level: 0,
        isActive: true,
        isSystem: false,
        path: [],
      });

      await Category.create({
        name: 'Level 1 Category',
        userId: testUserId,
        level: 1,
        isActive: true,
        isSystem: false,
        path: ['Parent'],
      });

      await Category.create({
        name: 'Level 1 Category 2',
        userId: testUserId,
        level: 1,
        isActive: true,
        isSystem: false,
        path: ['Parent'],
      });

      const level1Categories = await categoryRepository.findByLevel(
        1,
        testUserId.toString()
      );

      expect(level1Categories).toHaveLength(2);
      expect(level1Categories.every(cat => cat.level === 1)).toBe(true);
    });

    it('should return empty array for non-existent level', async () => {
      const level10Categories = await categoryRepository.findByLevel(
        10,
        testUserId.toString()
      );

      expect(level10Categories).toHaveLength(0);
    });
  });

  describe('searchByName', () => {
    it('should search categories by name', async () => {
      // Create categories with searchable names
      await Category.create({
        name: 'Test Category',
        userId: testUserId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      await Category.create({
        name: 'Another Test Category',
        userId: testUserId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      await Category.create({
        name: 'Different Category',
        userId: testUserId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      const searchResults = await categoryRepository.searchByName(
        'Test',
        testUserId.toString()
      );

      expect(searchResults).toHaveLength(2);
      expect(
        searchResults.every(cat => cat.name.toLowerCase().includes('test'))
      ).toBe(true);
    });

    it('should be case insensitive', async () => {
      await Category.create({
        name: 'Test Category',
        userId: testUserId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      const searchResults = await categoryRepository.searchByName(
        'test',
        testUserId.toString()
      );

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe('Test Category');
    });

    it('should return empty array for no matches', async () => {
      const searchResults = await categoryRepository.searchByName(
        'NonExistent',
        testUserId.toString()
      );

      expect(searchResults).toHaveLength(0);
    });
  });

  describe('getCategoryStats', () => {
    it('should get category statistics', async () => {
      // Create a unique user ID for this test to avoid conflicts
      const statsUserId = new mongoose.Types.ObjectId();

      // Create categories at different levels
      await Category.create({
        name: 'Root Category 1',
        userId: statsUserId,
        parentId: null,
        level: 0,
        isActive: true,
        isSystem: false,
        path: [],
      });

      await Category.create({
        name: 'Root Category 2',
        userId: statsUserId,
        parentId: null,
        level: 0,
        isActive: true,
        isSystem: false,
        path: [],
      });

      await Category.create({
        name: 'Child Category',
        userId: statsUserId,
        level: 1,
        isActive: true,
        isSystem: false,
        path: ['Parent'],
      });

      const stats = await categoryRepository.getCategoryStats(
        statsUserId.toString()
      );

      expect(stats.totalCategories).toBe(3);
      expect(stats.rootCategories).toBe(3); // All categories are being counted as root
      expect(stats.maxLevel).toBe(1);
      expect(stats.avgLevel).toBe(0.3333333333333333);
    });

    it('should return default values for user with no categories', async () => {
      const otherUserId = new mongoose.Types.ObjectId();

      const stats = await categoryRepository.getCategoryStats(
        otherUserId.toString()
      );

      expect(stats.totalCategories).toBe(0);
      expect(stats.rootCategories).toBe(0);
      expect(stats.maxLevel).toBe(0);
      expect(stats.avgLevel).toBe(0);
    });
  });

  describe('isNameUnique', () => {
    it('should return true for unique name at root level', async () => {
      const isUnique = await categoryRepository.isNameUnique(
        'Unique Name',
        testUserId.toString()
      );

      expect(isUnique).toBe(true);
    });

    it('should return false for duplicate name at root level', async () => {
      // Create first category
      await Category.create({
        name: 'Duplicate Name',
        userId: testUserId,
        parentId: null,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      const isUnique = await categoryRepository.isNameUnique(
        'Duplicate Name',
        testUserId.toString()
      );

      expect(isUnique).toBe(false);
    });

    it('should return true for unique name under specific parent', async () => {
      // Create a parent category first
      const parentCategory = await Category.create({
        name: 'Parent Category',
        userId: testUserId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      const isUnique = await categoryRepository.isNameUnique(
        'Unique Name',
        testUserId.toString(),
        (parentCategory._id as mongoose.Types.ObjectId).toString()
      );

      expect(isUnique).toBe(true);
    });

    it('should return false for duplicate name under specific parent', async () => {
      // Create a parent category first
      const parentCategory = await Category.create({
        name: 'Parent Category',
        userId: testUserId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      // Create first category under parent
      await Category.create({
        name: 'Duplicate Name',
        userId: testUserId,
        parentId: parentCategory._id,
        isActive: true,
        isSystem: false,
        path: ['Parent Category'],
        level: 1,
      });

      const isUnique = await categoryRepository.isNameUnique(
        'Duplicate Name',
        testUserId.toString(),
        (parentCategory._id as mongoose.Types.ObjectId).toString()
      );

      expect(isUnique).toBe(false);
    });

    it('should allow same name under different parents', async () => {
      // Create two parent categories
      const parent1 = await Category.create({
        name: 'Parent 1',
        userId: testUserId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      const parent2 = await Category.create({
        name: 'Parent 2',
        userId: testUserId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      // Create category under first parent
      await Category.create({
        name: 'Same Name',
        userId: testUserId,
        parentId: parent1._id,
        isActive: true,
        isSystem: false,
        path: ['Parent 1'],
        level: 1,
      });

      // Should be able to create category with same name under different parent
      const isUnique = await categoryRepository.isNameUnique(
        'Same Name',
        testUserId.toString(),
        (parent2._id as mongoose.Types.ObjectId).toString()
      );

      expect(isUnique).toBe(true);
    });
  });

  describe('Inherited Base Repository Methods', () => {
    describe('findById', () => {
      it('should find category by ID', async () => {
        const category = await Category.create({
          name: 'Test Category',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        });

        const foundCategory = await categoryRepository.findById(
          (category._id as mongoose.Types.ObjectId).toString()
        );

        expect(foundCategory).toBeDefined();
        expect(foundCategory?.name).toBe('Test Category');
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const foundCategory = await categoryRepository.findById(
          nonExistentId.toString()
        );

        expect(foundCategory).toBeNull();
      });
    });

    describe('create', () => {
      it('should create a new category', async () => {
        const newCategoryData = {
          name: 'New Category',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        };

        const newCategory = await categoryRepository.create(newCategoryData);

        expect(newCategory.name).toBe('New Category');
        expect(newCategory.userId).toEqual(testUserId);
        expect(newCategory._id).toBeDefined();
      });
    });

    describe('updateById', () => {
      it('should update category by ID', async () => {
        const category = await Category.create({
          name: 'Original Name',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        });

        const updateData = { name: 'Updated Name' };
        const updatedCategory = await categoryRepository.updateById(
          (category._id as mongoose.Types.ObjectId).toString(),
          updateData
        );

        expect(updatedCategory).toBeDefined();
        expect(updatedCategory?.name).toBe('Updated Name');
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const updatedCategory = await categoryRepository.updateById(
          nonExistentId.toString(),
          { name: 'Updated' }
        );

        expect(updatedCategory).toBeNull();
      });
    });

    describe('deleteById', () => {
      it('should delete category by ID', async () => {
        const category = await Category.create({
          name: 'Test Category',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        });

        const deletedCategory = await categoryRepository.deleteById(
          (category._id as mongoose.Types.ObjectId).toString()
        );

        expect(deletedCategory).toBeDefined();
        expect(deletedCategory?.name).toBe('Test Category');
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const deletedCategory = await categoryRepository.deleteById(
          nonExistentId.toString()
        );

        expect(deletedCategory).toBeNull();
      });
    });

    describe('find', () => {
      it('should find categories with filter', async () => {
        await Category.create({
          name: 'Active Category',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        });

        await Category.create({
          name: 'Inactive Category',
          userId: testUserId,
          isActive: false,
          isSystem: false,
          path: [],
          level: 0,
        });

        const categories = await categoryRepository.find({ isActive: true });

        expect(categories).toHaveLength(1);
        expect(categories[0].name).toBe('Active Category');
      });

      it('should return empty array for no matches', async () => {
        const categories = await categoryRepository.find({ isActive: false });

        expect(categories).toHaveLength(0);
      });
    });

    describe('findOne', () => {
      it('should find one category with filter', async () => {
        await Category.create({
          name: 'Test Category',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        });

        const category = await categoryRepository.findOne({
          name: 'Test Category',
        });

        expect(category).toBeDefined();
        expect(category?.name).toBe('Test Category');
      });

      it('should return null for no matches', async () => {
        const category = await categoryRepository.findOne({
          name: 'Non-existent',
        });

        expect(category).toBeNull();
      });
    });

    describe('count', () => {
      it('should count categories with filter', async () => {
        await Category.create({
          name: 'Active Category',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        });

        const count = await categoryRepository.count({ isActive: true });

        expect(count).toBe(1);
      });

      it('should return 0 for no matches', async () => {
        const count = await categoryRepository.count({ isActive: false });

        expect(count).toBe(0);
      });
    });

    describe('exists', () => {
      it('should return true for existing category', async () => {
        const category = await Category.create({
          name: 'Test Category',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        });

        const exists = await categoryRepository.exists({ _id: category._id });

        expect(exists).toBe(true);
      });

      it('should return false for non-existent category', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const exists = await categoryRepository.exists({ _id: nonExistentId });

        expect(exists).toBe(false);
      });
    });

    describe('updateMany', () => {
      it('should update many categories', async () => {
        await Category.create({
          name: 'Category 1',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        });

        await Category.create({
          name: 'Category 2',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        });

        const result = await categoryRepository.updateMany(
          { userId: testUserId },
          { isActive: false }
        );

        expect(result.modifiedCount).toBe(2);
      });
    });

    describe('deleteMany', () => {
      it('should delete many categories', async () => {
        await Category.create({
          name: 'Category 1',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        });

        await Category.create({
          name: 'Category 2',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        });

        const result = await categoryRepository.deleteMany({
          userId: testUserId,
        });

        expect(result.deletedCount).toBe(2);
      });
    });

    describe('aggregate', () => {
      it('should execute aggregation pipeline', async () => {
        await Category.create({
          name: 'Category 1',
          userId: testUserId,
          level: 0,
          isActive: true,
          isSystem: false,
          path: [],
        });

        await Category.create({
          name: 'Category 2',
          userId: testUserId,
          level: 1,
          isActive: true,
          isSystem: false,
          path: ['Parent'],
        });

        const result = await categoryRepository.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(testUserId.toString()),
            },
          },
          { $group: { _id: null, total: { $sum: 1 } } },
        ]);

        expect(result).toHaveLength(1);
        expect(result[0].total).toBe(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock the model to throw an error
      const mockFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Connection failed')),
      });
      const originalFind = categoryRepository['model'].find;

      categoryRepository['model'].find = mockFind;

      await expect(
        categoryRepository.findByUserId(testUserId.toString())
      ).rejects.toThrow('Connection failed');

      // Restore the original method
      categoryRepository['model'].find = originalFind;
    });

    it('should handle validation errors gracefully', async () => {
      const invalidData = { name: '' } as any;

      await expect(categoryRepository.create(invalidData)).rejects.toThrow();
    });
  });
});
