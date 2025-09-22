import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  FileText,
  Calendar,
  Clock,
  Download,
  Edit,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  RotateCcw,
  Trash2,
  Home,
  Building2,
  Globe,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { quotationsAPI, type Quotation, type QuotationFilters } from "../../../services/quotations";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../context/useAuth";
import QuotationsSkeleton from "../../../components/skeletons/QuotationsSkeleton";

interface QuotationsListProps {
  onViewQuotation: (quotation: Quotation) => void;
}

const QuotationsList: React.FC<QuotationsListProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<QuotationFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<number | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0 });
  const [bulkDeleteModal, setBulkDeleteModal] = useState<{
    isOpen: boolean;
    count: number;
  }>({ isOpen: false, count: 0 });

  // Bulk operations state
  const [selectedQuotations, setSelectedQuotations] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(["quotationNumber", "type", "client", "amount", "validity", "date", "createdBy", "remaining", "actions"])
  );
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // Extend validity modal state
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingQuotation, setExtendingQuotation] = useState<Quotation | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [extendReason, setExtendReason] = useState("");
  const [isExtending, setIsExtending] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingQuotation, setDeletingQuotation] = useState<Quotation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadQuotations = async () => {
      try {
        setLoading(true);
        const response = await quotationsAPI.getQuotations(filters);
        setQuotations(response.data.items);
        setPagination(response.data.pagination);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quotations");
      } finally {
        setLoading(false);
      }
    };

    loadQuotations();
  }, [filters]);

  // Separate loadQuotations for other functions that need to reload
  const loadQuotations = async () => {
    try {
      setLoading(true);
      const response = await quotationsAPI.getQuotations(filters);
      setQuotations(response.data.items);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

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
      }, 800); // 800ms debounce

      setSearchDebounceTimer(newTimer);
    },
    [searchDebounceTimer]
  );

  const handleFilterChange = (key: string, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuotations(new Set(quotations.map((q) => q._id)));
    } else {
      setSelectedQuotations(new Set());
    }
  };

  const handleSelectQuotation = (quotationId: string, checked: boolean) => {
    const newSelected = new Set(selectedQuotations);
    if (checked) {
      newSelected.add(quotationId);
    } else {
      newSelected.delete(quotationId);
    }
    setSelectedQuotations(newSelected);
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

  // Extend validity handler
  const handleExtendValidity = async () => {
    if (!extendingQuotation || !extendReason.trim()) return;

    try {
      setIsExtending(true);
      await quotationsAPI.extendValidity(extendingQuotation._id, {
        days: extendDays,
        reason: extendReason,
      });
      setShowExtendModal(false);
      setExtendingQuotation(null);
      setExtendDays(30);
      setExtendReason("");
      loadQuotations(); // Refresh data
    } catch (err) {
      console.error("Failed to extend validity:", err);
    } finally {
      setIsExtending(false);
    }
  };

  // Delete handler
  const handleDeleteQuotation = async () => {
    if (!deletingQuotation) return;

    try {
      setIsDeleting(true);
      await quotationsAPI.deleteQuotation(deletingQuotation._id);
      setShowDeleteModal(false);
      setDeletingQuotation(null);
      loadQuotations(); // Refresh data
    } catch (err) {
      console.error("Failed to delete quotation:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk actions
  const handleBulkDelete = () => {
    setBulkDeleteModal({ isOpen: true, count: selectedQuotations.size });
  };

  const handleConfirmBulkDelete = async () => {
    try {
      setBulkDeleting(true);
      setBulkDeleteModal({ isOpen: false, count: 0 });
      const totalQuotations = selectedQuotations.size;

      // Initialize progress
      setDeleteProgress({ current: 0, total: totalQuotations });

      // Simulate progress for better UX (since deletion happens in one API call)
      const progressInterval = setInterval(() => {
        setDeleteProgress((prev) => {
          if (prev.current < prev.total) {
            return { ...prev, current: prev.current + 1 };
          }
          return prev;
        });
      }, 150); // Update every 150ms

      await quotationsAPI.bulkDelete(Array.from(selectedQuotations));

      // Clear interval and complete progress
      clearInterval(progressInterval);
      setDeleteProgress({ current: totalQuotations, total: totalQuotations });

      // Small delay to show completion
      await new Promise((resolve) => setTimeout(resolve, 300));

      setSelectedQuotations(new Set());
      loadQuotations(); // Reload data
    } catch (err) {
      console.error("Failed to delete quotations:", err);
    } finally {
      setBulkDeleting(false);
      setDeleteProgress({ current: 0, total: 0 });
    }
  };

  const handleCancelBulkDelete = () => {
    setBulkDeleteModal({ isOpen: false, count: 0 });
  };

  const handleBulkDownload = async () => {
    try {
      setBulkDownloading(true);

      // Get quotation info for bulk download
      const response = await quotationsAPI.bulkDownload(Array.from(selectedQuotations));
      const quotationsToDownload = response.data.quotations;

      // Initialize progress
      setDownloadProgress({ current: 0, total: quotationsToDownload.length });

      // Download each quotation individually
      for (let i = 0; i < quotationsToDownload.length; i++) {
        const quotationInfo = quotationsToDownload[i];
        try {
          const blob = await quotationsAPI.downloadPDF(quotationInfo.id);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `quotation_${quotationInfo.quotationNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          // Update progress after successful download
          setDownloadProgress({ current: i + 1, total: quotationsToDownload.length });

          // Add a small delay between downloads to avoid overwhelming the browser
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (downloadErr) {
          console.error(`Failed to download quotation ${quotationInfo.quotationNumber}:`, downloadErr);
          // Still update progress even if download failed
          setDownloadProgress({ current: i + 1, total: quotationsToDownload.length });
        }
      }

      // Clear selection after successful bulk download
      setSelectedQuotations(new Set());
    } catch (err) {
      console.error("Failed to prepare bulk download:", err);
    } finally {
      setBulkDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "expired":
        return "text-red-600 bg-red-100";
      case "converted":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle size={16} />;
      case "expired":
        return <XCircle size={16} />;
      case "converted":
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getQuotationTypeIcon = (type: string) => {
    switch (type) {
      case "Office":
        return <Building2 size={16} className="text-blue-600" />;
      case "International":
        return <Globe size={16} className="text-green-600" />;
      default:
        return <Home size={16} className="text-purple-600" />;
    }
  };

  const calculateRemainingDays = (quotation: Quotation): number => {
    // Use backend calculated value if available
    if (typeof quotation.remainingDays === "number") {
      return quotation.remainingDays;
    }

    // Fallback: calculate on frontend
    try {
      const validUntil = new Date(quotation.validity.validUntil);
      const now = new Date();
      const diffTime = validUntil.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error("Error calculating remaining days:", error);
      return -1; // Default to expired if calculation fails
    }
  };

  const formatRemainingDays = (quotation: Quotation): string => {
    const remainingDays = calculateRemainingDays(quotation);

    if (quotation.validity.status === "expired") {
      return "Expired";
    }

    if (remainingDays < 0) {
      return `${Math.abs(remainingDays)} days overdue`;
    }

    if (remainingDays === 0) {
      return "Expires today";
    }

    if (remainingDays === 1) {
      return "1 day left";
    }

    return `${remainingDays} days left`;
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'UGX') {
      // Custom formatting for UGX to show "UGX XXXXX" format
      const number = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
      return `UGX ${number}`;
    } else {
      // Use standard formatting for other currencies
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'USD' ? 2 : 0
      });
      return formatter.format(amount);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-UG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewQuotation = (quotation: Quotation) => {
    navigate(`/quotations/${quotation._id}`);
  };

  const handleDownloadPDF = async (quotation: Quotation, e: React.MouseEvent) => {
    e.stopPropagation();

    // Prevent multiple downloads of the same document
    if (downloadingIds.has(quotation._id)) return;

    try {
      // Add to downloading set
      setDownloadingIds((prev) => new Set(prev).add(quotation._id));

      const blob = await quotationsAPI.downloadPDF(quotation._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quotation_${quotation.quotationNumber}.pdf`;
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
        newSet.delete(quotation._id);
        return newSet;
      });
    }
  };

  if (loading) {
    return <QuotationsSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Quotations</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadQuotations} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 lg:flex-none lg:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by number and name"
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
                    { key: "quotationNumber", label: "Quotation #" },
                    { key: "type", label: "Type" },
                    { key: "client", label: "Client" },
                    { key: "status", label: "Status" },
                    { key: "amount", label: "Amount" },
                    { key: "validity", label: "Validity" },
                    { key: "date", label: "Date" },
                    { key: "createdBy", label: "Created By" },
                    { key: "remaining", label: "Days Left" },
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={filters.type || ""}
                  onChange={(e) => handleFilterChange("type", e.target.value || undefined)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="Residential">Residential Move</option>
                  <option value="International">International Move</option>
                  <option value="Office">Office Move</option>
                </select>

                <select
                  value={filters.status || ""}
                  onChange={(e) => handleFilterChange("status", e.target.value || undefined)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>

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
                  <option value="quotationNumber-asc">Quote Number A-Z</option>
                  <option value="quotationNumber-desc">Quote Number Z-A</option>
                  <option value="pricing.totalAmount-desc">Highest Value</option>
                  <option value="pricing.totalAmount-asc">Lowest Value</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Actions */}
      {selectedQuotations.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-aces-green text-white rounded-lg p-4"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="font-medium text-center sm:text-left">
              {selectedQuotations.size} quotation{selectedQuotations.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
              <button
                onClick={handleBulkDownload}
                disabled={bulkDownloading || bulkDeleting}
                className={`px-3 py-2 sm:py-1 rounded text-sm transition-colors flex items-center justify-center space-x-1 ${
                  bulkDownloading || bulkDeleting
                    ? "bg-white/10 cursor-not-allowed text-white/70"
                    : "bg-white/20 hover:bg-white/30"
                }`}
              >
                {bulkDownloading && <Loader2 size={14} className="animate-spin" />}
                <span>{bulkDownloading ? "Downloading..." : "Download"}</span>
              </button>
              {isAdmin && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDownloading || bulkDeleting}
                  className={`px-3 py-2 sm:py-1 rounded text-sm transition-colors flex items-center justify-center space-x-1 ${
                    bulkDownloading || bulkDeleting ? "bg-red-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {bulkDeleting && <Loader2 size={14} className="animate-spin" />}
                  <span>{bulkDeleting ? "Deleting..." : "Delete"}</span>
                </button>
              )}
              <button
                onClick={() => setSelectedQuotations(new Set())}
                disabled={bulkDownloading || bulkDeleting}
                className={`px-3 py-2 sm:py-1 rounded text-sm transition-colors ${
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
                    <span>Downloading quotations...</span>
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
                    <span>Deleting quotations...</span>
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
        Showing {quotations.length} of {pagination.total} quotations
        {selectedQuotations.size > 0 && (
          <span className="ml-4 text-aces-green font-medium">· {selectedQuotations.size} selected</span>
        )}
      </div>

      {/* Quotations List/Table */}
      {quotations.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quotations Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filters.type || filters.status
              ? "No quotations match your current filters. Try adjusting your search criteria."
              : "Get started by creating your first quotation."}
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
                        checked={selectedQuotations.size === quotations.length && quotations.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-aces-green focus:ring-aces-green"
                      />
                    </th>
                    {visibleColumns.has("quotationNumber") && (
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quotation #
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
                    {visibleColumns.has("validity") && (
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valid Until
                      </th>
                    )}
                    {visibleColumns.has("date") && (
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    )}
                    {visibleColumns.has("createdBy") && (
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                    )}
                    {visibleColumns.has("remaining") && (
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days Left
                      </th>
                    )}
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quotations.map((quotation, index) => (
                    <motion.tr
                      key={quotation._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedQuotations.has(quotation._id) ? "bg-aces-green/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedQuotations.has(quotation._id)}
                          onChange={(e) => handleSelectQuotation(quotation._id, e.target.checked)}
                          className="rounded border-gray-300 text-aces-green focus:ring-aces-green"
                        />
                      </td>
                      {visibleColumns.has("quotationNumber") && (
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{quotation.quotationNumber}</td>
                      )}
                      {visibleColumns.has("type") && (
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            {getQuotationTypeIcon(quotation.type)}
                            <span>{quotation.type}</span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.has("client") && (
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{quotation.client.name}</div>
                            {quotation.client.company && (
                              <div className="text-xs text-gray-500">{quotation.client.company}</div>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.has("status") && (
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              quotation.validity.status === "active"
                                ? "text-green-600 bg-green-100"
                                : quotation.validity.status === "expired"
                                ? "text-red-600 bg-red-100"
                                : "text-blue-600 bg-blue-100"
                            }`}
                          >
                            {quotation.validity.status === "active" ? (
                              <CheckCircle size={12} />
                            ) : quotation.validity.status === "expired" ? (
                              <XCircle size={12} />
                            ) : (
                              <AlertCircle size={12} />
                            )}
                            <span className="capitalize">{quotation.validity.status}</span>
                          </span>
                        </td>
                      )}
                      {visibleColumns.has("amount") && (
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {formatCurrency(quotation.pricing.totalAmount, quotation.pricing.currency)}
                        </td>
                      )}
                      {visibleColumns.has("validity") && (
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(quotation.validity.validUntil)}</td>
                      )}
                      {visibleColumns.has("date") && (
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(quotation.createdAt)}</td>
                      )}
                      {visibleColumns.has("createdBy") && (
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium text-gray-900">{quotation.createdBy.fullName}</div>
                        </td>
                      )}
                      {visibleColumns.has("remaining") && (
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span
                            className={
                              calculateRemainingDays(quotation) < 0
                                ? "text-red-600 font-medium"
                                : calculateRemainingDays(quotation) < 7
                                ? "text-yellow-600 font-medium"
                                : ""
                            }
                          >
                            {formatRemainingDays(quotation)}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewQuotation(quotation)}
                            className="p-1 text-gray-600 hover:text-aces-green hover:bg-gray-100 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/quotations/edit/${quotation._id}`);
                            }}
                            className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDownloadPDF(quotation, e)}
                            disabled={downloadingIds.has(quotation._id)}
                            className={`p-1 rounded transition-colors ${
                              downloadingIds.has(quotation._id)
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title={downloadingIds.has(quotation._id) ? "Downloading..." : "Download PDF"}
                          >
                            {downloadingIds.has(quotation._id) ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Download size={14} />
                            )}
                          </button>
                          {quotation.validity.status === "active" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExtendingQuotation(quotation);
                                  setShowExtendModal(true);
                                }}
                                className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Extend Validity"
                              >
                                <RotateCcw size={14} />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingQuotation(quotation);
                                    setShowDeleteModal(true);
                                  }}
                                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Quotation"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          )}
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
              {quotations.map((quotation, index) => (
                <motion.div
                  key={quotation._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer overflow-hidden group ${
                    selectedQuotations.has(quotation._id) ? "ring-2 ring-aces-green border-aces-green" : ""
                  }`}
                  onClick={() => handleViewQuotation(quotation)}
                >
                  {/* Card Header */}
                  <div className="p-5 pb-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedQuotations.has(quotation._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectQuotation(quotation._id, e.target.checked);
                          }}
                          className="rounded border-gray-300 text-aces-green focus:ring-aces-green"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center space-x-2">
                          {getQuotationTypeIcon(quotation.type)}
                          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            {quotation.type}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          quotation.validity.status
                        )}`}
                      >
                        {getStatusIcon(quotation.validity.status)}
                        <span className="capitalize">{quotation.validity.status}</span>
                      </span>
                    </div>

                    {/* Quotation Number */}
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{quotation.quotationNumber}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar size={14} />
                        <span>Created {formatDate(quotation.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-5 pb-4">
                    {/* Client Information */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{quotation.client.name}</h4>
                          {quotation.client.company && (
                            <p className="text-sm text-gray-600 truncate">{quotation.client.company}</p>
                          )}
                          <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                            <Calendar size={12} />
                            <span>Move: {formatDate(quotation.locations.movingDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial & Timeline Info */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-green-700">
                          {formatCurrency(quotation.pricing.totalAmount, quotation.pricing.currency)}
                        </div>
                        <div className="text-xs text-green-600">Total Amount</div>
                      </div>

                      <div
                        className={`rounded-lg p-3 text-center ${
                          calculateRemainingDays(quotation) < 0
                            ? "bg-red-50"
                            : calculateRemainingDays(quotation) < 7
                            ? "bg-yellow-50"
                            : "bg-blue-50"
                        }`}
                      >
                        <div
                          className={`text-sm font-bold ${
                            calculateRemainingDays(quotation) < 0
                              ? "text-red-700"
                              : calculateRemainingDays(quotation) < 7
                              ? "text-yellow-700"
                              : "text-blue-700"
                          }`}
                        >
                          {formatRemainingDays(quotation)}
                        </div>
                        <div
                          className={`text-xs ${
                            calculateRemainingDays(quotation) < 0
                              ? "text-red-600"
                              : calculateRemainingDays(quotation) < 7
                              ? "text-yellow-600"
                              : "text-blue-600"
                          }`}
                        >
                          Validity
                        </div>
                      </div>
                    </div>

                    {/* Creator Info */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <span>By {quotation.createdBy.fullName}</span>
                      </div>
                      <div className="text-gray-500">{formatDate(quotation.validity.validUntil)}</div>
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
                            handleViewQuotation(quotation);
                          }}
                          className="p-2 text-gray-600 hover:text-aces-green hover:bg-white rounded-lg transition-colors shadow-sm"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/quotations/edit/${quotation._id}`);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors shadow-sm"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: downloadingIds.has(quotation._id) ? 1 : 1.1 }}
                          whileTap={{ scale: downloadingIds.has(quotation._id) ? 1 : 0.9 }}
                          onClick={(e) => handleDownloadPDF(quotation, e)}
                          disabled={downloadingIds.has(quotation._id)}
                          className={`p-2 rounded-lg transition-colors shadow-sm ${
                            downloadingIds.has(quotation._id)
                              ? "text-gray-400 bg-gray-200 cursor-not-allowed"
                              : "text-gray-600 hover:text-green-600 hover:bg-white"
                          }`}
                          title={downloadingIds.has(quotation._id) ? "Downloading..." : "Download PDF"}
                        >
                          {downloadingIds.has(quotation._id) ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )}
                        </motion.button>
                      </div>

                      {/* Additional Actions - only for active quotations */}
                      {quotation.validity.status === "active" && (
                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExtendingQuotation(quotation);
                              setShowExtendModal(true);
                            }}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors shadow-sm"
                            title="Extend Validity"
                          >
                            <RotateCcw size={16} />
                          </motion.button>

                          {isAdmin && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingQuotation(quotation);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-white rounded-lg transition-colors shadow-sm"
                              title="Delete Quotation"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          )}
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
        <>
          {/* Desktop pagination (for table view) */}
          <div className="hidden 2xl:flex items-center justify-between">
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

          {/* Mobile/Tablet pagination (for card view) */}
          <div className="flex 2xl:hidden items-center justify-center gap-2">
            {/* First page */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous page */}
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
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
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last page */}
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* Extend Validity Modal */}
      {showExtendModal && extendingQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Extend Validity - {extendingQuotation.quotationNumber}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Extend by (days)</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={extendDays}
                  onChange={(e) => setExtendDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Extension *</label>
                <textarea
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  placeholder="Explain why the validity is being extended..."
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowExtendModal(false);
                  setExtendingQuotation(null);
                  setExtendDays(30);
                  setExtendReason("");
                }}
                disabled={isExtending}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendValidity}
                disabled={!extendReason.trim() || isExtending}
                className="px-4 py-2 bg-aces-green text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isExtending && <Loader2 size={16} className="animate-spin" />}
                <span>{isExtending ? "Extending..." : "Extend Validity"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Quotation Modal */}
      {showDeleteModal && deletingQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Quotation</h3>

            <div className="space-y-4">
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{deletingQuotation.quotationNumber}</div>
                  <div className="text-gray-600">
                    {deletingQuotation.client.name} -{" "}
                    {formatCurrency(deletingQuotation.pricing.totalAmount, deletingQuotation.pricing.currency)}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Are you sure you want to delete this quotation? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingQuotation(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteQuotation}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isDeleting && <Loader2 size={16} className="animate-spin" />}
                <span>{isDeleting ? "Deleting..." : "Delete"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                    <div className="p-2 bg-red-500 rounded-full">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-red-100 rounded">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {bulkDeleteModal.count} Quotation{bulkDeleteModal.count !== 1 ? "s" : ""} Selected
                    </div>
                    <div className="text-xs text-gray-500">All selected quotations will be permanently deleted</div>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mt-4">
                Are you sure you want to permanently delete <strong>{bulkDeleteModal.count}</strong> selected quotation
                {bulkDeleteModal.count !== 1 ? "s" : ""}? This will completely remove{" "}
                {bulkDeleteModal.count !== 1 ? "these quotations" : "this quotation"} and all associated data from the
                system.
              </p>

              {/* Warning for bulk delete */}
              {bulkDeleteModal.count > 5 && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      You're about to delete a large number of quotations. This operation may take a moment.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelBulkDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkDelete}
                  disabled={bulkDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Deleting...
                    </>
                  ) : (
                    `Delete ${bulkDeleteModal.count} Quotation${bulkDeleteModal.count !== 1 ? "s" : ""}`
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

export default QuotationsList;
