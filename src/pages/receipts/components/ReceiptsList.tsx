import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  Receipt as ReceiptIcon,
  Calendar,
  DollarSign,
  User,
  Clock,
  Download,
  Mail,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Package,
  FileText,
  Loader2,
  Grid,
  List,
  Settings,
  MoreVertical,
  Trash2,
  Send,
  ChevronDown,
} from "lucide-react";
import { receiptsAPI, type Receipt, type ReceiptFilters } from "../../../services/receipts";
import { Button } from "../../../components/ui/Button";

interface ReceiptsListProps {
  onViewReceipt: (receipt: Receipt) => void;
}

const ReceiptsList: React.FC<ReceiptsListProps> = ({ onViewReceipt }) => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ReceiptFilters>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // New state for table view and bulk operations
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    "receiptNumber", "type", "client", "status", "amount", "date", "actions"
  ]));
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const response = await receiptsAPI.getReceipts(filters);
      setReceipts(response.data.items);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load receipts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, [filters]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    
    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    // Set new timer for debounced search
    const newTimer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }, 300); // 300ms debounce
    
    setSearchDebounceTimer(newTimer);
  }, [searchDebounceTimer]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReceipts(new Set(receipts.map(r => r._id)));
    } else {
      setSelectedReceipts(new Set());
    }
  };

  const handleSelectReceipt = (receiptId: string, checked: boolean) => {
    const newSelected = new Set(selectedReceipts);
    if (checked) {
      newSelected.add(receiptId);
    } else {
      newSelected.delete(receiptId);
    }
    setSelectedReceipts(newSelected);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedReceipts.size} selected receipts?`)) {
      try {
        await receiptsAPI.bulkDelete(Array.from(selectedReceipts));
        setSelectedReceipts(new Set());
        loadReceipts(); // Reload data
      } catch (err) {
        console.error('Failed to delete receipts:', err);
      }
    }
  };

  const handleBulkExport = async () => {
    try {
      const blob = await receiptsAPI.bulkExport(Array.from(selectedReceipts));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipts-export-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export receipts:', err);
    }
  };

  const handleBulkSendReminders = async () => {
    try {
      const result = await receiptsAPI.sendBulkReminders(Array.from(selectedReceipts));
      console.log(`Sent ${result.data.sentCount} payment reminders`);
      setSelectedReceipts(new Set());
    } catch (err) {
      console.error('Failed to send reminders:', err);
    }
  };

  const toggleColumnVisibility = (column: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(column)) {
      newVisible.delete(column);
    } else {
      newVisible.add(column);
    }
    setVisibleColumns(newVisible);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-600 bg-green-100";
      case "partial":
        return "text-yellow-600 bg-yellow-100";
      case "pending":
        return "text-gray-600 bg-gray-100";
      case "overdue":
        return "text-red-600 bg-red-100";
      case "refunded":
        return "text-blue-600 bg-blue-100";
      case "cancelled":
        return "text-gray-600 bg-gray-200";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle size={16} />;
      case "partial":
        return <AlertCircle size={16} />;
      case "pending":
        return <Clock size={16} />;
      case "overdue":
        return <AlertTriangle size={16} />;
      case "refunded":
        return <CreditCard size={16} />;
      case "cancelled":
        return <FileText size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getReceiptTypeIcon = (type: string) => {
    switch (type) {
      case "box":
        return <Package size={16} className="text-purple-600" />;
      case "commitment":
        return <FileText size={16} className="text-blue-600" />;
      case "final":
        return <CheckCircle size={16} className="text-green-600" />;
      case "one_time":
        return <CreditCard size={16} className="text-orange-600" />;
      default:
        return <ReceiptIcon size={16} className="text-gray-600" />;
    }
  };

  const getReceiptTypeLabel = (type: string) => {
    switch (type) {
      case "box":
        return "Box Receipt";
      case "commitment":
        return "Commitment";
      case "final":
        return "Final";
      case "one_time":
        return "One-Time Payment";
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-UG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewReceipt = (receipt: Receipt) => {
    navigate(`/receipts/${receipt._id}`);
  };

  const handleDownloadPDF = async (receipt: Receipt, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Prevent multiple downloads of the same document
    if (downloadingIds.has(receipt._id)) return;

    try {
      // Add to downloading set
      setDownloadingIds(prev => new Set(prev).add(receipt._id));

      const blob = await receiptsAPI.downloadPDF(receipt._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt_${receipt.receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF:", err);
    } finally {
      // Remove from downloading set
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(receipt._id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-aces-green border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Receipts</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadReceipts} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-600 mt-1">Manage and track all your client receipts and payments</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => navigate('/create?type=receipt')} variant="primary" className="flex items-center space-x-2">
            <Plus size={16} />
            <span>New Receipt</span>
          </Button>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search receipts by number or client name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white text-aces-green shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-white text-aces-green shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Grid size={18} />
            </button>
          </div>

          {/* Column Settings (only for table view) */}
          {viewMode === "table" && (
            <div className="relative">
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="flex items-center space-x-2 px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Settings size={16} />
                <span>Columns</span>
              </button>
              
              {showColumnSettings && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Show Columns</h4>
                    {[
                      { key: "receiptNumber", label: "Receipt #" },
                      { key: "type", label: "Type" },
                      { key: "client", label: "Client" },
                      { key: "status", label: "Status" },
                      { key: "amount", label: "Amount" },
                      { key: "balance", label: "Balance" },
                      { key: "date", label: "Date" },
                      { key: "dueDate", label: "Due Date" }
                    ].map(column => (
                      <label key={column.key} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(column.key)}
                          onChange={() => toggleColumnVisibility(column.key)}
                          className="rounded border-gray-300 text-aces-green focus:ring-aces-green"
                        />
                        <span className="text-sm text-gray-700">{column.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filter Toggle */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-colors ${
              showFilters
                ? "bg-aces-green text-white border-aces-green"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter size={16} />
            <span>Filters</span>
          </motion.button>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.receiptType || ""}
                  onChange={(e) => handleFilterChange("receiptType", e.target.value || undefined)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="box">Box Receipt</option>
                  <option value="commitment">Commitment</option>
                  <option value="final">Final</option>
                  <option value="one_time">One-Time Payment</option>
                </select>

                <select
                  value={filters.paymentStatus || ""}
                  onChange={(e) => handleFilterChange("paymentStatus", e.target.value || undefined)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                >
                  <option value="">All Payment Status</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.overdue || false}
                    onChange={(e) => handleFilterChange("overdue", e.target.checked || undefined)}
                    className="rounded border-gray-300 text-aces-green focus:ring-aces-green"
                  />
                  <span className="text-sm text-gray-700">Show only overdue</span>
                </label>

                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split("-");
                    handleFilterChange("sortBy", sortBy);
                    handleFilterChange("sortOrder", sortOrder);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="receiptNumber-asc">Receipt Number A-Z</option>
                  <option value="receiptNumber-desc">Receipt Number Z-A</option>
                  <option value="payment.totalAmount-desc">Highest Amount</option>
                  <option value="payment.totalAmount-asc">Lowest Amount</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Actions */}
      {selectedReceipts.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-aces-green text-white rounded-lg p-4 flex items-center justify-between"
        >
          <span className="font-medium">
            {selectedReceipts.size} receipt{selectedReceipts.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkExport}
              className="px-3 py-1 bg-white/20 rounded text-sm hover:bg-white/30 transition-colors"
            >
              Export
            </button>
            <button
              onClick={handleBulkSendReminders}
              className="px-3 py-1 bg-white/20 rounded text-sm hover:bg-white/30 transition-colors"
            >
              Send Reminders
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-500 rounded text-sm hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedReceipts(new Set())}
              className="px-3 py-1 bg-white/20 rounded text-sm hover:bg-white/30 transition-colors"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {receipts.length} of {pagination.total} receipts
        {selectedReceipts.size > 0 && (
          <span className="ml-4 text-aces-green font-medium">
            · {selectedReceipts.size} selected
          </span>
        )}
      </div>

      {/* Receipts List/Table */}
      {receipts.length === 0 ? (
        <div className="text-center py-12">
          <ReceiptIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Receipts Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filters.receiptType || filters.paymentStatus
              ? "No receipts match your current filters. Try adjusting your search criteria."
              : "Get started by creating your first receipt."}
          </p>
          <Button onClick={() => navigate('/create?type=receipt')} variant="primary">
            <Plus size={16} className="mr-2" />
            Create New Receipt
          </Button>
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedReceipts.size === receipts.length && receipts.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-aces-green focus:ring-aces-green"
                    />
                  </th>
                  {visibleColumns.has("receiptNumber") && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt #
                    </th>
                  )}
                  {visibleColumns.has("type") && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  )}
                  {visibleColumns.has("client") && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                  )}
                  {visibleColumns.has("status") && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  )}
                  {visibleColumns.has("amount") && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  )}
                  {visibleColumns.has("balance") && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                  )}
                  {visibleColumns.has("date") && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  )}
                  {visibleColumns.has("dueDate") && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipts.map((receipt, index) => (
                  <motion.tr
                    key={receipt._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedReceipts.has(receipt._id) ? "bg-aces-green/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedReceipts.has(receipt._id)}
                        onChange={(e) => handleSelectReceipt(receipt._id, e.target.checked)}
                        className="rounded border-gray-300 text-aces-green focus:ring-aces-green"
                      />
                    </td>
                    {visibleColumns.has("receiptNumber") && (
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {receipt.receiptNumber}
                      </td>
                    )}
                    {visibleColumns.has("type") && (
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          {getReceiptTypeIcon(receipt.receiptType)}
                          <span>{getReceiptTypeLabel(receipt.receiptType)}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.has("client") && (
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {receipt.client.name}
                      </td>
                    )}
                    {visibleColumns.has("status") && (
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            receipt.payment.status
                          )}`}
                        >
                          {getPaymentStatusIcon(receipt.payment.status)}
                          <span className="capitalize">{receipt.payment.status}</span>
                        </span>
                      </td>
                    )}
                    {visibleColumns.has("amount") && (
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(receipt.payment.totalAmount, receipt.payment.currency)}
                      </td>
                    )}
                    {visibleColumns.has("balance") && (
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {receipt.payment.balance > 0 ? (
                          <span className="text-red-600 font-medium">
                            {formatCurrency(receipt.payment.balance, receipt.payment.currency)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.has("date") && (
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(receipt.createdAt)}
                      </td>
                    )}
                    {visibleColumns.has("dueDate") && (
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {receipt.payment.dueDate ? (
                          <span className={receipt.isOverdue ? "text-red-600 font-medium" : ""}>
                            {formatDate(receipt.payment.dueDate)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewReceipt(receipt)}
                          className="p-1 text-gray-600 hover:text-aces-green hover:bg-gray-100 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => navigate(`/create?type=receipt&edit=${receipt._id}`)}
                          className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDownloadPDF(receipt, e)}
                          disabled={downloadingIds.has(receipt._id)}
                          className={`p-1 rounded transition-colors ${
                            downloadingIds.has(receipt._id)
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                          }`}
                          title={downloadingIds.has(receipt._id) ? "Downloading..." : "Download PDF"}
                        >
                          {downloadingIds.has(receipt._id) ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View */
        <div className="space-y-4">
          {receipts.map((receipt, index) => (
            <motion.div
              key={receipt._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer ${
                selectedReceipts.has(receipt._id) ? "ring-2 ring-aces-green border-aces-green" : ""
              }`}
              onClick={() => handleViewReceipt(receipt)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedReceipts.has(receipt._id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectReceipt(receipt._id, e.target.checked);
                    }}
                    className="rounded border-gray-300 text-aces-green focus:ring-aces-green"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{receipt.receiptNumber}</h3>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            receipt.payment.status
                          )}`}
                        >
                          {getPaymentStatusIcon(receipt.payment.status)}
                          <span className="capitalize">{receipt.payment.status}</span>
                        </span>
                        <span className="inline-flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded">
                          {getReceiptTypeIcon(receipt.receiptType)}
                          <span>{getReceiptTypeLabel(receipt.receiptType)}</span>
                        </span>
                        {receipt.isOverdue && (
                          <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                            {receipt.daysOverdue} days overdue
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User size={14} />
                        <span>{receipt.client.name}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar size={14} />
                        <span>{formatDate(receipt.createdAt)}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <DollarSign size={14} />
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {formatCurrency(receipt.payment.totalAmount, receipt.payment.currency)}
                          </span>
                          {receipt.payment.status !== "paid" && receipt.payment.balance > 0 && (
                            <span className="text-xs text-red-600">
                              Balance: {formatCurrency(receipt.payment.balance, receipt.payment.currency)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {receipt.payment.dueDate ? (
                          <>
                            <Clock size={14} />
                            <span className={receipt.isOverdue ? "text-red-600" : ""}>
                              Due: {formatDate(receipt.payment.dueDate)}
                            </span>
                          </>
                        ) : (
                          <>
                            <Calendar size={14} />
                            <span>No due date</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for Partial Payments */}
                    {receipt.payment.status === "partial" && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Payment Progress</span>
                          <span>
                            {formatCurrency(receipt.payment.amountPaid, receipt.payment.currency)} /{" "}
                            {formatCurrency(receipt.payment.totalAmount, receipt.payment.currency)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-aces-green h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(receipt.payment.amountPaid / receipt.payment.totalAmount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewReceipt(receipt);
                    }}
                    className="p-2 text-gray-600 hover:text-aces-green hover:bg-gray-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/create?type=receipt&edit=${receipt._id}`);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: downloadingIds.has(receipt._id) ? 1 : 1.1 }}
                    whileTap={{ scale: downloadingIds.has(receipt._id) ? 1 : 0.9 }}
                    onClick={(e) => handleDownloadPDF(receipt, e)}
                    disabled={downloadingIds.has(receipt._id)}
                    className={`p-2 rounded-lg transition-colors ${
                      downloadingIds.has(receipt._id)
                        ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                        : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                    }`}
                    title={downloadingIds.has(receipt._id) ? "Downloading..." : "Download PDF"}
                  >
                    {downloadingIds.has(receipt._id) ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              variant="secondary"
              size="sm"
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + Math.max(1, pagination.page - 2);
              if (page > pagination.totalPages) return null;
              return (
                <Button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  variant={page === pagination.page ? "primary" : "secondary"}
                  size="sm"
                >
                  {page}
                </Button>
              );
            })}
            <Button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              variant="secondary"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptsList;
