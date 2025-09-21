import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Receipt, Plus, Shield, Bell, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { notificationAPI } from "../../services/notifications";
import type { UnreadCountResponse } from "../../types/notification";

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notification count
  const loadNotificationData = useCallback(async () => {
    if (!user) return;

    try {
      // Load basic data
      const countResponse: UnreadCountResponse = await notificationAPI.getUnreadCount();
      setUnreadCount(countResponse.data.count);

      // Load admin data if user is admin
      if (user.role === "admin") {
        // Admin-specific notification handling can be added here if needed
        // const pendingResponse: PendingReviewResponse = await notificationAPI.getPendingReview();
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, [user]);

  // Load notification data on component mount and when user changes
  useEffect(() => {
    if (user) {
      loadNotificationData();
    }
  }, [user, loadNotificationData]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
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
                onClick={() => navigate("/notifications")}
                className="p-1.5 xl:p-2 text-gray-600 hover:text-aces-green hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Bell size={16} className="xl:w-[18px] xl:h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
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
