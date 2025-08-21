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

      expect(savedCategory.description).toBe('A comprehensive category description');
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

      expect(updatedCategory.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
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
});
