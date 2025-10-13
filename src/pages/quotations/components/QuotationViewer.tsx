import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Calendar,
  User,
  Mail,
  Phone,
  CreditCard,
  AlertCircle,
  Loader2,
  Building,
  Globe,
  Home,
  Edit,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import { clsx } from "clsx";
import { PageLayout } from "../../../components/layout";
import { QuotationDetailsSkeleton } from "../../../components/skeletons";

interface QuotationData {
  _id: string;
  quotationNumber: string;
  type: "Residential" | "International" | "Office";
  client: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    gender?: string;
  };
  locations: {
    from: string;
    to: string;
    movingDate: string;
  };
  services: Array<{
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  pricing: {
    currency: string;
    subtotal: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
  };
  validity: {
    status: "active" | "expired" | "converted";
    validUntil: string;
    daysValid: number;
  };
  termsAndConditions?: string;
  notes?: string;
  version: number;
  createdAt: string;
  createdBy: {
    fullName: string;
    email?: string;
  };
  convertedToReceipt?: {
    receiptId?: string;
    convertedAt?: string;
    convertedBy?: {
      fullName: string;
    };
  };
}

interface QuotationViewerProps {
  quotationId: string;
}

const QuotationViewer: React.FC<QuotationViewerProps> = ({ quotationId }) => {
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        setLoading(true);
        setError(null);

        const { api } = await import("../../../services/api");
        const response = await api.get(`/quotations/${quotationId}`);

        // Extract quotation from nested response structure
        const quotationData =
          response.data.data?.quotation || response.data.quotation || response.data.data || response.data;
        setQuotation(quotationData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [quotationId]);

  const handleDownload = async () => {
    if (!quotation || downloading) return;

    try {
      setDownloading(true);
      const { api } = await import("../../../services/api");
      const response = await api.get(`/quotations/${quotationId}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quotation-${quotation.quotationNumber}.pdf`;
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
      active: "bg-green-100 text-green-800",
      expired: "bg-red-100 text-red-800",
      converted: "bg-blue-100 text-blue-800",
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

  const getMoveTypeIcon = (type: string) => {
    switch (type) {
      case "International":
        return <Globe className="w-5 h-5 text-purple-600" />;
      case "Office":
        return <Building className="w-5 h-5 text-orange-600" />;
      case "Residential":
        return <Home className="w-5 h-5 text-blue-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
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
      <PageLayout title="Quotation Details">
        <QuotationDetailsSkeleton />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Error">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Quotation</h2>
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

  if (!quotation) {
    return (
      <PageLayout title="Quotation Not Found">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Quotation Not Found</h2>
            <p className="text-gray-600 mb-4">The requested quotation could not be found.</p>
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
    <PageLayout title={`Quotation ${quotation.quotationNumber}`}>
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Quotation Details</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Edit Button */}
            {quotation.validity?.status !== "converted" && (
              <button
                onClick={() => navigate(`/quotations/edit/${quotationId}`)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                title="Edit Quotation"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

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
                {quotation.validity?.status && getStatusBadge(quotation.validity.status)}
                <div className="flex items-center gap-2">
                  {getMoveTypeIcon(quotation.type)}
                  <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                    {quotation.type} Move
                  </span>
                </div>
                {quotation.version > 1 && (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    v{quotation.version}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 text-sm text-gray-600 lg:text-right">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Created: {formatDate(quotation.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  By: {quotation.createdBy.fullName}
                </div>
                {quotation.validity?.validUntil && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Expires: {formatDate(quotation.validity.validUntil)}
                  </div>
                )}
                {quotation.validity?.daysValid && (
                  <div className="flex items-center gap-1 text-xs">
                    Valid for {quotation.validity.daysValid} days
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
                  <p className="font-medium text-gray-900">{quotation.client.name}</p>
                </div>
              </div>
              {quotation.client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{quotation.client.email}</p>
                  </div>
                </div>
              )}
              {quotation.client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{quotation.client.phone}</p>
                  </div>
                </div>
              )}
              {quotation.client.company && (
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="font-medium text-gray-900">{quotation.client.company}</p>
                  </div>
                </div>
              )}
              {quotation.client.gender && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium text-gray-900 capitalize">{quotation.client.gender}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Move Details */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Move Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">From</p>
                <p className="font-medium text-gray-900">{quotation.locations.from}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">To</p>
                <p className="font-medium text-gray-900">{quotation.locations.to}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Moving Date</p>
                <p className="font-medium text-gray-900">{formatDate(quotation.locations.movingDate)}</p>
              </div>
            </div>
          </div>

          {/* Services */}
          {quotation.services && quotation.services.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-emerald-600" />
                Services
              </h3>

              {/* Collapsible Cards View for ALL screen sizes */}
              <div className="space-y-4">
                {quotation.services.map((service, index) => {
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
                            {service.name || `Service ${index + 1}`}
                          </span>
                        </div>

                        {/* Price only visible on medium screens and up */}
                        <div className="hidden md:flex items-center">
                          <span className="text-sm font-medium text-emerald-600">
                            {formatAmount(service.total, quotation.pricing?.currency)}
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
                            {/* Service Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Service Name
                                </label>
                                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                  <span className="text-gray-900">{service.name}</span>
                                </div>
                              </div>

                              <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Quantity
                                </label>
                                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                  <span className="text-gray-900">{service.quantity}</span>
                                </div>
                              </div>

                              <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Unit Price ({quotation.pricing?.currency})
                                </label>
                                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                  <span className="text-gray-900">{formatAmount(service.unitPrice, quotation.pricing?.currency)}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                              </label>
                              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px]">
                                <span className="text-gray-900">{service.description}</span>
                              </div>
                            </div>

                            {/* Service Total */}
                            <div className="p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Service Total:</span>
                                <span className="text-lg font-semibold text-emerald-600">
                                  {formatAmount(service.total, quotation.pricing?.currency)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pricing Information */}
          {quotation.pricing && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    {formatAmount(quotation.pricing.subtotal, quotation.pricing.currency)}
                  </span>
                </div>
                {quotation.pricing.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-green-600">
                      -{formatAmount(quotation.pricing.discount, quotation.pricing.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({Math.round(quotation.pricing.taxRate * 100)}%):</span>
                  <span className="font-medium">
                    {formatAmount(quotation.pricing.taxAmount, quotation.pricing.currency)}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatAmount(quotation.pricing.totalAmount, quotation.pricing.currency)}
                        </p>
                      </div>
                      <CreditCard className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Terms and Conditions */}
          {quotation.termsAndConditions && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.termsAndConditions}</div>
            </div>
          )}

          {/* Notes */}
          {quotation.notes && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.notes}</div>
            </div>
          )}

          {/* Conversion Information */}
          {quotation.convertedToReceipt && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Status</h3>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Converted to Receipt</p>
                    <p className="text-sm text-green-700">Receipt ID: {quotation.convertedToReceipt.receiptId}</p>
                    {quotation.convertedToReceipt.convertedAt && (
                      <p className="text-sm text-green-700">
                        Converted on: {formatDate(quotation.convertedToReceipt.convertedAt)}
                      </p>
                    )}
                    {quotation.convertedToReceipt.convertedBy && (
                      <p className="text-sm text-green-700">By: {quotation.convertedToReceipt.convertedBy.fullName}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default QuotationViewer;
