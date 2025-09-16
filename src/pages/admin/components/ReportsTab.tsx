import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Users, FileText, TrendingUp, Calendar } from "lucide-react";
import { adminAPI, type UserPerformance, type DocumentStats, type DashboardStats } from "../../../services/admin";

const ReportsTab: React.FC = () => {
  const [userPerformance, setUserPerformance] = useState<UserPerformance[]>([]);
  const [documentStats, setDocumentStats] = useState<DocumentStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [notificationStats, setNotificationStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedGranularity, setSelectedGranularity] = useState("daily");

  useEffect(() => {
    fetchReports();
  }, [selectedPeriod, selectedGranularity]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      const [performanceData, statsData, dashboardData, notificationData] = await Promise.all([
        adminAPI.getUserPerformanceReport({ period: selectedPeriod }).catch((err) => {
          console.error("User performance error:", err);
          return { data: { performance: [] } };
        }),
        adminAPI
          .getDocumentStatsReport({
            period: selectedPeriod,
            granularity: selectedGranularity,
          })
          .catch((err) => {
            console.error("Document stats error:", err);
            return null;
          }),
        adminAPI.getDashboardStats({ period: selectedPeriod }).catch((err) => {
          console.error("Dashboard stats error:", err);
          return null;
        }),
        adminAPI.getNotificationStats({ period: selectedPeriod }).catch((err) => {
          console.error("Notification stats error:", err);
          return null;
        }),
      ]);

      setUserPerformance(performanceData.data.performance || []);
      setDocumentStats(statsData);
      setDashboardStats(dashboardData);
      setNotificationStats(notificationData?.data || null);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const periodOptions = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "1y", label: "1 Year" },
  ];

  const granularityOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  const calculateTotalDocuments = () => {
    if (!dashboardStats) return 0;
    return (dashboardStats.totalQuotations || 0) + (dashboardStats.totalReceipts || 0);
  };

  const calculateTotalRevenue = () => {
    if (!dashboardStats?.overview?.revenue) return 0;
    return dashboardStats.overview.revenue.total || 0;
  };

  const formatCurrency = (amount: number) => {
    const currency = dashboardStats?.overview?.revenue?.currency || "UGX";
    return `${currency} ${amount.toLocaleString()}`;
  };

  const getTopPerformers = () => {
    return userPerformance
      .sort((a, b) => b.quotationCount + b.receiptCount - (a.quotationCount + a.receiptCount))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aces-green"></div>
        <span className="ml-2 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period and Granularity Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-aces-green focus:border-aces-green"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Granularity</label>
            <select
              value={selectedGranularity}
              onChange={(e) => setSelectedGranularity(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-aces-green focus:border-aces-green"
            >
              {granularityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={fetchReports}
          className="inline-flex items-center px-4 py-2 bg-aces-green text-white rounded-lg hover:bg-aces-green/90 font-medium"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Refresh Reports
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Users</h3>
              <div className="text-2xl font-bold text-aces-green">{dashboardStats?.overview.totalUsers.count || 0}</div>
              <div className="text-xs text-gray-500 mt-1">{dashboardStats?.overview.totalUsers.active || 0} active</div>
              {dashboardStats?.overview.totalUsers.change && (
                <div className="text-xs mt-1">
                  <span
                    className={`${
                      parseFloat(dashboardStats.overview.totalUsers.change) >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {parseFloat(dashboardStats.overview.totalUsers.change) >= 0 ? "+" : ""}
                    {dashboardStats.overview.totalUsers.change}%
                  </span>
                  <span className="text-gray-500 ml-1">vs last period</span>
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-aces-green" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Documents</h3>
              <div className="text-2xl font-bold text-blue-600">{calculateTotalDocuments()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {dashboardStats?.totalQuotations || 0} quotations, {dashboardStats?.totalReceipts || 0} receipts
              </div>
              {dashboardStats?.overview.totalDocuments && (
                <div className="text-xs mt-1">
                  <span
                    className={`${
                      parseFloat(dashboardStats.overview.totalDocuments.quotationsChange) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {parseFloat(dashboardStats.overview.totalDocuments.quotationsChange) >= 0 ? "+" : ""}
                    {dashboardStats.overview.totalDocuments.quotationsChange}%
                  </span>
                  <span className="text-gray-500 ml-1">quotations</span>
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Revenue</h3>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(calculateTotalRevenue())}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrency(dashboardStats?.overview.revenue.current || 0)} this period
              </div>
              {dashboardStats?.overview.revenue.change && (
                <div className="text-xs mt-1">
                  <span
                    className={`${
                      parseFloat(dashboardStats.overview.revenue.change) >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {parseFloat(dashboardStats.overview.revenue.change) >= 0 ? "+" : ""}
                    {dashboardStats.overview.revenue.change}%
                  </span>
                  <span className="text-gray-500 ml-1">vs last period</span>
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Move Types</h3>
              <div className="text-sm font-medium text-gray-900 space-y-1">
                <div>International: {dashboardStats?.internationalOrders || 0}</div>
                <div>Office: {dashboardStats?.officeMoves || 0}</div>
                <div>Residential: {dashboardStats?.residentialMoves || 0}</div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* User Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Quotations</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Receipts</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {userPerformance.map((user, index) => (
                <tr key={user.user._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{user.user.fullName}</div>
                      <div className="text-sm text-gray-500">{user.user.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900">{user.quotationCount}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(user.totalQuotationValue || 0)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900">{user.receiptCount}</div>
                    <div className="text-xs text-gray-500">
                      {user.paidReceipts}/{user.receiptCount} paid
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(user.totalReceiptValue || 0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Top Performers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
        <div className="space-y-4">
          {getTopPerformers().map((user, index) => (
            <div key={user.user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-aces-green rounded-full flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">{user.user.fullName}</div>
                  <div className="text-xs text-gray-500">{user.user.email}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user.quotationCount + user.receiptCount} documents
                </div>
                <div className="text-xs text-gray-500">
                  {formatCurrency((user.totalQuotationValue || 0) + (user.totalReceiptValue || 0))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      {dashboardStats?.recentActivity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Quotations</h4>
              <div className="space-y-3">
                {dashboardStats.recentActivity.quotations.slice(0, 5).map((quotation) => (
                  <div key={quotation._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{quotation.quotationNumber}</div>
                      <div className="text-xs text-gray-500">
                        {quotation.type} - {quotation.createdBy.fullName}
                      </div>
                      <div className="text-xs text-gray-400">{new Date(quotation.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          quotation.validity.status === "active"
                            ? "bg-green-100 text-green-800"
                            : quotation.validity.status === "expired"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {quotation.validity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Receipts</h4>
              <div className="space-y-3">
                {dashboardStats.recentActivity.receipts.slice(0, 5).map((receipt) => (
                  <div key={receipt._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{receipt.receiptNumber}</div>
                      <div className="text-xs text-gray-500">{receipt.createdBy.fullName}</div>
                      <div className="text-xs text-gray-400">{new Date(receipt.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-900">
                        {formatCurrency(receipt.payment?.totalAmount || 0)}
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          receipt.payment?.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : receipt.payment?.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {receipt.payment?.status || "unknown"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ReportsTab;
