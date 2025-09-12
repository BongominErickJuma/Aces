export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'member' | 'user';
  status: 'active' | 'suspended';
  phonePrimary?: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    tokens: {
      accessToken: string;
      expiresIn: number;
      tokenType: string;
    };
    sessionInfo: {
      lastLogin: string;
      rememberMe: boolean;
    };
  };
}

export interface TokenResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
  };
}