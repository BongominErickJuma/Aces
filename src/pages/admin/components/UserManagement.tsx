import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ChevronDown,
  Eye,
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
import { adminAPI, type AdminUser } from "../../../services/admin";

interface UserManagementProps {
  isAdmin: boolean;
  currentUser?: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

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

const UserManagement: React.FC<UserManagementProps> = ({ isAdmin, currentUser }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userStatistics, setUserStatistics] = useState<Record<string, UserStatistics>>({});
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    role: "admin" | "user";
    status: "active" | "inactive" | "suspended";
  }>({ role: "user", status: "active" });
  const [updatingUser, setUpdatingUser] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    user: AdminUser | null;
    action: "suspend" | "delete" | "reactivate" | null;
  }>({
    isOpen: false,
    user: null,
    action: null,
  });
  const [bulkSuspendModal, setBulkSuspendModal] = useState<{
    isOpen: boolean;
    count: number;
  }>({ isOpen: false, count: 0 });
  const [bulkSuspending, setBulkSuspending] = useState(false);
  const [suspendProgress, setSuspendProgress] = useState({ current: 0, total: 0 });
  const [bulkReactivateModal, setBulkReactivateModal] = useState<{
    isOpen: boolean;
    count: number;
  }>({ isOpen: false, count: 0 });
  const [bulkReactivating, setBulkReactivating] = useState(false);
  const [reactivateProgress, setReactivateProgress] = useState({ current: 0, total: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchUsers = useCallback(async (page: number = currentPage) => {
    try {
      setLoading(true);
      const params = {
        page: page,
        limit: 20,
        search: searchQuery || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        sort: "-createdAt",
      };

      const response = await adminAPI.getAllUsers(params);

      // Handle the backend response structure properly
      if (response.data) {
        const users = response.data.items || [];
        // Filter out current user to prevent self-operations
        const filteredUsers = currentUser ? users.filter((user: AdminUser) => user._id !== currentUser._id) : users;
        setUsers(filteredUsers);
        setPagination(
          response.data.pagination || {
            page: page,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          }
        );

        // Fetch statistics for all users on the current page
        const statsPromises = users.map((user: AdminUser) => adminAPI.getUserStatistics(user._id).catch(() => null));
        const statsResults = await Promise.all(statsPromises);

        const newStats: Record<string, UserStatistics> = {};
        users.forEach((user: AdminUser, index: number) => {
          if (statsResults[index]) {
            newStats[user._id] = statsResults[index]!;
          }
        });

        setUserStatistics((prev) => ({ ...prev, ...newStats }));
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, roleFilter, statusFilter, currentUser]);

  // Fetch users when filters change (reset to page 1)
  useEffect(() => {
    setCurrentPage(1);
    fetchUsers(1);
  }, [searchQuery, roleFilter, statusFilter, fetchUsers]);

  // Fetch users when page changes
  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

  const handleToggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((user) => user._id)));
    }
  };

  const handleUserAction = (user: AdminUser, action: "suspend" | "delete" | "reactivate") => {
    setActionModal({ isOpen: true, user, action });
  };

  // Bulk suspend handlers
  const handleBulkSuspend = () => {
    setBulkSuspendModal({ isOpen: true, count: selectedUsers.size });
  };

  // Bulk reactivate handlers
  const handleBulkReactivate = () => {
    setBulkReactivateModal({ isOpen: true, count: selectedUsers.size });
  };

  const handleConfirmBulkSuspend = async () => {
    try {
      setBulkSuspending(true);
      setBulkSuspendModal({ isOpen: false, count: 0 });
      const totalUsers = selectedUsers.size;
      const selectedUserIds = Array.from(selectedUsers);

      // Initialize progress
      setSuspendProgress({ current: 0, total: totalUsers });

      // Simulate progress for better UX (since suspension happens in one API call)
      const progressInterval = setInterval(() => {
        setSuspendProgress((prev) => {
          if (prev.current < prev.total) {
            return { ...prev, current: prev.current + 1 };
          }
          return prev;
        });
      }, 200); // Update every 200ms

      await adminAPI.bulkSuspendUsers(selectedUserIds);

      // Clear interval and complete progress
      clearInterval(progressInterval);
      setSuspendProgress({ current: totalUsers, total: totalUsers });

      // Small delay to show completion
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Clear selection after successful bulk suspend
      setSelectedUsers(new Set());
      fetchUsers(); // Reload data
    } catch (err) {
      console.error("Failed to suspend users:", err);
      alert("Failed to suspend users. Please try again.");
    } finally {
      setBulkSuspending(false);
      setSuspendProgress({ current: 0, total: 0 });
    }
  };

  const handleCancelBulkSuspend = () => {
    setBulkSuspendModal({ isOpen: false, count: 0 });
  };

  const handleConfirmBulkReactivate = async () => {
    try {
      setBulkReactivating(true);
      setBulkReactivateModal({ isOpen: false, count: 0 });
      const totalUsers = selectedUsers.size;
      const selectedUserIds = Array.from(selectedUsers);

      // Initialize progress
      setReactivateProgress({ current: 0, total: totalUsers });

      // Simulate progress for better UX (since reactivation happens in one API call)
      const progressInterval = setInterval(() => {
        setReactivateProgress((prev) => {
          if (prev.current < prev.total) {
            return { ...prev, current: prev.current + 1 };
          }
          return prev;
        });
      }, 200); // Update every 200ms

      await adminAPI.bulkReactivateUsers(selectedUserIds);

      // Clear interval and complete progress
      clearInterval(progressInterval);
      setReactivateProgress({ current: totalUsers, total: totalUsers });

      // Small delay to show completion
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Clear selection after successful bulk reactivate
      setSelectedUsers(new Set());
      fetchUsers(); // Reload data
    } catch (err) {
      console.error("Failed to reactivate users:", err);
      alert("Failed to reactivate users. Please try again.");
    } finally {
      setBulkReactivating(false);
      setReactivateProgress({ current: 0, total: 0 });
    }
  };

  const handleCancelBulkReactivate = () => {
    setBulkReactivateModal({ isOpen: false, count: 0 });
  };

  const handleConfirmAction = async () => {
    if (!actionModal.user || !actionModal.action) return;

    try {
      switch (actionModal.action) {
        case "suspend":
          await adminAPI.deleteUser(actionModal.user._id);
          break;
        case "delete":
          await adminAPI.deleteUserPermanently(actionModal.user._id);
          break;
        case "reactivate":
          await adminAPI.reactivateUser(actionModal.user._id);
          break;
      }
      setActionModal({ isOpen: false, user: null, action: null });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error(`Failed to ${actionModal.action} user:`, error);
      alert(`Failed to ${actionModal.action} user. Please try again.`);
    }
  };

  const handleCancelAction = () => {
    setActionModal({ isOpen: false, user: null, action: null });
  };

  const fetchUserStatistics = async (userId: string) => {
    // Don't fetch if we already have the statistics
    if (userStatistics[userId]) {
      return;
    }

    try {
      const response = await adminAPI.getUserStatistics(userId);
      // The backend returns data.data (which contains statistics)
      setUserStatistics((prev) => ({
        ...prev,
        [userId]: response,
      }));
    } catch (error) {
      console.error("Failed to fetch user statistics:", error);
    }
  };

  const handleToggleExpanded = async (userId: string) => {
    const isExpanding = expandedUser !== userId;
    setExpandedUser(isExpanding ? userId : null);

    // Reset editing state when toggling
    if (editingUser === userId) {
      setEditingUser(null);
      setEditForm({ role: "user", status: "active" });
    }

    // Fetch statistics when expanding a user
    if (isExpanding) {
      await fetchUserStatistics(userId);
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user._id);
    setEditForm({
      role: user.role,
      status: user.status,
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ role: "user", status: "active" });
  };

  const handleUpdateUser = async (userId: string) => {
    if (!editForm.role || !editForm.status) {
      alert("Please select both role and status");
      return;
    }

    try {
      setUpdatingUser(true);
      await adminAPI.updateUser(userId, {
        role: editForm.role,
        status: editForm.status,
      });

      // Update the local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, role: editForm.role, status: editForm.status } : user
        )
      );

      setEditingUser(null);
      setEditForm({ role: "user", status: "active" });
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Failed to update user. Please try again.");
    } finally {
      setUpdatingUser(false);
    }
  };

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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-aces-green"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            <ChevronDown className={`w-4 h-4 ml-2 transform transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 rounded-lg p-4 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-aces-green focus:border-aces-green"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-aces-green focus:border-aces-green"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-aces-green text-white rounded-lg p-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">
              {selectedUsers.size} user{selectedUsers.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkSuspend}
                disabled={bulkSuspending || bulkReactivating}
                className={`px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1 ${
                  bulkSuspending || bulkReactivating ? "bg-red-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {bulkSuspending && <Loader2 size={14} className="animate-spin" />}
                <span>Suspend</span>
              </button>
              <button
                onClick={handleBulkReactivate}
                disabled={bulkSuspending || bulkReactivating}
                className={`px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1 ${
                  bulkSuspending || bulkReactivating
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {bulkReactivating && <Loader2 size={14} className="animate-spin" />}
                <span>Reactivate</span>
              </button>
              <button
                onClick={() => setSelectedUsers(new Set())}
                disabled={bulkSuspending || bulkReactivating}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  bulkSuspending || bulkReactivating
                    ? "bg-white/10 cursor-not-allowed text-white/70"
                    : "bg-white/20 hover:bg-white/30"
                }`}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {bulkSuspending && suspendProgress.total > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Suspending users...</span>
                  <span>
                    {suspendProgress.current} of {suspendProgress.total}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="bg-white h-2.5 rounded-full transition-all duration-300 ease-out"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(suspendProgress.current / suspendProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
          {bulkReactivating && reactivateProgress.total > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Reactivating users...</span>
                  <span>
                    {reactivateProgress.current} of {reactivateProgress.total}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="bg-white h-2.5 rounded-full transition-all duration-300 ease-out"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(reactivateProgress.current / reactivateProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onChange={handleSelectAllUsers}
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
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Loading users...</p>
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
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user._id)}
                          onChange={() => handleToggleUserSelection(user._id)}
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
                          {user.phoneSecondary && (
                            <div className="text-xs text-gray-500">Alt: {user.phoneSecondary}</div>
                          )}
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
                        {userStatistics[user._id] ? (
                          <>
                            <div className="text-sm text-gray-900">
                              {userStatistics[user._id].performance.totalDocuments} documents
                            </div>
                            <div className="text-sm text-gray-500">
                              {userStatistics[user._id].documents.quotations.total} quotations,{" "}
                              {userStatistics[user._id].documents.receipts.total} receipts
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm text-gray-900">{user.statistics.totalDocuments} documents</div>
                            <div className="text-sm text-gray-500">
                              {user.statistics.quotations} quotations, {user.statistics.receipts} receipts
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                          </div>
                          {user.createdBy && typeof user.createdBy === 'object' && (
                            <div className="text-xs text-gray-500">Added by: {user.createdBy.fullName}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleExpanded(user._id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <>
                              {user.status === "active" && (
                                <button
                                  onClick={() => handleUserAction(user, "suspend")}
                                  className="text-red-400 hover:text-red-600"
                                  title="Suspend user"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              {user.status === "suspended" && (
                                <>
                                  <button
                                    onClick={() => handleUserAction(user, "reactivate")}
                                    className="text-gray-400 hover:text-green-600"
                                    title="Reactivate user"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleUserAction(user, "delete")}
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
                                                  {userStatistics[user._id].documents.quotations.total}
                                                </div>
                                                <div className="text-gray-500">Total</div>
                                              </div>
                                              <div className="text-center">
                                                <div className="text-lg font-semibold text-green-600">
                                                  {userStatistics[user._id].documents.quotations.thisMonth}
                                                </div>
                                                <div className="text-gray-500">This Month</div>
                                              </div>
                                              <div className="text-center">
                                                <div className="text-lg font-semibold text-purple-600">
                                                  {userStatistics[user._id].documents.quotations.thisWeek}
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
                                                  {userStatistics[user._id].documents.receipts.total}
                                                </div>
                                                <div className="text-gray-500">Total</div>
                                              </div>
                                              <div className="text-center">
                                                <div className="text-lg font-semibold text-green-600">
                                                  {userStatistics[user._id].documents.receipts.thisMonth}
                                                </div>
                                                <div className="text-gray-500">This Month</div>
                                              </div>
                                              <div className="text-center">
                                                <div className="text-lg font-semibold text-purple-600">
                                                  {userStatistics[user._id].documents.receipts.thisWeek}
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
                                                  {userStatistics[user._id].performance.totalDocuments}
                                                </div>
                                                <div className="text-gray-600 text-xs">Total Documents</div>
                                              </div>
                                              <div className="text-center">
                                                <div className="text-xl font-semibold text-purple-600">
                                                  {userStatistics[user._id].performance.averageDocumentsPerWeek}
                                                </div>
                                                <div className="text-gray-600 text-xs">Avg/Week</div>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                              <span className="text-gray-600 text-sm">Most Active Day:</span>
                                              <span className="font-semibold text-sm text-purple-600">
                                                {userStatistics[user._id].performance.mostActiveDay}
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                              <span className="text-gray-600 text-sm">Joined:</span>
                                              <span className="font-semibold text-sm text-gray-700">
                                                {new Date(
                                                  userStatistics[user._id].performance.joinDate
                                                ).toLocaleDateString()}
                                              </span>
                                            </div>
                                            {userStatistics[user._id].performance.lastActive && (
                                              <div className="flex justify-between items-center">
                                                <span className="text-gray-600 text-sm">Last Active:</span>
                                                <span className="font-semibold text-sm text-gray-700">
                                                  {userStatistics[user._id].performance.lastActive
                                                    ? new Date(userStatistics[user._id].performance.lastActive!).toLocaleDateString()
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
                                        <span className="text-sm font-medium text-gray-700">
                                          Edit User Role & Status
                                        </span>
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={handleCancelEdit}
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
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value as "admin" | "user" }))}
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
                                              setEditForm((prev) => ({ ...prev, status: e.target.value as "active" | "inactive" | "suspended" }))
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
                                          onClick={handleCancelEdit}
                                          disabled={updatingUser}
                                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => handleUpdateUser(user._id)}
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
                                          onClick={() => handleEditUser(user)}
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
                                        {user.createdBy && typeof user.createdBy === 'object' && <div>Added by: {user.createdBy.fullName}</div>}
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
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
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
                  to{" "}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>{" "}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
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
                        onClick={() => handlePageChange(pageNum)}
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
                    onClick={() => handlePageChange(pagination.page + 1)}
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

      {/* Action Confirmation Modal */}
      <AnimatePresence>
        {actionModal.isOpen && actionModal.user && actionModal.action && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    actionModal.action === "delete"
                      ? "bg-red-100"
                      : actionModal.action === "reactivate"
                      ? "bg-green-100"
                      : "bg-orange-100"
                  }`}
                >
                  {actionModal.action === "delete" ? (
                    <Trash className="w-6 h-6 text-red-600" />
                  ) : actionModal.action === "reactivate" ? (
                    <RotateCcw className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {actionModal.action === "delete"
                      ? "Delete User Permanently"
                      : actionModal.action === "reactivate"
                      ? "Reactivate User"
                      : "Suspend User"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {actionModal.action === "delete"
                      ? "This action cannot be undone"
                      : actionModal.action === "reactivate"
                      ? "User will regain access"
                      : "This action can be reversed"}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10">
                      {actionModal.user.profilePhoto?.url ? (
                        <img
                          src={actionModal.user.profilePhoto.url}
                          alt={actionModal.user.fullName}
                          className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-aces-green to-aces-blue flex items-center justify-center text-white font-medium">
                          {actionModal.user.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{actionModal.user.fullName}</div>
                      <div className="text-sm text-gray-500">{actionModal.user.email}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        {getRoleBadge(actionModal.user.role)}
                        {getStatusBadge(actionModal.user.status)}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mt-4">
                  {actionModal.action === "delete" ? (
                    <>
                      Are you sure you want to permanently delete <strong>{actionModal.user.fullName}</strong>? This
                      will completely remove the user and all associated data from the system.
                    </>
                  ) : actionModal.action === "reactivate" ? (
                    <>
                      Are you sure you want to reactivate <strong>{actionModal.user.fullName}</strong>? This will
                      restore their access to the system and change their status to active.
                    </>
                  ) : (
                    <>
                      Are you sure you want to suspend <strong>{actionModal.user.fullName}</strong>? This will prevent
                      them from accessing the system and mark their status as suspended.
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleCancelAction}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    actionModal.action === "delete"
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      : actionModal.action === "reactivate"
                      ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                      : "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                  }`}
                >
                  {actionModal.action === "delete"
                    ? "Delete Permanently"
                    : actionModal.action === "reactivate"
                    ? "Reactivate User"
                    : "Suspend User"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Suspend Confirmation Modal */}
      <AnimatePresence>
        {bulkSuspendModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleCancelBulkSuspend}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Suspend Multiple Users</h3>
                  <p className="text-sm text-gray-600">This action can be reversed later</p>
                </div>
              </div>

              {/* Bulk Suspend Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {bulkSuspendModal.count} User{bulkSuspendModal.count !== 1 ? "s" : ""} Selected
                    </div>
                    <div className="text-xs text-gray-500">All selected users will be suspended and lose access</div>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mt-4">
                Are you sure you want to suspend <strong>{bulkSuspendModal.count}</strong> selected user
                {bulkSuspendModal.count !== 1 ? "s" : ""}?{bulkSuspendModal.count !== 1 ? " These users" : " This user"}{" "}
                will lose access to the system but can be reactivated later.
              </p>

              {/* Warning for bulk suspend */}
              {bulkSuspendModal.count > 5 && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      You're about to suspend a large number of users. This operation may take a moment.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelBulkSuspend}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={bulkSuspending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkSuspend}
                  disabled={bulkSuspending}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkSuspending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Suspending...
                    </>
                  ) : (
                    `Suspend ${bulkSuspendModal.count} User${bulkSuspendModal.count !== 1 ? "s" : ""}`
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Reactivate Confirmation Modal */}
      <AnimatePresence>
        {bulkReactivateModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleCancelBulkReactivate}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reactivate Multiple Users</h3>
                  <p className="text-sm text-gray-600">Users will regain system access</p>
                </div>
              </div>

              {/* Bulk Reactivate Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {bulkReactivateModal.count} User{bulkReactivateModal.count !== 1 ? "s" : ""} Selected
                    </div>
                    <div className="text-xs text-gray-500">
                      All selected users will be reactivated and regain access
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mt-4">
                Are you sure you want to reactivate <strong>{bulkReactivateModal.count}</strong> selected user
                {bulkReactivateModal.count !== 1 ? "s" : ""}?
                {bulkReactivateModal.count !== 1 ? " These users" : " This user"} will regain access to the system and
                their status will be changed to active.
              </p>

              {/* Warning for bulk reactivate */}
              {bulkReactivateModal.count > 5 && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-xs text-green-800">
                      You're about to reactivate a large number of users. This operation may take a moment.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelBulkReactivate}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={bulkReactivating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkReactivate}
                  disabled={bulkReactivating}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkReactivating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Reactivating...
                    </>
                  ) : (
                    `Reactivate ${bulkReactivateModal.count} User${bulkReactivateModal.count !== 1 ? "s" : ""}`
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
