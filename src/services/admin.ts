import { api } from "./api";

export interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "inactive" | "suspended";
  profileCompleted: boolean;
  phonePrimary?: string;
  phoneSecondary?: string;
  address?: string;
  emergencyContact?: string;
  profilePhoto?: {
    publicId?: string;
    url?: string;
    originalName?: string;
    uploadedAt?: string;
  };
  bankDetails?: {
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    swiftCode?: string;
    branch?: string;
  };
  mobileMoneyDetails?: {
    mtnNumber?: string;
    airtelNumber?: string;
  };
  statistics: {
    quotations: number;
    receipts: number;
    totalDocuments: number;
  };
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: {
    _id?: string;
    fullName: string;
    email: string;
  };
}

export interface UserPerformance {
  user: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  quotationCount: number;
  totalQuotationValue: number;
  convertedQuotations: number;
  conversionRate: string;
  receiptCount: number;
  totalReceiptValue: number;
  paidReceipts: number;
  paymentRate?: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  userId?: {
    _id: string;
    fullName: string;
    email: string;
  };
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface DocumentStats {
  period: string;
  granularity: string;
  trends: {
    quotations: Array<{
      _id: string;
      count: number;
      totalValue: number;
      converted: number;
    }>;
    receipts: Array<{
      _id: string;
      count: number;
      totalValue: number;
      paid: number;
    }>;
  };
  distribution: {
    quotationStatus: Array<{ _id: string; count: number }>;
    receiptPaymentStatus: Array<{ _id: string; count: number }>;
  };
  dateRange: {
    start: string;
    end: string;
  };
}

export interface DashboardStats {
  period: string;
  totalUsers: number;
  totalQuotations: number;
  totalReceipts: number;
  internationalOrders: number;
  officeMoves: number;
  residentialMoves: number;
  overview: {
    totalUsers: {
      count: number;
      active: number;
      change: string;
    };
    totalDocuments: {
      quotations: number;
      receipts: number;
      quotationsChange: string;
      receiptsChange: string;
    };
    revenue: {
      total: number;
      current: number;
      change: string;
      currency: string;
    };
    notifications: {
      unread: number;
    };
  };
  breakdowns: {
    quotationsByStatus: Record<string, number>;
    receiptsByStatus: Record<string, number>;
    receiptsByPaymentStatus: Record<string, number>;
  };
  recentActivity: {
    quotations: Array<{
      _id: string;
      quotationNumber: string;
      type: string;
      client: {
        fullName: string;
        email?: string;
        phone?: string;
      };
      pricing: {
        totalAmount: number;
        currency: string;
      };
      validity: { status: string };
      createdAt: string;
      createdBy: { fullName: string };
    }>;
    receipts: Array<{
      _id: string;
      receiptNumber: string;
      client: {
        fullName: string;
        email?: string;
        phone?: string;
      };
      payment: {
        totalAmount: number;
        currency: string;
        status: string;
      };
      createdAt: string;
      createdBy: { fullName: string };
    }>;
  };
  dateRange: {
    start: string;
    end: string;
    period: string;
  };
}

export const adminAPI = {
  // User Management
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    profileCompleted?: string;
    sort?: string;
  }) => {
    try {
      const response = await api.get("/users", { params });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error("Error fetching users:", err.response?.data || err.message);
      throw new Error(err.response?.data?.message || "Failed to fetch users");
    }
  },

  getUserById: async (id: string): Promise<AdminUser> => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data.data.user;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch user");
    }
  },

  updateUser: async (id: string, updates: Partial<AdminUser>) => {
    try {
      const response = await api.put(`/users/${id}`, updates);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to update user");
    }
  },

  deleteUser: async (id: string) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to delete user");
    }
  },

  deleteUserPermanently: async (id: string) => {
    try {
      const response = await api.delete(`/users/${id}/permanent`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to permanently delete user");
    }
  },

  bulkSuspendUsers: async (userIds: string[]) => {
    try {
      const response = await api.post("/users/bulk-suspend", { userIds });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to suspend users");
    }
  },

  bulkReactivateUsers: async (userIds: string[]) => {
    try {
      const response = await api.post("/users/bulk-reactivate", { userIds });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to reactivate users");
    }
  },

  reactivateUser: async (id: string) => {
    try {
      const response = await api.put(`/users/${id}/reactivate`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to reactivate user");
    }
  },

  getUserStatistics: async (id: string) => {
    try {
      const response = await api.get(`/users/${id}/statistics`);
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch user statistics");
    }
  },

  // Reports
  getUserPerformanceReport: async (params?: { period?: string; userId?: string }) => {
    try {
      const response = await api.get("/dashboard/reports/user-performance", { params });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch user performance report");
    }
  },

  getDocumentStatsReport: async (params?: { period?: string; granularity?: string }): Promise<DocumentStats> => {
    try {
      const response = await api.get("/dashboard/reports/document-stats", { params });

      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch document statistics");
    }
  },

  // Dashboard Stats
  getDashboardStats: async (params?: { period?: string }) => {
    try {
      const response = await api.get("/dashboard/stats", { params });
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch dashboard statistics");
    }
  },

  // Notifications
  getNotificationStats: async (params?: { period?: string }) => {
    try {
      const response = await api.get("/notifications/stats", { params });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch notification statistics");
    }
  },

  createNotification: async (notificationData: {
    recipientIds: string[];
    type: string;
    title: string;
    message: string;
    priority?: string;
    actionUrl?: string;
    actionText?: string;
  }) => {
    try {
      const response = await api.post("/notifications", notificationData);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to create notification");
    }
  },

  cleanupOldNotifications: async (days?: number) => {
    try {
      const response = await api.delete("/notifications/cleanup", {
        params: { days },
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to cleanup notifications");
    }
  },

  // Audit Logs (Note: These might need to be added to backend routes)
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      // This endpoint might need to be implemented in the backend
      const response = await api.get("/audit-logs", { params });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch audit logs");
    }
  },

  getAuditStats: async (params?: { startDate?: string; endDate?: string }) => {
    try {
      // This endpoint might need to be implemented in the backend
      const response = await api.get("/audit-logs/stats", { params });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch audit statistics");
    }
  },
};
