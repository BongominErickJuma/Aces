import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FileText, Receipt, Globe, Building, Home, AlertCircle } from "lucide-react";
import { PageLayout } from "../../components/layout";
import StatsCard from "../../components/dashboard/StatsCard";
import RecentDocuments from "../../components/dashboard/RecentDocuments";
import DashboardSkeleton from "../../components/skeletons/DashboardSkeleton";
import { Button } from "../../components/ui/Button";
import { dashboardAPI } from "../../services/dashboard";
import { receiptsAPI } from "../../services/receipts";
import { quotationsAPI } from "../../services/quotations";
import { useAuth } from "../../context/useAuth";
import type { DashboardStats, Period } from "../../types/dashboard";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period] = useState<Period>("30d");
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const isAdmin = user?.role === "admin";

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardAPI.getStats(period);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const handleRefresh = async () => {
    await loadDashboardData();
  };

  const handleViewDocument = (type: "quotation" | "receipt", id: string) => {
    navigate(`/${type}s/${id}`);
  };

  const handleDownloadDocument = async (type: "quotation" | "receipt", id: string) => {
    // Prevent multiple downloads of the same document
    if (downloadingIds.has(id)) return;

    try {
      // Add to downloading set
      setDownloadingIds((prev) => new Set(prev).add(id));

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
      const docData =
        type === "quotation"
          ? stats?.recentActivity.quotations.find((q) => q._id === id)
          : stats?.recentActivity.receipts.find((r) => r._id === id);

      const documentNumber =
        type === "quotation"
          ? (docData as { quotationNumber?: string })?.quotationNumber || id
          : (docData as { receiptNumber?: string })?.receiptNumber || id;

      link.download = `${type}-${documentNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      // Remove from downloading set
      setDownloadingIds((prev) => {
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
    const documentName = type === "quotation" ? "quotation" : "receipt";
    if (!confirm(`Are you sure you want to delete this ${documentName}? This action cannot be undone.`)) return;

    try {
      if (type === "receipt") {
        await receiptsAPI.deleteReceipt(id);
      } else {
        await quotationsAPI.deleteQuotation(id);
      }

      // Refresh the dashboard data after successful deletion
      handleRefresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert(
        error instanceof Error
          ? error.message
          : `Failed to delete ${documentName}. ${type === "receipt" ? "Admin privileges required." : ""}`
      );
    }
  };

  if (loading) {
    return (
      <PageLayout title="Dashboard">
        <DashboardSkeleton />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Dashboard">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData} variant="primary">
            Try Again
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Dashboard">
      <div className="space-y-6">

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
