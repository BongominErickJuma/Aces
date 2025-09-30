import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, Calendar, User, MapPin, FileText, AlertCircle, Loader2, Phone, Mail, Home, ChevronDown, ChevronUp} from "lucide-react";
import { PageLayout } from "../../components/layout";
import { Button } from "../../components/ui/Button";
import { ReceiptEditSkeleton } from "../../components/skeletons";
import { receiptsAPI, type Receipt, type ReceiptService } from "../../services/receipts";

const ReceiptEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    receiptType: "one_time" as "item" | "commitment" | "final" | "one_time",
    client: {
      name: "",
      phone: "",
      email: "",
      address: "",
      gender: "",
    },
    locations: {
      from: "",
      to: "",
      movingDate: "",
    },
    services: [] as ReceiptService[],
    payment: {
      currency: "UGX" as "UGX" | "USD",
      method: undefined as "cash" | "bank_transfer" | "mobile_money" | undefined,
      dueDate: "",
    },
    signatures: {
      receivedBy: "",
      receivedByTitle: "",
      clientName: "",
      signatureDate: new Date().toISOString().split("T")[0],
    },
    notes: "",
    // Commitment receipt specific fields
    commitmentFeePaid: 0,
    totalMovingAmount: 0,
    // Final receipt specific fields
    finalPaymentReceived: 0,
  });

  useEffect(() => {
    if (id) {
      fetchReceipt();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReceipt = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await receiptsAPI.getReceiptById(id);
      const receiptData = response.data.receipt;
      setReceipt(receiptData);

      // Extract receipt type specific fields from direct properties
      let commitmentFeePaid = 0;
      let totalMovingAmount = 0;
      let finalPaymentReceived = 0;

      if (receiptData.receiptType === "commitment") {
        // Use direct fields for commitment receipts
        commitmentFeePaid = receiptData.commitmentFeePaid || 0;
        totalMovingAmount = receiptData.totalMovingAmount || 0;
      } else if (receiptData.receiptType === "final") {
        // Use direct fields for final receipts
        commitmentFeePaid = receiptData.commitmentFeePaid || 0;
        finalPaymentReceived = receiptData.finalPaymentReceived || 0;
      } else if (receiptData.receiptType === "one_time") {
        // Use direct fields for one-time receipts
        totalMovingAmount = receiptData.totalMovingAmount || 0;
      }

      // Populate form with existing data
      setFormData({
        receiptType: receiptData.receiptType,
        client: {
          name: receiptData.client.name || "",
          phone: receiptData.client.phone || "",
          email: receiptData.client.email || "",
          address: receiptData.client.address || "",
          gender: receiptData.client.gender || "",
        },
        locations: {
          from: receiptData.locations?.from || "",
          to: receiptData.locations?.to || "",
          movingDate: receiptData.locations?.movingDate
            ? new Date(receiptData.locations.movingDate).toISOString().split("T")[0]
            : "",
        },
        services: receiptData.services || [],
        payment: {
          currency: receiptData.payment.currency,
          method: receiptData.payment.method,
          dueDate: receiptData.payment.dueDate ? new Date(receiptData.payment.dueDate).toISOString().split("T")[0] : "",
        },
        signatures: {
          receivedBy: receiptData.signatures?.receivedBy || "",
          receivedByTitle: receiptData.signatures?.receivedByTitle || "",
          clientName: receiptData.signatures?.clientName || "",
          signatureDate: receiptData.signatures?.signatureDate
            ? new Date(receiptData.signatures.signatureDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        },
        notes: receiptData.notes || "",
        commitmentFeePaid: commitmentFeePaid,
        totalMovingAmount: totalMovingAmount,
        finalPaymentReceived: finalPaymentReceived,
      });

      // Expand first service by default if there are services
      if (receiptData.receiptType === "item" && receiptData.services && receiptData.services.length > 0) {
        setExpandedServices(new Set([0]));
      }
    } catch (err) {
      console.error("Failed to fetch receipt:", err);
      setError(err instanceof Error ? err.message : "Failed to load receipt");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section: keyof typeof formData, field: string, value: string | number | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [section]:
        typeof prev[section] === "object" && !Array.isArray(prev[section])
          ? { ...(prev[section] as Record<string, unknown>), [field]: value }
          : value,
    }));
  };

  const handleServiceChange = (index: number, field: keyof ReceiptService, value: string | number) => {
    const updatedServices = [...formData.services];
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: value,
    };

    // Calculate total when amount or quantity changes
    if (field === "amount" || field === "quantity") {
      const amount = field === "amount" ? Number(value) : Number(updatedServices[index].amount);
      const quantity = field === "quantity" ? Number(value) : Number(updatedServices[index].quantity);
      updatedServices[index].total = amount * quantity;
    }

    setFormData((prev) => ({ ...prev, services: updatedServices }));
  };

  const addService = () => {
    const newServiceIndex = formData.services.length;
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          description: "",
          amount: 0,
          quantity: 1,
          total: 0,
        },
      ],
    }));
    // Expand the newly added service
    setExpandedServices((prev) => new Set(prev).add(newServiceIndex));
  };

  const removeService = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
    // Remove from expanded set
    setExpandedServices((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const toggleServiceExpanded = (index: number) => {
    setExpandedServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const calculateTotalAmount = () => {
    return formData.services.reduce((sum, service) => sum + (service.total || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    // Validation
    if (!formData.client.name || !formData.client.phone) {
      setError("Client name and phone are required");
      return;
    }

    // Only item receipts require services
    if (formData.receiptType === "item" && formData.services.length === 0) {
      setError("At least one service is required for item receipts");
      return;
    }

    // Validate based on receipt type
    if (formData.receiptType === "commitment") {
      // Validate commitment receipt fields
      if (!formData.commitmentFeePaid && formData.commitmentFeePaid !== 0) {
        setError("Commitment fee is required");
        return;
      }
      if (!formData.totalMovingAmount || formData.totalMovingAmount <= 0) {
        setError("Total moving amount must be greater than zero");
        return;
      }
    } else if (formData.receiptType === "final") {
      // Validate final receipt fields
      if (!formData.commitmentFeePaid && formData.commitmentFeePaid !== 0) {
        setError("Commitment fee (previously paid) is required");
        return;
      }
      if (!formData.finalPaymentReceived && formData.finalPaymentReceived !== 0) {
        setError("Final payment received is required");
        return;
      }
    } else if (formData.receiptType === "one_time") {
      // Validate one-time payment fields
      if (!formData.totalMovingAmount || formData.totalMovingAmount <= 0) {
        setError("Total moving amount must be greater than zero");
        return;
      }
    } else if (formData.receiptType === "item") {
      // Validate regular services for item receipts only
      const hasInvalidServices = formData.services.some((service) => !service.description || service.amount <= 0);

      if (hasInvalidServices) {
        setError("All services must have a description and valid amount");
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      let updateData: Record<string, unknown>;

      if (formData.receiptType === "commitment") {
        // For commitment receipts, send commitment-specific data
        updateData = {
          receiptType: formData.receiptType,
          client: formData.client,
          locations:
            formData.locations.from || formData.locations.to || formData.locations.movingDate
              ? formData.locations
              : undefined,
          commitmentFeePaid: Number(formData.commitmentFeePaid),
          totalMovingAmount: Number(formData.totalMovingAmount),
          payment: {
            currency: formData.payment.currency,
            method: formData.payment.method || undefined,
            dueDate: formData.payment.dueDate || undefined,
          },
          signatures: formData.signatures,
          notes: formData.notes || undefined,
        };
      } else if (formData.receiptType === "final") {
        // For final receipts, send final-specific data
        updateData = {
          receiptType: formData.receiptType,
          client: formData.client,
          locations:
            formData.locations.from || formData.locations.to || formData.locations.movingDate
              ? formData.locations
              : undefined,
          commitmentFeePaid: Number(formData.commitmentFeePaid),
          finalPaymentReceived: Number(formData.finalPaymentReceived),
          payment: {
            currency: formData.payment.currency,
            method: formData.payment.method || undefined,
            dueDate: formData.payment.dueDate || undefined,
          },
          signatures: formData.signatures,
          notes: formData.notes || undefined,
        };
      } else if (formData.receiptType === "one_time") {
        // For one-time payment receipts, send one-time-specific data
        updateData = {
          receiptType: formData.receiptType,
          client: formData.client,
          locations:
            formData.locations.from || formData.locations.to || formData.locations.movingDate
              ? formData.locations
              : undefined,
          totalMovingAmount: Number(formData.totalMovingAmount),
          payment: {
            currency: formData.payment.currency,
            method: formData.payment.method || undefined,
            dueDate: formData.payment.dueDate || undefined,
          },
          signatures: formData.signatures,
          notes: formData.notes || undefined,
        };
      } else {
        // For other receipt types, use regular services
        const totalAmount = calculateTotalAmount();

        updateData = {
          receiptType: formData.receiptType,
          client: formData.client,
          locations:
            formData.locations.from || formData.locations.to || formData.locations.movingDate
              ? formData.locations
              : undefined,
          services: formData.services,
          payment: {
            totalAmount: totalAmount,
            amountPaid: receipt?.payment.amountPaid || 0, // Keep existing amount paid
            balance: Math.max(0, totalAmount - (receipt?.payment.amountPaid || 0)), // Ensure balance is not negative
            currency: formData.payment.currency,
            method: formData.payment.method || undefined,
            dueDate: formData.payment.dueDate || undefined,
            status: receipt?.payment.status || "pending", // Keep existing status
          },
          signatures: formData.signatures,
          notes: formData.notes || undefined,
        };
      }

      await receiptsAPI.updateReceipt(id, updateData);
      navigate(`/receipts/${id}`, {
        state: { message: "Receipt updated successfully" },
      });
    } catch (err) {
      console.error("Receipt update failed:", err);
      setError(err instanceof Error ? err.message : "Failed to update receipt");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: formData.payment.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <PageLayout title="Edit Receipt">
        <ReceiptEditSkeleton />
      </PageLayout>
    );
  }

  if (error && !receipt) {
    return (
      <PageLayout title="Edit Receipt">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Receipt</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={fetchReceipt} variant="primary">
              Try Again
            </Button>
            <Button onClick={() => navigate("/receipts")} variant="secondary">
              Back to Receipts
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!receipt) {
    return (
      <PageLayout title="Edit Receipt">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Receipt Not Found</h3>
          <p className="text-gray-600 mb-4">The receipt you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/receipts")} variant="primary">
            Back to Receipts
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`Edit Receipt - ${receipt.receiptNumber}`}>
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
          input, select, textarea { font-size: 0.875rem; }
          button { font-size: 0.875rem; }
        }
      `}</style>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Client Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <User className="w-4 sm:w-5 h-4 sm:h-5 mr-1.5 sm:mr-2 text-emerald-600" />
            Client Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.client.name}
                onChange={(e) => handleInputChange("client", "name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  value={formData.client.phone}
                  onChange={(e) => handleInputChange("client", "phone", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={formData.client.gender}
                onChange={(e) => handleInputChange("client", "gender", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={formData.client.email}
                  onChange={(e) => handleInputChange("client", "email", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.client.address}
                  onChange={(e) => handleInputChange("client", "address", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Locations (for non-item receipts) */}
        {formData.receiptType !== "item" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <MapPin className="w-4 sm:w-5 h-4 sm:h-5 mr-1.5 sm:mr-2 text-emerald-600" />
              Locations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="text"
                  value={formData.locations.from}
                  onChange={(e) => handleInputChange("locations", "from", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Pickup location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="text"
                  value={formData.locations.to}
                  onChange={(e) => handleInputChange("locations", "to", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Destination"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moving Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={formData.locations.movingDate}
                    onChange={(e) => handleInputChange("locations", "movingDate", e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services / Commitment Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <FileText className="w-4 sm:w-5 h-4 sm:h-5 mr-1.5 sm:mr-2 text-emerald-600" />
            {formData.receiptType === "commitment" ? "Commitment Receipt Details" : "Services"}
          </h2>

          {formData.receiptType === "commitment" ? (
            /* Commitment Receipt Fields */
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commitment Fee Paid ({formData.payment.currency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.commitmentFeePaid}
                    onChange={(e) => setFormData((prev) => ({ ...prev, commitmentFeePaid: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount For Moving ({formData.payment.currency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.totalMovingAmount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, totalMovingAmount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
              </div>

              {/* Balance Due */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-700">Balance Due:</span>
                  <span className="text-xl font-bold text-emerald-600">
                    {formatCurrency((formData.totalMovingAmount || 0) - (formData.commitmentFeePaid || 0))}
                  </span>
                </div>
              </div>

              {/* Summary Table */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Receipt Summary</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium text-gray-700">Description</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-sm text-gray-600">Commitment Fee Paid</td>
                      <td className="py-2 text-sm text-right font-semibold text-green-600">
                        {formatCurrency(formData.commitmentFeePaid || 0)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-sm text-gray-600">Total Amount For Moving</td>
                      <td className="py-2 text-sm text-right font-semibold">
                        {formatCurrency(formData.totalMovingAmount || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-sm text-gray-600 font-medium">Balance Due</td>
                      <td className="py-2 text-sm text-right font-bold text-red-600">
                        {formatCurrency((formData.totalMovingAmount || 0) - (formData.commitmentFeePaid || 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : formData.receiptType === "final" ? (
            /* Final Receipt Fields */
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commitment Fee Paid (Previously) ({formData.payment.currency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.commitmentFeePaid}
                    onChange={(e) => setFormData((prev) => ({ ...prev, commitmentFeePaid: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Final Payment Received ({formData.payment.currency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.finalPaymentReceived}
                    onChange={(e) => setFormData((prev) => ({ ...prev, finalPaymentReceived: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
              </div>

              {/* Grand Total */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-700">Grand Total:</span>
                  <span className="text-xl font-bold text-emerald-600">
                    {formatCurrency((formData.commitmentFeePaid || 0) + (formData.finalPaymentReceived || 0))}
                  </span>
                </div>
              </div>

              {/* Summary Table for Final Receipt */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Receipt Summary</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium text-gray-700">Description</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-sm text-gray-600">Commitment Fee Paid (Previously)</td>
                      <td className="py-2 text-sm text-right font-semibold">
                        {formatCurrency(formData.commitmentFeePaid || 0)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-sm text-gray-600">Final Payment Received</td>
                      <td className="py-2 text-sm text-right font-semibold text-green-600">
                        {formatCurrency(formData.finalPaymentReceived || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-sm text-gray-600 font-medium">Grand Total</td>
                      <td className="py-2 text-sm text-right font-bold text-emerald-600">
                        {formatCurrency((formData.commitmentFeePaid || 0) + (formData.finalPaymentReceived || 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : formData.receiptType === "one_time" ? (
            /* One Time Payment Fields */
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount For Moving ({formData.payment.currency}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.totalMovingAmount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, totalMovingAmount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              {/* Summary Table for One Time Payment */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Receipt Summary</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium text-gray-700">Description</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 text-sm text-gray-600 font-medium">Total Amount For Moving</td>
                      <td className="py-2 text-sm text-right font-bold text-emerald-600">
                        {formatCurrency(formData.totalMovingAmount || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : formData.receiptType === "item" ? (
            <div className="space-y-3 sm:space-y-4">
              {formData.services.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-3">No services added yet</p>
                  <Button type="button" onClick={addService} variant="primary" size="sm">
                    Add First Service
                  </Button>
                </div>
              ) : (
                <>
                  {formData.services.map((service, index) => {
                    const isExpanded = expandedServices.has(index);
                    const hasContent = service.description || service.amount > 0;

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                      >
                        {/* Service Header - Always visible */}
                        <div
                          className="p-3 sm:p-4 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                          onClick={() => toggleServiceExpanded(index)}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="flex items-center space-x-1.5 sm:space-x-2">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                              <span className="text-sm sm:text-base font-medium text-gray-900">
                                Service {index + 1}
                                {hasContent && !isExpanded && (
                                  <span className="hidden sm:inline text-sm text-gray-500 ml-2">
                                    ({service.description.substring(0, 30)}
                                    {service.description.length > 30 ? "..." : ""})
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            {!isExpanded && (
                              <span className="text-xs sm:text-sm font-semibold text-emerald-600">
                                {formatCurrency(service.total)}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeService(index);
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Service Details - Collapsible */}
                        {isExpanded && (
                          <div className="p-3 sm:p-4 pt-0 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
                              <div className="md:col-span-12">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Service Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                  value={service.description}
                                  onChange={(e) => handleServiceChange(index, "description", e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                  placeholder="Enter detailed service description"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:col-span-12">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount <span className="text-red-500">*</span>
                                  </label>
                                <input
                                  type="number"
                                  value={service.amount}
                                  onChange={(e) => handleServiceChange(index, "amount", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  min="0"
                                  step="1000"
                                  required
                                />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input
                                  type="number"
                                  value={service.quantity}
                                  onChange={(e) => handleServiceChange(index, "quantity", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  min="1"
                                />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                                <input
                                  type="text"
                                  value={formatCurrency(service.total)}
                                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                                  disabled
                                />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Add Service Button */}
                  <Button
                    type="button"
                    onClick={addService}
                    variant="secondary"
                    className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 hover:border-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <span>Add Another Service</span>
                  </Button>

                  {/* Total */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-emerald-600">{formatCurrency(calculateTotalAmount())}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Additional Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Additional Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Any additional notes or comments..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <Button type="button" onClick={() => navigate(`/receipts/${id}`)} variant="secondary" disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Changes</>
            )}
          </Button>
        </div>
      </form>
    </PageLayout>
  );
};

export default ReceiptEditPage;
