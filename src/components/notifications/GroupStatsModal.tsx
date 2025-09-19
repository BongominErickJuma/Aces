import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, FileText, UserPlus, CheckCircle, Shield, DollarSign } from "lucide-react";

interface SampleNotification {
  title: string;
  message: string;
  createdAt: string;
  priority: string;
  isRead: boolean;
}

interface Group {
  groupName: string;
  displayName: string;
  notificationCount: number;
  readCount: number;
  unreadCount: number;
  latestCreated: string;
  oldestCreated: string;
  sampleNotifications: SampleNotification[];
}

interface GroupStat {
  type: string;
  count: number;
  description: string;
  notificationCount: number;
  readCount: number;
  unreadCount: number;
  latestActivity: string;
  oldestActivity: string;
  groups: Group[];
}

interface GroupStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupStats: GroupStat[];
  totalGroups: number;
  loading?: boolean;
}

const GroupStatsModal: React.FC<GroupStatsModalProps> = ({
  isOpen,
  onClose,
  groupStats,
  totalGroups,
  loading = false,
}) => {
  const getTypeIcon = (type: string) => {
    if (type.includes("document") || type.includes("quotation") || type.includes("receipt")) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    if (type.includes("user")) {
      return <UserPlus className="w-5 h-5 text-green-500" />;
    }
    if (type.includes("payment")) {
      return <DollarSign className="w-5 h-5 text-yellow-500" />;
    }
    if (type.includes("security") || type.includes("system")) {
      return <Shield className="w-5 h-5 text-red-500" />;
    }
    return <CheckCircle className="w-5 h-5 text-gray-500" />;
  };

  const getTypeDisplayName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      document_created: "Documents Created",
      document_updated: "Documents Updated",
      document_deleted: "Documents Deleted",
      quotation_expired: "Quotations Expired",
      quotation_converted: "Quotations Converted",
      payment_received: "Payments Received",
      payment_overdue: "Payments Overdue",
      user_created: "Users Created",
      user_updated: "Users Updated",
      user_role_changed: "User Roles Changed",
      user_deleted: "Users Deleted",
      user_suspended: "Users Suspended",
      user_reactivated: "Users Reactivated",
      profile_incomplete: "Incomplete Profiles",
      system_maintenance: "System Maintenance",
      backup_completed: "Backups Completed",
      security_alert: "Security Alerts",
    };
    return typeMap[type] || type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-aces-green" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Notification Groups Breakdown</h3>
                  <p className="text-sm text-gray-600">{totalGroups} total groups organizing your notifications</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aces-green"></div>
                </div>
              ) : (
                <>
                  {/* Explanation */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">What are Groups?</h4>
                    <p className="text-sm text-blue-800 mb-2">
                      Groups organize related notifications together. For example, all notifications about a specific
                      document or all user creation notifications from the same day are grouped together.
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Click on any notification type below</strong> to see the specific groups and sample
                      notifications within each group. This detailed breakdown shows exactly which notifications are
                      grouped together and why.
                    </p>
                  </div>

                  {/* Stats List */}
                  <div className="space-y-3">
                    {groupStats && groupStats.length > 0 ? (
                      groupStats.map((stat, index) => (
                        <motion.div
                          key={stat.type}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getTypeIcon(stat.type)}
                              <div>
                                <h5 className="font-medium text-gray-900">{getTypeDisplayName(stat.type)}</h5>
                                <p className="text-sm text-gray-600">{stat.description}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-green-600">{stat.readCount} read</span>
                                  <span className="text-xs text-red-600">{stat.unreadCount} unread</span>
                                  <span className="text-xs text-gray-500">
                                    {stat.notificationCount} total notifications
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-bold text-gray-900">{stat.count}</span>
                              <p className="text-xs text-gray-500">{stat.count === 1 ? "group" : "groups"}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No groups to display</h4>
                        <p className="text-gray-500">There are currently no notification groups to show.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GroupStatsModal;
