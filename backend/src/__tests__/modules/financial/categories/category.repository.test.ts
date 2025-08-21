import mongoose from 'mongoose';
import { CategoryRepository } from '../../../../modules/financial/categories/repositories/category.repository';
import { Category } from '../../../../modules/financial/categories/models/category.model';
import { ICategory } from '../../../../modules/financial/categories/interfaces/category.interface';

describe('Category Repository', () => {
  let categoryRepository: CategoryRepository;
  let testUserId: mongoose.Types.ObjectId;
  let testCategory: any;

  beforeAll(async () => {
    testUserId = new mongoose.Types.ObjectId();
  });

  beforeEach(async () => {
    await Category.deleteMany({});
    categoryRepository = new CategoryRepository();
    
    // Create a test category
    testCategory = await Category.create({
      name: 'Test Category',
      userId: testUserId,
      isActive: true,
      isSystem: false,
      path: [],
      level: 0,
    });
  });

  afterAll(async () => {
    await Category.deleteMany({});
  });

  describe('findByUserId', () => {
    it('should find categories by user ID', async () => {
      const categories = await categoryRepository.findByUserId(testUserId.toString());

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Test Category');
      expect(categories[0].userId).toEqual(testUserId);
    });

    it('should return empty array for non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const categories = await categoryRepository.findByUserId(nonExistentUserId.toString());

      expect(categories).toHaveLength(0);
    });

    it('should only return active categories', async () => {
      // Create an inactive category
      await Category.create({
        name: 'Inactive Category',
        userId: testUserId,
        isActive: false,
      });

      const categories = await categoryRepository.findByUserId(testUserId.toString());

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Test Category');
    });

    it('should sort categories by level and name', async () => {
      // Create categories with different levels
      await Category.create({
        name: 'Level 1 Category',
        userId: testUserId,
        level: 1,
        isActive: true,
      });

      await Category.create({
        name: 'Level 0 Category',
        userId: testUserId,
        level: 0,
        isActive: true,
      });

      const categories = await categoryRepository.findByUserId(testUserId.toString());

      expect(categories).toHaveLength(3);
      expect(categories[0].level).toBe(0);
      expect(categories[1].level).toBe(0);
      expect(categories[2].level).toBe(1);
    });
  });

  describe('findRootCategories', () => {
    it('should find root categories (no parent)', async () => {
      const rootCategories = await categoryRepository.findRootCategories(testUserId.toString());

      expect(rootCategories).toHaveLength(1);
      expect(rootCategories[0].name).toBe('Test Category');
      expect(rootCategories[0].parentId).toBeUndefined();
    });

    it('should not return categories with parents', async () => {
      const parentId = new mongoose.Types.ObjectId();
      
      // Create a parent category
      await Category.create({
        name: 'Parent Category',
        userId: testUserId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      // Create a child category
      await Category.create({
        name: 'Child Category',
        userId: testUserId,
        parentId: parentId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      });

      const rootCategories = await categoryRepository.findRootCategories(testUserId.toString());

      expect(rootCategories).toHaveLength(2);
      expect(rootCategories.every(cat => !cat.parentId)).toBe(true);
    });

    it('should return empty array for user with no root categories', async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      const rootCategories = await categoryRepository.findRootCategories(otherUserId.toString());

      expect(rootCategories).toHaveLength(0);
    });
  });

  describe('findByParentId', () => {
    it('should find categories by parent ID', async () => {
      const parentId = new mongoose.Types.ObjectId();
      
      // Create a child category
      await Category.create({
        name: 'Child Category',
        userId: testUserId,
        parentId: parentId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 1,
      });

      const childCategories = await categoryRepository.findByParentId(parentId.toString(), testUserId.toString());

      expect(childCategories).toHaveLength(1);
      expect(childCategories[0].name).toBe('Child Category');
      expect(childCategories[0].parentId).toEqual(parentId);
    });

    it('should return empty array for non-existent parent', async () => {
      const nonExistentParentId = new mongoose.Types.ObjectId();
      const childCategories = await categoryRepository.findByParentId(nonExistentParentId.toString(), testUserId.toString());

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
      });

      const childCategories = await categoryRepository.findByParentId(parentId.toString(), testUserId.toString());

      expect(childCategories).toHaveLength(0);
    });
  });

  describe('getCategoryTree', () => {
    it('should get category tree structure', async () => {
      // Mock the static method
      const mockTree = [
        {
          _id: testCategory._id,
          name: 'Test Category',
          children: [],
        },
      ] as any;

      jest.spyOn(Category, 'getCategoryTree').mockResolvedValue(mockTree);

      const tree = await categoryRepository.getCategoryTree(testUserId.toString());

      expect(tree).toEqual(mockTree);
      expect(Category.getCategoryTree).toHaveBeenCalledWith(testUserId.toString());
    });

    it('should handle errors when getting category tree', async () => {
      const error = new Error('Database error');
      jest.spyOn(Category, 'getCategoryTree').mockRejectedValue(error);

      await expect(categoryRepository.getCategoryTree(testUserId.toString())).rejects.toThrow('Database error');
    });
  });

  describe('Inherited Base Repository Methods', () => {
    describe('findById', () => {
      it('should find category by ID', async () => {
        const foundCategory = await categoryRepository.findById(testCategory._id.toString());

        expect(foundCategory).toBeDefined();
        expect(foundCategory?.name).toBe('Test Category');
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const foundCategory = await categoryRepository.findById(nonExistentId.toString());

        expect(foundCategory).toBeNull();
      });
    });

    describe('create', () => {
      it('should create a new category', async () => {
        const newCategoryData = {
          name: 'New Category',
          userId: testUserId,
          isActive: true,
        };

        const newCategory = await categoryRepository.create(newCategoryData);

        expect(newCategory.name).toBe('New Category');
        expect(newCategory.userId).toEqual(testUserId);
        expect(newCategory._id).toBeDefined();
      });
    });

    describe('updateById', () => {
      it('should update category by ID', async () => {
        const updateData = { name: 'Updated Category' };
        const updatedCategory = await categoryRepository.updateById(testCategory._id.toString(), updateData);

        expect(updatedCategory).toBeDefined();
        expect(updatedCategory?.name).toBe('Updated Category');
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const updatedCategory = await categoryRepository.updateById(nonExistentId.toString(), { name: 'Updated' });

        expect(updatedCategory).toBeNull();
      });
    });

    describe('deleteById', () => {
      it('should delete category by ID', async () => {
        const deletedCategory = await categoryRepository.deleteById(testCategory._id.toString());

        expect(deletedCategory).toBeDefined();
        expect(deletedCategory?.name).toBe('Test Category');

        // Verify it's deleted
        const foundCategory = await Category.findById(testCategory._id);
        expect(foundCategory).toBeNull();
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const deletedCategory = await categoryRepository.deleteById(nonExistentId.toString());

        expect(deletedCategory).toBeNull();
      });
    });

    describe('find', () => {
      it('should find categories with filter', async () => {
        const categories = await categoryRepository.find({ isActive: true });

        expect(categories).toHaveLength(1);
        expect(categories[0].name).toBe('Test Category');
      });

      it('should return empty array for no matches', async () => {
        const categories = await categoryRepository.find({ isActive: false });

        expect(categories).toHaveLength(0);
      });
    });

    describe('findOne', () => {
      it('should find one category with filter', async () => {
        const category = await categoryRepository.findOne({ name: 'Test Category' });

        expect(category).toBeDefined();
        expect(category?.name).toBe('Test Category');
      });

      it('should return null for no matches', async () => {
        const category = await categoryRepository.findOne({ name: 'Non-existent' });

        expect(category).toBeNull();
      });
    });

    describe('count', () => {
      it('should count categories with filter', async () => {
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
        const exists = await categoryRepository.exists({ _id: testCategory._id });

        expect(exists).toBe(true);
      });

      it('should return false for non-existent category', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const exists = await categoryRepository.exists({ _id: nonExistentId });

        expect(exists).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock a database error by mocking the repository's model
      const originalFind = categoryRepository['model'].find;
      const mockFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Connection failed'))
      });
      categoryRepository['model'].find = mockFind;

      await expect(categoryRepository.findByUserId(testUserId.toString())).rejects.toThrow('Connection failed');
      
      // Restore the original method
      categoryRepository['model'].find = originalFind;
    });

    it('should handle validation errors gracefully', async () => {
      // Test with invalid data that will cause validation to fail
      const invalidData = { name: 'Invalid' } as any;
      
      await expect(categoryRepository.create(invalidData)).rejects.toThrow();
    });
  });
});
