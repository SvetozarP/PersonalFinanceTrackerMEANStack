import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../../../modules/users/user.model';

// Mock bcrypt
jest.mock('bcryptjs');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('User Model', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/test'
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should create a valid user', async () => {
      const validUser = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(validUser);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(validUser.email);
      expect(savedUser.firstName).toBe(validUser.firstName);
      expect(savedUser.lastName).toBe(validUser.lastName);
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should require email field', async () => {
      const userWithoutEmail = {
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userWithoutEmail);
      await expect(user.save()).rejects.toThrow();
    });

    it('should require password field', async () => {
      const userWithoutPassword = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userWithoutPassword);
      await expect(user.save()).rejects.toThrow();
    });

    it('should require firstName field', async () => {
      const userWithoutFirstName = {
        email: 'test@example.com',
        password: 'TestPass123!',
        lastName: 'Doe',
      };

      const user = new User(userWithoutFirstName);
      await expect(user.save()).rejects.toThrow();
    });

    it('should require lastName field', async () => {
      const userWithoutLastName = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
      };

      const user = new User(userWithoutLastName);
      await expect(user.save()).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const userWithInvalidEmail = {
        email: 'invalid-email',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userWithInvalidEmail);
      await expect(user.save()).rejects.toThrow();
    });

    it('should validate password complexity', async () => {
      const userWithWeakPassword = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userWithWeakPassword);
      await expect(user.save()).rejects.toThrow();
    });

    it('should accept valid password with letters, numbers, and special characters', async () => {
      const userWithValidPassword = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userWithValidPassword);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
    });

    it('should reject password without letters', async () => {
      const userWithInvalidPassword = {
        email: 'test@example.com',
        password: '123456789!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userWithInvalidPassword);
      await expect(user.save()).rejects.toThrow();
    });

    it('should reject password without numbers', async () => {
      const userWithInvalidPassword = {
        email: 'test@example.com',
        password: 'Password!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userWithInvalidPassword);
      await expect(user.save()).rejects.toThrow();
    });

    it('should reject password without special characters', async () => {
      const userWithInvalidPassword = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userWithInvalidPassword);
      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce password minimum length', async () => {
      const userWithShortPassword = {
        email: 'test@example.com',
        password: 'Ab1!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userWithShortPassword);
      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce firstName maximum length', async () => {
      const longFirstName = 'A'.repeat(51);
      const userWithLongFirstName = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: longFirstName,
        lastName: 'Doe',
      };

      const user = new User(userWithLongFirstName);
      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce lastName maximum length', async () => {
      const longLastName = 'A'.repeat(51);
      const userWithLongLastName = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: longLastName,
      };

      const user = new User(userWithLongLastName);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Email Uniqueness', () => {
    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      // Save first user
      const user1 = new User(userData);
      await user1.save();

      // Try to save second user with same email
      const user2 = new User(userData);
      await expect(user2.save()).rejects.toThrow();
    });

    it('should convert email to lowercase', async () => {
      const userData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe('test@example.com');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const mockSalt = 'mocked-salt';
      const mockHash = 'mocked-hash';

      mockBcrypt.genSalt.mockResolvedValue(mockSalt as never);
      mockBcrypt.hash.mockResolvedValue(mockHash as never);

      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userData);
      await user.save();

      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('TestPass123!', mockSalt);
    });

    it('should hash password when password is modified', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userData);
      await user.save();

      // Clear mocks
      jest.clearAllMocks();

      // Mock the salt generation for the second save
      const mockSalt = 'mocked-salt-2';
      mockBcrypt.genSalt.mockResolvedValue(mockSalt as never);

      // Update password field
      user.password = 'NewPass123!';
      await user.save();

      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('NewPass123!', mockSalt);
    });
  });

  describe('Password Comparison', () => {
    it('should compare passwords correctly', async () => {
      const mockResult = true;
      mockBcrypt.compare.mockResolvedValue(mockResult as never);

      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userData);
      await user.save();

      const result = await user.comparePassword('TestPass123!');
      expect(result).toBe(mockResult);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        'TestPass123!',
        user.password
      );
    });
  });

  describe('Virtual Fields', () => {
    it('should have firstName and lastName fields', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.firstName).toBe('John');
      expect(savedUser.lastName).toBe('Doe');
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt automatically', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
      expect(savedUser.createdAt).toBeInstanceOf(Date);
      expect(savedUser.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt when document is modified', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userData);
      const savedUser = await user.save();
      const originalUpdatedAt = savedUser.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      savedUser.firstName = 'Jane';
      savedUser.password = 'TestPass123!'; // Keep the password
      const updatedUser = await savedUser.save();

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('Default Values', () => {
    it('should set isActive to true by default', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.isActive).toBe(true);
    });

    it('should allow setting isActive to false', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
        isActive: false,
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.isActive).toBe(false);
    });
  });

  describe('Optional Fields', () => {
    it('should allow setting lastLogin', async () => {
      const lastLogin = new Date();
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
        lastLogin,
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.lastLogin).toEqual(lastLogin);
    });

    it('should not require lastLogin', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.lastLogin).toBeUndefined();
    });
  });
});
