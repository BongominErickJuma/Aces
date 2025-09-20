import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  Shield,
  Users,
  RotateCcw,
  Trash,
  BarChart3,
  TrendingUp,
  Activity,
  Loader2,
  Edit3,
  Save,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { type AdminUser } from "../../../services/admin";

interface UserStatistics {
  documents: {
    quotations: {
      total: number;
      thisMonth: number;
      thisWeek: number;
    };
    receipts: {
      total: number;
      thisMonth: number;
      thisWeek: number;
    };
  };
  performance: {
    totalDocuments: number;
    averageDocumentsPerWeek: number;
    mostActiveDay: string;
    joinDate: string;
    lastActive?: string;
  };
}

interface UserCardViewProps {
  users: AdminUser[];
  loading: boolean;
  selectedUsers: Set<string>;
  expandedUser: string | null;
  userStatistics: Record<string, UserStatistics>;
  editingUser: string | null;
  editForm: {
    role: "admin" | "user";
    status: "active" | "inactive" | "suspended";
  };
  updatingUser: boolean;
  isAdmin: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onSelectUser: (userId: string) => void;
  onToggleExpanded: (userId: string) => void;
  onUserAction: (user: AdminUser, action: "suspend" | "delete" | "reactivate") => void;
  onEditUser: (user: AdminUser) => void;
  onUpdateUser: (userId: string) => void;
  onCancelEdit: () => void;
  onPageChange: (page: number) => void;
  setEditForm: React.Dispatch<
    React.SetStateAction<{
      role: "admin" | "user";
      status: "active" | "inactive" | "suspended";
    }>
  >;
}

const UserCardView: React.FC<UserCardViewProps> = ({
  users,
  loading,
  selectedUsers,
  expandedUser,
  userStatistics,
  editingUser,
  editForm,
  updatingUser,
  isAdmin,
  pagination,
  onSelectUser,
  onToggleExpanded,
  onUserAction,
  onEditUser,
  onUpdateUser,
  onCancelEdit,
  onPageChange,
  setEditForm,
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: Check },
      inactive: { color: "bg-gray-100 text-gray-800", icon: AlertCircle },
      suspended: { color: "bg-red-100 text-red-800", icon: X },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: "bg-purple-100 text-purple-800",
      user: "bg-blue-100 text-blue-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          roleConfig[role as keyof typeof roleConfig]
        }`}
      >
        {role === "admin" && <Shield className="w-3 h-3 mr-1" />}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-full flex flex-col items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mb-2" />
          <p className="text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No users found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.map((user, index) => (
          <motion.div
            key={user._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden ${
              selectedUsers.has(user._id) ? "ring-2 ring-aces-green border-aces-green" : ""
            } ${
              expandedUser === user._id ? "bg-blue-50" : "bg-white"
            }`}
          >
            {/* Card Header */}
            <div className="p-5 pb-0">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user._id)}
                    onChange={() => onSelectUser(user._id)}
                    className="rounded border-gray-300 text-aces-green focus:ring-aces-green"
                  />
                  <div className="flex items-center space-x-2">{getRoleBadge(user.role)}</div>
                </div>
                {getStatusBadge(user.status)}
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 h-12 w-12">
                  {user.profilePhoto?.url ? (
                    <img
                      src={user.profilePhoto.url}
                      alt={user.fullName}
                      className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-aces-green to-aces-blue flex items-center justify-center text-white font-medium text-lg">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{user.fullName}</h3>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  {!user.profileCompleted && (
                    <div className="flex items-center mt-1">
                      <AlertCircle className="w-3 h-3 text-amber-500 mr-1" />
                      <span className="text-xs text-amber-600">Profile incomplete</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="px-5 pb-4">
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Contact Info</h4>
                <div className="space-y-1">
                  <div className="text-sm text-gray-900">{user.phonePrimary || "No phone"}</div>
                  {user.phoneSecondary && <div className="text-xs text-gray-500">Alt: {user.phoneSecondary}</div>}
                  {user.emergencyContact && (
                    <div className="text-xs text-gray-500">Emergency: {user.emergencyContact}</div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-700">
                    {userStatistics[user._id]?.performance?.totalDocuments || user.statistics?.totalDocuments || 0}
                  </div>
                  <div className="text-xs text-blue-600">Total Documents</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-sm font-bold text-green-700">
                    {userStatistics[user._id]?.documents?.quotations?.total !== undefined &&
                    userStatistics[user._id]?.documents?.receipts?.total !== undefined
                      ? `${userStatistics[user._id].documents.quotations.total}Q / ${
                          userStatistics[user._id].documents.receipts.total
                        }R`
                      : user.statistics &&
                        user.statistics.quotations !== undefined &&
                        user.statistics.receipts !== undefined
                      ? `${user.statistics.quotations}Q / ${user.statistics.receipts}R`
                      : "0Q / 0R"}
                  </div>
                  <div className="text-xs text-green-600">Quotes / Receipts</div>
                </div>
              </div>

              {/* Activity Info */}
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  <span className="font-medium">Last Login:</span>
                  <div className="text-xs">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                  </div>
                </div>
                {user.createdBy && typeof user.createdBy === "object" && (
                  <div className="text-gray-500 text-xs text-right">
                    <div>Added by:</div>
                    <div className="font-medium">{user.createdBy.fullName}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer - Actions */}
            <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onToggleExpanded(user._id)}
                    className="p-2 text-gray-600 hover:text-aces-green hover:bg-white rounded-lg transition-colors shadow-sm"
                    title={expandedUser === user._id ? "Hide details" : "View details"}
                  >
                    {expandedUser === user._id ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <div className="flex items-center space-x-2">
                    {user.status === "active" && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onUserAction(user, "suspend")}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-white rounded-lg transition-colors shadow-sm"
                        title="Suspend user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                    {user.status === "suspended" && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onUserAction(user, "reactivate")}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-white rounded-lg transition-colors shadow-sm"
                          title="Reactivate user"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onUserAction(user, "delete")}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-white rounded-lg transition-colors shadow-sm"
                          title="Delete permanently"
                        >
                          <Trash className="w-4 h-4" />
                        </motion.button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Expanded User Details (Mobile) */}
            <AnimatePresence>
              {expandedUser === user._id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200 bg-gray-50"
                >
                  <div className="p-5 space-y-4">
                    {/* User Statistics - Expanded */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 flex items-center text-lg">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        User Statistics
                      </h4>

                      {userStatistics[user._id] ? (
                        <div className="space-y-3">
                          {/* Document Statistics */}
                          <div className="bg-white rounded-lg p-4 border space-y-3">
                            <div className="flex items-center text-blue-600 mb-2">
                              <TrendingUp className="w-4 h-4 mr-2" />
                              <span className="font-medium text-sm">Document Statistics</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-blue-50 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-blue-600">
                                  {userStatistics[user._id]?.documents?.quotations?.total || 0}
                                </div>
                                <div className="text-xs text-blue-600">Quotations</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {userStatistics[user._id]?.documents?.quotations?.thisMonth || 0} this month
                                </div>
                              </div>
                              <div className="bg-green-50 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-green-600">
                                  {userStatistics[user._id]?.documents?.receipts?.total || 0}
                                </div>
                                <div className="text-xs text-green-600">Receipts</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {userStatistics[user._id]?.documents?.receipts?.thisMonth || 0} this month
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Performance Statistics */}
                          <div className="bg-white rounded-lg p-4 border space-y-3">
                            <div className="flex items-center text-purple-600 mb-2">
                              <Activity className="w-4 h-4 mr-2" />
                              <span className="font-medium text-sm">Performance</span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total Documents:</span>
                                <span className="font-semibold text-purple-600">
                                  {userStatistics[user._id]?.performance?.totalDocuments || 0}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Avg/Week:</span>
                                <span className="font-semibold text-purple-600">
                                  {userStatistics[user._id]?.performance?.averageDocumentsPerWeek || 0}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Most Active Day:</span>
                                <span className="font-semibold text-purple-600">
                                  {userStatistics[user._id]?.performance?.mostActiveDay || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Joined:</span>
                                <span className="font-semibold text-gray-700">
                                  {userStatistics[user._id]?.performance?.joinDate
                                    ? new Date(userStatistics[user._id].performance.joinDate).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
                            <div className="text-gray-500 text-sm">Loading statistics...</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Role & Status Management Panel - Admin Only */}
                    {isAdmin && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 flex items-center text-lg">
                          <Shield className="w-5 h-5 mr-2" />
                          User Management
                        </h4>

                        {editingUser === user._id ? (
                          <div className="bg-white rounded-lg border p-4 space-y-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">Edit User Role & Status</span>
                              <button
                                onClick={onCancelEdit}
                                disabled={updatingUser}
                                className="text-gray-400 hover:text-gray-600 p-1"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                  value={editForm.role}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({ ...prev, role: e.target.value as "admin" | "user" }))
                                  }
                                  disabled={updatingUser}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aces-green focus:border-aces-green disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                  value={editForm.status}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      status: e.target.value as "active" | "inactive" | "suspended",
                                    }))
                                  }
                                  disabled={updatingUser}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-aces-green focus:border-aces-green disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                  <option value="suspended">Suspended</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                              <button
                                onClick={onCancelEdit}
                                disabled={updatingUser}
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => onUpdateUser(user._id)}
                                disabled={updatingUser || !editForm.role || !editForm.status}
                                className="px-3 py-2 text-sm font-medium text-white bg-aces-green border border-transparent rounded-lg hover:bg-aces-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aces-green disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                              >
                                {updatingUser && <Loader2 className="w-4 h-4 animate-spin" />}
                                <Save className="w-4 h-4" />
                                <span>{updatingUser ? "Updating..." : "Update User"}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Current Settings</span>
                              <button
                                onClick={() => onEditUser(user)}
                                className="text-aces-green hover:text-aces-green/80 flex items-center space-x-1 text-sm"
                              >
                                <Edit3 className="w-4 h-4" />
                                <span>Edit</span>
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Role:</span>
                                {getRoleBadge(user.role)}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Status:</span>
                                {getStatusBadge(user.status)}
                              </div>
                            </div>

                            <div className="pt-2 border-t space-y-1 text-xs text-gray-500">
                              <div>User ID: {user._id}</div>
                              <div>Created: {new Date(user.createdAt).toLocaleDateString()}</div>
                              {user.createdBy && typeof user.createdBy === "object" && (
                                <div>Added by: {user.createdBy.fullName}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {/* First page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={pagination.page === 1}
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous page */}
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page indicator */}
          <div className="px-4 py-2 bg-gray-100 rounded-lg min-w-[80px] text-center">
            <span className="text-sm font-medium text-gray-900">
              {pagination.page}/{pagination.totalPages}
            </span>
          </div>

          {/* Next page */}
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page */}
          <button
            onClick={() => onPageChange(pagination.totalPages)}
            disabled={pagination.page === pagination.totalPages}
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default UserCardView;
