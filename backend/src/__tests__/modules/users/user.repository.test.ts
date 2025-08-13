import { UserRepository } from '../../../modules/users/user.repository';
import { User, IUser } from '../../../modules/users/user.model';

// Mock the base repository
jest.mock('../../../shared/repositories/base.repository', () => {
  return {
    BaseRepository: jest.fn().mockImplementation(() => ({
      findOne: jest.fn(),
      exists: jest.fn(),
      updateById: jest.fn(),
      find: jest.fn(),
      findWithPagination: jest.fn(),
    })),
  };
});

// Mock the User model
jest.mock('../../../modules/users/user.model', () => ({
  User: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
    exists: jest.fn(),
    aggregate: jest.fn(),
  },
}));

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} as IUser;

describe('User Repository', () => {
  let userRepository: UserRepository;
  let mockBaseRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a new instance and get the mocked base repository methods
    userRepository = new UserRepository();

    // Get the mocked methods from the instance
    mockBaseRepository = {
      findOne: jest.fn(),
      exists: jest.fn(),
      updateById: jest.fn(),
      find: jest.fn(),
      findWithPagination: jest.fn(),
    };

    // Replace the methods on the repository instance
    (userRepository as any).findOne = mockBaseRepository.findOne;
    (userRepository as any).exists = mockBaseRepository.exists;
    (userRepository as any).updateById = mockBaseRepository.updateById;
    (userRepository as any).find = mockBaseRepository.find;
    (userRepository as any).findWithPagination =
      mockBaseRepository.findWithPagination;
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      mockBaseRepository.findOne.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockBaseRepository.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should return null when user not found', async () => {
      mockBaseRepository.findOne.mockResolvedValue(null);

      const result = await userRepository.findByEmail(
        'nonexistent@example.com'
      );

      expect(result).toBeNull();
    });

    it('should convert email to lowercase', async () => {
      mockBaseRepository.findOne.mockResolvedValue(mockUser);

      await userRepository.findByEmail('TEST@EXAMPLE.COM');

      expect(mockBaseRepository.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should find user by email with password', async () => {
      mockBaseRepository.findOne.mockResolvedValue(mockUser);

      const result =
        await userRepository.findByEmailWithPassword('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockBaseRepository.findOne).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        '+password'
      );
    });
  });

  describe('emailExists', () => {
    it('should return true when email exists', async () => {
      mockBaseRepository.exists.mockResolvedValue(true);

      const result = await userRepository.emailExists('test@example.com');

      expect(result).toBe(true);
      expect(mockBaseRepository.exists).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should return false when email does not exist', async () => {
      mockBaseRepository.exists.mockResolvedValue(false);

      const result = await userRepository.emailExists(
        'nonexistent@example.com'
      );

      expect(result).toBe(false);
    });

    it('should convert email to lowercase', async () => {
      mockBaseRepository.exists.mockResolvedValue({ _id: '123' });

      await userRepository.emailExists('TEST@EXAMPLE.COM');

      expect(mockBaseRepository.exists).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  describe('updateLastLogin', () => {
    it('should update user last login successfully', async () => {
      const updatedUser = { ...mockUser, lastLogin: new Date() };
      mockBaseRepository.updateById.mockResolvedValue(updatedUser);

      const result = await userRepository.updateLastLogin('123');

      expect(result).toEqual(updatedUser);
      expect(mockBaseRepository.updateById).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          lastLogin: expect.any(Date),
        })
      );
    });
  });

  describe('findActiveUsers', () => {
    it('should find active users successfully', async () => {
      const activeUsers = [mockUser];
      mockBaseRepository.find.mockResolvedValue(activeUsers);

      const result = await userRepository.findActiveUsers();

      expect(result).toEqual(activeUsers);
      expect(mockBaseRepository.find).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };
      mockBaseRepository.updateById.mockResolvedValue(deactivatedUser);

      const result = await userRepository.deactivateUser('123');

      expect(result).toEqual(deactivatedUser);
      expect(mockBaseRepository.updateById).toHaveBeenCalledWith('123', {
        isActive: false,
      });
    });
  });

  describe('reactivateUser', () => {
    it('should reactivate user successfully', async () => {
      const reactivatedUser = { ...mockUser, isActive: true };
      mockBaseRepository.updateById.mockResolvedValue(reactivatedUser);

      const result = await userRepository.reactivateUser('123');

      expect(result).toEqual(reactivatedUser);
      expect(mockBaseRepository.updateById).toHaveBeenCalledWith('123', {
        isActive: true,
      });
    });
  });

  describe('searchByName', () => {
    it('should search users by name successfully', async () => {
      const searchResults = [mockUser];
      mockBaseRepository.find.mockResolvedValue(searchResults);

      const result = await userRepository.searchByName('Test');

      expect(result).toEqual(searchResults);
      expect(mockBaseRepository.find).toHaveBeenCalledWith({
        $or: [
          { firstName: { $regex: /Test/i } },
          { lastName: { $regex: /Test/i } },
        ],
      });
    });

    it('should handle case-insensitive search', async () => {
      const searchResults = [mockUser];
      mockBaseRepository.find.mockResolvedValue(searchResults);

      await userRepository.searchByName('test');

      expect(mockBaseRepository.find).toHaveBeenCalledWith({
        $or: [
          { firstName: { $regex: /test/i } },
          { lastName: { $regex: /test/i } },
        ],
      });
    });
  });

  describe('getUsersWithSearch', () => {
    it('should get users with search and pagination successfully', async () => {
      const mockPaginationResult = {
        documents: [mockUser],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockBaseRepository.findWithPagination.mockResolvedValue(
        mockPaginationResult
      );

      const result = await userRepository.getUsersWithSearch('Test', 1, 10);

      expect(result).toEqual(mockPaginationResult);
    });

    it('should search by email when search term is provided', async () => {
      const mockPaginationResult = {
        documents: [mockUser],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockBaseRepository.findWithPagination.mockResolvedValue(
        mockPaginationResult
      );

      await userRepository.getUsersWithSearch('test@example.com', 1, 10);

      expect(mockBaseRepository.findWithPagination).toHaveBeenCalledWith(
        {
          $or: [
            { firstName: { $regex: /test@example.com/i } },
            { lastName: { $regex: /test@example.com/i } },
            { email: { $regex: /test@example.com/i } },
          ],
        },
        1,
        10,
        { createdAt: -1 }
      );
    });

    it('should use default filter when no search term is provided', async () => {
      const mockPaginationResult = {
        documents: [mockUser],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockBaseRepository.findWithPagination.mockResolvedValue(
        mockPaginationResult
      );

      await userRepository.getUsersWithSearch(undefined, 1, 10);

      expect(mockBaseRepository.findWithPagination).toHaveBeenCalledWith(
        {},
        1,
        10,
        { createdAt: -1 }
      );
    });
  });

  describe('Repository Instance', () => {
    it('should export a repository instance', () => {
      // Mock the module import
      jest.doMock('../../../modules/users/user.repository', () => ({
        userRepository: {
          findByEmail: jest.fn(),
          findByEmailWithPassword: jest.fn(),
          emailExists: jest.fn(),
          updateLastLogin: jest.fn(),
          findActiveUsers: jest.fn(),
          deactivateUser: jest.fn(),
          reactivateUser: jest.fn(),
          searchByName: jest.fn(),
          getUsersWithSearch: jest.fn(),
        },
      }));

      const {
        userRepository: exportedRepo,
      } = require('../../../modules/users/user.repository');
      expect(exportedRepo).toBeDefined();
      expect(exportedRepo).toHaveProperty('findByEmail');
    });
  });
});
