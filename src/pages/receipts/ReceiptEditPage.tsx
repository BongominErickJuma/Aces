import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, Calendar, User, MapPin, FileText, AlertCircle, Loader2, Phone, Mail, Home } from "lucide-react";
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

  // Form state
  const [formData, setFormData] = useState({
    receiptType: "one_time" as "box" | "commitment" | "final" | "one_time",
    client: {
      name: "",
      phone: "",
      email: "",
      address: "",
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
  };

  const removeService = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
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

    // Only box receipts require services
    if (formData.receiptType === "box" && formData.services.length === 0) {
      setError("At least one service is required for box receipts");
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
    } else if (formData.receiptType === "box") {
      // Validate regular services for box receipts only
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
      <form onSubmit={handleSubmit} className="space-y-6">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-emerald-600" />
            Client Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Locations (for non-box receipts) */}
        {formData.receiptType !== "box" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
              Locations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-emerald-600" />
              {formData.receiptType === "commitment" ? "Commitment Receipt Details" : "Services"}
            </h2>
            {formData.receiptType !== "commitment" && (
              <Button type="button" onClick={addService} variant="secondary" size="sm">
                Add Service
              </Button>
            )}
          </div>

          {formData.receiptType === "commitment" ? (
            /* Commitment Receipt Fields */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-4">
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
          ) : formData.receiptType === "box" && formData.services.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-3">No services added yet</p>
              <Button type="button" onClick={addService} variant="primary" size="sm">
                Add First Service
              </Button>
            </div>
          ) : formData.receiptType === "box" ? (
            <div className="space-y-4">
              {formData.services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={service.description}
                        onChange={(e) => handleServiceChange(index, "description", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Service description"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
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
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={service.quantity}
                        onChange={(e) => handleServiceChange(index, "quantity", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                      <input
                        type="text"
                        value={formatCurrency(service.total)}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                        disabled
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5 mx-auto" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Total */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-emerald-600">{formatCurrency(calculateTotalAmount())}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Additional Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Any additional notes or comments..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
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
