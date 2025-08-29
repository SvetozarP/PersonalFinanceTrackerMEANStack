import { categoryValidation } from '../../../../modules/financial/categories/validators/category.validation';
import mongoose from 'mongoose';

describe('Category Validation', () => {
  describe('create schema', () => {
    it('should validate valid category creation data', () => {
      const validData = {
        name: 'Test Category',
        description: 'Test description',
        color: '#FF0000',
        icon: 'test-icon',
        parentId: new mongoose.Types.ObjectId().toString(),
      };

      const { error, value } = categoryValidation.create.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should validate minimal valid category data', () => {
      const validData = {
        name: 'Test Category',
      };

      const { error, value } = categoryValidation.create.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject missing name', () => {
      const invalidData = {
        description: 'Test description',
      };

      const { error } = categoryValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Category name is required');
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
      };

      const { error } = categoryValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Category name cannot be empty');
    });

    it('should reject name that is too long', () => {
      const invalidData = {
        name: 'a'.repeat(101),
      };

      const { error } = categoryValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Category name cannot exceed 100 characters'
      );
    });

    it('should reject description that is too long', () => {
      const invalidData = {
        name: 'Test Category',
        description: 'a'.repeat(501),
      };

      const { error } = categoryValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Description cannot exceed 500 characters'
      );
    });

    it('should reject invalid color format', () => {
      const invalidData = {
        name: 'Test Category',
        color: 'invalid-color',
      };

      const { error } = categoryValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Color must be a valid hex color code'
      );
    });

    it('should accept valid hex colors', () => {
      const validColors = ['#FF0000', '#00FF00', '#0000FF', '#FFF', '#000'];

      validColors.forEach(color => {
        const validData = {
          name: 'Test Category',
          color,
        };

        const { error } = categoryValidation.create.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    it('should reject icon that is too long', () => {
      const invalidData = {
        name: 'Test Category',
        icon: 'a'.repeat(51),
      };

      const { error } = categoryValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Icon name cannot exceed 50 characters'
      );
    });

    it('should reject invalid parentId format', () => {
      const invalidData = {
        name: 'Test Category',
        parentId: 'invalid-object-id',
      };

      const { error } = categoryValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Parent ID must be a valid MongoDB ObjectId'
      );
    });

    it('should accept valid parentId', () => {
      const validData = {
        name: 'Test Category',
        parentId: new mongoose.Types.ObjectId().toString(),
      };

      const { error } = categoryValidation.create.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should trim whitespace from string fields', () => {
      const dataWithWhitespace = {
        name: '  Test Category  ',
        description: '  Test description  ',
        icon: '  test-icon  ',
      };

      const { error, value } =
        categoryValidation.create.validate(dataWithWhitespace);

      expect(error).toBeUndefined();
      expect(value.name).toBe('Test Category');
      expect(value.description).toBe('Test description');
      expect(value.icon).toBe('test-icon');
    });
  });

  describe('update schema', () => {
    it('should validate valid category update data', () => {
      const validData = {
        name: 'Updated Category',
        description: 'Updated description',
        color: '#00FF00',
        icon: 'updated-icon',
        parentId: new mongoose.Types.ObjectId().toString(),
        isActive: false,
      };

      const { error, value } = categoryValidation.update.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should validate partial update data', () => {
      const validData = {
        name: 'Updated Category',
      };

      const { error, value } = categoryValidation.update.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should validate empty update data', () => {
      const validData = {};

      const { error, value } = categoryValidation.update.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject empty name if provided', () => {
      const invalidData = {
        name: '',
      };

      const { error } = categoryValidation.update.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Category name cannot be empty');
    });

    it('should reject name that is too long', () => {
      const invalidData = {
        name: 'a'.repeat(101),
      };

      const { error } = categoryValidation.update.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Category name cannot exceed 100 characters'
      );
    });

    it('should reject description that is too long', () => {
      const invalidData = {
        description: 'a'.repeat(501),
      };

      const { error } = categoryValidation.update.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Description cannot exceed 500 characters'
      );
    });

    it('should reject invalid color format', () => {
      const invalidData = {
        color: 'invalid-color',
      };

      const { error } = categoryValidation.update.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Color must be a valid hex color code'
      );
    });

    it('should reject icon that is too long', () => {
      const invalidData = {
        icon: 'a'.repeat(51),
      };

      const { error } = categoryValidation.update.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Icon name cannot exceed 50 characters'
      );
    });

    it('should reject invalid parentId format', () => {
      const invalidData = {
        parentId: 'invalid-object-id',
      };

      const { error } = categoryValidation.update.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Parent ID must be a valid MongoDB ObjectId'
      );
    });

    it('should validate isActive boolean', () => {
      const validData = {
        isActive: true,
      };

      const { error, value } = categoryValidation.update.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should trim whitespace from string fields', () => {
      const dataWithWhitespace = {
        name: '  Updated Category  ',
        description: '  Updated description  ',
        icon: '  updated-icon  ',
      };

      const { error, value } =
        categoryValidation.update.validate(dataWithWhitespace);

      expect(error).toBeUndefined();
      expect(value.name).toBe('Updated Category');
      expect(value.description).toBe('Updated description');
      expect(value.icon).toBe('updated-icon');
    });
  });

  describe('id schema', () => {
    it('should validate valid ObjectId', () => {
      const validData = {
        id: new mongoose.Types.ObjectId().toString(),
      };

      const { error, value } = categoryValidation.id.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject missing id', () => {
      const invalidData = {};

      const { error } = categoryValidation.id.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Category ID is required');
    });

    it('should reject invalid ObjectId format', () => {
      const invalidData = {
        id: 'invalid-object-id',
      };

      const { error } = categoryValidation.id.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Category ID must be a valid MongoDB ObjectId'
      );
    });

    it('should reject empty id', () => {
      const invalidData = {
        id: '',
      };

      const { error } = categoryValidation.id.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('not allowed to be empty');
    });
  });

  describe('query schema', () => {
    it('should validate valid query parameters', () => {
      const validData = {
        parentId: new mongoose.Types.ObjectId().toString(),
        level: 2,
        isActive: true,
        search: 'test search',
        page: 1,
        limit: 20,
      };

      const { error, value } = categoryValidation.query.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should validate empty query parameters', () => {
      const validData = {};

      const { error, value } = categoryValidation.query.validate(validData);

      expect(error).toBeUndefined();
      expect(value.page).toBe(1); // default value
      expect(value.limit).toBe(20); // default value
    });

    it('should reject invalid parentId format', () => {
      const invalidData = {
        parentId: 'invalid-object-id',
      };

      const { error } = categoryValidation.query.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Parent ID must be a valid MongoDB ObjectId'
      );
    });

    it('should reject negative level', () => {
      const invalidData = {
        level: -1,
      };

      const { error } = categoryValidation.query.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Level cannot be negative');
    });

    it('should reject non-integer level', () => {
      const invalidData = {
        level: 1.5,
      };

      const { error } = categoryValidation.query.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Level must be an integer');
    });

    it('should reject non-number level', () => {
      const invalidData = {
        level: 'not-a-number',
      };

      const { error } = categoryValidation.query.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Level must be a number');
    });

    it('should validate isActive boolean', () => {
      const validData = {
        isActive: false,
      };

      const { error, value } = categoryValidation.query.validate(validData);

      expect(error).toBeUndefined();
      expect(value.isActive).toBe(false);
    });

    it('should reject page less than 1', () => {
      const invalidData = {
        page: 0,
      };

      const { error } = categoryValidation.query.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain(
        'must be greater than or equal to 1'
      );
    });

    it('should reject limit less than 1', () => {
      const invalidData = {
        limit: 0,
      };

      const { error } = categoryValidation.query.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain(
        'must be greater than or equal to 1'
      );
    });

    it('should reject limit greater than 100', () => {
      const invalidData = {
        limit: 101,
      };

      const { error } = categoryValidation.query.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain(
        'must be less than or equal to 100'
      );
    });

    it('should apply default values', () => {
      const validData = {};

      const { error, value } = categoryValidation.query.validate(validData);

      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(20);
    });

    it('should trim whitespace from search field', () => {
      const dataWithWhitespace = {
        search: '  test search  ',
      };

      const { error, value } =
        categoryValidation.query.validate(dataWithWhitespace);

      expect(error).toBeUndefined();
      expect(value.search).toBe('test search');
    });
  });

  describe('edge cases and complex validation', () => {
    it('should handle null values gracefully', () => {
      const dataWithNulls = {
        name: 'Test Category',
        description: null,
        color: null,
        icon: null,
        parentId: null,
      };

      const { error } = categoryValidation.create.validate(dataWithNulls);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be a string');
    });

    it('should handle undefined values gracefully', () => {
      const dataWithUndefined = {
        name: 'Test Category',
        description: undefined,
        color: undefined,
        icon: undefined,
        parentId: undefined,
      };

      const { error } = categoryValidation.create.validate(dataWithUndefined);

      expect(error).toBeUndefined();
    });

    it('should reject extra unknown fields in strict mode', () => {
      const dataWithExtraFields = {
        name: 'Test Category',
        unknownField: 'should be stripped',
      };

      const { error, value } =
        categoryValidation.create.validate(dataWithExtraFields);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('not allowed');
    });

    it('should validate complex nested scenarios', () => {
      const complexData = {
        name: '  Complex Category  ',
        description: '  Complex description with special chars !@#$%^&*()  ',
        color: '#AbCdEf',
        icon: '  complex-icon-name  ',
        parentId: new mongoose.Types.ObjectId().toString(),
      };

      const { error, value } = categoryValidation.create.validate(complexData);

      expect(error).toBeUndefined();
      expect(value.name).toBe('Complex Category');
      expect(value.description).toBe(
        'Complex description with special chars !@#$%^&*()'
      );
      expect(value.color).toBe('#AbCdEf');
      expect(value.icon).toBe('complex-icon-name');
    });

    it('should handle multiple validation errors', () => {
      const invalidData = {
        name: '', // empty name
        description: 'a'.repeat(501), // too long description
        color: 'invalid', // invalid color
        icon: 'a'.repeat(51), // too long icon
        parentId: 'invalid-id', // invalid ObjectId
      };

      const { error } = categoryValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details.length).toBeGreaterThan(0);
    });

    it('should validate ObjectIds with different formats', () => {
      const validObjectIds = [
        new mongoose.Types.ObjectId().toString(),
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
      ];

      validObjectIds.forEach(id => {
        const validData = {
          name: 'Test Category',
          parentId: id,
        };

        const { error } = categoryValidation.create.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    it('should reject various invalid ObjectId formats', () => {
      const invalidObjectIds = [
        'too-short',
        '507f1f77bcf86cd799439011z', // invalid character
        '507f1f77bcf86cd79943901', // too short
        '507f1f77bcf86cd799439011a', // too long
        '',
        '   ',
      ];

      invalidObjectIds.forEach(id => {
        const invalidData = {
          name: 'Test Category',
          parentId: id,
        };

        const { error } = categoryValidation.create.validate(invalidData);
        expect(error).toBeDefined();
      });
    });
  });
});
