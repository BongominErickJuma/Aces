import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Receipt, Calendar, User, Mail, Phone, MapPin, AlertCircle, Loader2, DollarSign } from "lucide-react";
import { clsx } from "clsx";
import { PageLayout } from "../../../components/layout";
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
      box: "Box Receipt",
      commitment: "Commitment Receipt",
      final: "Final Receipt",
      one_time: "One-time Receipt",
    };
    return type ? types[type as keyof typeof types] || type : "Receipt";
  };

  if (loading) {
    return (
      <PageLayout title="Loading Receipt">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="text-gray-600">Loading receipt...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Error">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Receipt</h2>
            <p className="text-gray-600 mb-4">{error}</p>
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
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Receipt className="w-6 h-6 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Receipt Details</h1>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors",
                downloading
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
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
              <div className="text-right text-sm text-gray-600">
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="w-4 h-4" />
                  Created: {formatDate(receipt.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  By: {receipt.createdBy.fullName}
                </div>
                {receipt.payment.dueDate && (
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4" />
                    Due: {formatDate(receipt.payment.dueDate)}
                  </div>
                )}
                {receipt.payment.paymentHistory && receipt.payment.paymentHistory.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
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

          {/* Move Locations */}
          {receipt.locations && (
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

          {/* Services */}
          {receipt.services && receipt.services.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Services</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Description</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600">Qty</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600">Amount</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.services.map((service, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 text-sm font-medium text-gray-900">{service.description}</td>
                        <td className="py-3 text-sm text-gray-600 text-right">{service.quantity}</td>
                        <td className="py-3 text-sm text-gray-600 text-right">
                          {formatAmount(service.amount, receipt.payment.currency)}
                        </td>
                        <td className="py-3 text-sm font-medium text-gray-900 text-right">
                          {formatAmount(service.total, receipt.payment.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
