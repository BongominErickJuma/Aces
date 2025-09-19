import { api } from "./api";
import type {
  NotificationResponse,
  UnreadCountResponse,
  NotificationFilters,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
  DeleteNotificationResponse,
  NotificationStatsResponse,
  CreateNotificationRequest,
  AdminSummaryResponse,
  PendingReviewResponse,
  BulkDeleteRequest,
  BulkDeleteResponse,
  ExtendLifecycleRequest,
  ExtendLifecycleResponse,
  SystemHealthResponse,
} from "../types/notification";

export const notificationAPI = {
  /**
   * Get user notifications with pagination and filters
   */
  getUserNotifications: async (filters: NotificationFilters = {}): Promise<NotificationResponse> => {
    try {
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.unreadOnly !== undefined) params.append("unreadOnly", filters.unreadOnly.toString());
      if (filters.type) params.append("type", filters.type);
      if (filters.priority) params.append("priority", filters.priority);

      const response = await api.get(`/notifications?${params.toString()}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch notifications");
    }
  },

  /**
   * Get count of unread notifications
   */
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    try {
      const response = await api.get("/notifications/unread-count");
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch unread count");
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string): Promise<MarkAsReadResponse> => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to mark notification as read");
    }
  },

  /**
   * Mark notification as unread
   */
  markAsUnread: async (notificationId: string): Promise<MarkAsReadResponse> => {
    try {
      const response = await api.put(`/notifications/${notificationId}/unread`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to mark notification as unread");
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<MarkAllAsReadResponse> => {
    try {
      const response = await api.put("/notifications/mark-all-read");
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to mark all notifications as read");
    }
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId: string): Promise<DeleteNotificationResponse> => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to delete notification");
    }
  },

  /**
   * Create notification (Admin only)
   */
  createNotification: async (
    data: CreateNotificationRequest
  ): Promise<{ success: boolean; message: string; data: Record<string, unknown> }> => {
    try {
      const response = await api.post("/notifications", data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to create notification");
    }
  },

  /**
   * Get notification statistics (Admin only)
   */
  getNotificationStats: async (period: "7d" | "30d" | "90d" | "1y" = "30d"): Promise<NotificationStatsResponse> => {
    try {
      const response = await api.get(`/notifications/stats?period=${period}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch notification statistics");
    }
  },

  /**
   * Delete old notifications (Admin only)
   */
  cleanupOldNotifications: async (
    days: number = 90
  ): Promise<{ success: boolean; message: string; data: { deletedCount: number } }> => {
    try {
      const response = await api.delete(`/notifications/cleanup?days=${days}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to cleanup old notifications");
    }
  },

  // New Admin Lifecycle Management APIs
  /**
   * Get admin notification summary with grouping
   */
  getAdminSummary: async (params?: Record<string, unknown>): Promise<AdminSummaryResponse> => {
    try {
      const response = await api.get("/notifications/admin/summary", { params });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch admin summary");
    }
  },

  /**
   * Get notifications pending review (30+ days old)
   */
  getPendingReview: async (params?: Record<string, unknown>): Promise<PendingReviewResponse> => {
    try {
      const response = await api.get("/notifications/admin/pending-review", { params });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch pending review notifications");
    }
  },

  /**
   * Bulk delete notifications
   */
  bulkDelete: async (data: BulkDeleteRequest): Promise<BulkDeleteResponse> => {
    try {
      const response = await api.delete("/notifications/admin/bulk-delete", { data });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to bulk delete notifications");
    }
  },

  /**
   * Extend notification lifecycle
   */
  extendLifecycle: async (id: string, data: ExtendLifecycleRequest): Promise<ExtendLifecycleResponse> => {
    try {
      const response = await api.put(`/notifications/admin/${id}/extend`, data);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to extend notification lifecycle");
    }
  },

  /**
   * Update admin settings
   */
  updateAdminSettings: async (
    settings: Record<string, unknown>
  ): Promise<{ success: boolean; message: string; data: Record<string, unknown> }> => {
    try {
      const response = await api.put("/notifications/admin/settings", settings);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to update admin settings");
    }
  },

  /**
   * Get notification analytics
   */
  getAnalytics: async (
    params?: Record<string, unknown>
  ): Promise<{ success: boolean; message: string; data: Record<string, unknown> }> => {
    try {
      const response = await api.get("/notifications/admin/analytics", { params });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch analytics");
    }
  },

  /**
   * Run lifecycle job manually
   */
  runLifecycleJob: async (): Promise<{ success: boolean; message: string; data: Record<string, unknown> }> => {
    try {
      const response = await api.post("/notifications/admin/run-lifecycle-job");
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to run lifecycle job");
    }
  },

  /**
   * Get system health status
   */
  getSystemHealth: async (): Promise<SystemHealthResponse> => {
    try {
      const response = await api.get("/notifications/admin/system-health");
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch system health");
    }
  },

  /**
   * Get group statistics breakdown
   */
  getGroupStats: async (): Promise<{
    success: boolean;
    message: string;
    data: {
      groupStats: Array<{
        type: string;
        count: number;
        notificationCount: number;
        description: string;
        readCount: number;
        unreadCount: number;
        latestActivity: string;
        oldestActivity: string;
        groups: Array<{
          groupName: string;
          displayName: string;
          notificationCount: number;
          readCount: number;
          unreadCount: number;
          latestCreated: string;
          oldestCreated: string;
          sampleNotifications: Array<{
            title: string;
            message: string;
            createdAt: string;
            priority: string;
            isRead: boolean;
          }>;
        }>;
      }>;
      totalGroups: number;
      summary: {
        totalNotificationTypes: number;
        totalNotifications: number;
        totalGroupsCount: number;
      };
    };
  }> => {
    try {
      const response = await api.get("/notifications/admin/group-stats");
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to fetch group statistics");
    }
  },
};
