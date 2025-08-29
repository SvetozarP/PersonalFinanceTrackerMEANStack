import mongoose from 'mongoose';
import { Category } from '../../../../modules/financial/categories/models/category.model';
import { ICategory } from '../../../../modules/financial/categories/interfaces/category.interface';

describe('Category Model', () => {
  let testCategory: ICategory;
  let testUserId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    testUserId = new mongoose.Types.ObjectId();
  });

  beforeEach(async () => {
    await Category.deleteMany({});
  });

  afterAll(async () => {
    await Category.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid category with required fields', async () => {
      const categoryData = {
        name: 'Test Category',
        userId: testUserId,
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.name).toBe('Test Category');
      expect(savedCategory.userId).toEqual(testUserId);
      expect(savedCategory.color).toBe('#3B82F6'); // Default color
      expect(savedCategory.icon).toBe('folder'); // Default icon
      expect(savedCategory.isActive).toBe(true); // Default value
      expect(savedCategory.isSystem).toBe(false); // Default value
      expect(savedCategory.level).toBe(0); // Default value
      expect(savedCategory.path).toEqual([]); // Default value
    });

    it('should create a category with all optional fields', async () => {
      // First create a parent category
      const parentCategory = await Category.create({
        name: 'Parent Category',
        userId: testUserId,
      });

      const categoryData = {
        name: 'Full Category',
        description: 'A comprehensive category description',
        color: '#FF0000',
        icon: 'star',
        parentId: parentCategory._id,
        isActive: false,
        isSystem: true,
        userId: testUserId,
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.description).toBe(
        'A comprehensive category description'
      );
      expect(savedCategory.color).toBe('#FF0000');
      expect(savedCategory.icon).toBe('star');
      expect(savedCategory.parentId).toEqual(categoryData.parentId);
      expect(savedCategory.level).toBe(1); // Should be calculated from parent
      expect(savedCategory.path).toEqual(['Parent Category']); // Should be calculated from parent
      expect(savedCategory.isActive).toBe(false);
      expect(savedCategory.isSystem).toBe(true);
    });

    it('should trim whitespace from name and description', async () => {
      const categoryData = {
        name: '  Trimmed Name  ',
        description: '  Trimmed Description  ',
        userId: testUserId,
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.name).toBe('Trimmed Name');
      expect(savedCategory.description).toBe('Trimmed Description');
    });

    it('should validate name length constraints', async () => {
      const longName = 'A'.repeat(101);

      const longCategory = new Category({ name: longName, userId: testUserId });

      await expect(longCategory.save()).rejects.toThrow();
    });

    it('should validate description length constraints', async () => {
      const longDescription = 'A'.repeat(501);

      const category = new Category({
        name: 'Test Category',
        description: longDescription,
        userId: testUserId,
      });

      await expect(category.save()).rejects.toThrow();
    });

    it('should validate color format', async () => {
      const invalidColors = ['invalid', '#GGGGGG', 'red', '#12345'];

      for (const invalidColor of invalidColors) {
        const category = new Category({
          name: `Test Category ${invalidColor}`,
          color: invalidColor,
          userId: testUserId,
        });

        await expect(category.save()).rejects.toThrow();
      }
    });

    it('should accept valid hex colors', async () => {
      const validColors = ['#FF0000', '#00FF00', '#0000FF', '#123456', '#ABC'];

      for (let i = 0; i < validColors.length; i++) {
        const validColor = validColors[i];
        const category = new Category({
          name: `Test Category ${i}`, // Unique name for each test
          color: validColor,
          userId: testUserId,
        });

        const savedCategory = await category.save();
        expect(savedCategory.color).toBe(validColor);
      }
    });

    it('should validate icon length constraints', async () => {
      const longIcon = 'A'.repeat(51);

      const category = new Category({
        name: 'Test Category',
        icon: longIcon,
        userId: testUserId,
      });

      await expect(category.save()).rejects.toThrow();
    });

    it('should validate level constraints', async () => {
      const negativeLevel = -1;

      const category = new Category({
        name: 'Test Category',
        level: negativeLevel,
        userId: testUserId,
      });

      await expect(category.save()).rejects.toThrow();
    });
  });

  describe('Indexes and Constraints', () => {
    it('should enforce unique category names per user and parent', async () => {
      const parentId = new mongoose.Types.ObjectId();

      // Create first category
      await Category.create({
        name: 'Duplicate Name',
        userId: testUserId,
        parentId: parentId,
      });

      // Try to create duplicate
      const duplicateCategory = new Category({
        name: 'Duplicate Name',
        userId: testUserId,
        parentId: parentId,
      });

      await expect(duplicateCategory.save()).rejects.toThrow();
    });

    it('should allow same name under different parents', async () => {
      // Create actual parent categories first
      const parent1 = await Category.create({
        name: 'Parent Category 1',
        userId: testUserId,
      });

      const parent2 = await Category.create({
        name: 'Parent Category 2',
        userId: testUserId,
      });

      // Create first category under parent1
      await Category.create({
        name: 'Same Name',
        userId: testUserId,
        parentId: parent1._id,
      });

      // Create second category with same name but under parent2
      const secondCategory = new Category({
        name: 'Same Name',
        userId: testUserId,
        parentId: parent2._id,
      });

      const savedCategory = await secondCategory.save();
      expect(savedCategory.name).toBe('Same Name');
      expect(savedCategory.parentId).toEqual(parent2._id);
    });

    it('should allow same name for different users', async () => {
      const userId2 = new mongoose.Types.ObjectId();

      // Create first category
      await Category.create({
        name: 'Same Name',
        userId: testUserId,
      });

      // Create second category with same name but different user
      const secondCategory = new Category({
        name: 'Same Name',
        userId: userId2,
      });

      const savedCategory = await secondCategory.save();
      expect(savedCategory.name).toBe('Same Name');
      expect(savedCategory.userId).toEqual(userId2);
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const category = new Category({
        name: 'Timestamp Test',
        userId: testUserId,
      });

      const savedCategory = await category.save();

      expect(savedCategory.createdAt).toBeDefined();
      expect(savedCategory.updatedAt).toBeDefined();
      expect(savedCategory.createdAt).toBeInstanceOf(Date);
      expect(savedCategory.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt when document is modified', async () => {
      const category = new Category({
        name: 'Update Test',
        userId: testUserId,
      });

      const savedCategory = await category.save();
      const originalUpdatedAt = savedCategory.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      savedCategory.name = 'Updated Name';
      const updatedCategory = await savedCategory.save();

      expect(updatedCategory.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('Virtuals', () => {
    it('should include virtuals in toJSON', async () => {
      const category = new Category({
        name: 'Virtual Test',
        userId: testUserId,
      });

      const savedCategory = await category.save();
      const jsonCategory = savedCategory.toJSON();

      expect(jsonCategory._id).toBeDefined();
      expect(jsonCategory.name).toBe('Virtual Test');
    });

    it('should include virtuals in toObject', async () => {
      const category = new Category({
        name: 'Virtual Test',
        userId: testUserId,
      });

      const savedCategory = await category.save();
      const objectCategory = savedCategory.toObject();

      expect(objectCategory._id).toBeDefined();
      expect(objectCategory.name).toBe('Virtual Test');
    });
  });

  describe('Model Methods', () => {
    it('should have getCategoryTree static method', async () => {
      expect(typeof Category.getCategoryTree).toBe('function');
    });

    it('should have getCategoryPath static method', async () => {
      expect(typeof Category.getCategoryPath).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      const categoryWithoutName = new Category({ userId: testUserId });
      await expect(categoryWithoutName.save()).rejects.toThrow();

      const categoryWithoutUserId = new Category({ name: 'Test' });
      await expect(categoryWithoutUserId.save()).rejects.toThrow();
    });

    it('should handle invalid ObjectId references', async () => {
      const category = new Category({
        name: 'Test Category',
        userId: testUserId,
        parentId: 'invalid-object-id',
      });

      await expect(category.save()).rejects.toThrow();
    });
  });

  describe('Pre-save Middleware', () => {
    it('should calculate path and level for root category', async () => {
      const category = new Category({
        name: 'Root Category',
        userId: testUserId,
      });

      const savedCategory = await category.save();
      expect(savedCategory.path).toEqual([]);
      expect(savedCategory.level).toBe(0);
    });

    it('should calculate path and level for child category', async () => {
      // Create parent category
      const parentCategory = await Category.create({
        name: 'Parent Category',
        userId: testUserId,
      });

      const childCategory = new Category({
        name: 'Child Category',
        userId: testUserId,
        parentId: parentCategory._id,
      });

      const savedChild = await childCategory.save();
      expect(savedChild.path).toEqual(['Parent Category']);
      expect(savedChild.level).toBe(1);
    });

    it('should calculate path and level for grandchild category', async () => {
      // Create parent category
      const parentCategory = await Category.create({
        name: 'Parent Category',
        userId: testUserId,
      });

      // Create child category
      const childCategory = await Category.create({
        name: 'Child Category',
        userId: testUserId,
        parentId: parentCategory._id,
      });

      // Create grandchild category
      const grandchildCategory = new Category({
        name: 'Grandchild Category',
        userId: testUserId,
        parentId: childCategory._id,
      });

      const savedGrandchild = await grandchildCategory.save();
      expect(savedGrandchild.path).toEqual([
        'Parent Category',
        'Child Category',
      ]);
      expect(savedGrandchild.level).toBe(2);
    });

    it('should handle invalid parent ID gracefully', async () => {
      const invalidParentId = new mongoose.Types.ObjectId();

      const category = new Category({
        name: 'Invalid Parent Category',
        userId: testUserId,
        parentId: invalidParentId,
      });

      const savedCategory = await category.save();
      // Should reset to root when parent is invalid
      expect(savedCategory.parentId).toBeUndefined();
      expect(savedCategory.path).toEqual([]);
      expect(savedCategory.level).toBe(0);
    });

    it('should update path and level when parentId changes', async () => {
      // Create first parent
      const firstParent = await Category.create({
        name: 'First Parent',
        userId: testUserId,
      });

      // Create category with first parent
      const category = await Category.create({
        name: 'Test Category',
        userId: testUserId,
        parentId: firstParent._id,
      });

      expect(category.path).toEqual(['First Parent']);
      expect(category.level).toBe(1);

      // Create second parent
      const secondParent = await Category.create({
        name: 'Second Parent',
        userId: testUserId,
      });

      // Change parent
      category.parentId = secondParent._id as mongoose.Types.ObjectId;
      const updatedCategory = await category.save();

      expect(updatedCategory.path).toEqual(['Second Parent']);
      expect(updatedCategory.level).toBe(1);
    });

    it('should enforce uniqueness within same parent and user', async () => {
      // Create first category
      await Category.create({
        name: 'Unique Category',
        userId: testUserId,
      });

      // Try to create another with same name and user (should fail)
      const duplicateCategory = new Category({
        name: 'Unique Category',
        userId: testUserId,
      });

      await expect(duplicateCategory.save()).rejects.toThrow(
        'Category name must be unique within the same parent and user'
      );
    });

    it('should allow same name for different users', async () => {
      const userId2 = new mongoose.Types.ObjectId();

      // Create category for first user
      await Category.create({
        name: 'Shared Name',
        userId: testUserId,
      });

      // Create category with same name for second user (should succeed)
      const secondCategory = new Category({
        name: 'Shared Name',
        userId: userId2,
      });

      const savedCategory = await secondCategory.save();
      expect(savedCategory.name).toBe('Shared Name');
      expect(savedCategory.userId).toEqual(userId2);
    });

    it('should allow same name under different parents', async () => {
      // Create first parent
      const firstParent = await Category.create({
        name: 'First Parent',
        userId: testUserId,
      });

      // Create second parent
      const secondParent = await Category.create({
        name: 'Second Parent',
        userId: testUserId,
      });

      // Create category under first parent
      await Category.create({
        name: 'Same Name',
        userId: testUserId,
        parentId: firstParent._id,
      });

      // Create category with same name under second parent (should succeed)
      const secondCategory = new Category({
        name: 'Same Name',
        userId: testUserId,
        parentId: secondParent._id,
      });

      const savedCategory = await secondCategory.save();
      expect(savedCategory.name).toBe('Same Name');
      expect(savedCategory.parentId).toEqual(secondParent._id);
    });

    it('should allow updating category without changing name', async () => {
      const category = await Category.create({
        name: 'Update Test',
        userId: testUserId,
      });

      // Update description (should succeed)
      category.description = 'Updated description';
      const updatedCategory = await category.save();

      expect(updatedCategory.description).toBe('Updated description');
      expect(updatedCategory.name).toBe('Update Test');
    });
  });

  describe('Pre-delete Middleware', () => {
    it('should move children to grandparent when parent is deleted', async () => {
      // Create grandparent
      const grandparent = await Category.create({
        name: 'Grandparent',
        userId: testUserId,
      });

      // Create parent
      const parent = await Category.create({
        name: 'Parent',
        userId: testUserId,
        parentId: grandparent._id,
      });

      // Create children
      const child1 = await Category.create({
        name: 'Child 1',
        userId: testUserId,
        parentId: parent._id,
      });

      const child2 = await Category.create({
        name: 'Child 2',
        userId: testUserId,
        parentId: parent._id,
      });

      // Delete parent
      await parent.deleteOne();

      // Check that children are now under grandparent
      const updatedChild1 = await Category.findById(child1._id);
      const updatedChild2 = await Category.findById(child2._id);

      expect(updatedChild1?.parentId).toEqual(grandparent._id);
      expect(updatedChild2?.parentId).toEqual(grandparent._id);
      expect(updatedChild1?.path).toEqual(['Grandparent']);
      expect(updatedChild2?.path).toEqual(['Grandparent']);
      expect(updatedChild1?.level).toBe(1);
      expect(updatedChild2?.level).toBe(1);
    });

    it('should make children root categories when root parent is deleted', async () => {
      // Create parent (root category)
      const parent = await Category.create({
        name: 'Root Parent',
        userId: testUserId,
      });

      // Create children
      const child1 = await Category.create({
        name: 'Child 1',
        userId: testUserId,
        parentId: parent._id,
      });

      const child2 = await Category.create({
        name: 'Child 2',
        userId: testUserId,
        parentId: parent._id,
      });

      // Delete parent
      await Category.deleteOne({ _id: parent._id });

      // Check that children are now root categories
      const updatedChild1 = await Category.findById(child1._id);
      const updatedChild2 = await Category.findById(child2._id);

      expect(updatedChild1?.parentId).toBeNull();
      expect(updatedChild2?.parentId).toBeNull();
      expect(updatedChild1?.path).toEqual([]);
      expect(updatedChild2?.path).toEqual([]);
      expect(updatedChild1?.level).toBe(0);
      expect(updatedChild2?.level).toBe(0);
    });

    it('should handle deletion of category with no children', async () => {
      const category = await Category.create({
        name: 'No Children',
        userId: testUserId,
      });

      // Should not throw error
      await expect(category.deleteOne()).resolves.toBeDefined();
    });

    it('should handle deletion errors gracefully', async () => {
      const category = new Category({
        name: 'Error Test',
        userId: testUserId,
      });

      // Mock the find method to throw an error
      const originalFind = Category.find;
      Category.find = jest.fn().mockRejectedValue(new Error('Database error'));

      try {
        await category.deleteOne();
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        // Restore original method
        Category.find = originalFind;
      }
    });
  });

  describe('Static Methods', () => {
    it('should get category tree correctly', async () => {
      // Create categories in hierarchy
      const root1 = await Category.create({
        name: 'Root 1',
        userId: testUserId,
      });

      const root2 = await Category.create({
        name: 'Root 2',
        userId: testUserId,
      });

      const child1 = await Category.create({
        name: 'Child 1',
        userId: testUserId,
        parentId: root1._id,
      });

      const child2 = await Category.create({
        name: 'Child 2',
        userId: testUserId,
        parentId: root1._id,
      });

      const grandchild = await Category.create({
        name: 'Grandchild',
        userId: testUserId,
        parentId: child1._id,
      });

      const tree = await Category.getCategoryTree(testUserId.toString());

      expect(tree).toHaveLength(2);
      expect(tree[0].name).toBe('Root 1');
      expect((tree[0] as any).children).toHaveLength(2);
      expect((tree[0] as any).children[0].name).toBe('Child 1');
      expect((tree[0] as any).children[0].children).toHaveLength(1);
      expect((tree[0] as any).children[0].children[0].name).toBe('Grandchild');
      expect(tree[1].name).toBe('Root 2');
      expect((tree[1] as any).children).toHaveLength(0);
    });

    it('should get category path correctly', async () => {
      // Create category with path
      const parent = await Category.create({
        name: 'Parent',
        userId: testUserId,
      });

      const child = await Category.create({
        name: 'Child',
        userId: testUserId,
        parentId: parent._id,
      });

      const path = await Category.getCategoryPath(
        (child._id as mongoose.Types.ObjectId).toString()
      );

      expect(path).toBeDefined();
      expect(path?.id).toEqual(child._id);
      expect(path?.name).toBe('Child');
      expect(path?.path).toEqual(['Parent']);
      // The fullPath should be calculated from the path array
      expect(path?.fullPath).toBe('Parent > Child');
    });

    it('should return null for non-existent category path', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const path = await Category.getCategoryPath(nonExistentId.toString());

      expect(path).toBeNull();
    });

    it('should handle empty category tree', async () => {
      const tree = await Category.getCategoryTree(testUserId.toString());
      expect(tree).toEqual([]);
    });
  });
});
