import * as jwt from 'jsonwebtoken';
import { User, IUser } from '../users/user.model';
import mongoose from 'mongoose';

// Tokens interface
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Interface for login credentials
export interface ILoginCredentials {
  email: string;
  password: string;
}

//Interface for registration
export interface IRegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class AuthService {
  private readonly JWT_SECRET: jwt.Secret =
    process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '1h';
  private readonly REFRESH_TOKEN_EXPIRES_IN: string = '7d';

  async register(userData: IRegisterData): Promise<IUser> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Return user without password
    const userWithoutPassword = user.toObject();
    if (userWithoutPassword.password) {
      delete (userWithoutPassword as any).password;
    }

    return userWithoutPassword as IUser;
  }

  async login(
    credentials: ILoginCredentials
  ): Promise<{ user: IUser; tokens: IAuthTokens }> {
    // Find user and include password for comparison
    const user = await User.findOne({ email: credentials.email }).select(
      '+password'
    );
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(credentials.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = await this.generateTokens(
      (user._id as mongoose.Types.ObjectId).toString()
    );

    // Return user without password and tokens
    const userWithoutPassword = user.toObject();
    if (userWithoutPassword.password) {
      delete (userWithoutPassword as any).password;
    }

    return { user: userWithoutPassword as IUser, tokens };
  }

  async refreshToken(refreshToken: string): Promise<IAuthTokens> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        this.JWT_SECRET as jwt.Secret
      ) as jwt.JwtPayload & { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      return await this.generateTokens(
        (user._id as mongoose.Types.ObjectId).toString()
      );
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    // In a more advanced implementation, you might want to blacklist the refresh token
    // For now, we'll just log the logout action
    console.log(`User ${userId} logged out`);
  }

  private signJWT(payload: object, expiresIn: string): string {
    if (!this.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }
    // @ts-ignore - JWT types compatibility issue
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn });
  }

  private async generateTokens(userId: string): Promise<IAuthTokens> {
    const accessToken = this.signJWT(
      { userId, type: 'access' },
      this.JWT_EXPIRES_IN
    );

    const refreshToken = this.signJWT(
      { userId, type: 'refresh' },
      this.REFRESH_TOKEN_EXPIRES_IN
    );

    return { accessToken, refreshToken };
  }

  async validateToken(token: string): Promise<{ userId: string }> {
    try {
      const decoded = jwt.verify(
        token,
        this.JWT_SECRET as jwt.Secret
      ) as jwt.JwtPayload & { userId: string; type: string };

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return { userId: decoded.userId };
    } catch {
      throw new Error('Invalid token');
    }
  }
}
