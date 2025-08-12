import { registerSchema, loginSchema } from '../../../modules/auth/auth.validation';

describe('Auth Validation', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const { error } = registerSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should require all fields', () => {
      const invalidData = {
        email: 'test@example.com',
        // missing password, firstName, lastName
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const { error } = loginSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should require both email and password', () => {
      const invalidData = {
        email: 'test@example.com',
        // missing password
      };

      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});
