import Joi from 'joi';
import {
  loginSchema,
  registerSchema,
} from '../../../modules/auth/auth.validation';

describe('Auth Validation Schemas', () => {
  describe('Login Schema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const { error, value } = loginSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual({
        ...validData,
        rememberMe: false, // default value added by Joi
      });
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid email address');
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('not allowed to be empty');
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com',
      };

      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Password is required');
    });

    it('should handle rememberMe field', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };

      const { error, value } = loginSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value.rememberMe).toBe(true);
    });

    it('should set rememberMe to false by default', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const { error, value } = loginSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value.rememberMe).toBe(false);
    });
  });

  describe('Register Schema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123@',
        firstName: 'John',
        lastName: 'Doe',
      };

      const { error, value } = registerSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 8 characters');
    });

    it('should reject password without special characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('special character');
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123@',
        firstName: 'John',
        lastName: 'Doe',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid email address');
    });

    it('should reject empty names', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123@',
        firstName: '',
        lastName: 'Doe',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('not allowed to be empty');
    });

    it('should reject short names', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123@',
        firstName: 'A',
        lastName: 'Doe',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('First name must be at least 2 characters');
    });

    it('should reject long names', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123@',
        firstName: 'A'.repeat(51),
        lastName: 'Doe',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('First name cannot exceed 50 characters');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const { error } = loginSchema.validate(null);
      expect(error).toBeDefined();
    });

    it('should handle undefined values', () => {
      const { error } = loginSchema.validate(undefined);
      expect(error).toBeUndefined(); // Joi treats undefined as "no validation needed"
    });

    it('should handle empty objects', () => {
      const { error } = loginSchema.validate({});
      expect(error).toBeDefined();
    });

    it('should handle extra fields gracefully', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        extraField: 'should be ignored',
      };

      const { error, value } = loginSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value.email).toBe('test@example.com');
      expect(value.password).toBe('password123');
    });
  });
});
