import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Trash2,
  Calendar,
  DollarSign,
  User,
  MapPin,
  FileText,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Building2,
  Package,
  Clock,
  Percent,
} from "lucide-react";
import { PageLayout } from "../../components/layout";
import { Button } from "../../components/ui/Button";
import { QuotationEditSkeleton } from "../../components/skeletons";
import { quotationsAPI, type Quotation, type QuotationService } from "../../services/quotations";

const QuotationEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: "Residential" as "Residential" | "International" | "Office",
    client: {
      name: "",
      phone: "",
      email: "",
      company: "",
    },
    locations: {
      from: "",
      to: "",
      movingDate: "",
    },
    services: [] as QuotationService[],
    pricing: {
      currency: "UGX" as "UGX" | "USD",
      discount: 0,
      taxRate: 0.18,
    },
    validity: {
      daysValid: 30,
    },
    termsAndConditions: "",
    notes: "",
  });

  const fetchQuotation = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await quotationsAPI.getQuotationById(id);
      const quotationData = response.data.quotation;
      setQuotation(quotationData);

      // Populate form with existing data
      setFormData({
        type: quotationData.type,
        client: {
          name: quotationData.client.name || "",
          phone: quotationData.client.phone || "",
          email: quotationData.client.email || "",
          company: quotationData.client.company || "",
        },
        locations: {
          from: quotationData.locations.from || "",
          to: quotationData.locations.to || "",
          movingDate: quotationData.locations.movingDate
            ? new Date(quotationData.locations.movingDate).toISOString().split("T")[0]
            : "",
        },
        services: quotationData.services || [],
        pricing: {
          currency: quotationData.pricing.currency,
          discount: quotationData.pricing.discount || 0,
          taxRate: quotationData.pricing.taxRate || 0.18,
        },
        validity: {
          daysValid: quotationData.validity.daysValid || 30,
        },
        termsAndConditions: quotationData.termsAndConditions || "",
        notes: quotationData.notes || "",
      });
    } catch (err) {
      console.error("Failed to fetch quotation:", err);
      setError(err instanceof Error ? err.message : "Failed to load quotation");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchQuotation();
    }
  }, [id, fetchQuotation]);

  const handleInputChange = (section: keyof typeof formData, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [section]:
        typeof prev[section] === "object" && !Array.isArray(prev[section])
          ? { ...(prev[section] as Record<string, unknown>), [field]: value }
          : value,
    }));
  };

  const handleServiceChange = (index: number, field: keyof QuotationService, value: string | number) => {
    const updatedServices = [...formData.services];
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: value,
    };

    // Calculate total when unitPrice or quantity changes
    if (field === "unitPrice" || field === "quantity") {
      const unitPrice = field === "unitPrice" ? Number(value) : Number(updatedServices[index].unitPrice);
      const quantity = field === "quantity" ? Number(value) : Number(updatedServices[index].quantity);
      updatedServices[index].total = unitPrice * quantity;
    }

    setFormData((prev) => ({ ...prev, services: updatedServices }));
  };

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          name: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
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

  const calculateSubtotal = () => {
    return formData.services.reduce((sum, service) => sum + (service.total || 0), 0);
  };

  const calculateTaxAmount = () => {
    const subtotal = calculateSubtotal();
    const afterDiscount = subtotal - (formData.pricing.discount || 0);
    return afterDiscount * (formData.pricing.taxRate || 0);
  };

  const calculateTotalAmount = () => {
    const subtotal = calculateSubtotal();
    const afterDiscount = subtotal - (formData.pricing.discount || 0);
    const taxAmount = afterDiscount * (formData.pricing.taxRate || 0);
    return afterDiscount + taxAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    // Validation
    if (!formData.client.name || !formData.client.phone) {
      setError("Client name and phone are required");
      return;
    }

    if (formData.type === "Office" && !formData.client.company) {
      setError("Company name is required for office moves");
      return;
    }

    if (!formData.locations.from || !formData.locations.to || !formData.locations.movingDate) {
      setError("All location fields are required");
      return;
    }

    if (formData.services.length === 0) {
      setError("At least one service is required");
      return;
    }

    const hasInvalidServices = formData.services.some(
      (service) => !service.name || !service.description || service.unitPrice <= 0 || service.quantity < 1
    );

    if (hasInvalidServices) {
      setError("All services must have a name, description, valid unit price and quantity");
      return;
    }

    // Validate moving date is in the future
    const movingDate = new Date(formData.locations.movingDate);
    if (movingDate <= new Date()) {
      setError("Moving date must be in the future");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const subtotal = calculateSubtotal();
      const taxAmount = calculateTaxAmount();
      const totalAmount = calculateTotalAmount();

      const updateData = {
        type: formData.type,
        client: {
          name: formData.client.name,
          phone: formData.client.phone,
          email: formData.client.email || undefined,
          company: formData.client.company || undefined,
        },
        locations: {
          from: formData.locations.from,
          to: formData.locations.to,
          movingDate: formData.locations.movingDate,
        },
        services: formData.services.map((service) => ({
          name: service.name,
          description: service.description,
          quantity: service.quantity,
          unitPrice: service.unitPrice,
        })),
        pricing: {
          currency: formData.pricing.currency,
          subtotal: subtotal,
          discount: formData.pricing.discount,
          taxRate: formData.pricing.taxRate,
          taxAmount: taxAmount,
          totalAmount: totalAmount,
        },
        termsAndConditions: formData.termsAndConditions || undefined,
        notes: formData.notes || undefined,
      };

      await quotationsAPI.updateQuotation(id, updateData);
      navigate(`/quotations/${id}`, {
        state: { message: "Quotation updated successfully" },
      });
    } catch (err) {
      console.error("Quotation update failed:", err);
      setError(err instanceof Error ? err.message : "Failed to update quotation");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: formData.pricing.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <PageLayout title="Edit Quotation">
        <QuotationEditSkeleton />
      </PageLayout>
    );
  }

  if (!quotation) {
    return (
      <PageLayout title="Edit Quotation">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quotation Not Found</h3>
          <p className="text-gray-600 mb-4">The quotation you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/quotations")} variant="primary">
            Back to Quotations
          </Button>
        </div>
      </PageLayout>
    );
  }

  // Don't allow editing converted quotations
  if (quotation.validity.status === "converted") {
    return (
      <PageLayout title="Edit Quotation">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quotation Already Converted</h3>
          <p className="text-gray-600 mb-4">This quotation has been converted to a receipt and cannot be edited.</p>
          <Button onClick={() => navigate(`/quotations/${id}`)} variant="primary">
            View Quotation
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`Edit Quotation - ${quotation.quotationNumber}`}>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company {formData.type === "Office" && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.client.company}
                  onChange={(e) => handleInputChange("client", "company", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required={formData.type === "Office"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
            Locations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.locations.from}
                onChange={(e) => handleInputChange("locations", "from", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Pickup location"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.locations.to}
                onChange={(e) => handleInputChange("locations", "to", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Destination"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moving Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={formData.locations.movingDate}
                  onChange={(e) => handleInputChange("locations", "movingDate", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-emerald-600" />
              Services
            </h2>
            <Button type="button" onClick={addService} variant="secondary" size="sm">
              Add Service
            </Button>
          </div>

          {formData.services.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-3">No services added yet</p>
              <Button type="button" onClick={addService} variant="primary" size="sm">
                Add First Service
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => handleServiceChange(index, "name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Service name"
                        required
                      />
                    </div>
                    <div className="md:col-span-3">
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
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={service.quantity}
                        onChange={(e) => handleServiceChange(index, "quantity", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        min="1"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={service.unitPrice}
                        onChange={(e) => handleServiceChange(index, "unitPrice", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        min="0"
                        step="1000"
                        required
                      />
                    </div>
                    <div className="md:col-span-1">
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
            </div>
          )}
        </div>

        {/* Pricing Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-emerald-600" />
            Pricing Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input
                type="text"
                value="UGX"
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
              <input
                type="number"
                value={formData.pricing.discount}
                onChange={(e) => handleInputChange("pricing", "discount", Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                min="0"
                step="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <div className="relative">
                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  value={formData.pricing.taxRate * 100}
                  onChange={(e) => handleInputChange("pricing", "taxRate", Number(e.target.value) / 100)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-10"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validity (Days)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  value={formData.validity.daysValid}
                  onChange={(e) => handleInputChange("validity", "daysValid", Number(e.target.value))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="7"
                  max="90"
                />
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          {formData.services.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                </div>
                {formData.pricing.discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Discount:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(formData.pricing.discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tax ({(formData.pricing.taxRate * 100).toFixed(1)}%):</span>
                  <span className="font-medium">{formatCurrency(calculateTaxAmount())}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(calculateTotalAmount())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-emerald-600" />
            Terms and Conditions
          </h2>
          <textarea
            value={formData.termsAndConditions}
            onChange={(e) => handleInputChange("termsAndConditions", "", e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Enter the terms and conditions for this quotation..."
          />
        </div>

        {/* Additional Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", "", e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Any additional notes or comments..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Button type="button" onClick={() => navigate(`/quotations/${id}`)} variant="secondary" disabled={saving}>
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

export default QuotationEditPage;
