export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'member' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  phonePrimary?: string;
  phoneSecondary?: string;
  address?: string;
  emergencyContact?: string;
  profilePhoto?: {
    url: string;
    originalName?: string;
    publicId?: string;
    uploadedAt?: string;
  };
  signature?: {
    type?: 'canvas' | 'upload';
    data?: string;
    publicId?: string;
    originalName?: string;
    createdAt?: string;
  };
  profileCompleted: boolean;
  profileCompletionStatus?: {
    isComplete: boolean;
    missingFields: string[];
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  createdBy?: string;
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