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
  // New lifecycle management fields
  notificationGroup?: string;
  recipientUserIds?: string[];
  readByUsers?: Array<{ userId: string; readAt: string }>;
  isReadByAllUsers?: boolean;
  adminManaged?: boolean;
  lifecycleStatus?: "active" | "pending_review" | "extended" | "archived";
  reminderSentAt?: string;
  extendedUntil?: string;
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

// New admin management types
export interface NotificationGroup {
  _id: string;
  count: number;
  types: string[];
  readPercentage: number;
  daysSinceOldest: number;
  isUrgent: boolean;
  sampleNotification: Notification;
}

export interface AdminSummaryResponse {
  success: boolean;
  data: {
    groups: NotificationGroup[];
    totalNotifications: number;
    totalUnread: number;
    pendingReviewCount: number;
    overallStats?: Array<{
      totalNotifications: number;
      totalReadByAll: number;
    }>;
  };
  message: string;
}

export interface PendingReviewResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    count: number;
  };
  message: string;
}

export interface BulkDeleteRequest {
  confirmDeletion: boolean;
  criteria?: Record<string, unknown>;
  notificationIds?: string[];
}

export interface BulkDeleteResponse {
  success: boolean;
  data: {
    deletedCount: number;
  };
  message: string;
}

export interface ExtendLifecycleRequest {
  extendDays?: number;
  reason?: string;
}

export interface ExtendLifecycleResponse {
  success: boolean;
  data: Notification;
  message: string;
}

export interface SystemHealth {
  healthScore: {
    score: number;
    level: string;
    issues: string[];
  };
  jobs: Record<string, unknown>;
  alerts: Array<{
    level: string;
    message: string;
    action: string;
  }>;
}

export interface SystemHealthResponse {
  success: boolean;
  data: SystemHealth;
  message: string;
}
