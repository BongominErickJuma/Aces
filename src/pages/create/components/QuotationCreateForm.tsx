import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  Calculator,
  AlertCircle,
  Building2,
  Home,
  Globe,
  User,
  MapPin,
  Package,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { quotationsAPI, type CreateQuotationData } from "../../../services/quotations";
import { Button } from "../../../components/ui/Button";
import QuotationPreview from "./QuotationPreview";
import { useDraft } from "../../../hooks/useDraft";
import { DraftSyncIndicator } from "../../../components/ui/DraftSyncIndicator";

interface QuotationCreateFormProps {
  onCancel: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

type FormData = CreateQuotationData;

const QuotationCreateForm: React.FC<QuotationCreateFormProps> = ({ onCancel, isLoading, setIsLoading }) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set([0]));

  const {
    saveDraft,
    loadDraft,
    clearDraft,
    syncDraft,
    hasDraft,
    lastSaved,
    isSaving,
    syncStatus,
    lastSyncError,
    isCloudSyncEnabled,
  } = useDraft<FormData>("quotation-create", {
    autoSave: true,
    autoSaveInterval: 3000,
  });

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
        gender: "",
      },
      locations: {
        from: "",
        to: "",
        movingDate: "",
      },
      services: [
        {
          name: "Packaging",
          description: "Standard packaging service",
          quantity: 1,
          unitPrice: 0,
        },
      ],
      pricing: {
        currency: "UGX",
        discount: 0,
        taxRate: 0,
      },
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

  // Load draft on mount if exists
  useEffect(() => {
    const loadExistingDraft = async () => {
      const draftData = await loadDraft();
      if (draftData) {
        interface DraftData extends FormData {
          currentStep?: number;
        }
        const { currentStep: savedStep, ...formData } = draftData as DraftData;
        reset(formData);
        if (savedStep) {
          setCurrentStep(savedStep);
        }
      }
    };

    loadExistingDraft();
  }, []); // Remove loadDraft and reset from deps to prevent re-loading

  // Auto-save draft when form changes (but not during submission)
  useEffect(() => {
    if (isLoading) return; // Don't auto-save during submission

    const subscription = watch((value) => {
      // Only save if there's meaningful data
      if (value.client?.name || value.client?.phone || (value.services && value.services.length > 0)) {
        interface DraftData extends FormData {
          currentStep?: number;
        }
        saveDraft({ ...value, currentStep } as DraftData);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, saveDraft, currentStep, isLoading]);

  // Calculate totals
  const subtotal = watchedServices?.reduce((sum, service) => sum + (service.quantity * service.unitPrice || 0), 0) || 0;

  const discountAmount = (subtotal * (watchedDiscount || 0)) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * ((watchedTaxRate || 0) / 100);
  const totalAmount = taxableAmount + taxAmount;

  const onSubmit = async (data: FormData) => {
    // Prevent submission if not on the final step
    if (currentStep !== 4) {
      console.warn("Form submitted but not on step 4, current step:", currentStep);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Calculate pricing
      const calculatedPricing = {
        ...data.pricing,
        discount: discountAmount, // Backend expects discount as amount, not percentage
        taxRate: (data.pricing.taxRate || 0) / 100, // Convert percentage to decimal for backend
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
      };

      const quotationData = {
        ...data,
        pricing: calculatedPricing,
      };

      const response = await quotationsAPI.createQuotation(quotationData);

      // Clear draft after successful creation
      clearDraft();

      // Navigate to quotations list after successful creation
      navigate("/quotations", {
        state: { message: `Quotation ${response.data.quotation.quotationNumber} created successfully` },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quotation");
    } finally {
      setIsLoading(false);
    }
  };

  const addService = () => {
    const newIndex = fields.length;
    append({
      name: "",
      description: "Service description",
      quantity: 1,
      unitPrice: 0,
    });
    // Expand the new service and collapse others
    setExpandedServices(new Set([newIndex]));
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

  const formatCurrency = (amount: number) => {
    const currency = watchedCurrency || "UGX";
    if (currency === "UGX") {
      // Custom formatting for UGX to show "UGX XXXXX" format
      const number = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
      return `UGX ${number}`;
    } else {
      // Use standard formatting for other currencies
      const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: currency === "USD" ? 2 : 0,
      });
      return formatter.format(amount);
    }
  };

  const getQuotationTypeIcon = (type: string) => {
    switch (type) {
      case "Office":
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case "International":
        return <Globe className="w-5 h-5 text-green-600" />;
      default:
        return <Home className="w-5 h-5 text-purple-600" />;
    }
  };

  const steps = [
    { id: 1, title: "Basic Info", icon: User },
    { id: 2, title: "Locations", icon: MapPin },
    { id: 3, title: "Services", icon: Package },
    { id: 4, title: "Pricing", icon: DollarSign },
  ];

  const watchedFormData = {
    type: quotationType,
    client: {
      name: watch("client.name") || "",
      phone: watch("client.phone") || "",
      email: watch("client.email") || "",
      company: watch("client.company") || "",
      gender: watch("client.gender") || "",
    },
    locations: {
      from: watch("locations.from") || "",
      to: watch("locations.to") || "",
      movingDate: watch("locations.movingDate") || "",
    },
    services: watchedServices || [],
    pricing: {
      currency: watchedCurrency || "UGX",
      discount: watchedDiscount || 0,
      taxRate: watchedTaxRate || 0,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
    },
    notes: watch("notes") || "",
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Main Content - Flex Layout with Form and Preview */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form Section */}
        <div className="flex-1 lg:w-1/2 space-y-4 lg:space-y-6">
          {/* Draft Status with Cloud Sync */}
          <DraftSyncIndicator
            syncStatus={syncStatus}
            lastSaved={lastSaved}
            isSaving={isSaving}
            lastSyncError={lastSyncError}
            isCloudSyncEnabled={isCloudSyncEnabled}
            hasDraft={hasDraft}
            onClearDraft={clearDraft}
            onSyncDraft={syncDraft}
          />

          {/* Progress Steps */}
          <div className="bg-gray-50 rounded-lg p-3 lg:p-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-aces-green text-white"
                          : isCompleted
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs lg:text-sm font-medium hidden lg:inline">{step.title}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-4 lg:w-8 h-0.5 mx-1 lg:mx-2 ${isCompleted ? "bg-green-300" : "bg-gray-300"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 lg:space-y-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="w-5 h-5 text-aces-green" />
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>

                {/* Quotation Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Quotation Type *</label>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {["Residential", "Office", "International"].map((type) => (
                      <label key={type} className="relative">
                        <input
                          type="radio"
                          value={type}
                          {...register("type", { required: "Quotation type is required" })}
                          className="peer sr-only"
                        />
                        <div className="p-3 lg:p-4 border border-gray-300 rounded-lg cursor-pointer peer-checked:border-aces-green peer-checked:bg-aces-green/5 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            {getQuotationTypeIcon(type)}
                            <div>
                              <div className="font-medium text-gray-900">{type}</div>
                              <div className="text-xs lg:text-sm text-gray-500">
                                {type === "Residential" && "Home and apartment moves"}
                                {type === "Office" && "Business and office relocations"}
                                {type === "International" && "Cross-border moving services"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
                </div>

                {/* Client Information */}
                <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Client Information</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
                      <input
                        type="text"
                        {...register("client.name", { required: "Client name is required" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                        placeholder="John Doe"
                      />
                      {errors.client?.name && <p className="text-red-500 text-sm mt-1">{errors.client.name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        {...register("client.phone", { required: "Phone number is required" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                        placeholder="+256 700 000 000"
                      />
                      {errors.client?.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.client.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        {...register("client.email")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        {...register("client.gender")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                      >
                        <option value="">Not selected</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    {quotationType === "Office" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                        <input
                          type="text"
                          {...register("client.company")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                          placeholder="ABC Company Ltd."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Locations */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MapPin className="w-5 h-5 text-aces-green" />
                  <h3 className="text-lg font-semibold text-gray-900">Location Details</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Location *</label>
                    <textarea
                      {...register("locations.from", { required: "From location is required" })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                      placeholder="Enter pickup address..."
                    />
                    {errors.locations?.from && (
                      <p className="text-red-500 text-sm mt-1">{errors.locations.from.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Location *</label>
                    <textarea
                      {...register("locations.to", { required: "To location is required" })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                      placeholder="Enter delivery address..."
                    />
                    {errors.locations?.to && <p className="text-red-500 text-sm mt-1">{errors.locations.to.message}</p>}
                  </div>
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
                    <p className="text-red-500 text-sm mt-1">{errors.locations.movingDate.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Services */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Package className="w-5 h-5 text-aces-green" />
                  <h3 className="text-lg font-semibold text-gray-900">Services</h3>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const isExpanded = expandedServices.has(index);
                    const hasContent = watchedServices?.[index]?.name || watchedServices?.[index]?.unitPrice > 0;

                    return (
                      <div key={field.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        {/* Service Header - Always visible */}
                        <div
                          className="p-4 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                          onClick={() => toggleServiceExpanded(index)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              <span className="font-medium text-gray-900">
                                {watchedServices?.[index]?.name || `Service ${index + 1}`}
                                {hasContent && !isExpanded && !watchedServices?.[index]?.name && (
                                  <span className="text-sm text-gray-500 ml-2">
                                    ({(watchedServices?.[index]?.description || "").substring(0, 30)}
                                    {(watchedServices?.[index]?.description || "").length > 30 ? "..." : ""})
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {hasContent && (
                              <span className="text-sm font-medium text-aces-green">
                                {formatCurrency(
                                  (watchedServices?.[index]?.quantity || 0) * (watchedServices?.[index]?.unitPrice || 0)
                                )}
                              </span>
                            )}
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  remove(index);
                                  // Update expanded services when removing
                                  const newExpanded = new Set(expandedServices);
                                  newExpanded.delete(index);
                                  // Adjust indices for remaining services
                                  const adjustedExpanded = new Set<number>();
                                  newExpanded.forEach((i) => {
                                    if (i < index) {
                                      adjustedExpanded.add(i);
                                    } else if (i > index) {
                                      adjustedExpanded.add(i - 1);
                                    }
                                  });
                                  setExpandedServices(adjustedExpanded);
                                }}
                                className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Service Form - Expandable */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-6 pb-6 border-t border-gray-200 bg-white"
                          >
                            <div className="pt-4 space-y-4">
                              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                <div className="lg:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Name *</label>
                                  <input
                                    type="text"
                                    {...register(`services.${index}.name`, {
                                      required: "Service name is required",
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                                    placeholder="e.g., Packaging, Loading, Transportation"
                                  />
                                  {errors.services?.[index]?.name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.services[index]?.name?.message}</p>
                                  )}
                                </div>

                                <div className="lg:col-span-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                                  <input
                                    type="number"
                                    min="1"
                                    {...register(`services.${index}.quantity`, {
                                      required: "Quantity is required",
                                      min: { value: 1, message: "Quantity must be at least 1" },
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                                  />
                                  {errors.services?.[index]?.quantity && (
                                    <p className="text-red-500 text-sm mt-1">
                                      {errors.services[index]?.quantity?.message}
                                    </p>
                                  )}
                                </div>

                                <div className="lg:col-span-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Unit Price ({watchedCurrency}) *
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    {...register(`services.${index}.unitPrice`, {
                                      required: "Unit price is required",
                                      min: { value: 0, message: "Price must be positive" },
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                                  />
                                  {errors.services?.[index]?.unitPrice && (
                                    <p className="text-red-500 text-sm mt-1">
                                      {errors.services[index]?.unitPrice?.message}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                <textarea
                                  {...register(`services.${index}.description`, {
                                    required: "Service description is required",
                                    minLength: { value: 1, message: "Description must have at least 1 character" },
                                    maxLength: { value: 500, message: "Description cannot exceed 500 characters" },
                                  })}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                                  placeholder="Additional details about this service..."
                                />
                                {errors.services?.[index]?.description && (
                                  <p className="text-red-500 text-sm mt-1">
                                    {errors.services[index]?.description?.message}
                                  </p>
                                )}
                              </div>

                              {/* Service Total */}
                              <div className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-600">Service Total:</span>
                                  <span className="text-lg font-semibold text-aces-green">
                                    {formatCurrency(
                                      (watchedServices[index]?.quantity || 0) * (watchedServices[index]?.unitPrice || 0)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Service Button - Now at the bottom */}
                  <Button
                    type="button"
                    onClick={addService}
                    variant="secondary"
                    className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 hover:border-aces-green hover:bg-aces-green/5 transition-colors"
                  >
                    <span>Add Another Service</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Pricing */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <DollarSign className="w-5 h-5 text-aces-green" />
                  <h3 className="text-lg font-semibold text-gray-900">Pricing & Summary</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pricing Settings */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        {...register("pricing.discount")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        {...register("pricing.taxRate")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                        placeholder="18"
                      />
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calculator className="w-5 h-5 mr-2" />
                      Pricing Summary
                    </h4>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                      </div>

                      {watchedDiscount && watchedDiscount > 0 && (
                        <div className="flex justify-between items-center py-2 text-red-600">
                          <span>Discount ({watchedDiscount}%)</span>
                          <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Taxable Amount</span>
                        <span className="font-medium">{formatCurrency(taxableAmount)}</span>
                      </div>

                      {watchedTaxRate && watchedTaxRate > 0 && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Tax ({watchedTaxRate}%)</span>
                          <span className="font-medium">{formatCurrency(taxAmount)}</span>
                        </div>
                      )}

                      <div className="border-t border-gray-300 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-gray-900">Total</span>
                          <span className="text-xl font-bold text-aces-green">{formatCurrency(totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    {...register("notes")}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                    placeholder="Additional notes or comments..."
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between pt-6 border-t border-gray-200 space-y-4 lg:space-y-0">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center space-y-3 lg:space-y-0 lg:space-x-3">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    variant="secondary"
                    disabled={isLoading}
                    className="w-full lg:w-auto"
                  >
                    Previous
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={onCancel}
                  variant="secondary"
                  disabled={isLoading}
                  className="flex items-center w-full lg:w-auto justify-center"
                >
                  <span>Cancel</span>
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentStep(currentStep + 1);
                    }}
                    variant="primary"
                    disabled={isLoading}
                    className="w-full lg:w-auto"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    variant="primary"
                    className="flex items-center space-x-2 w-full lg:w-auto justify-center"
                  >
                    <span>{isLoading ? "Creating..." : "Create Quotation"}</span>
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div className="w-full lg:w-1/2 lg:sticky lg:top-6 lg:self-start">
          <QuotationPreview data={watchedFormData} />
        </div>
      </div>
    </div>
  );
};

export default QuotationCreateForm;
