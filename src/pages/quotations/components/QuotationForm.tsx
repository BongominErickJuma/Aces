import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { Save, X, Plus, Trash2, Calculator, AlertCircle, Building2, Home, Globe } from "lucide-react";
import { quotationsAPI, type CreateQuotationData, type Quotation } from "../../../services/quotations";
import { Button } from "../../../components/ui/Button";

interface QuotationFormProps {
  quotation?: Quotation | null;
  onSave: (quotation: Quotation) => void;
  onCancel: () => void;
}

type FormData = CreateQuotationData;

const QuotationForm: React.FC<QuotationFormProps> = ({ quotation, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!quotation;

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      type: "Residential",
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
      services: [
        {
          name: "Packaging",
          description: "",
          quantity: 1,
          unitPrice: 0,
        },
      ],
      pricing: {
        currency: "UGX",
        discount: 0,
        taxRate: 0.18,
      },
      termsAndConditions: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "services",
  });

  const watchedServices = watch("services");
  const watchedCurrency = watch("pricing.currency");
  const watchedDiscount = watch("pricing.discount");
  const watchedTaxRate = watch("pricing.taxRate");
  const quotationType = watch("type");

  // Load existing quotation data for editing
  useEffect(() => {
    if (isEditing && quotation) {
      reset({
        type: quotation.type,
        client: quotation.client,
        locations: {
          from: quotation.locations.from,
          to: quotation.locations.to,
          movingDate: quotation.locations.movingDate.split("T")[0], // Format for date input
        },
        services: quotation.services.map((service) => ({
          name: service.name,
          description: service.description,
          quantity: service.quantity,
          unitPrice: service.unitPrice,
        })),
        pricing: {
          currency: quotation.pricing.currency,
          discount: quotation.pricing.discount || 0,
          taxRate: quotation.pricing.taxRate,
        },
        termsAndConditions: quotation.termsAndConditions || "",
        notes: quotation.notes || "",
      });
    }
  }, [quotation, isEditing, reset]);

  // Calculate totals
  const calculations = React.useMemo(() => {
    const subtotal =
      watchedServices?.reduce((sum, service) => {
        return sum + (service.quantity || 0) * (service.unitPrice || 0);
      }, 0) || 0;

    const discountAmount = watchedDiscount || 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = taxableAmount * (watchedTaxRate || 0);
    const total = taxableAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    };
  }, [watchedServices, watchedDiscount, watchedTaxRate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: watchedCurrency || "UGX",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const addService = () => {
    append({
      name: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
    });
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);

      // Ensure moving date is in the future
      const movingDate = new Date(data.locations.movingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (movingDate <= today) {
        setError("Moving date must be in the future");
        return;
      }

      // Validate office move requirements
      if (data.type === "Office" && !data.client.company?.trim()) {
        setError("Company name is required for office moves");
        return;
      }

      let result;
      if (isEditing && quotation) {
        // For updates, include calculated pricing fields
        const updateData = {
          ...data,
          pricing: {
            ...data.pricing,
            subtotal: calculations.subtotal,
            taxAmount: calculations.taxAmount,
            totalAmount: calculations.total,
          },
        };
        result = await quotationsAPI.updateQuotation(quotation._id, updateData);
      } else {
        result = await quotationsAPI.createQuotation(data);
      }

      onSave(result.data.quotation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quotation");
    } finally {
      setLoading(false);
    }
  };

  const getQuotationTypeIcon = (type: string) => {
    switch (type) {
      case "Office":
        return <Building2 size={20} className="text-blue-600" />;
      case "International":
        return <Globe size={20} className="text-green-600" />;
      default:
        return <Home size={20} className="text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? `Edit Quotation ${quotation?.quotationNumber}` : "Create New Quotation"}
          </h2>
          <p className="text-gray-600 mt-1">
            {isEditing ? "Update quotation details" : "Fill in the details to generate a new quotation"}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onCancel}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <X size={20} />
        </motion.button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3"
        >
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Quotation Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotation Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                type: "Residential",
                description: "Moving homes, apartments, and personal belongings",
                features: ["Packaging", "Transportation", "Labor"]
              },
              {
                type: "International",
                description: "Cross-border moves with customs clearance",
                features: ["Border Clearance", "Documentation", "International Transport"]
              },
              {
                type: "Office",
                description: "Business relocations and office equipment moves",
                features: ["Equipment Handling", "Minimal Downtime", "Professional Service"]
              }
            ].map((moveType) => (
              <label key={moveType.type} className="cursor-pointer">
                <input
                  type="radio"
                  value={moveType.type}
                  {...register("type", { required: "Please select a quotation type" })}
                  className="sr-only"
                />
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    quotationType === moveType.type
                      ? "border-aces-green bg-green-50 text-aces-green"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {getQuotationTypeIcon(moveType.type)}
                    <span className="font-medium">{moveType.type} Move</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{moveType.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {moveType.features.map((feature, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </label>
            ))}
          </div>
          {errors.type && <p className="text-red-600 text-sm mt-2">{errors.type.message}</p>}
        </motion.div>

        {/* Client Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
              <input
                type="text"
                {...register("client.name", { required: "Client name is required" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="Enter client name"
              />
              {errors.client?.name && <p className="text-red-600 text-sm mt-1">{errors.client.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                {...register("client.phone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^[+]?[\d\s\-()]{10,}$/,
                    message: "Please enter a valid phone number",
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="+256 700 123 456"
              />
              {errors.client?.phone && <p className="text-red-600 text-sm mt-1">{errors.client.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                {...register("client.email", {
                  pattern: {
                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    message: "Please enter a valid email address",
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="client@example.com"
              />
              {errors.client?.email && <p className="text-red-600 text-sm mt-1">{errors.client.email.message}</p>}
            </div>

            {quotationType === "Office" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  {...register("client.company", {
                    required: quotationType === "Office" ? "Company name is required for office moves" : false,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  placeholder="Enter company name"
                />
                {errors.client?.company && <p className="text-red-600 text-sm mt-1">{errors.client.company.message}</p>}
              </div>
            )}
          </div>
        </motion.div>

        {/* Locations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Move Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From (Pickup Location) *</label>
              <input
                type="text"
                {...register("locations.from", { required: "Pickup location is required" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="Enter pickup location"
              />
              {errors.locations?.from && <p className="text-red-600 text-sm mt-1">{errors.locations.from.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To (Destination) *</label>
              <input
                type="text"
                {...register("locations.to", { required: "Destination is required" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="Enter destination"
              />
              {errors.locations?.to && <p className="text-red-600 text-sm mt-1">{errors.locations.to.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Moving Date *</label>
              <input
                type="date"
                {...register("locations.movingDate", { required: "Moving date is required" })}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              />
              {errors.locations?.movingDate && (
                <p className="text-red-600 text-sm mt-1">{errors.locations.movingDate.message}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Services</h3>
            <Button type="button" onClick={addService} variant="secondary" size="sm">
              <Plus size={16} className="mr-1" />
              Add Service
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Service Name *</label>
                    <input
                      type="text"
                      {...register(`services.${index}.name`, { required: "Service name is required" })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                      placeholder="e.g., Packaging"
                    />
                    {errors.services?.[index]?.name && (
                      <p className="text-red-600 text-xs mt-1">{errors.services[index].name.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                    <input
                      type="text"
                      {...register(`services.${index}.description`, { required: "Description is required" })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                      placeholder="Describe the service"
                    />
                    {errors.services?.[index]?.description && (
                      <p className="text-red-600 text-xs mt-1">{errors.services[index].description.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      {...register(`services.${index}.quantity`, {
                        required: "Quantity is required",
                        min: { value: 1, message: "Quantity must be at least 1" },
                        valueAsNumber: true,
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                    />
                    {errors.services?.[index]?.quantity && (
                      <p className="text-red-600 text-xs mt-1">{errors.services[index].quantity.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register(`services.${index}.unitPrice`, {
                        required: "Unit price is required",
                        min: { value: 0, message: "Price cannot be negative" },
                        valueAsNumber: true,
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                    />
                    {errors.services?.[index]?.unitPrice && (
                      <p className="text-red-600 text-xs mt-1">{errors.services[index].unitPrice.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-1 flex items-end justify-center">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </div>

                {/* Service Total */}
                <div className="mt-3 text-right">
                  <span className="text-sm font-medium text-gray-700">
                    Total:{" "}
                    {formatCurrency((watchedServices[index]?.quantity || 0) * (watchedServices[index]?.unitPrice || 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calculator className="mr-2" size={20} />
            Pricing & Calculations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency *</label>
              <select
                {...register("pricing.currency", { required: "Currency is required" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              >
                <option value="UGX">UGX - Uganda Shillings</option>
                <option value="USD">USD - US Dollars</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("pricing.discount", {
                  min: { value: 0, message: "Discount cannot be negative" },
                  valueAsNumber: true,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register("pricing.taxRate", {
                  min: { value: 0, message: "Tax rate cannot be negative" },
                  max: { value: 1, message: "Tax rate cannot exceed 100%" },
                  valueAsNumber: true,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="18"
              />
            </div>
          </div>

          {/* Calculations Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculations.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>-{formatCurrency(calculations.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({((watchedTaxRate || 0) * 100).toFixed(1)}%):</span>
                <span>{formatCurrency(calculations.taxAmount)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-aces-green">{formatCurrency(calculations.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
              <textarea
                rows={4}
                {...register("termsAndConditions")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="Enter specific terms and conditions for this quotation..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                rows={3}
                {...register("notes")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="Any additional notes or special instructions..."
              />
            </div>
          </div>
        </motion.div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Button type="button" onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
              />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            {loading ? "Saving..." : isEditing ? "Update Quotation" : "Create Quotation"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;
