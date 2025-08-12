import { BaseRepository } from '../../shared/repositories/base.repository';
import { User, IUser } from './user.model';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find user by email with password (for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase() }, '+password');
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    return this.exists({ email: email.toLowerCase() });
  }

  /**
   * Update user's last login
   */
  async updateLastLogin(userId: string): Promise<IUser | null> {
    return this.updateById(userId, { lastLogin: new Date() });
  }

  /**
   * Find active users
   */
  async findActiveUsers(): Promise<IUser[]> {
    return this.find({ isActive: true });
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId: string): Promise<IUser | null> {
    return this.updateById(userId, { isActive: false });
  }

  /**
   * Reactivate user
   */
  async reactivateUser(userId: string): Promise<IUser | null> {
    return this.updateById(userId, { isActive: true });
  }

  /**
   * Search users by name
   */
  async searchByName(searchTerm: string): Promise<IUser[]> {
    const regex = new RegExp(searchTerm, 'i');
    return this.find({
      $or: [{ firstName: { $regex: regex } }, { lastName: { $regex: regex } }],
    });
  }

  /**
   * Get users with pagination and search
   */
  async getUsersWithSearch(
    searchTerm?: string,
    page: number = 1,
    limit: number = 10,
    sort: any = { createdAt: -1 }
  ): Promise<{
    documents: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let filter: any = {};

    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      filter = {
        $or: [
          { firstName: { $regex: regex } },
          { lastName: { $regex: regex } },
          { email: { $regex: regex } },
        ],
      };
    }

    return this.findWithPagination(filter, page, limit, sort);
  }
}

export const userRepository = new UserRepository();
