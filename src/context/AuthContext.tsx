import React, { useEffect, useState, type ReactNode } from "react";
import type { User, LoginCredentials } from "../types/auth";
import { authAPI, tokenManager } from "../services/api";
import { AuthContext, type AuthContextType } from "./auth";

// Note: useAuth hook is exported from ./useAuth file directly to avoid react-refresh warning

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const isAuthenticated = !!user;

  // Initialize auth state
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if we have a stored access token first
      const hasToken = tokenManager.getAccessToken();

      if (!hasToken) {
        // Try to refresh using cookie if available
        try {
          await authAPI.refreshToken();
          const userData = await authAPI.getProfile();
          setUser(userData);
        } catch {
          // No valid session
          setUser(null);
        }
      } else {
        // We have a token, try to get profile
        try {
          const userData = await authAPI.getProfile();
          setUser(userData);
        } catch {
          // Token might be expired, try refresh
          try {
            await authAPI.refreshToken();
            const userData = await authAPI.getProfile();
            setUser(userData);
          } catch {
            // Both failed, clear everything
            setUser(null);
            tokenManager.clearAccessToken();
          }
        }
      }
    } catch {
      // Any unexpected error
      setUser(null);
      tokenManager.clearAccessToken();
    } finally {
      setIsInitializing(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(credentials);
      // This log does not work
      console.log("Login response in context:", response);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        throw new Error(response.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      tokenManager.clearAccessToken();
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authAPI.getProfile();
      setUser(userData);
    } catch (error) {
      setUser(null);
      tokenManager.clearAccessToken();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isInitializing,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
