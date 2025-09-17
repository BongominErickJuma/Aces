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
  createNotification: async (data: CreateNotificationRequest): Promise<{ success: boolean; message: string; data: Record<string, unknown> }> => {
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
  cleanupOldNotifications: async (days: number = 90): Promise<{ success: boolean; message: string; data: { deletedCount: number } }> => {
    try {
      const response = await api.delete(`/notifications/cleanup?days=${days}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || "Failed to cleanup old notifications");
    }
  },
};
