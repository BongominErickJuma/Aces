import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Receipt, Search, Filter, Download, Eye, ChevronDown, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type { QuotationSummary, ReceiptSummary, DocumentType } from "../../types/dashboard";

interface RecentDocumentsProps {
  quotations: QuotationSummary[];
  receipts: ReceiptSummary[];
  loading?: boolean;
  onViewDocument: (type: "quotation" | "receipt", id: string) => void;
  onDownloadDocument: (type: "quotation" | "receipt", id: string) => void;
  onDeleteDocument?: (type: "quotation" | "receipt", id: string) => void;
  onShareDocument: (type: "quotation" | "receipt", id: string) => void;
  isAdmin?: boolean;
  downloadingIds?: Set<string>;
}

const RecentDocuments: React.FC<RecentDocumentsProps> = ({
  quotations,
  receipts,
  loading = false,
  onViewDocument,
  onDownloadDocument,
  downloadingIds = new Set(),
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState<DocumentType>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Combine and sort documents
  const allDocuments = [
    ...quotations.map((q) => ({ ...q, docType: "quotation" as const })),
    ...receipts.map((r) => ({ ...r, docType: "receipt" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter documents
  const filteredDocuments = allDocuments.filter((doc) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        doc.client.name.toLowerCase().includes(query) ||
        ("quotationNumber" in doc && doc.quotationNumber.toLowerCase().includes(query)) ||
        ("receiptNumber" in doc && doc.receiptNumber.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Document type filter
    if (documentTypeFilter !== "all") {
      if (documentTypeFilter === "quotations" && doc.docType !== "quotation") return false;
      if (documentTypeFilter === "receipts" && doc.docType !== "receipt") return false;
    }

    return true;
  });

  const getStatusBadge = (doc: any) => {
    if (doc.docType === "quotation" && doc.validity?.status) {
      const statusColors = {
        active: "bg-green-100 text-green-800",
        expired: "bg-red-100 text-red-800",
        converted: "bg-blue-100 text-blue-800",
      };
      return (
        <span className={clsx("px-2 py-1 text-xs font-medium rounded-full", statusColors[doc.validity.status])}>
          {doc.validity.status}
        </span>
      );
    }

    if (doc.docType === "receipt" && doc.payment?.status) {
      const statusColors = {
        paid: "bg-green-100 text-green-800",
        partial: "bg-yellow-100 text-yellow-800",
        pending: "bg-red-100 text-red-800",
      };
      return (
        <span className={clsx("px-2 py-1 text-xs font-medium rounded-full", statusColors[doc.payment.status])}>
          {doc.payment.status}
        </span>
      );
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "UGX",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Documents</h2>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search - Full width on mobile */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={clsx(
                  "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 border rounded-lg text-sm font-medium transition-colors flex-shrink-0",
                  showFilters
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                <ChevronDown className={clsx("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Document Type:</label>
                <select
                  value={documentTypeFilter}
                  onChange={(e) => setDocumentTypeFilter(e.target.value as DocumentType)}
                  className="flex-1 sm:min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">All Documents</option>
                  <option value="quotations">Quotations Only</option>
                  <option value="receipts">Receipts Only</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 md:p-6">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No documents found</p>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet Card View (≤1200px) */}
            <div className="block 2xl:hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocuments.map((doc) => (
                  <motion.div
                    key={doc._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all flex flex-col h-full"
                  >
                    {/* Header with document type and status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {doc.docType === "quotation" ? (
                          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        ) : (
                          <Receipt className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm text-gray-900 truncate">
                          {"quotationNumber" in doc ? doc.quotationNumber : doc.receiptNumber}
                        </span>
                      </div>
                      {getStatusBadge(doc)}
                    </div>

                    {/* Content area with even spacing */}
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Client</span>
                          <span className="text-sm font-medium text-gray-700 text-right">{doc.client.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Created By</span>
                          <span className="text-sm text-gray-600 text-right">{doc.createdBy?.fullName || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Date</span>
                          <span className="text-sm text-gray-600 text-right">{formatDate(doc.createdAt)}</span>
                        </div>
                        {(doc.docType === "quotation" && doc.pricing) || (doc.docType === "receipt" && doc.payment) ? (
                          <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Amount</span>
                            <span className="text-sm font-semibold text-gray-900 text-right">
                              {doc.docType === "quotation" && doc.pricing
                                ? formatAmount(doc.pricing.totalAmount, doc.pricing.currency)
                                : formatAmount(doc.payment.totalAmount, doc.payment.currency)}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => onViewDocument(doc.docType, doc._id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button
                          onClick={() => onDownloadDocument(doc.docType, doc._id)}
                          disabled={downloadingIds.has(doc._id)}
                          className={clsx(
                            "flex-1 flex items-center justify-center gap-1 px-3 py-2 border rounded-md text-xs font-medium transition-colors",
                            downloadingIds.has(doc._id)
                              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          {downloadingIds.has(doc._id) ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3" />
                              Download
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Desktop Table View (>1200px) */}
            <div className="hidden 2xl:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {doc.docType === "quotation" ? (
                              <FileText className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Receipt className="w-4 h-4 text-emerald-600" />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {"quotationNumber" in doc ? doc.quotationNumber : doc.receiptNumber}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{doc.client.name}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {doc.docType === "quotation" && doc.pricing
                            ? formatAmount(doc.pricing.totalAmount, doc.pricing.currency)
                            : doc.docType === "receipt" && doc.payment
                            ? formatAmount(doc.payment.totalAmount, doc.payment.currency)
                            : "N/A"}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(doc)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{doc.createdBy?.fullName || "N/A"}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(doc.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onViewDocument(doc.docType, doc._id)}
                              className="p-1 text-gray-600 hover:text-gray-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDownloadDocument(doc.docType, doc._id)}
                              disabled={downloadingIds.has(doc._id)}
                              className={clsx(
                                "p-1 transition-colors",
                                downloadingIds.has(doc._id)
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-gray-600 hover:text-gray-900"
                              )}
                            >
                              {downloadingIds.has(doc._id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecentDocuments;
