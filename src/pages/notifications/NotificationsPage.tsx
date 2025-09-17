import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Filter,
  CheckCheck,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";
import { PageLayout } from "../../components/layout";
import { notificationAPI } from "../../services/notifications";
import type { NotificationPagination, NotificationType, NotificationPriority } from "../../types/notification";

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedType] = useState<NotificationType | "all">("all");
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // Load notifications
  useEffect(() => {
    const loadNotifications = async (page = 1) => {
      try {
        setLoading(true);
        const response = await notificationAPI.getUserNotifications({
          page,
          limit: 20,
          unreadOnly: selectedFilter === "unread" ? true : undefined,
          type: selectedType !== "all" ? selectedType : undefined,
          priority: selectedPriority !== "all" ? selectedPriority : undefined,
        });
        setNotifications(response.data);
        setCurrentPage(page);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    loadNotifications(1);
  }, [selectedFilter, selectedType, selectedPriority]);

  // Separate loadNotifications for other uses
  const loadNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const response = await notificationAPI.getUserNotifications({
        page,
        limit: 20,
        unreadOnly: selectedFilter === "unread" ? true : undefined,
        type: selectedType !== "all" ? selectedType : undefined,
        priority: selectedPriority !== "all" ? selectedPriority : undefined,
      });
      setNotifications(response.data);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Handle mark as read/unread
  const handleMarkAsRead = async (notificationId: string, currentReadStatus: boolean) => {
    try {
      if (currentReadStatus) {
        await notificationAPI.markAsUnread(notificationId);
      } else {
        await notificationAPI.markAsRead(notificationId);
      }
      await loadNotifications(currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update notification");
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      await loadNotifications(currentPage);
      setSelectedNotifications(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark all as read");
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      await loadNotifications(currentPage);
      setSelectedNotifications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete notification");
    }
  };

  // Handle bulk actions
  const handleBulkMarkAsRead = async () => {
    try {
      await Promise.all(Array.from(selectedNotifications).map((id) => notificationAPI.markAsRead(id)));
      await loadNotifications(currentPage);
      setSelectedNotifications(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update notifications");
    }
  };

  // Toggle notification selection
  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  // Get notification icon
  const getNotificationIcon = (type: NotificationType, priority: NotificationPriority) => {
    if (priority === "urgent" || priority === "high") {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }

    switch (type) {
      case "document_created":
      case "document_updated":
      case "quotation_converted":
      case "payment_received":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "document_deleted":
      case "payment_overdue":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "quotation_expired":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && !notifications) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aces-green"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="w-8 h-8 text-aces-green" />
              Notifications
            </h1>
            <p className="text-gray-600 mt-1">Stay updated with your system activities</p>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            {selectedNotifications.size > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleBulkMarkAsRead}
                className="px-4 py-2 bg-aces-green text-white rounded-lg hover:bg-aces-green/90 transition-colors flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Mark {selectedNotifications.size} as Read
              </motion.button>
            )}

            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />

            {/* Read Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as "all" | "unread" | "read")}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aces-green focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Priority:</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as NotificationPriority | "all")}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aces-green focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {/* Notifications List */}
        {notifications && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {notifications.docs.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                <AnimatePresence>
                  {notifications.docs.map((notification, index) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? "bg-blue-50/50 border-l-4 border-l-blue-500" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Selection checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedNotifications.has(notification._id)}
                          onChange={() => toggleNotificationSelection(notification._id)}
                          className="mt-1 rounded border-gray-300 text-aces-green focus:ring-aces-green"
                        />

                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type, notification.priority)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4
                                className={`text-sm font-medium ${
                                  !notification.read ? "text-gray-900" : "text-gray-700"
                                }`}
                              >
                                {notification.title}
                              </h4>
                              <p className={`text-sm mt-1 ${!notification.read ? "text-gray-800" : "text-gray-600"}`}>
                                {notification.message}
                              </p>

                              <div className="flex items-center gap-3 mt-2">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
                                    notification.priority
                                  )}`}
                                >
                                  {notification.priority}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {notification.timeAgo || new Date(notification.createdAt).toLocaleDateString()}
                                </span>
                                {notification.actor && (
                                  <span className="text-xs text-gray-500">by {notification.actor.fullName}</span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {notification.actionUrl && (
                                <button
                                  onClick={() => window.open(notification.actionUrl, "_blank")}
                                  className="p-1 text-gray-400 hover:text-aces-green transition-colors"
                                  title={notification.actionText || "View"}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => handleMarkAsRead(notification._id, notification.read)}
                                className="p-1 text-gray-400 hover:text-aces-green transition-colors"
                                title={notification.read ? "Mark as unread" : "Mark as read"}
                              >
                                {notification.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>

                              <button
                                onClick={() => handleDeleteNotification(notification._id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete notification"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            {notifications && notifications.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {notifications.pagingCounter} to{" "}
                  {Math.min(notifications.pagingCounter + notifications.limit - 1, notifications.totalDocs)} of{" "}
                  {notifications.totalDocs} notifications
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadNotifications(currentPage - 1)}
                    disabled={!notifications.hasPrevPage || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-gray-600">
                    Page {notifications.page} of {notifications.totalPages}
                  </span>

                  <button
                    onClick={() => loadNotifications(currentPage + 1)}
                    disabled={!notifications.hasNextPage || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </PageLayout>
  );
};

export default NotificationsPage;
