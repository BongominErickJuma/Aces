import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FileText, Receipt, Globe, Building, Home, Users, DollarSign, RefreshCw, Download, Bell } from "lucide-react";
import { PageLayout } from "../../components/layout";
import StatsCard from "../../components/dashboard/StatsCard";
import RecentDocuments from "../../components/dashboard/RecentDocuments";
import { dashboardAPI } from "../../services/dashboard";
import { useAuth } from "../../context/AuthContext";
import type { DashboardStats, Period } from "../../types/dashboard";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const isAdmin = user?.role === "admin";

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const data = await dashboardAPI.getStats(period);
      setStats(data);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleViewDocument = (type: "quotation" | "receipt", id: string) => {
    navigate(`/${type}s/${id}`);
  };

  const handleDownloadDocument = async (type: "quotation" | "receipt", id: string) => {
    // Prevent multiple downloads of the same document
    if (downloadingIds.has(id)) return;

    try {
      // Add to downloading set
      setDownloadingIds(prev => new Set(prev).add(id));

      const { api } = await import("../../services/api");
      const endpoint = type === "quotation" ? "quotations" : "receipts";
      
      const response = await api.get(`/${endpoint}/${id}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Get document number for filename (will be available from the doc in stats)
      const docData = type === "quotation" 
        ? stats?.recentActivity.quotations.find(q => q._id === id)
        : stats?.recentActivity.receipts.find(r => r._id === id);
      
      const documentNumber = type === "quotation" 
        ? (docData as any)?.quotationNumber || id
        : (docData as any)?.receiptNumber || id;
        
      link.download = `${type}-${documentNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      // Remove from downloading set
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleShareDocument = (type: "quotation" | "receipt", id: string) => {
    // TODO: Implement share functionality
    console.log(`Sharing ${type} ${id}`);
  };

  const handleDeleteDocument = async (type: "quotation" | "receipt", id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      // TODO: Implement delete functionality
      console.log(`Deleting ${type} ${id}`);
      handleRefresh();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleExportData = () => {
    // TODO: Implement CSV/Excel export
    console.log("Exporting dashboard data...");
  };

  return (
    <PageLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.fullName}!</h1>
              <p className="text-gray-600 mt-1">Here's an overview of your document management system</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Period Selector */}
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
              </button>

              {/* Export Button */}
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatsCard
            title="Total Receipts"
            value={stats?.totalReceipts || 0}
            change={stats?.overview.totalDocuments.receiptsChange}
            icon={Receipt}
            color="green"
            loading={loading}
          />
          <StatsCard
            title="Total Quotations"
            value={stats?.totalQuotations || 0}
            change={stats?.overview.totalDocuments.quotationsChange}
            icon={FileText}
            color="blue"
            loading={loading}
          />
          <StatsCard
            title="International Moves"
            value={stats?.internationalOrders || 0}
            icon={Globe}
            color="purple"
            loading={loading}
          />
          <StatsCard
            title="Office Moves"
            value={stats?.officeMoves || 0}
            icon={Building}
            color="orange"
            loading={loading}
          />
          <StatsCard
            title="Residential Moves"
            value={stats?.residentialMoves || 0}
            icon={Home}
            color="red"
            loading={loading}
          />
        </div>

        {/* Additional Stats for Admin */}
        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Users"
              value={stats?.overview.totalUsers.count || 0}
              change={stats?.overview.totalUsers.change}
              icon={Users}
              color="blue"
              loading={loading}
            />
            <StatsCard
              title="Active Users"
              value={stats?.overview.totalUsers.active || 0}
              icon={Users}
              color="green"
              loading={loading}
            />
            <StatsCard
              title="Total Revenue"
              value={
                stats?.overview.revenue.total
                  ? `${stats.overview.revenue.currency} ${stats.overview.revenue.total.toLocaleString()}`
                  : "0"
              }
              change={stats?.overview.revenue.change}
              icon={DollarSign}
              color="purple"
              loading={loading}
            />
            <StatsCard
              title="Unread Notifications"
              value={stats?.overview.notifications.unread || 0}
              icon={Bell}
              color="orange"
              loading={loading}
            />
          </div>
        )}

        {/* Recent Documents Section */}
        <RecentDocuments
          quotations={stats?.recentActivity.quotations || []}
          receipts={stats?.recentActivity.receipts || []}
          loading={loading}
          onViewDocument={handleViewDocument}
          onDownloadDocument={handleDownloadDocument}
          onDeleteDocument={isAdmin ? handleDeleteDocument : undefined}
          onShareDocument={handleShareDocument}
          isAdmin={isAdmin}
          downloadingIds={downloadingIds}
        />

        {/* Activity Timeline (Optional Enhancement) */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Period</span>
                <span className="text-sm font-medium text-gray-900">{stats.dateRange.period}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Date Range</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(stats.dateRange.start).toLocaleDateString()} -{" "}
                  {new Date(stats.dateRange.end).toLocaleDateString()}
                </span>
              </div>
              {Object.entries(stats.breakdowns.quotationsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Quotations ({status})</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
              {Object.entries(stats.breakdowns.receiptsByPaymentStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Receipts ({status})</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
};

export default DashboardPage;
