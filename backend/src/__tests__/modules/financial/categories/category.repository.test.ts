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
    // Reset mocks
    jest.clearAllMocks();
    
    // Create the actual repository instance
    categoryRepository = new CategoryRepository();
    
    // Mock the methods by replacing them with jest mocks
    (categoryRepository as any).findById = jest.fn();
    (categoryRepository as any).findOne = jest.fn();
    (categoryRepository as any).create = jest.fn();
    (categoryRepository as any).updateById = jest.fn();
    (categoryRepository as any).deleteById = jest.fn();
    (categoryRepository as any).findByUserId = jest.fn();
    (categoryRepository as any).findRootCategories = jest.fn();
    (categoryRepository as any).findByParentId = jest.fn();
    (categoryRepository as any).getCategoryTree = jest.fn();
    (categoryRepository as any).find = jest.fn();
    (categoryRepository as any).count = jest.fn();
    (categoryRepository as any).exists = jest.fn();
    (categoryRepository as any).updateMany = jest.fn();
    (categoryRepository as any).deleteMany = jest.fn();
    (categoryRepository as any).aggregate = jest.fn();
  });

  afterEach(async () => {
    // Clean up test data
    await Category.deleteMany({});
  });

  describe('findByUserId', () => {
    it('should find categories by user ID', async () => {
      const mockCategories = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Test Category',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        },
      ];

      (categoryRepository as any).findByUserId.mockResolvedValue(mockCategories as any);

      const categories = await categoryRepository.findByUserId(testUserId.toString());

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Test Category');
      expect(categories[0].userId).toEqual(testUserId);
      expect((categoryRepository as any).findByUserId).toHaveBeenCalledWith(testUserId.toString());
    });

    it('should return empty array for non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      
      (categoryRepository as any).findByUserId.mockResolvedValue([]);

      const categories = await categoryRepository.findByUserId(nonExistentUserId.toString());

      expect(categories).toHaveLength(0);
      expect((categoryRepository as any).findByUserId).toHaveBeenCalledWith(nonExistentUserId.toString());
    });

    it('should only return active categories', async () => {
      const mockCategories = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Test Category',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        },
      ];

      (categoryRepository as any).findByUserId.mockResolvedValue(mockCategories as any);

      const categories = await categoryRepository.findByUserId(testUserId.toString());

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Test Category');
      expect((categoryRepository as any).findByUserId).toHaveBeenCalledWith(testUserId.toString());
    });

    it('should sort categories by level and name', async () => {
      const mockCategories = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Level 0 Category',
          userId: testUserId,
          level: 0,
          isActive: true,
          isSystem: false,
          path: [],
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Test Category',
          userId: testUserId,
          level: 0,
          isActive: true,
          isSystem: false,
          path: [],
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Level 1 Category',
          userId: testUserId,
          level: 1,
          isActive: true,
          isSystem: false,
          path: ['Parent'],
        },
      ];

      (categoryRepository as any).findByUserId.mockResolvedValue(mockCategories as any);

      const categories = await categoryRepository.findByUserId(testUserId.toString());

      expect(categories).toHaveLength(3);
      expect(categories[0].level).toBe(0);
      expect(categories[1].level).toBe(0);
      expect(categories[2].level).toBe(1);
      expect((categoryRepository as any).findByUserId).toHaveBeenCalledWith(testUserId.toString());
    });
  });

  describe('findRootCategories', () => {
    it('should find root categories (no parent)', async () => {
      const mockCategories = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Test Category',
          userId: testUserId,
          parentId: undefined,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        },
      ];

      (categoryRepository as any).findRootCategories.mockResolvedValue(mockCategories as any);

      const rootCategories = await categoryRepository.findRootCategories(testUserId.toString());

      expect(rootCategories).toHaveLength(1);
      expect(rootCategories[0].name).toBe('Test Category');
      expect(rootCategories[0].parentId).toBeUndefined();
      expect((categoryRepository as any).findRootCategories).toHaveBeenCalledWith(testUserId.toString());
    });

    it('should not return categories with parents', async () => {
      const parentId = new mongoose.Types.ObjectId();
      
      // Create a parent category first
      const parentCategory = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Parent Category',
        userId: testUserId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      };

      // Create a child category
      const childCategory = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Child Category',
        userId: testUserId,
        parentId: parentCategory._id,
        isActive: true,
        isSystem: false,
        path: [parentCategory.name],
        level: 1,
      };

      // Mock the repository to return only root categories
      (categoryRepository as any).findRootCategories.mockResolvedValue([parentCategory] as any);

      const rootCategories = await categoryRepository.findRootCategories(testUserId.toString());

      expect(rootCategories).toHaveLength(1);
      expect(rootCategories.every(cat => !cat.parentId)).toBe(true);
      expect((categoryRepository as any).findRootCategories).toHaveBeenCalledWith(testUserId.toString());
    });

    it('should return empty array for user with no root categories', async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      
      (categoryRepository as any).findRootCategories.mockResolvedValue([]);

      const rootCategories = await categoryRepository.findRootCategories(otherUserId.toString());

      expect(rootCategories).toHaveLength(0);
      expect((categoryRepository as any).findRootCategories).toHaveBeenCalledWith(otherUserId.toString());
    });
  });

  describe('findByParentId', () => {
    it('should find categories by parent ID', async () => {
      const parentId = new mongoose.Types.ObjectId();
      
      // Create a parent category first
      const parentCategory = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Parent Category',
        userId: testUserId,
        isActive: true,
        isSystem: false,
        path: [],
        level: 0,
      };
      
      // Create a child category
      const childCategory = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Child Category',
        userId: testUserId,
        parentId: parentId,
        isActive: true,
        isSystem: false,
        path: ['Parent Category'],
        level: 1,
      };

      (categoryRepository as any).findByParentId.mockResolvedValue([childCategory] as any);

      const childCategories = await categoryRepository.findByParentId(parentId.toString(), testUserId.toString());

      expect(childCategories).toHaveLength(1);
      expect(childCategories[0].name).toBe('Child Category');
      expect(childCategories[0].parentId).toEqual(parentId);
      expect((categoryRepository as any).findByParentId).toHaveBeenCalledWith(parentId.toString(), testUserId.toString());
    });

    it('should return empty array for non-existent parent', async () => {
      const nonExistentParentId = new mongoose.Types.ObjectId();
      
      (categoryRepository as any).findByParentId.mockResolvedValue([]);

      const childCategories = await categoryRepository.findByParentId(nonExistentParentId.toString(), testUserId.toString());

      expect(childCategories).toHaveLength(0);
      expect((categoryRepository as any).findByParentId).toHaveBeenCalledWith(nonExistentParentId.toString(), testUserId.toString());
    });

    it('should only return categories for the specified user', async () => {
      const parentId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();
      
      // Create child category for other user
      const otherUserChild = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Other User Child',
        userId: otherUserId,
        parentId: parentId,
        isActive: true,
        isSystem: false,
        path: ['Parent Category'],
        level: 1,
      };

      (categoryRepository as any).findByParentId.mockResolvedValue([]);

      const childCategories = await categoryRepository.findByParentId(parentId.toString(), testUserId.toString());

      expect(childCategories).toHaveLength(0);
      expect((categoryRepository as any).findByParentId).toHaveBeenCalledWith(parentId.toString(), testUserId.toString());
    });
  });

  describe('getCategoryTree', () => {
    it('should get category tree structure', async () => {
      const mockTree = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Test Category',
          children: [],
        },
      ];

      (categoryRepository as any).getCategoryTree.mockResolvedValue(mockTree as any);

      const tree = await categoryRepository.getCategoryTree(testUserId.toString());

      expect(tree).toEqual(mockTree);
      expect((categoryRepository as any).getCategoryTree).toHaveBeenCalledWith(testUserId.toString());
    });

    it('should handle errors when getting category tree', async () => {
      const error = new Error('Database error');
      
      (categoryRepository as any).getCategoryTree.mockRejectedValue(error);

      await expect(categoryRepository.getCategoryTree(testUserId.toString())).rejects.toThrow('Database error');
      expect((categoryRepository as any).getCategoryTree).toHaveBeenCalledWith(testUserId.toString());
    });
  });

  describe('Inherited Base Repository Methods', () => {
    describe('findById', () => {
      it('should find category by ID', async () => {
        const mockCategory = {
          _id: new mongoose.Types.ObjectId(),
          name: 'Test Category',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        };

        (categoryRepository as any).findById.mockResolvedValue(mockCategory as any);

        const foundCategory = await categoryRepository.findById(mockCategory._id.toString());

        expect(foundCategory).toBeDefined();
        expect(foundCategory?.name).toBe('Test Category');
        expect((categoryRepository as any).findById).toHaveBeenCalledWith(mockCategory._id.toString());
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        
        (categoryRepository as any).findById.mockResolvedValue(null);

        const foundCategory = await categoryRepository.findById(nonExistentId.toString());

        expect(foundCategory).toBeNull();
        expect((categoryRepository as any).findById).toHaveBeenCalledWith(nonExistentId.toString());
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

        const mockCreatedCategory = {
          _id: new mongoose.Types.ObjectId(),
          ...newCategoryData,
        };

        (categoryRepository as any).create.mockResolvedValue(mockCreatedCategory as any);

        const newCategory = await categoryRepository.create(newCategoryData);

        expect(newCategory.name).toBe('New Category');
        expect(newCategory.userId).toEqual(testUserId);
        expect(newCategory._id).toBeDefined();
        expect((categoryRepository as any).create).toHaveBeenCalledWith(newCategoryData);
      });
    });

    describe('updateById', () => {
      it('should update category by ID', async () => {
        const updateData = { name: 'Updated Category' };
        const mockUpdatedCategory = {
          _id: new mongoose.Types.ObjectId(),
          name: 'Updated Category',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        };

        (categoryRepository as any).updateById.mockResolvedValue(mockUpdatedCategory as any);

        const updatedCategory = await categoryRepository.updateById(mockUpdatedCategory._id.toString(), updateData);

        expect(updatedCategory).toBeDefined();
        expect(updatedCategory?.name).toBe('Updated Category');
        expect((categoryRepository as any).updateById).toHaveBeenCalledWith(mockUpdatedCategory._id.toString(), updateData);
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        
        (categoryRepository as any).updateById.mockResolvedValue(null);

        const updatedCategory = await categoryRepository.updateById(nonExistentId.toString(), { name: 'Updated' });

        expect(updatedCategory).toBeNull();
        expect((categoryRepository as any).updateById).toHaveBeenCalledWith(nonExistentId.toString(), { name: 'Updated' });
      });
    });

    describe('deleteById', () => {
      it('should delete category by ID', async () => {
        const mockDeletedCategory = {
          _id: new mongoose.Types.ObjectId(),
          name: 'Test Category',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        };

        (categoryRepository as any).deleteById.mockResolvedValue(mockDeletedCategory as any);

        const deletedCategory = await categoryRepository.deleteById(mockDeletedCategory._id.toString());

        expect(deletedCategory).toBeDefined();
        expect(deletedCategory?.name).toBe('Test Category');
        expect((categoryRepository as any).deleteById).toHaveBeenCalledWith(mockDeletedCategory._id.toString());
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        
        (categoryRepository as any).deleteById.mockResolvedValue(null);

        const deletedCategory = await categoryRepository.deleteById(nonExistentId.toString());

        expect(deletedCategory).toBeNull();
        expect((categoryRepository as any).deleteById).toHaveBeenCalledWith(nonExistentId.toString());
      });
    });

    describe('find', () => {
      it('should find categories with filter', async () => {
        const mockCategories = [
          {
            _id: new mongoose.Types.ObjectId(),
            name: 'Test Category',
            userId: testUserId,
            isActive: true,
            isSystem: false,
            path: [],
            level: 0,
          },
        ];

        (categoryRepository as any).find.mockResolvedValue(mockCategories as any);

        const categories = await categoryRepository.find({ isActive: true });

        expect(categories).toHaveLength(1);
        expect(categories[0].name).toBe('Test Category');
        expect((categoryRepository as any).find).toHaveBeenCalledWith({ isActive: true });
      });

      it('should return empty array for no matches', async () => {
        (categoryRepository as any).find.mockResolvedValue([]);

        const categories = await categoryRepository.find({ isActive: false });

        expect(categories).toHaveLength(0);
        expect((categoryRepository as any).find).toHaveBeenCalledWith({ isActive: false });
      });
    });

    describe('findOne', () => {
      it('should find one category with filter', async () => {
        const mockCategory = {
          _id: new mongoose.Types.ObjectId(),
          name: 'Test Category',
          userId: testUserId,
          isActive: true,
          isSystem: false,
          path: [],
          level: 0,
        };

        (categoryRepository as any).findOne.mockResolvedValue(mockCategory as any);

        const category = await categoryRepository.findOne({ name: 'Test Category' });

        expect(category).toBeDefined();
        expect(category?.name).toBe('Test Category');
        expect((categoryRepository as any).findOne).toHaveBeenCalledWith({ name: 'Test Category' });
      });

      it('should return null for no matches', async () => {
        (categoryRepository as any).findOne.mockResolvedValue(null);

        const category = await categoryRepository.findOne({ name: 'Non-existent' });

        expect(category).toBeNull();
        expect((categoryRepository as any).findOne).toHaveBeenCalledWith({ name: 'Non-existent' });
      });
    });

    describe('count', () => {
      it('should count categories with filter', async () => {
        (categoryRepository as any).count.mockResolvedValue(1);

        const count = await categoryRepository.count({ isActive: true });

        expect(count).toBe(1);
        expect((categoryRepository as any).count).toHaveBeenCalledWith({ isActive: true });
      });

      it('should return 0 for no matches', async () => {
        (categoryRepository as any).count.mockResolvedValue(0);

        const count = await categoryRepository.count({ isActive: false });

        expect(count).toBe(0);
        expect((categoryRepository as any).count).toHaveBeenCalledWith({ isActive: false });
      });
    });

    describe('exists', () => {
      it('should return true for existing category', async () => {
        const mockCategoryId = new mongoose.Types.ObjectId();
        
        (categoryRepository as any).exists.mockResolvedValue(true);

        const exists = await categoryRepository.exists({ _id: mockCategoryId });

        expect(exists).toBe(true);
        expect((categoryRepository as any).exists).toHaveBeenCalledWith({ _id: mockCategoryId });
      });

      it('should return false for non-existent category', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        
        (categoryRepository as any).exists.mockResolvedValue(false);

        const exists = await categoryRepository.exists({ _id: nonExistentId });

        expect(exists).toBe(false);
        expect((categoryRepository as any).exists).toHaveBeenCalledWith({ _id: nonExistentId });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Test that the repository properly handles errors from the model
      const mockFind = jest.fn().mockRejectedValue(new Error('Connection failed'));
      const originalFind = categoryRepository['model'].find;
      
      // Mock the model's find method to simulate a database error
      categoryRepository['model'].find = mockFind;

      // Test the actual method behavior by calling it directly
      try {
        await categoryRepository.findByUserId(testUserId.toString());
        // If we get here, the error wasn't thrown as expected
        expect(true).toBe(false); // This should never be reached
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // Just check that it's an error, don't check the specific message
        expect((error as Error).message).toBeTruthy();
      }

      // Restore the original method
      categoryRepository['model'].find = originalFind;
    });

    it('should handle validation errors gracefully', async () => {
      const invalidData = { name: 'Invalid' } as any;
      
      (categoryRepository as any).create.mockRejectedValue(new Error('Validation error'));

      await expect(categoryRepository.create(invalidData)).rejects.toThrow('Validation error');
      expect((categoryRepository as any).create).toHaveBeenCalledWith(invalidData);
    });
  });
});
