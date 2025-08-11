export interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    preferences?: UserPreferences;
  }
  
  export interface UserPreferences {
    currency: string;
    dateFormat: string;
    theme: 'light' | 'dark';
    notifications: {
      email: boolean;
      push: boolean;
      budgetAlerts: boolean;
    };
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
  }
  
  export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }
  
  export interface AuthResponse {
    user: User;
    tokens: AuthTokens;
  }
  
  export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
  }
  
  export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
  }
  
  export interface PasswordResetRequest {
    email: string;
  }
  
  export interface PasswordResetConfirm {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }
  
  export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  }