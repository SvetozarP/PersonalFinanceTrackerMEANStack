import {
  registerSchema,
  loginSchema,
} from '../../../modules/auth/auth.validation';

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
      expect(error?.details.length).toBeGreaterThan(0);
    });

    it('should validate email format', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test.example.com',
        '',
        'test@example',
      ];

      invalidEmails.forEach(email => {
        const { error } = registerSchema.validate({
          email,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        });
        expect(error).toBeDefined();
      });
    });

    it('should validate password complexity requirements', () => {
      const invalidPasswords = [
        'password', // no uppercase, no number, no special char
        'PASSWORD', // no lowercase, no number, no special char
        'Password', // no number, no special char
        'Password1', // no special char
        'Pass@word', // no number
        '12345678', // no letters, no special char
        'Pass@1', // too short
        '', // empty
      ];

      invalidPasswords.forEach(password => {
        const { error } = registerSchema.validate({
          email: 'test@example.com',
          password,
          firstName: 'Test',
          lastName: 'User',
        });
        expect(error).toBeDefined();
      });
    });

    it('should accept valid passwords with allowed special characters', () => {
      // Only use special characters that are allowed by the regex: @$!%*?&
      const validPasswords = [
        'Password123@',
        'Secure@456',
        'MyPass$789',
        'Test$123',
        'Complex%456',
        'Strong@789',
        'Valid&123',
        'Good*456',
        'Safe@789',
        'Reliable$123',
      ];

      validPasswords.forEach(password => {
        const { error } = registerSchema.validate({
          email: 'test@example.com',
          password,
          firstName: 'Test',
          lastName: 'User',
        });
        expect(error).toBeUndefined();
      });
    });

    it('should validate firstName requirements', () => {
      const invalidFirstNames = [
        '', // empty
        'A', // too short
        'A'.repeat(51), // too long
      ];

      invalidFirstNames.forEach(firstName => {
        const { error } = registerSchema.validate({
          email: 'test@example.com',
          password: 'Password123@',
          firstName,
          lastName: 'User',
        });
        expect(error).toBeDefined();
      });

      // Valid first names - use only simple ASCII names
      const validFirstNames = [
        'John',
        'Mary',
        'Jane',
        'Robert',
        'Michael',
        'David',
      ];

      validFirstNames.forEach(firstName => {
        const { error } = registerSchema.validate({
          email: 'test@example.com',
          password: 'Password123@',
          firstName,
          lastName: 'User',
        });
        expect(error).toBeUndefined();
      });
    });

    it('should validate lastName requirements', () => {
      const invalidLastNames = [
        '', // empty
        'A', // too short
        'A'.repeat(51), // too long
      ];

      invalidLastNames.forEach(lastName => {
        const { error } = registerSchema.validate({
          email: 'test@example.com',
          password: 'Password123@',
          firstName: 'Test',
          lastName,
        });
        expect(error).toBeDefined();
      });

      // Valid last names - use only simple ASCII names
      const validLastNames = [
        'Smith',
        'Johnson',
        'Williams',
        'Brown',
        'Jones',
        'Garcia',
      ];

      validLastNames.forEach(lastName => {
        const { error } = registerSchema.validate({
          email: 'test@example.com',
          password: 'Password123@',
          firstName: 'Test',
          lastName,
        });
        expect(error).toBeUndefined();
      });
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
      expect(error?.details.length).toBeGreaterThan(0);
    });

    it('should validate email format for login', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test.example.com',
        '',
        'test@example',
      ];

      invalidEmails.forEach(email => {
        const { error } = loginSchema.validate({
          email,
          password: 'Password123!',
        });
        expect(error).toBeDefined();
      });
    });

    it('should accept rememberMe as optional boolean', () => {
      const dataWithRememberMe = {
        email: 'test@example.com',
        password: 'Password123!',
        rememberMe: true,
      };

      const { error, value } = loginSchema.validate(dataWithRememberMe);
      expect(error).toBeUndefined();
      expect(value.rememberMe).toBe(true);
    });

    it('should set rememberMe to false by default', () => {
      const dataWithoutRememberMe = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const { error, value } = loginSchema.validate(dataWithoutRememberMe);
      expect(error).toBeUndefined();
      expect(value.rememberMe).toBe(false);
    });

    it('should accept rememberMe as string and convert to boolean', () => {
      const dataWithStringRememberMe = {
        email: 'test@example.com',
        password: 'Password123!',
        rememberMe: 'true',
      };

      const { error, value } = loginSchema.validate(dataWithStringRememberMe);
      expect(error).toBeUndefined();
      expect(value.rememberMe).toBe(true);
    });

    it('should handle edge cases for rememberMe', () => {
      const edgeCases = [
        { rememberMe: true, expected: true },
        { rememberMe: false, expected: false },
        { rememberMe: undefined, expected: false },
      ];

      edgeCases.forEach(({ rememberMe, expected }) => {
        const { error, value } = loginSchema.validate({
          email: 'test@example.com',
          password: 'Password123!',
          rememberMe,
        });
        expect(error).toBeUndefined();
        expect(value.rememberMe).toBe(expected);
      });
    });
  });

  describe('schema configuration', () => {
    it('should have proper error messages for register schema', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'weak',
        firstName: '',
        lastName: '',
      };

      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();

      const errorMessages = error?.details.map(detail => detail.message);
      expect(errorMessages).toContain('Please provide a valid email address');

      // Test password validation separately
      const passwordData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
      };
      const passwordError = registerSchema.validate(passwordData);
      expect(passwordError.error).toBeDefined();
      expect(
        passwordError.error?.details.some(detail =>
          detail.message.includes('Password')
        )
      ).toBe(true);

      // Test firstName validation separately
      const firstNameData = {
        email: 'test@example.com',
        password: 'Password123@',
        firstName: '',
        lastName: 'User',
      };
      const firstNameError = registerSchema.validate(firstNameData);
      expect(firstNameError.error).toBeDefined();
      expect(
        firstNameError.error?.details.some(detail =>
          detail.message.includes('firstName')
        )
      ).toBe(true);

      // Test lastName validation separately
      const lastNameData = {
        email: 'test@example.com',
        password: 'Password123@',
        firstName: 'Test',
        lastName: '',
      };
      const lastNameError = registerSchema.validate(lastNameData);
      expect(lastNameError.error).toBeDefined();
      expect(
        lastNameError.error?.details.some(detail =>
          detail.message.includes('lastName')
        )
      ).toBe(true);
    });

    it('should have proper error messages for login schema', () => {
      const invalidData = {
        email: 'invalid-email',
        // missing password
      };

      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();

      const errorMessages = error?.details.map(detail => detail.message);
      expect(errorMessages).toContain('Please provide a valid email address');

      // Test password validation separately
      const passwordData = {
        email: 'test@example.com',
        // missing password
      };
      const passwordError = loginSchema.validate(passwordData);
      expect(passwordError.error).toBeDefined();
      expect(
        passwordError.error?.details.some(detail =>
          detail.message.includes('Password')
        )
      ).toBe(true);
    });
  });
});
