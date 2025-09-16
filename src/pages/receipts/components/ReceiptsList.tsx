import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Receipt as ReceiptIcon,
  Calendar,
  DollarSign,
  User,
  Clock,
  Download,
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
  Trash2,
} from "lucide-react";
import { receiptsAPI, type Receipt, type ReceiptFilters } from "../../../services/receipts";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../context/useAuth";

interface ReceiptsListProps {
  onViewReceipt: (receipt: Receipt) => void;
}

const ReceiptsList: React.FC<ReceiptsListProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    receipt: Receipt | null;
  }>({ isOpen: false, receipt: null });
  const [bulkDeleteModal, setBulkDeleteModal] = useState<{
    isOpen: boolean;
    count: number;
  }>({ isOpen: false, count: 0 });
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0 });

  // Bulk operations state
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(["receiptNumber", "type", "client", "status", "amount", "date", "createdBy", "actions"])
  );
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

  const handleSearch = useCallback(
    (value: string) => {
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
    },
    [searchDebounceTimer]
  );

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReceipts(new Set(receipts.map((r) => r._id)));
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
  const handleBulkDelete = () => {
    setBulkDeleteModal({ isOpen: true, count: selectedReceipts.size });
  };

  const handleConfirmBulkDelete = async () => {
    try {
      setBulkDeleting(true);
      setBulkDeleteModal({ isOpen: false, count: 0 });
      const totalReceipts = selectedReceipts.size;

      // Initialize progress
      setDeleteProgress({ current: 0, total: totalReceipts });

      // Simulate progress for better UX (since deletion happens in one API call)
      const progressInterval = setInterval(() => {
        setDeleteProgress((prev) => {
          if (prev.current < prev.total) {
            return { ...prev, current: prev.current + 1 };
          }
          return prev;
        });
      }, 150); // Update every 150ms

      await receiptsAPI.bulkDelete(Array.from(selectedReceipts));

      // Clear interval and complete progress
      clearInterval(progressInterval);
      setDeleteProgress({ current: totalReceipts, total: totalReceipts });

      // Small delay to show completion
      await new Promise((resolve) => setTimeout(resolve, 300));

      setSelectedReceipts(new Set());
      loadReceipts(); // Reload data
    } catch (err) {
      console.error("Failed to delete receipts:", err);
      setError(err instanceof Error ? err.message : "Failed to delete receipts");
    } finally {
      setBulkDeleting(false);
      setDeleteProgress({ current: 0, total: 0 });
    }
  };

  const handleCancelBulkDelete = () => {
    setBulkDeleteModal({ isOpen: false, count: 0 });
  };

  const handleDeleteReceipt = (receipt: Receipt, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, receipt });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.receipt) return;

    try {
      setDeletingId(deleteModal.receipt._id);
      await receiptsAPI.deleteReceipt(deleteModal.receipt._id);
      setDeleteModal({ isOpen: false, receipt: null });
      loadReceipts(); // Reload data
    } catch (err) {
      console.error("Failed to delete receipt:", err);
      setError(err instanceof Error ? err.message : "Failed to delete receipt. Admin privileges required.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, receipt: null });
  };

  const handleEditReceipt = (receiptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/receipts/edit/${receiptId}`);
  };

  const handleBulkDownload = async () => {
    try {
      setBulkDownloading(true);

      // Get receipt info for bulk download
      const response = await receiptsAPI.bulkDownload(Array.from(selectedReceipts));
      const receiptsToDownload = response.data.receipts;

      // Initialize progress
      setDownloadProgress({ current: 0, total: receiptsToDownload.length });

      // Download each receipt individually
      for (let i = 0; i < receiptsToDownload.length; i++) {
        const receiptInfo = receiptsToDownload[i];
        try {
          const blob = await receiptsAPI.downloadPDF(receiptInfo.id);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `receipt_${receiptInfo.receiptNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          // Update progress after successful download
          setDownloadProgress({ current: i + 1, total: receiptsToDownload.length });

          // Add a small delay between downloads to avoid overwhelming the browser
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (downloadErr) {
          console.error(`Failed to download receipt ${receiptInfo.receiptNumber}:`, downloadErr);
          // Still update progress even if download failed
          setDownloadProgress({ current: i + 1, total: receiptsToDownload.length });
        }
      }

      // Clear selection after successful bulk download
      setSelectedReceipts(new Set());
    } catch (err) {
      console.error("Failed to prepare bulk download:", err);
      setError(err instanceof Error ? err.message : "Failed to download receipts");
    } finally {
      setBulkDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
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
      setDownloadingIds((prev) => new Set(prev).add(receipt._id));

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
      setDownloadingIds((prev) => {
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

          {/* Column Settings (only for desktop table view) */}
          <div className="relative hidden 2xl:block">
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
                    { key: "dueDate", label: "Due Date" },
                    { key: "createdBy", label: "Created By" },
                  ].map((column) => (
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
          className="bg-aces-green text-white rounded-lg p-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">
              {selectedReceipts.size} receipt{selectedReceipts.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkDownload}
                disabled={bulkDownloading || bulkDeleting}
                className={`px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1 ${
                  bulkDownloading || bulkDeleting
                    ? "bg-white/10 cursor-not-allowed text-white/70"
                    : "bg-white/20 hover:bg-white/30"
                }`}
              >
                {bulkDownloading && <Loader2 size={14} className="animate-spin" />}
                <span>{bulkDownloading ? "Download" : "Download"}</span>
              </button>
              {isAdmin && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDownloading || bulkDeleting}
                  className={`px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1 ${
                    bulkDownloading || bulkDeleting ? "bg-red-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {bulkDeleting && <Loader2 size={14} className="animate-spin" />}
                  <span>{bulkDeleting ? "Delete" : "Delete"}</span>
                </button>
              )}
              <button
                onClick={() => setSelectedReceipts(new Set())}
                disabled={bulkDownloading || bulkDeleting}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  bulkDownloading || bulkDeleting
                    ? "bg-white/10 cursor-not-allowed text-white/70"
                    : "bg-white/20 hover:bg-white/30"
                }`}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Progress Bars */}
          {(bulkDownloading || bulkDeleting) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {bulkDownloading && downloadProgress.total > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Downloading receipts...</span>
                    <span>
                      {downloadProgress.current} of {downloadProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="bg-white h-2.5 rounded-full transition-all duration-300 ease-out"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(downloadProgress.current / downloadProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {bulkDeleting && deleteProgress.total > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Deleting receipts...</span>
                    <span>
                      {deleteProgress.current} of {deleteProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="bg-white h-2.5 rounded-full transition-all duration-300 ease-out"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(deleteProgress.current / deleteProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {receipts.length} of {pagination.total} receipts
        {selectedReceipts.size > 0 && (
          <span className="ml-4 text-aces-green font-medium">· {selectedReceipts.size} selected</span>
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
        </div>
      ) : (
        <>
          {/* Desktop Table View (>1200px) */}
          <div className="hidden 2xl:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                  {visibleColumns.has("createdBy") && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
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
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{receipt.receiptNumber}</td>
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
                      <td className="px-4 py-3 text-sm text-gray-900">{receipt.client.name}</td>
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
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(receipt.createdAt)}</td>
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
                    {visibleColumns.has("createdBy") && (
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium text-gray-900">{receipt.createdBy?.fullName || "Unknown"}</div>
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
                          onClick={(e) => handleEditReceipt(receipt._id, e)}
                          className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDeleteReceipt(receipt, e)}
                            disabled={deletingId === receipt._id}
                            className={`p-1 rounded transition-colors ${
                              deletingId === receipt._id
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:text-red-800 hover:bg-red-50"
                            }`}
                            title={deletingId === receipt._id ? "Deleting..." : "Delete"}
                          >
                            {deletingId === receipt._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        )}
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

        {/* Mobile/Tablet Card View (≤1200px) */}
        <div className="block 2xl:hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {receipts.map((receipt, index) => (
            <motion.div
              key={receipt._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer overflow-hidden group ${
                selectedReceipts.has(receipt._id) ? "ring-2 ring-aces-green border-aces-green" : ""
              }`}
              onClick={() => handleViewReceipt(receipt)}
            >
              {/* Card Header */}
              <div className="p-5 pb-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
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
                    <div className="flex items-center space-x-2">
                      {getReceiptTypeIcon(receipt.receiptType)}
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        {getReceiptTypeLabel(receipt.receiptType)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(
                      receipt.payment.status
                    )}`}
                  >
                    {getPaymentStatusIcon(receipt.payment.status)}
                    <span className="capitalize">{receipt.payment.status}</span>
                  </span>
                </div>

                {/* Receipt Number */}
                <div className="mb-3">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{receipt.receiptNumber}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar size={14} />
                    <span>Issued {formatDate(receipt.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-5 pb-4">
                {/* Client Information */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{receipt.client.name}</h4>
                      {receipt.client.company && (
                        <p className="text-sm text-gray-600 truncate">{receipt.client.company}</p>
                      )}
                      {receipt.payment.dueDate && (
                        <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                          <Clock size={12} />
                          <span className={receipt.isOverdue ? "text-red-600 font-medium" : ""}>
                            {receipt.isOverdue
                              ? `Overdue by ${receipt.daysOverdue} days`
                              : `Due: ${formatDate(receipt.payment.dueDate)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Info */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div
                    className={`rounded-lg p-3 text-center ${
                      receipt.payment.status === "paid"
                        ? "bg-green-50"
                        : receipt.payment.status === "partial"
                        ? "bg-yellow-50"
                        : receipt.payment.status === "overdue"
                        ? "bg-red-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <div
                      className={`text-lg font-bold ${
                        receipt.payment.status === "paid"
                          ? "text-green-700"
                          : receipt.payment.status === "partial"
                          ? "text-yellow-700"
                          : receipt.payment.status === "overdue"
                          ? "text-red-700"
                          : "text-gray-700"
                      }`}
                    >
                      {formatCurrency(receipt.payment.totalAmount, receipt.payment.currency)}
                    </div>
                    <div
                      className={`text-xs ${
                        receipt.payment.status === "paid"
                          ? "text-green-600"
                          : receipt.payment.status === "partial"
                          ? "text-yellow-600"
                          : receipt.payment.status === "overdue"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      Total Amount
                    </div>
                  </div>

                  <div
                    className={`rounded-lg p-3 text-center ${
                      receipt.payment.balance > 0 ? "bg-orange-50" : "bg-blue-50"
                    }`}
                  >
                    <div
                      className={`text-lg font-bold ${
                        receipt.payment.balance > 0 ? "text-orange-700" : "text-blue-700"
                      }`}
                    >
                      {receipt.payment.balance > 0
                        ? formatCurrency(receipt.payment.balance, receipt.payment.currency)
                        : formatCurrency(receipt.payment.amountPaid, receipt.payment.currency)}
                    </div>
                    <div className={`text-xs ${receipt.payment.balance > 0 ? "text-orange-600" : "text-blue-600"}`}>
                      {receipt.payment.balance > 0 ? "Balance Due" : "Amount Paid"}
                    </div>
                  </div>
                </div>

                {/* Creator and Additional Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span>By {receipt.createdBy?.fullName || "Unknown"}</span>
                  </div>
                  {receipt.payment.paymentMethod && (
                    <div className="text-xs text-gray-500">via {receipt.payment.paymentMethod}</div>
                  )}
                </div>
              </div>

              {/* Card Footer - Actions */}
              <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 group-hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewReceipt(receipt);
                      }}
                      className="p-2 text-gray-600 hover:text-aces-green hover:bg-white rounded-lg transition-colors shadow-sm"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleEditReceipt(receipt._id, e)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors shadow-sm"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </motion.button>

                    {isAdmin && (
                      <motion.button
                        whileHover={{ scale: deletingId === receipt._id ? 1 : 1.1 }}
                        whileTap={{ scale: deletingId === receipt._id ? 1 : 0.9 }}
                        onClick={(e) => handleDeleteReceipt(receipt, e)}
                        disabled={deletingId === receipt._id}
                        className={`p-2 rounded-lg transition-colors shadow-sm ${
                          deletingId === receipt._id
                            ? "text-gray-400 bg-gray-200 cursor-not-allowed"
                            : "text-red-600 hover:text-red-800 hover:bg-red-50"
                        }`}
                        title={deletingId === receipt._id ? "Deleting..." : "Delete"}
                      >
                        {deletingId === receipt._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: downloadingIds.has(receipt._id) ? 1 : 1.1 }}
                      whileTap={{ scale: downloadingIds.has(receipt._id) ? 1 : 0.9 }}
                      onClick={(e) => handleDownloadPDF(receipt, e)}
                      disabled={downloadingIds.has(receipt._id)}
                      className={`p-2 rounded-lg transition-colors shadow-sm ${
                        downloadingIds.has(receipt._id)
                          ? "text-gray-400 bg-gray-200 cursor-not-allowed"
                          : "text-gray-600 hover:text-green-600 hover:bg-white"
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

                  {/* Payment Status Actions */}
                  {receipt.payment.status !== "paid" && receipt.payment.status !== "cancelled" && (
                    <div className="flex items-center space-x-2">
                      {receipt.payment.status === "pending" || receipt.payment.status === "partial" ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle payment recording
                          }}
                          className="px-3 py-1.5 bg-aces-green text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                          title="Record Payment"
                        >
                          <CreditCard size={14} className="inline mr-1" />
                          Record Payment
                        </motion.button>
                      ) : receipt.isOverdue ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle send reminder
                          }}
                          className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                          title="Send Reminder"
                        >
                          <AlertTriangle size={14} className="inline mr-1" />
                          Send Reminder
                        </motion.button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        </div>
        </>
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && deleteModal.receipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={handleCancelDelete}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto shadow-xl"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Receipt</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              {/* Receipt Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <ReceiptIcon className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{deleteModal.receipt.receiptNumber}</div>
                    <div className="text-sm text-gray-500">{deleteModal.receipt.client.name}</div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(deleteModal.receipt.payment.totalAmount, deleteModal.receipt.payment.currency)}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mt-4">
                Are you sure you want to permanently delete receipt <strong>{deleteModal.receipt.receiptNumber}</strong>
                ? This will completely remove the receipt and all associated data from the system.
              </p>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={deletingId === deleteModal.receipt._id}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deletingId === deleteModal.receipt._id}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === deleteModal.receipt._id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Receipt"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation Modal */}
      <AnimatePresence>
        {bulkDeleteModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={handleCancelBulkDelete}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto shadow-xl"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Multiple Receipts</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              {/* Bulk Delete Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <ReceiptIcon className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {bulkDeleteModal.count} Receipt{bulkDeleteModal.count !== 1 ? "s" : ""} Selected
                    </div>
                    <div className="text-xs text-gray-500">All selected receipts will be permanently deleted</div>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mt-4">
                Are you sure you want to permanently delete <strong>{bulkDeleteModal.count}</strong> selected receipt
                {bulkDeleteModal.count !== 1 ? "s" : ""}? This will completely remove{" "}
                {bulkDeleteModal.count !== 1 ? "these receipts" : "this receipt"} and all associated data from the
                system.
              </p>

              {/* Warning for bulk delete */}
              {bulkDeleteModal.count > 5 && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      You're about to delete a large number of receipts. This operation may take a moment.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelBulkDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={bulkDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkDelete}
                  disabled={bulkDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Deleting...
                    </>
                  ) : (
                    `Delete ${bulkDeleteModal.count} Receipt${bulkDeleteModal.count !== 1 ? "s" : ""}`
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

export default ReceiptsList;
