export type NotificationType =
  | "document_created"
  | "document_updated"
  | "document_deleted"
  | "quotation_expired"
  | "quotation_converted"
  | "payment_received"
  | "payment_overdue"
  | "user_created"
  | "user_updated"
  | "user_role_changed"
  | "user_deleted"
  | "profile_incomplete"
  | "system_maintenance"
  | "backup_completed"
  | "security_alert";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface NotificationActor {
  _id: string;
  fullName: string;
  email: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  priority: NotificationPriority;
  actionUrl?: string;
  actionText?: string;
  actorId?: string;
  actor?: NotificationActor;
  metadata?: Record<string, unknown>;
  readAt?: string;
  expiresAt?: string;
  isExpired?: boolean;
  timeAgo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPagination {
  docs: Notification[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface NotificationResponse {
  success: boolean;
  data: NotificationPagination;
  message: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
  message: string;
}

export interface NotificationStats {
  period: string;
  totalNotifications: number;
  totalUnread: number;
  readRate: string;
  notificationsByType: Record<string, number>;
  notificationsByPriority: Record<string, number>;
  recentNotifications: Notification[];
}

export interface NotificationStatsResponse {
  success: boolean;
  data: NotificationStats;
  message: string;
}

export interface CreateNotificationRequest {
  recipientIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
}

export interface MarkAsReadResponse {
  success: boolean;
  data: Notification;
  message: string;
}

export interface MarkAllAsReadResponse {
  success: boolean;
  data: {
    modifiedCount: number;
  };
  message: string;
}

export interface DeleteNotificationResponse {
  success: boolean;
  data: null;
  message: string;
}
