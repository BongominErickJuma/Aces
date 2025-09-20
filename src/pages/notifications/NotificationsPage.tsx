import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Filter,
  CheckCheck,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
  Shield,
  Calendar,
  Clock,
  Users,
} from "lucide-react";
import { PageLayout } from "../../components/layout";
import GroupStatsModal from "../../components/notifications/GroupStatsModal";
import BulkDeleteModal from "../../components/notifications/BulkDeleteModal";
import NotificationsSkeleton from "../../components/skeletons/NotificationsSkeleton";
import NotificationsAdminSkeleton from "../../components/skeletons/NotificationsAdminSkeleton";
import { notificationAPI } from "../../services/notifications";
import { useAuth } from "../../hooks/useAuth";
import type {
  NotificationPagination,
  NotificationType,
  NotificationPriority,
  Notification,
  AdminSummaryResponse,
  PendingReviewResponse,
  SystemHealth,
} from "../../types/notification";

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"unread" | "read" | "manage">("unread");
  const [selectedType] = useState<NotificationType | "all">("all");
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // Admin management state
  const [adminSummary, setAdminSummary] = useState<AdminSummaryResponse["data"] | null>(null);
  const [pendingReview, setPendingReview] = useState<PendingReviewResponse["data"] | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  // Group stats modal state
  const [showGroupStatsModal, setShowGroupStatsModal] = useState(false);
  const [groupStatsLoading, setGroupStatsLoading] = useState(false);

  // Bulk delete modal state
  const [bulkDeleteModal, setBulkDeleteModal] = useState({
    isOpen: false,
    loading: false,
  });
  const [groupStats, setGroupStats] = useState<
    Array<{
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
    }>
  >([]);

  // Helper function to check if current user has read a notification
  const isReadByCurrentUser = (notification: Notification): boolean => {
    if (!user?._id || !notification.readByUsers) return notification.read || false;
    return notification.readByUsers.some((reader) => reader.userId === user._id);
  };

  // Load notifications based on active tab
  useEffect(() => {
    const loadData = async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        if (activeTab === "manage" && user?.role === "admin") {
          // Load admin data
          setAdminLoading(true);
          const [summaryResponse, pendingResponse, healthResponse] = await Promise.all([
            notificationAPI.getAdminSummary(),
            notificationAPI.getPendingReview(),
            notificationAPI.getSystemHealth(),
          ]);
          setAdminSummary(summaryResponse.data);
          setPendingReview(pendingResponse.data);
          setSystemHealth(healthResponse.data);
          setAdminLoading(false);
        } else {
          // Load regular notifications
          let unreadOnlyParam: boolean | undefined = undefined;
          if (activeTab === "unread") {
            unreadOnlyParam = true;
          } else if (activeTab === "read") {
            unreadOnlyParam = false;
          }

          const response = await notificationAPI.getUserNotifications({
            page,
            limit: 20,
            unreadOnly: unreadOnlyParam,
            type: selectedType !== "all" ? selectedType : undefined,
            priority: selectedPriority !== "all" ? selectedPriority : undefined,
          });
          setNotifications(response.data);
          setCurrentPage(page);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData(1);
  }, [activeTab, selectedType, selectedPriority, user?.role]);

  // Separate loadNotifications for other uses
  const loadNotifications = async (page = 1) => {
    try {
      setLoading(true);

      let unreadOnlyParam: boolean | undefined = undefined;
      if (activeTab === "unread") {
        unreadOnlyParam = true;
      } else if (activeTab === "read") {
        unreadOnlyParam = false;
      }

      const response = await notificationAPI.getUserNotifications({
        page,
        limit: 20,
        unreadOnly: unreadOnlyParam,
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

  // Admin action handlers
  const handleExtendLifecycle = async (notificationId: string, extendDays: number = 30) => {
    try {
      await notificationAPI.extendLifecycle(notificationId, { extendDays, reason: "Extended by admin" });
      // Reload admin data
      if (activeTab === "manage") {
        const pendingResponse = await notificationAPI.getPendingReview();
        setPendingReview(pendingResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extend lifecycle");
    }
  };

  const handleBulkDeleteRead = async () => {
    setBulkDeleteModal({ isOpen: true, loading: false });
  };

  const handleConfirmBulkDelete = async () => {
    try {
      setBulkDeleteModal((prev) => ({ ...prev, loading: true }));

      await notificationAPI.bulkDelete({
        confirmDeletion: true,
        criteria: { isReadByAllUsers: true },
      });

      // Reload admin data
      if (activeTab === "manage") {
        const [summaryResponse, pendingResponse] = await Promise.all([
          notificationAPI.getAdminSummary(),
          notificationAPI.getPendingReview(),
        ]);
        setAdminSummary(summaryResponse.data);
        setPendingReview(pendingResponse.data);
      }

      setBulkDeleteModal({ isOpen: false, loading: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to bulk delete");
      setBulkDeleteModal({ isOpen: false, loading: false });
    }
  };

  const handleCancelBulkDelete = () => {
    setBulkDeleteModal({ isOpen: false, loading: false });
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
      // Switch to "read" tab to show the marked notifications
      setActiveTab("read");
      await loadNotifications(1);
      setSelectedNotifications(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark all as read");
    }
  };

  // Handle bulk actions
  const handleBulkMarkAsRead = async () => {
    try {
      // Process notifications one by one to ensure proper per-user read status handling
      for (const notificationId of Array.from(selectedNotifications)) {
        await notificationAPI.markAsRead(notificationId);
      }
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

  // Handle group stats modal
  const handleShowGroupStats = async () => {
    setShowGroupStatsModal(true);
    setGroupStatsLoading(true);

    try {
      const response = await notificationAPI.getGroupStats();
      setGroupStats(response.data.groupStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load group stats");
      // Fallback to empty array if API fails
      setGroupStats([]);
    } finally {
      setGroupStatsLoading(false);
    }
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

  // Get lifecycle status color
  const getLifecycleColor = (status?: string) => {
    switch (status) {
      case "pending_review":
        return "bg-yellow-100 text-yellow-800";
      case "extended":
        return "bg-blue-100 text-blue-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  // Render lifecycle indicators
  const renderLifecycleIndicators = (notification: Notification) => (
    <div className="flex flex-col gap-1 mt-2">
      {notification.lifecycleStatus && notification.lifecycleStatus !== "active" && (
        <span
          className={`text-xs px-2 py-1 rounded-full self-start ${getLifecycleColor(notification.lifecycleStatus)}`}
        >
          {notification.lifecycleStatus.replace("_", " ")}
        </span>
      )}
      {notification.extendedUntil && (
        <span className="text-xs text-blue-600 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Extended until {new Date(notification.extendedUntil).toLocaleDateString()}
        </span>
      )}
      {notification.adminManaged && (
        <span className="text-xs text-purple-600 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Admin managed
        </span>
      )}
    </div>
  );

  if (loading && !notifications) {
    return (
      <PageLayout title="Notifications">
        <NotificationsSkeleton />
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Notifications">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Stay updated with your system activities</p>
            </div>

            {/* Bulk Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {selectedNotifications.size > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleBulkMarkAsRead}
                  className="px-3 sm:px-4 py-2 bg-aces-green text-white rounded-lg hover:bg-aces-green/90 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark {selectedNotifications.size} as Read</span>
                  <span className="sm:hidden">Mark ({selectedNotifications.size}) Read</span>
                </motion.button>
              )}

              {activeTab === "unread" && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark All Read</span>
                  <span className="sm:hidden">All Read</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div>
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1">
              <button
                onClick={() => {
                  setActiveTab("unread");
                  setCurrentPage(1);
                  setSelectedNotifications(new Set());
                  setAdminLoading(false);
                }}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "unread"
                    ? "border-aces-green text-aces-green"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Unread
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("read");
                  setCurrentPage(1);
                  setSelectedNotifications(new Set());
                  setAdminLoading(false);
                }}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "read"
                    ? "border-aces-green text-aces-green"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Read
                </span>
              </button>
              {user?.role === "admin" && (
                <button
                  onClick={() => {
                    setActiveTab("manage");
                    setCurrentPage(1);
                    setSelectedNotifications(new Set());
                    setAdminLoading(true);
                  }}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "manage"
                      ? "border-aces-green text-aces-green"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Manage
                    {pendingReview?.count && pendingReview.count > 0 && (
                      <span className="bg-red-500 text-white rounded-full text-xs px-2 py-0.5 ml-1">
                        {pendingReview.count}
                      </span>
                    )}
                  </span>
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Filters - Only show for unread/read tabs */}
        {activeTab !== "manage" && (
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 sm:hidden">Filters:</span>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm font-medium text-gray-700 min-w-fit">Priority:</span>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as NotificationPriority | "all")}
                  className="flex-1 sm:flex-initial px-2 sm:px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-aces-green focus:border-transparent"
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
        )}

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

        {/* Tab Content */}
        {activeTab === "manage" && user?.role === "admin" ? (
          <AdminManageTab
            adminSummary={adminSummary}
            pendingReview={pendingReview}
            systemHealth={systemHealth}
            onExtendLifecycle={handleExtendLifecycle}
            onBulkDeleteRead={handleBulkDeleteRead}
            onShowGroupStats={handleShowGroupStats}
            loading={adminLoading || (!adminSummary && !pendingReview && !systemHealth)}
          />
        ) : activeTab !== "manage" ? (
          // Regular Notifications List
          notifications && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {notifications.docs.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === "unread"
                      ? "No unread notifications"
                      : activeTab === "read"
                      ? "No read notifications"
                      : "No notifications"}
                  </h3>
                  <p className="text-gray-500">
                    {activeTab === "unread"
                      ? "All caught up! No new notifications."
                      : activeTab === "read"
                      ? "You haven't read any notifications yet."
                      : "You're all caught up!"}
                  </p>
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
                        className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors ${
                          !isReadByCurrentUser(notification) ? "bg-blue-50/50" : ""
                        }`}
                      >
                        {/* Mobile Layout (< xl) */}
                        <div className="xl:hidden">
                          {/* Top Row: Checkbox, Icon, Title, and Actions */}
                          <div className="flex items-start gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedNotifications.has(notification._id)}
                              onChange={() => toggleNotificationSelection(notification._id)}
                              className="mt-1 rounded border-gray-300 text-aces-green focus:ring-aces-green flex-shrink-0"
                            />

                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type, notification.priority)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4
                                className={`text-sm font-medium ${
                                  !isReadByCurrentUser(notification) ? "text-gray-900" : "text-gray-700"
                                }`}
                              >
                                {notification.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleMarkAsRead(notification._id, isReadByCurrentUser(notification))}
                                className="p-1 text-gray-400 hover:text-aces-green transition-colors"
                                title={isReadByCurrentUser(notification) ? "Mark as unread" : "Mark as read"}
                              >
                                {isReadByCurrentUser(notification) ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Message Body */}
                          <div className="ml-8">
                            <p
                              className={`text-sm ${
                                !isReadByCurrentUser(notification) ? "text-gray-800 font-medium" : "text-gray-600"
                              }`}
                            >
                              {notification.message}
                            </p>

                            <div className="flex flex-col gap-1 mt-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full self-start ${getPriorityColor(
                                  notification.priority
                                )}`}
                              >
                                {notification.priority}
                              </span>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-500">
                                  {notification.timeAgo || new Date(notification.createdAt).toLocaleDateString()}
                                </span>
                                {notification.actor && (
                                  <span className="text-xs text-gray-500">by {notification.actor.fullName}</span>
                                )}
                              </div>
                              {renderLifecycleIndicators(notification)}
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout (xl+) */}
                        <div className="hidden xl:flex items-start gap-3">
                          {/* Selection checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedNotifications.has(notification._id)}
                            onChange={() => toggleNotificationSelection(notification._id)}
                            className="mt-1 rounded border-gray-300 text-aces-green focus:ring-aces-green flex-shrink-0"
                          />

                          {/* Icon */}
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type, notification.priority)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4
                                  className={`text-sm font-medium ${
                                    !isReadByCurrentUser(notification) ? "text-gray-900" : "text-gray-700"
                                  }`}
                                >
                                  {notification.title}
                                </h4>
                                <p
                                  className={`text-sm mt-1 ${
                                    !isReadByCurrentUser(notification) ? "text-gray-800 font-medium" : "text-gray-600"
                                  }`}
                                >
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
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">
                                      {notification.timeAgo || new Date(notification.createdAt).toLocaleDateString()}
                                    </span>
                                    {notification.actor && (
                                      <span className="text-xs text-gray-500">by {notification.actor.fullName}</span>
                                    )}
                                  </div>
                                </div>
                                {renderLifecycleIndicators(notification)}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleMarkAsRead(notification._id, isReadByCurrentUser(notification))}
                                  className="p-1 text-gray-400 hover:text-aces-green transition-colors"
                                  title={isReadByCurrentUser(notification) ? "Mark as unread" : "Mark as read"}
                                >
                                  {isReadByCurrentUser(notification) ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
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
                <div className="px-3 sm:px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                    Showing {notifications.pagingCounter} to{" "}
                    {Math.min(notifications.pagingCounter + notifications.limit - 1, notifications.totalDocs)} of{" "}
                    {notifications.totalDocs} {activeTab} notifications
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadNotifications(currentPage - 1)}
                      disabled={!notifications.hasPrevPage || loading}
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </button>

                    <span className="text-xs sm:text-sm text-gray-600 px-2">
                      {notifications.page} / {notifications.totalPages}
                    </span>

                    <button
                      onClick={() => loadNotifications(currentPage + 1)}
                      disabled={!notifications.hasNextPage || loading}
                      className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        ) : null}

        {/* Group Stats Modal */}
        <GroupStatsModal
          isOpen={showGroupStatsModal}
          onClose={() => setShowGroupStatsModal(false)}
          groupStats={groupStats}
          totalGroups={adminSummary?.groups?.length || 0}
          loading={groupStatsLoading}
        />

        {/* Bulk Delete Modal */}
        <BulkDeleteModal
          isOpen={bulkDeleteModal.isOpen}
          loading={bulkDeleteModal.loading}
          onConfirm={handleConfirmBulkDelete}
          onCancel={handleCancelBulkDelete}
          adminSummary={adminSummary}
          systemHealth={systemHealth}
        />
      </motion.div>
    </PageLayout>
  );
};

// Admin Management Tab Component
const AdminManageTab: React.FC<{
  adminSummary: AdminSummaryResponse["data"] | null;
  pendingReview: PendingReviewResponse["data"] | null;
  systemHealth: SystemHealth | null;
  onExtendLifecycle: (id: string, days?: number) => void;
  onBulkDeleteRead: () => void;
  onShowGroupStats: () => void;
  loading: boolean;
}> = ({
  adminSummary,
  pendingReview,
  systemHealth,
  onExtendLifecycle,
  onBulkDeleteRead,
  onShowGroupStats,
  loading,
}) => {
  if (loading) {
    return <NotificationsAdminSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {adminSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {adminSummary.overallStats?.[0]?.totalNotifications || 0}
                </p>
              </div>
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Read</p>
                <p className="text-2xl font-bold text-green-600">
                  {adminSummary.overallStats?.[0]?.totalReadByAll || 0}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending (Unread)</p>
                <p className="text-2xl font-bold text-red-600">
                  {(adminSummary.overallStats?.[0]?.totalNotifications || 0) -
                    (adminSummary.overallStats?.[0]?.totalReadByAll || 0)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <button
            onClick={onShowGroupStats}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all duration-200 w-full text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700">Groups</p>
                <p className="text-2xl font-bold text-green-600 group-hover:text-green-700">
                  {adminSummary.groups?.length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-600">Click to view breakdown</p>
              </div>
              <Users className="w-8 h-8 text-green-500 group-hover:text-green-600 transition-colors" />
            </div>
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onBulkDeleteRead}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Bulk Delete Read
          </button>
        </div>
      </div>

      {/* Pending Review Notifications */}
      {pendingReview && pendingReview.notifications?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Notifications Requiring Review</h3>
            <p className="text-sm text-gray-600">Notifications older than 30 days that need admin action</p>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingReview.notifications.map((notification: Notification) => (
              <div key={notification._id} className="p-4 bg-yellow-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        Created: {new Date(notification.createdAt).toLocaleDateString()}(
                        {Math.floor((Date.now() - new Date(notification.createdAt).getTime()) / (1000 * 60 * 60 * 24))}{" "}
                        days ago)
                      </span>
                      {notification.notificationGroup && (
                        <span className="text-xs text-purple-600">Group: {notification.notificationGroup}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => onExtendLifecycle(notification._id, 30)}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      Extend 30d
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health */}
      {systemHealth && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">System Health</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-4 h-4 rounded-full ${
                  systemHealth.healthScore?.level === "good"
                    ? "bg-green-500"
                    : systemHealth.healthScore?.level === "warning"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              ></div>
              <span className="font-medium">Health Score: {systemHealth.healthScore?.score || 0}/100</span>
            </div>
            {systemHealth.alerts?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Alerts</h4>
                {systemHealth.alerts.map((alert: { level: string; message: string; action: string }, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      alert.level === "error"
                        ? "bg-red-50 text-red-700"
                        : alert.level === "warning"
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    <p className="text-sm font-medium">{alert.message}</p>
                    {alert.action && <p className="text-xs mt-1">{alert.action}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
