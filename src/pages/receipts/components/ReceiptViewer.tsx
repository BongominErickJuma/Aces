import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Receipt, Calendar, User, Mail, Phone, MapPin, AlertCircle, Loader2, DollarSign, Edit, ChevronDown, ChevronUp, Package } from "lucide-react";
import { clsx } from "clsx";
import { PageLayout } from "../../../components/layout";
import { ReceiptDetailsSkeleton } from "../../../components/skeletons";
import PaymentManager from "./PaymentManager";
import { receiptsAPI, type Receipt as ReceiptType } from "../../../services/receipts";

interface ReceiptViewerProps {
  receiptId: string;
}

const ReceiptViewer: React.FC<ReceiptViewerProps> = ({ receiptId }) => {
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchReceipt();
  }, [receiptId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await receiptsAPI.getReceiptById(receiptId);
      setReceipt(response.data.receipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!receipt || downloading) return;

    try {
      setDownloading(true);
      const { api } = await import("../../../services/api");
      const response = await api.get(`/receipts/${receiptId}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${receipt.receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
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

  const getStatusBadge = (status: string) => {
    const statusColors = {
      paid: "bg-green-100 text-green-800",
      partial: "bg-yellow-100 text-yellow-800",
      pending: "bg-gray-100 text-gray-800",
      overdue: "bg-red-100 text-red-800",
      refunded: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={clsx(
          "px-3 py-1 text-sm font-medium rounded-full",
          statusColors[status as keyof typeof statusColors]
        )}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getReceiptTypeLabel = (type?: string) => {
    const types = {
      item: "Item Receipt",
      commitment: "Commitment Receipt",
      final: "Final Receipt",
      one_time: "One-time Receipt",
    };
    return type ? types[type as keyof typeof types] || type : "Receipt";
  };

  const toggleServiceExpanded = (index: number) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedServices(newExpanded);
  };

  if (loading) {
    return (
      <PageLayout title="Receipt Details">
        <ReceiptDetailsSkeleton />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Error">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Receipt</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchReceipt}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/receipts")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Receipts
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!receipt) {
    return (
      <PageLayout title="Receipt Not Found">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Receipt Not Found</h2>
            <p className="text-gray-600 mb-4">The requested receipt could not be found.</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`Receipt ${receipt.receiptNumber}`}>
      <style>{`
        @media (max-width: 350px) {
          .text-lg { font-size: 1rem; }
          .text-xl { font-size: 1.125rem; }
          .text-2xl { font-size: 1.25rem; }
          .text-sm { font-size: 0.8125rem; }
          .text-base { font-size: 0.875rem; }
          .px-3 { padding-left: 0.625rem; padding-right: 0.625rem; }
          .px-4 { padding-left: 0.75rem; padding-right: 0.75rem; }
          .py-2 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
          .p-4 { padding: 0.875rem; }
          .p-6 { padding: 1rem; }
          .gap-4 { gap: 0.75rem; }
          .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.75rem; }
          .space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
        }
      `}</style>
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600" />
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Receipt Details</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Edit Button */}
            <button
              onClick={() => navigate(`/receipts/edit/${receiptId}`)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              title="Edit Receipt"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={clsx(
                "flex items-center gap-2 px-3 sm:px-4 py-2 border rounded-lg transition-colors justify-center",
                downloading
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
              title="Download PDF"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Document Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          {/* Status and Metadata */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {getStatusBadge(receipt.payment.status)}
                <span className="px-3 py-1 text-sm font-medium bg-emerald-100 text-emerald-800 rounded-full">
                  {getReceiptTypeLabel(receipt.receiptType)}
                </span>
                {receipt.version > 1 && (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    v{receipt.version}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 text-sm text-gray-600 lg:text-right">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Created: {formatDate(receipt.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  By: {receipt.createdBy.fullName}
                </div>
                {receipt.payment.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Due: {formatDate(receipt.payment.dueDate)}
                  </div>
                )}
                {receipt.payment.paymentHistory && receipt.payment.paymentHistory.length > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Last Paid:{" "}
                    {formatDate(receipt.payment.paymentHistory[receipt.payment.paymentHistory.length - 1].date)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{receipt.client.name}</p>
                </div>
              </div>
              {receipt.client.gender && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium text-gray-900">
                      {receipt.client.gender.charAt(0).toUpperCase() + receipt.client.gender.slice(1)}
                    </p>
                  </div>
                </div>
              )}
              {receipt.client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{receipt.client.email}</p>
                  </div>
                </div>
              )}
              {receipt.client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{receipt.client.phone}</p>
                  </div>
                </div>
              )}
              {receipt.client.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{receipt.client.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Move Locations - Only show for commitment, final, and one_time receipts */}
          {receipt.locations && ["commitment", "final", "one_time"].includes(receipt.receiptType) && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Move Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">From</p>
                  <p className="font-medium text-gray-900">{receipt.locations.from}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To</p>
                  <p className="font-medium text-gray-900">{receipt.locations.to}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Moving Date</p>
                  <p className="font-medium text-gray-900">
                    {receipt.locations.movingDate ? formatDate(receipt.locations.movingDate) : "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quotation Reference */}
          {receipt.quotationId && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Quotation</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Quotation Number</p>
                    <p className="text-lg font-semibold text-blue-900">{receipt.quotationId.quotationNumber}</p>
                    <p className="text-sm text-blue-600">Type: {receipt.quotationId.type}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/quotations/${receipt.quotationId?._id}`)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    View Quotation
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Services - Only show for item receipts */}
          {receipt.services && receipt.services.length > 0 && receipt.receiptType === "item" && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-emerald-600" />
                Items
              </h3>

              {/* Collapsible Cards View for ALL screen sizes */}
              <div className="space-y-4">
                {receipt.services.map((service, index) => {
                  const isExpanded = expandedServices.has(index);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                    >
                      {/* Service Header - Always visible */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                        onClick={() => toggleServiceExpanded(index)}
                      >
                        <div className="flex items-center space-x-2">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          <span className="font-medium text-gray-900">
                            {service.description || `Item ${index + 1}`}
                          </span>
                        </div>

                        {/* Price only visible on medium screens and up */}
                        <div className="hidden md:flex items-center">
                          <span className="text-sm font-medium text-emerald-600">
                            {formatAmount(service.total, receipt.payment.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Service Details - Expandable */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-200 bg-white"
                        >
                          <div className="pt-4 space-y-4">
                            {/* Item Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Description
                                </label>
                                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                  <span className="text-gray-900">{service.description}</span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Quantity
                                </label>
                                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                  <span className="text-gray-900">{service.quantity}</span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Unit Price ({receipt.payment.currency})
                                </label>
                                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                  <span className="text-gray-900">{formatAmount(service.amount, receipt.payment.currency)}</span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Total ({receipt.payment.currency})
                                </label>
                                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                  <span className="text-gray-900">{formatAmount(service.total, receipt.payment.currency)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Item Total Calculation */}
                            <div className="p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Item Total:</span>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">{service.quantity} × {formatAmount(service.amount, receipt.payment.currency)}</p>
                                  <span className="text-lg font-semibold text-emerald-600">
                                    {formatAmount(service.total, receipt.payment.currency)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Services Summary */}
                <div className="mt-4 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-700">
                      Total Items ({receipt.services.length})
                    </span>
                    <span className="text-base font-bold text-emerald-800">
                      {formatAmount(
                        receipt.services.reduce((sum, service) => sum + (service.total || 0), 0),
                        receipt.payment.currency
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Payment Management */}
        <PaymentManager receipt={receipt} onUpdate={(updatedReceipt) => setReceipt(updatedReceipt)} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          {/* Receipt Type Specific Payment Details */}
          {receipt.receiptType === "commitment" && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Commitment Receipt Details</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Commitment Fee Paid</p>
                    <p className="text-blue-900 font-bold text-lg">
                      {formatAmount(receipt.commitmentFeePaid, receipt.payment.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Amount for Moving</p>
                    <p className="text-blue-900 font-bold text-lg">
                      {formatAmount(receipt.totalMovingAmount, receipt.payment.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Balance Due</p>
                    <p className="text-blue-900 font-bold text-lg">
                      {formatAmount((receipt.totalMovingAmount || 0) - (receipt.commitmentFeePaid || 0), receipt.payment.currency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {receipt.receiptType === "final" && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Receipt Details</h3>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Commitment Fee Paid (Previously)</p>
                    <p className="text-green-900 font-bold text-lg">
                      {formatAmount(receipt.commitmentFeePaid, receipt.payment.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Final Payment Received</p>
                    <p className="text-green-900 font-bold text-lg">
                      {formatAmount(receipt.finalPaymentReceived, receipt.payment.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Grand Total</p>
                    <p className="text-green-900 font-bold text-lg">
                      {formatAmount((receipt.commitmentFeePaid || 0) + (receipt.finalPaymentReceived || 0), receipt.payment.currency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {receipt.receiptType === "one_time" && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">One Time Payment Receipt Details</h3>
              <div className="bg-orange-50 rounded-lg p-4">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Total Amount for Moving</p>
                  <p className="text-orange-900 font-bold text-xl">
                    {formatAmount(receipt.totalMovingAmount, receipt.payment.currency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Commitment Fee */}
          {receipt.commitmentFee && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Commitment Fee</h3>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {receipt.commitmentFee.commitmentReceiptId && (
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Commitment Receipt</p>
                      <p className="text-purple-900 font-medium">{receipt.commitmentFee.commitmentReceiptId}</p>
                    </div>
                  )}
                  {receipt.commitmentFee.amount && (
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Amount</p>
                      <p className="text-purple-900 font-bold">
                        {formatAmount(receipt.commitmentFee.amount, receipt.payment.currency)}
                      </p>
                    </div>
                  )}
                  {receipt.commitmentFee.paidDate && (
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Paid Date</p>
                      <p className="text-purple-900 font-medium">{formatDate(receipt.commitmentFee.paidDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Signatures */}
          {receipt.signatures && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Signatures</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(receipt.signatures.receivedBy || receipt.signatures.receivedByTitle) && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Received By</h4>
                    {receipt.signatures.receivedBy && (
                      <p className="text-sm text-gray-900">{receipt.signatures.receivedBy}</p>
                    )}
                    {receipt.signatures.receivedByTitle && (
                      <p className="text-sm text-gray-600">{receipt.signatures.receivedByTitle}</p>
                    )}
                  </div>
                )}
                {receipt.signatures.clientName && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Client</h4>
                    <p className="text-sm text-gray-900">{receipt.signatures.clientName}</p>
                  </div>
                )}
                {receipt.signatures.signatureDate && (
                  <div className="col-span-full">
                    <p className="text-sm text-gray-600">Signed on: {formatDate(receipt.signatures.signatureDate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {receipt.notes && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{receipt.notes}</div>
            </div>
          )}

          {/* Version History */}
          {receipt.versions && receipt.versions.length > 0 && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Version History</h3>
              <div className="space-y-3">
                {receipt.versions.reverse().map((version, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                            v{version.versionNumber}
                          </span>
                          <span className="text-sm text-gray-600">by {version.editedBy.fullName}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(version.editedAt)}</p>
                        {version.reason && <p className="text-sm text-gray-700 mt-2">{version.reason}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default ReceiptViewer;
