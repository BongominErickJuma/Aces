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

interface UserTableViewProps {
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
  onSelectAll: () => void;
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

const UserTableView: React.FC<UserTableViewProps> = ({
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
  onSelectAll,
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === users.length && users.length > 0}
                  onChange={onSelectAll}
                  className="rounded border-gray-300 text-aces-green focus:ring-aces-green"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role & Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statistics
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12">
                  <div className="flex flex-col items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mb-2" />
                    <p className="text-gray-500">Loading users...</p>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No users found</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <React.Fragment key={user._id}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-gray-50 ${expandedUser === user._id ? "bg-blue-50" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user._id)}
                        onChange={() => onSelectUser(user._id)}
                        className="rounded border-gray-300 text-aces-green focus:ring-aces-green"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.profilePhoto?.url ? (
                            <img
                              src={user.profilePhoto.url}
                              alt={user.fullName}
                              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-aces-green to-aces-blue flex items-center justify-center text-white font-medium">
                              {user.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {!user.profileCompleted && (
                            <div className="flex items-center mt-1">
                              <AlertCircle className="w-3 h-3 text-amber-500 mr-1" />
                              <span className="text-xs text-amber-600">Profile incomplete</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">{user.phonePrimary || "No phone"}</div>
                        {user.phoneSecondary && <div className="text-xs text-gray-500">Alt: {user.phoneSecondary}</div>}
                        {user.emergencyContact && (
                          <div className="text-xs text-gray-500">Emergency: {user.emergencyContact}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {userStatistics[user._id]?.performance ? (
                        <>
                          <div className="text-sm text-gray-900">
                            {userStatistics[user._id]?.performance?.totalDocuments || 0} documents
                          </div>
                          <div className="text-sm text-gray-500">
                            {userStatistics[user._id]?.documents?.quotations?.total || 0} quotations,{" "}
                            {userStatistics[user._id]?.documents?.receipts?.total || 0} receipts
                          </div>
                        </>
                      ) : user.statistics && user.statistics.totalDocuments !== undefined ? (
                        <>
                          <div className="text-sm text-gray-900">{user.statistics.totalDocuments} documents</div>
                          <div className="text-sm text-gray-500">
                            {user.statistics.quotations || 0} quotations, {user.statistics.receipts || 0} receipts
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-gray-900">0 documents</div>
                          <div className="text-sm text-gray-500">0 quotations, 0 receipts</div>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                        </div>
                        {user.createdBy && typeof user.createdBy === "object" && (
                          <div className="text-xs text-gray-500">Added by: {user.createdBy.fullName}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onToggleExpanded(user._id)}
                          className="text-gray-400 hover:text-gray-600"
                          title={expandedUser === user._id ? "Hide details" : "View details"}
                        >
                          {expandedUser === user._id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {isAdmin && (
                          <>
                            {user.status === "active" && (
                              <button
                                onClick={() => onUserAction(user, "suspend")}
                                className="text-red-400 hover:text-red-600"
                                title="Suspend user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {user.status === "suspended" && (
                              <>
                                <button
                                  onClick={() => onUserAction(user, "reactivate")}
                                  className="text-gray-400 hover:text-green-600"
                                  title="Reactivate user"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onUserAction(user, "delete")}
                                  className="text-red-400 hover:text-red-600"
                                  title="Delete permanently"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                  {/* Expanded User Details Row */}
                  <AnimatePresence>
                    {expandedUser === user._id && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50"
                      >
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* User Statistics - Expanded */}
                            <div className="lg:col-span-2 space-y-4">
                              <h4 className="font-medium text-gray-900 flex items-center text-lg">
                                <BarChart3 className="w-5 h-5 mr-2" />
                                User Statistics
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userStatistics[user._id] ? (
                                  <>
                                    {/* Document Statistics */}
                                    <div className="bg-white rounded-lg p-4 border space-y-3">
                                      <div className="flex items-center text-blue-600 mb-2">
                                        <TrendingUp className="w-4 h-4 mr-2" />
                                        <span className="font-medium text-sm">Document Statistics</span>
                                      </div>
                                      <div className="space-y-3">
                                        <div className="bg-blue-50 rounded-lg p-3">
                                          <div className="text-gray-700 font-medium text-sm mb-2">Quotations</div>
                                          <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div className="text-center">
                                              <div className="text-2xl font-bold text-blue-600">
                                                {userStatistics[user._id]?.documents?.quotations?.total || 0}
                                              </div>
                                              <div className="text-gray-500">Total</div>
                                            </div>
                                            <div className="text-center">
                                              <div className="text-lg font-semibold text-green-600">
                                                {userStatistics[user._id]?.documents?.quotations?.thisMonth || 0}
                                              </div>
                                              <div className="text-gray-500">This Month</div>
                                            </div>
                                            <div className="text-center">
                                              <div className="text-lg font-semibold text-purple-600">
                                                {userStatistics[user._id]?.documents?.quotations?.thisWeek || 0}
                                              </div>
                                              <div className="text-gray-500">This Week</div>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-3">
                                          <div className="text-gray-700 font-medium text-sm mb-2">Receipts</div>
                                          <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div className="text-center">
                                              <div className="text-2xl font-bold text-green-600">
                                                {userStatistics[user._id]?.documents?.receipts?.total || 0}
                                              </div>
                                              <div className="text-gray-500">Total</div>
                                            </div>
                                            <div className="text-center">
                                              <div className="text-lg font-semibold text-green-600">
                                                {userStatistics[user._id]?.documents?.receipts?.thisMonth || 0}
                                              </div>
                                              <div className="text-gray-500">This Month</div>
                                            </div>
                                            <div className="text-center">
                                              <div className="text-lg font-semibold text-purple-600">
                                                {userStatistics[user._id]?.documents?.receipts?.thisWeek || 0}
                                              </div>
                                              <div className="text-gray-500">This Week</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Performance Statistics */}
                                    <div className="bg-white rounded-lg p-4 border space-y-3">
                                      <div className="flex items-center text-purple-600 mb-2">
                                        <Activity className="w-4 h-4 mr-2" />
                                        <span className="font-medium text-sm">Performance Metrics</span>
                                      </div>
                                      <div className="space-y-3">
                                        <div className="bg-purple-50 rounded-lg p-3">
                                          <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="text-center">
                                              <div className="text-2xl font-bold text-purple-600">
                                                {userStatistics[user._id]?.performance?.totalDocuments || 0}
                                              </div>
                                              <div className="text-gray-600 text-xs">Total Documents</div>
                                            </div>
                                            <div className="text-center">
                                              <div className="text-xl font-semibold text-purple-600">
                                                {userStatistics[user._id]?.performance?.averageDocumentsPerWeek || 0}
                                              </div>
                                              <div className="text-gray-600 text-xs">Avg/Week</div>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-gray-600 text-sm">Most Active Day:</span>
                                            <span className="font-semibold text-sm text-purple-600">
                                              {userStatistics[user._id]?.performance?.mostActiveDay || "N/A"}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-gray-600 text-sm">Joined:</span>
                                            <span className="font-semibold text-sm text-gray-700">
                                              {userStatistics[user._id]?.performance?.joinDate
                                                ? new Date(
                                                    userStatistics[user._id].performance.joinDate
                                                  ).toLocaleDateString()
                                                : "N/A"}
                                            </span>
                                          </div>
                                          {userStatistics[user._id]?.performance?.lastActive && (
                                            <div className="flex justify-between items-center">
                                              <span className="text-gray-600 text-sm">Last Active:</span>
                                              <span className="font-semibold text-sm text-gray-700">
                                                {userStatistics[user._id]?.performance?.lastActive
                                                  ? new Date(
                                                      userStatistics[user._id].performance.lastActive!
                                                    ).toLocaleDateString()
                                                  : "Never"}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="col-span-2 flex items-center justify-center py-8">
                                    <div className="text-center">
                                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
                                      <div className="text-gray-500 text-sm">Loading statistics...</div>
                                    </div>
                                  </div>
                                )}
                              </div>
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
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={onCancelEdit}
                                          disabled={updatingUser}
                                          className="text-gray-400 hover:text-gray-600 p-1"
                                        >
                                          <XCircle className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                        <select
                                          value={editForm.role}
                                          onChange={(e) =>
                                            setEditForm((prev) => ({
                                              ...prev,
                                              role: e.target.value as "admin" | "user",
                                            }))
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
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
                </span>{" "}
                to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>{" "}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === pagination.page
                          ? "z-10 bg-aces-green border-aces-green text-white"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTableView;
