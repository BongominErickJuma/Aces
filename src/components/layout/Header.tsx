import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Plus,
  Shield,
  Bell,
  LogOut,
  Menu,
  X,
  Eye,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { notificationAPI } from "../../services/notifications";
import type { Notification } from "../../types/notification";

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // Load notifications data
  const loadNotificationData = useCallback(async () => {
    if (!user) return;

    try {
      setNotificationLoading(true);
      const [countResponse, notificationsResponse] = await Promise.all([
        notificationAPI.getUnreadCount(),
        notificationAPI.getUserNotifications({ page: 1, limit: 5, unreadOnly: true }),
      ]);

      setUnreadCount(countResponse.data.count);
      setRecentNotifications(notificationsResponse.data.docs);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setNotificationLoading(false);
    }
  }, [user]);

  // Load notification data on component mount and when user changes
  useEffect(() => {
    loadNotificationData();
  }, [loadNotificationData]);

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isNotificationOpen) {
      loadNotificationData();
    }
  }, [isNotificationOpen, loadNotificationData]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Handle mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      await loadNotificationData();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Handle notification action click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification._id);
    }

    if (notification.actionUrl) {
      // Internal navigation
      if (notification.actionUrl.startsWith("/")) {
        navigate(notification.actionUrl);
        setIsNotificationOpen(false);
      } else {
        // External link
        window.open(notification.actionUrl, "_blank");
      }
    }
  };

  const navigationItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "user"],
    },
    {
      name: "Quotations",
      path: "/quotations",
      icon: FileText,
      roles: ["admin", "user"],
    },
    {
      name: "Receipts",
      path: "/receipts",
      icon: Receipt,
      roles: ["admin", "user"],
    },
    {
      name: "Create",
      path: "/create",
      icon: Plus,
      roles: ["admin", "user"],
    },
    {
      name: "Admin",
      path: "/admin",
      icon: Shield,
      roles: ["admin"],
    },
  ];

  const visibleItems = navigationItems.filter((item) => item.roles.includes(user?.role || "user"));

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-gray-200"
    >
      <div className="container mx-auto px-3 sm:px-4 xl:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18 xl:h-20">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <Link to="/dashboard" className="flex items-center space-x-2 sm:space-x-3">
              <img
                src="/img/Aces_logo.svg"
                alt="Aces Movers Logo"
                className="h-8 sm:h-10 xl:h-12 w-auto object-contain"
              />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-1 2xl:space-x-2">
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <motion.div key={item.path} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-2 px-2 xl:px-3 2xl:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-aces-green to-aces-blue text-white shadow-lg"
                        : "text-gray-600 hover:text-aces-green hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-xs xl:text-sm">{item.name}</span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-1 sm:space-x-2 xl:space-x-3">
            {/* Notifications */}
            <motion.div whileHover={{ scale: 1.1 }} className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-1.5 xl:p-2 text-gray-600 hover:text-aces-green hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Bell size={16} className="xl:w-[18px] xl:h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 xl:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      <Link
                        to="/notifications"
                        onClick={() => setIsNotificationOpen(false)}
                        className="text-xs text-aces-green hover:text-aces-green/80 font-medium"
                      >
                        View All
                      </Link>
                    </div>

                    {/* Loading */}
                    {notificationLoading ? (
                      <div className="px-4 py-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-aces-green mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading...</p>
                      </div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No new notifications</p>
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {recentNotifications.map((notification) => (
                          <motion.div
                            key={notification._id}
                            whileHover={{ backgroundColor: "rgba(249, 250, 251, 1)" }}
                            className="px-4 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-3">
                              {/* Priority indicator */}
                              <div
                                className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                  notification.priority === "urgent"
                                    ? "bg-red-500"
                                    : notification.priority === "high"
                                    ? "bg-orange-500"
                                    : notification.priority === "normal"
                                    ? "bg-blue-500"
                                    : "bg-gray-400"
                                }`}
                              />

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">{notification.title}</h4>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-500">
                                    {notification.timeAgo || new Date(notification.createdAt).toLocaleDateString()}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {notification.actionUrl && <ExternalLink className="w-3 h-3 text-gray-400" />}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(notification._id);
                                      }}
                                      className="p-1 text-gray-400 hover:text-aces-green transition-colors"
                                      title="Mark as read"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    {recentNotifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                        <Link
                          to="/notifications"
                          onClick={() => setIsNotificationOpen(false)}
                          className="block text-center text-sm text-aces-green hover:text-aces-green/80 font-medium"
                        >
                          View All Notifications
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Profile Dropdown */}
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
              <Link
                to="/profile"
                className="flex items-center space-x-1.5 xl:space-x-2 px-1.5 xl:px-2 py-1.5 xl:py-2 text-gray-600 hover:text-aces-green hover:bg-gray-50 rounded-lg transition-colors"
              >
                {user?.profilePhoto?.url ? (
                  <img
                    src={user.profilePhoto.url}
                    alt={user.fullName}
                    className="w-7 xl:w-8 h-7 xl:h-8 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 xl:w-8 h-7 xl:h-8 rounded-full bg-gradient-to-r from-aces-green to-aces-blue flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs xl:text-sm font-medium">
                      {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                <span className="hidden sm:block text-xs xl:text-sm font-medium truncate max-w-16 xl:max-w-24 2xl:max-w-32">
                  {user?.fullName || "User"}
                </span>
              </Link>
            </motion.div>

            {/* Logout */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLogout}
              className="p-1.5 xl:p-2 text-gray-600 hover:text-red-500 hover:bg-gray-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={16} className="xl:w-[18px] xl:h-[18px]" />
            </motion.button>

            {/* Mobile Menu Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-1.5 xl:p-2 text-gray-600 hover:text-aces-green hover:bg-gray-50 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X size={16} className="sm:w-[18px] sm:h-[18px]" />
              ) : (
                <Menu size={16} className="sm:w-[18px] sm:h-[18px]" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile/Tablet Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="xl:hidden border-t border-gray-200 py-3 sm:py-4"
            >
              <div className="space-y-1.5 sm:space-y-2">
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-2.5 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-aces-green to-aces-blue text-white"
                          : "text-gray-600 hover:text-aces-green hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
