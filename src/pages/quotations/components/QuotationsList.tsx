import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  FileText,
  Calendar,
  DollarSign,
  User,
  Clock,
  Download,
  Edit,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Grid,
  List,
  Settings,
  RotateCcw,
  Receipt,
  Home,
  Building2,
  Globe,
} from "lucide-react";
import { quotationsAPI, type Quotation, type QuotationFilters } from "../../../services/quotations";
import { Button } from "../../../components/ui/Button";

interface QuotationsListProps {
  onViewQuotation: (quotation: Quotation) => void;
}

const QuotationsList: React.FC<QuotationsListProps> = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<QuotationFilters>({
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
  const [selectedQuotations, setSelectedQuotations] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(["quotationNumber", "type", "client", "status", "amount", "validity", "date", "createdBy", "actions"])
  );
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // Extend validity modal state
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingQuotation, setExtendingQuotation] = useState<Quotation | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [extendReason, setExtendReason] = useState("");

  // Convert to receipt modal state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertingQuotation, setConvertingQuotation] = useState<Quotation | null>(null);

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

  useEffect(() => {
    loadQuotations();
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
    }
  };

  // Convert to receipt handler
  const handleConvertToReceipt = (quotation: Quotation) => {
    setConvertingQuotation(quotation);
    setShowConvertModal(true);
  };

  // Navigate to create receipt from quotation
  const confirmConvertToReceipt = () => {
    if (convertingQuotation) {
      navigate(`/create/receipt?fromQuotation=${convertingQuotation._id}`);
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedQuotations.size} selected quotations?`)) {
      try {
        await quotationsAPI.bulkDelete(Array.from(selectedQuotations));
        setSelectedQuotations(new Set());
        loadQuotations();
      } catch (err) {
        console.error("Failed to delete quotations:", err);
      }
    }
  };

  const handleBulkExport = async () => {
    try {
      const blob = await quotationsAPI.bulkExport(Array.from(selectedQuotations));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotations-export-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to export quotations:", err);
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600 mt-1">Manage and track all your moving quotations</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search quotations by number, client name, or company..."
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
                viewMode === "list" ? "bg-white text-aces-green shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "table" ? "bg-white text-aces-green shadow-sm" : "text-gray-600 hover:text-gray-900"
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
                  <option value="converted">Converted</option>
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
          className="bg-aces-green text-white rounded-lg p-4 flex items-center justify-between"
        >
          <span className="font-medium">
            {selectedQuotations.size} quotation{selectedQuotations.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkExport}
              className="px-3 py-1 bg-white/20 rounded text-sm hover:bg-white/30 transition-colors"
            >
              Export
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-500 rounded text-sm hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedQuotations(new Set())}
              className="px-3 py-1 bg-white/20 rounded text-sm hover:bg-white/30 transition-colors"
            >
              Clear
            </button>
          </div>
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
                        <div className="flex items-center space-x-2">
                          <User size={14} className="text-blue-500" />
                          <div>
                            <div className="font-medium text-gray-900">{quotation.createdBy.fullName}</div>
                            {quotation.createdBy.email && (
                              <div className="text-xs text-gray-500">{quotation.createdBy.email}</div>
                            )}
                          </div>
                        </div>
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
                          onClick={() => navigate(`/create?type=quotation&edit=${quotation._id}`)}
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConvertToReceipt(quotation);
                              }}
                              className="p-1 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                              title="Convert to Receipt"
                            >
                              <Receipt size={14} />
                            </button>
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
      ) : (
        /* Card View */
        <div className="space-y-4">
          {quotations.map((quotation, index) => (
            <motion.div
              key={quotation._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer ${
                selectedQuotations.has(quotation._id) ? "ring-2 ring-aces-green border-aces-green" : ""
              }`}
              onClick={() => handleViewQuotation(quotation)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
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
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{quotation.quotationNumber}</h3>
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          quotation.validity.status
                        )}`}
                      >
                        {getStatusIcon(quotation.validity.status)}
                        <span className="capitalize">{quotation.validity.status}</span>
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{quotation.type}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User size={14} />
                        <div>
                          <div className="font-medium text-gray-900">{quotation.client.name}</div>
                          {quotation.client.company && (
                            <div className="text-xs text-gray-500">{quotation.client.company}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar size={14} />
                        <span>{formatDate(quotation.locations.movingDate)}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <DollarSign size={14} />
                        <span className="font-medium">
                          {formatCurrency(quotation.pricing.totalAmount, quotation.pricing.currency)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock size={14} />
                        <span>{formatRemainingDays(quotation)}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <User size={14} className="text-blue-500" />
                        <div>
                          <div className="font-medium text-gray-900">{quotation.createdBy.fullName}</div>
                          <div className="text-xs text-gray-500">Created by</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar size={14} className="text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{formatDate(quotation.createdAt)}</div>
                          <div className="text-xs text-gray-500">Created on</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewQuotation(quotation);
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
                      navigate(`/create?type=quotation&edit=${quotation._id}`);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: downloadingIds.has(quotation._id) ? 1 : 1.1 }}
                    whileTap={{ scale: downloadingIds.has(quotation._id) ? 1 : 0.9 }}
                    onClick={(e) => handleDownloadPDF(quotation, e)}
                    disabled={downloadingIds.has(quotation._id)}
                    className={`p-2 rounded-lg transition-colors ${
                      downloadingIds.has(quotation._id)
                        ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                        : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                    }`}
                    title={downloadingIds.has(quotation._id) ? "Downloading..." : "Download PDF"}
                  >
                    {downloadingIds.has(quotation._id) ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                  </motion.button>

                  {/* Extend Validity Button - only for active quotations */}
                  {quotation.validity.status === "active" && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExtendingQuotation(quotation);
                        setShowExtendModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Extend Validity"
                    >
                      <RotateCcw size={16} />
                    </motion.button>
                  )}

                  {/* Convert to Receipt Button - only for active quotations */}
                  {quotation.validity.status === "active" && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConvertToReceipt(quotation);
                      }}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Convert to Receipt"
                    >
                      <Receipt size={16} />
                    </motion.button>
                  )}
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
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendValidity}
                disabled={!extendReason.trim()}
                className="px-4 py-2 bg-aces-green text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Extend Validity
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Convert to Receipt Modal */}
      {showConvertModal && convertingQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Convert to Receipt</h3>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{convertingQuotation.quotationNumber}</div>
                  <div className="text-gray-600">
                    {convertingQuotation.client.name} -{" "}
                    {formatCurrency(convertingQuotation.pricing.totalAmount, convertingQuotation.pricing.currency)}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                This will create a new receipt based on this quotation. The quotation will be marked as converted and
                cannot be modified.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setConvertingQuotation(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmConvertToReceipt}
                className="px-4 py-2 bg-aces-green text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Receipt
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default QuotationsList;
