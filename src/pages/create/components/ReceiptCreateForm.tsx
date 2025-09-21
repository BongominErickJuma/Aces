import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  Calculator,
  AlertCircle,
  Package,
  FileText,
  CheckCircle,
  CreditCard,
  User,
  MapPin,
  ExternalLink,
  Notebook,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { receiptsAPI, type CreateReceiptData } from "../../../services/receipts";
import { quotationsAPI, type Quotation } from "../../../services/quotations";
import { Button } from "../../../components/ui/Button";
import ReceiptPreview from "./ReceiptPreview";

interface ReceiptCreateFormProps {
  onCancel: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  fromQuotationId?: string | null;
}

interface FormData extends CreateReceiptData {
  moveType?: "international" | "residential" | "office";
  commitmentFeePaid?: number;
  totalMovingAmount?: number;
  finalPaymentReceived?: number;
  grandTotal?: number;
  amountReceived?: number; // For box receipts
}

const ReceiptCreateForm: React.FC<ReceiptCreateFormProps> = ({
  onCancel,
  isLoading,
  setIsLoading,
  fromQuotationId,
}) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  // Removed unused state variables
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set([0]));

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      receiptType: "box",
      moveType: "residential",
      client: {
        name: "",
        phone: "",
        email: "",
        address: "",
      },
      locations: {
        from: "",
        to: "",
        movingDate: new Date().toISOString().split("T")[0],
      },
      services: [
        {
          description: "Standard service",
          amount: 0,
          quantity: 1,
          total: 0,
        },
      ],
      payment: {
        currency: "UGX",
        method: "mobile_money",
      },
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "services",
  });

  const watchedServices = watch("services");
  const watchedCurrency = watch("payment.currency");
  const receiptType = watch("receiptType");

  // Load quotation data if coming from quotation
  useEffect(() => {
    const loadQuotationData = async (quotationId: string) => {
      try {
        setIsLoading(true);
        const response = await quotationsAPI.getQuotationById(quotationId);
        const quotation = response.data.quotation;

        // Pre-fill form with quotation data
        setValue("quotationId", quotationId);
        setValue("receiptType", "commitment"); // Default when creating from quotation
        setValue("client.name", quotation.client.name);
        setValue("client.phone", quotation.client.phone);
        setValue("client.email", quotation.client.email || "");
        setValue("client.address", quotation.client.company || "");
        setValue("locations.from", quotation.locations.from);
        setValue("locations.to", quotation.locations.to);
        setValue("locations.movingDate", quotation.locations.movingDate.split("T")[0]);
        setValue("payment.currency", quotation.pricing.currency);

        // Convert quotation services to receipt services
        const receiptServices = quotation.services.map((service) => ({
          description: `${service.name} - ${service.description}`.trim().replace(/^- /, ""),
          quantity: service.quantity,
          amount: service.unitPrice,
          total: service.quantity * service.unitPrice,
        }));

        setValue("services", receiptServices);
        setSelectedQuotation(quotation);
      } catch {
        setError("Failed to load quotation data");
      } finally {
        setIsLoading(false);
      }
    };

    if (fromQuotationId) {
      loadQuotationData(fromQuotationId);
    }
  }, [fromQuotationId, setIsLoading, setValue]);

  // Calculate totals
  const totalAmount =
    watchedServices?.reduce((sum, service) => {
      const quantity = Number(service.quantity) || 0;
      const amount = Number(service.amount) || 0;
      return sum + quantity * amount;
    }, 0) || 0;

  const onSubmit = async (data: FormData) => {
    // Prevent submission if not on the final step
    if (currentStep !== 4) {
      console.warn("Form submitted but not on step 4, current step:", currentStep);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const baseReceiptData: CreateReceiptData = {
        receiptType: data.receiptType,
        moveType: data.receiptType !== "box" ? data.moveType : undefined,
        quotationId: data.quotationId || undefined,
        client: {
          name: data.client.name,
          phone: data.client.phone,
          email: data.client.email || undefined,
          address: data.client.address || undefined,
        },
        locations:
          data.locations && (data.locations.from || data.locations.to || data.locations.movingDate)
            ? {
                from: data.locations.from || undefined,
                to: data.locations.to || undefined,
                movingDate: data.locations.movingDate || undefined,
              }
            : undefined,
        payment: {
          currency: data.payment.currency,
          method: data.payment.method || undefined,
          dueDate: data.payment.dueDate || undefined,
        },
        services: [], // Will be filled below based on receipt type
        notes: data.notes || undefined,
      };

      // Handle different receipt types
      let receiptData: CreateReceiptData & {
        commitmentFeePaid?: number;
        totalMovingAmount?: number;
        finalPaymentReceived?: number;
        totalAmountForMoving?: number;
      };

      if (data.receiptType === "commitment") {
        // Add commitment-specific fields
        receiptData = {
          ...baseReceiptData,
          services: [], // Backend will generate the 3 service items automatically
          commitmentFeePaid: Number(data.commitmentFeePaid) || 0,
          totalMovingAmount: Number(data.totalMovingAmount) || 0,
        };
      } else if (data.receiptType === "final") {
        // Add final receipt-specific fields
        receiptData = {
          ...baseReceiptData,
          services: [], // No services for final receipts
          commitmentFeePaid: Number(data.commitmentFeePaid) || 0,
          finalPaymentReceived: Number(data.finalPaymentReceived) || 0,
        };
      } else if (data.receiptType === "one_time") {
        // Add one time payment-specific fields
        receiptData = {
          ...baseReceiptData,
          services: [], // No services for one time payments
          totalMovingAmount: Number(data.totalMovingAmount) || 0,
        };
      } else {
        // Box receipts - Include services
        const services = (data.services || []).map((service) => ({
          description: service.description,
          quantity: Number(service.quantity),
          amount: Number(service.amount),
          total: Number(service.quantity) * Number(service.amount),
        }));
        receiptData = {
          ...baseReceiptData,
          services,
        };
      }

      const response = await receiptsAPI.createReceipt(receiptData as CreateReceiptData);

      // For box receipts, add initial payment if amountReceived is provided
      if (data.receiptType === "box" && data.amountReceived && Number(data.amountReceived) > 0) {
        try {
          const paymentData = {
            amount: Number(data.amountReceived),
            method: data.payment.method || "cash",
            reference: "",
            notes: "Initial payment received during receipt creation",
          };

          await receiptsAPI.addPayment(response.data.receipt._id, paymentData);
        } catch (paymentError) {
          console.error("Failed to add initial payment:", paymentError);
          // Don't fail the entire receipt creation if payment fails
          // The user can add the payment later via PaymentManager
        }
      }

      // Navigate to receipts list after successful creation
      navigate("/receipts", {
        state: { message: `Receipt ${response.data.receipt.receiptNumber} created successfully` },
      });
    } catch (err) {
      console.error("Receipt creation error:", err);

      // Better error messages
      let errorMessage = "Failed to create receipt";
      if (err instanceof Error) {
        errorMessage = err.message;

        // Type guard for axios-like error structure
        const axiosError = err as { response?: { data?: { message?: string; error?: { details?: unknown } } } };

        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.data?.error?.details) {
          const details = axiosError.response.data.error.details;
          if (Array.isArray(details)) {
            errorMessage = details.map((d: { msg?: string; message?: string }) => d.msg || d.message).join(", ");
          } else if (typeof details === "object" && details !== null) {
            const detailsObj = details as { reason?: string; message?: string };
            errorMessage = detailsObj.reason || detailsObj.message || errorMessage;
          }
        }
        console.error("Error response:", axiosError.response?.data);
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const addService = () => {
    const newIndex = fields.length;
    append({
      description: "Service description",
      quantity: 1,
      amount: 0,
      total: 0,
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
    if (currency === 'UGX') {
      // Custom formatting for UGX to show "UGX XXXXX" format
      const number = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
      return `UGX ${number}`;
    } else {
      // Use standard formatting for other currencies
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'USD' ? 2 : 0
      });
      return formatter.format(amount);
    }
  };

  const steps = [
    { id: 1, title: "Receipt Type", icon: FileText },
    { id: 2, title: "Client Info", icon: User },
    {
      id: 3,
      title:
        receiptType === "commitment"
          ? "Commitment"
          : receiptType === "final"
          ? "Final Payment"
          : receiptType === "one_time"
          ? "Payment"
          : "Services",
      icon: Package,
    },
    { id: 4, title: "Review", icon: CreditCard },
  ];

  const watchedFormData = {
    receiptType,
    moveType: watch("moveType"),
    client: {
      name: watch("client.name") || "",
      phone: watch("client.phone") || "",
      email: watch("client.email") || "",
      address: watch("client.address") || "",
    },
    locations:
      receiptType !== "box"
        ? {
            from: watch("locations.from") || "",
            to: watch("locations.to") || "",
            movingDate: watch("locations.movingDate") || "",
          }
        : undefined,
    services: receiptType === "box" ? watchedServices || [] : undefined,
    payment: {
      currency: watchedCurrency || "UGX",
      method: watch("payment.method") || undefined,
      dueDate: watch("payment.dueDate") || undefined,
    },
    notes: watch("notes") || "",
    commitmentFeePaid: watch("commitmentFeePaid") ? Number(watch("commitmentFeePaid")) : undefined,
    totalMovingAmount: watch("totalMovingAmount") ? Number(watch("totalMovingAmount")) : undefined,
    finalPaymentReceived: watch("finalPaymentReceived") ? Number(watch("finalPaymentReceived")) : undefined,
    amountReceived: watch("amountReceived") ? Number(watch("amountReceived")) : undefined,
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

      {/* Quotation Reference */}
      {selectedQuotation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-blue-700 font-medium">
                  Creating receipt from quotation: {selectedQuotation.quotationNumber}
                </p>
                <p className="text-blue-600 text-sm">
                  Client: {selectedQuotation.client.name} • Total:{" "}
                  {formatCurrency(selectedQuotation.pricing.totalAmount)}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-blue-500" />
          </div>
        </motion.div>
      )}

      {/* Main Content - Flex Layout with Form and Preview */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form Section */}
        <div className="flex-1 lg:w-1/2 space-y-4 lg:space-y-6">
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
            {/* Step 1: Receipt Type Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="w-5 h-5 text-aces-green" />
                  <h3 className="text-lg font-semibold text-gray-900">Receipt Type</h3>
                </div>

                {/* Receipt Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Receipt Type *</label>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {[
                      { value: "box", label: "Box Receipt", description: "Standard moving box receipt" },
                      { value: "commitment", label: "Commitment", description: "Commitment fee receipt" },
                      { value: "final", label: "Final", description: "Final payment receipt" },
                      { value: "one_time", label: "One Time", description: "Single payment receipt" },
                    ].map((type) => (
                      <label key={type.value} className="relative">
                        <input
                          type="radio"
                          value={type.value}
                          {...register("receiptType", { required: "Receipt type is required" })}
                          className="peer sr-only"
                        />
                        <div className="p-4 border border-gray-300 rounded-lg cursor-pointer peer-checked:border-aces-green peer-checked:bg-aces-green/5 hover:bg-gray-50 transition-colors">
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.receiptType && <p className="text-red-500 text-sm mt-1">{errors.receiptType.message}</p>}
                </div>

                {/* Move Type Selection - Only shown for non-box receipts */}
                {receiptType !== "box" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Move Type *</label>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {[
                        { value: "residential", label: "Residential Move", description: "Moving homes and apartments" },
                        { value: "office", label: "Office Move", description: "Commercial and office relocations" },
                        {
                          value: "international",
                          label: "International Move",
                          description: "Cross-border relocations",
                        },
                      ].map((type) => (
                        <label key={type.value} className="relative">
                          <input
                            type="radio"
                            value={type.value}
                            {...register("moveType", {
                              required: "Move type is required for this receipt type",
                            })}
                            className="peer sr-only"
                          />
                          <div className="p-4 border border-gray-300 rounded-lg cursor-pointer peer-checked:border-aces-green peer-checked:bg-aces-green/5 hover:bg-gray-50 transition-colors">
                            <div className="font-medium text-gray-900">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.moveType && <p className="text-red-500 text-sm mt-1">{errors.moveType.message}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Client Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="w-5 h-5 text-aces-green" />
                  <h3 className="text-lg font-semibold text-gray-900">Client Information</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    {errors.client?.phone && <p className="text-red-500 text-sm mt-1">{errors.client.phone.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      {...register("client.address")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                      placeholder="Client address"
                    />
                  </div>
                </div>

                {/* Location Information - Only shown for commitment, final, and one_time receipts */}
                {receiptType !== "box" && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Location Details
                    </h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Location *</label>
                        <textarea
                          {...register("locations.from", {
                            required: "From location is required",
                          })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                          placeholder="Pickup location"
                        />
                        {errors.locations?.from && (
                          <p className="text-red-500 text-sm mt-1">{errors.locations.from.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Location *</label>
                        <textarea
                          {...register("locations.to", {
                            required: "To location is required",
                          })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                          placeholder="Delivery location"
                        />
                        {errors.locations?.to && (
                          <p className="text-red-500 text-sm mt-1">{errors.locations.to.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Moving Date *</label>
                      <input
                        type="date"
                        {...register("locations.movingDate", {
                          required: "Moving date is required",
                        })}
                        defaultValue={new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                      />
                      {errors.locations?.movingDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.locations.movingDate.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Services */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Package className="w-5 h-5 text-aces-green" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {receiptType === "commitment"
                      ? "Commitment Receipt Details"
                      : receiptType === "final"
                      ? "Final Receipt Details"
                      : receiptType === "one_time"
                      ? "One Time Payment Details"
                      : "Services"}
                  </h3>
                </div>

                {/* Receipt Type Specific Fields */}
                {receiptType === "commitment" ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Commitment Fee Information</h4>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Commitment Fee Paid ({watchedCurrency}) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register("commitmentFeePaid", {
                              required: "Commitment fee is required",
                              min: { value: 0, message: "Amount must be positive" },
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                            placeholder="Enter commitment fee paid"
                          />
                          {errors.commitmentFeePaid && (
                            <p className="text-red-500 text-sm mt-1">{errors.commitmentFeePaid.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Amount For Moving ({watchedCurrency}) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register("totalMovingAmount", {
                              required: "Total moving amount is required",
                              min: { value: 0, message: "Amount must be positive" },
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                            placeholder="Enter total moving amount"
                          />
                          {errors.totalMovingAmount && (
                            <p className="text-red-500 text-sm mt-1">{errors.totalMovingAmount.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Balance Due (calculated) */}
                      <div className="mt-6 p-4 bg-white rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-medium text-gray-700">Balance Due:</span>
                          <span className="text-xl font-bold text-aces-green">
                            {formatCurrency(
                              Number(watch("totalMovingAmount") || 0) - Number(watch("commitmentFeePaid") || 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Summary Table for Commitment Receipt */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Receipt Summary</h4>
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
                              {formatCurrency(watch("commitmentFeePaid") || 0)}
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 text-sm text-gray-600">Total Amount For Moving</td>
                            <td className="py-2 text-sm text-right font-semibold">
                              {formatCurrency(watch("totalMovingAmount") || 0)}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-sm text-gray-600 font-medium">Balance Due</td>
                            <td className="py-2 text-sm text-right font-bold text-red-600">
                              {formatCurrency(
                                Number(watch("totalMovingAmount") || 0) - Number(watch("commitmentFeePaid") || 0)
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : receiptType === "final" ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Final Payment Information</h4>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Commitment Fee Paid (Previously) ({watchedCurrency}) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register("commitmentFeePaid", {
                              required: "Commitment fee amount is required",
                              min: { value: 0, message: "Amount must be positive" },
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                            placeholder="Enter commitment fee paid previously"
                          />
                          {errors.commitmentFeePaid && (
                            <p className="text-red-500 text-sm mt-1">{errors.commitmentFeePaid.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Final Payment Received ({watchedCurrency}) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register("finalPaymentReceived", {
                              required: "Final payment amount is required",
                              min: { value: 0, message: "Amount must be positive" },
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                            placeholder="Enter final payment received"
                          />
                          {errors.finalPaymentReceived && (
                            <p className="text-red-500 text-sm mt-1">{errors.finalPaymentReceived.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Grand Total (calculated) */}
                      <div className="mt-6 p-4 bg-white rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-medium text-gray-700">Grand Total:</span>
                          <span className="text-xl font-bold text-aces-green">
                            {formatCurrency(
                              Number(watch("commitmentFeePaid") || 0) + Number(watch("finalPaymentReceived") || 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Summary Table for Final Receipt */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Receipt Summary</h4>
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
                              {formatCurrency(watch("commitmentFeePaid") || 0)}
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 text-sm text-gray-600">Final Payment Received</td>
                            <td className="py-2 text-sm text-right font-semibold text-green-600">
                              {formatCurrency(watch("finalPaymentReceived") || 0)}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-sm text-gray-600 font-medium">Grand Total</td>
                            <td className="py-2 text-sm text-right font-bold text-aces-green">
                              {formatCurrency(
                                Number(watch("commitmentFeePaid") || 0) + Number(watch("finalPaymentReceived") || 0)
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : receiptType === "one_time" ? (
                  <div className="space-y-4">
                    <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">One Time Payment Information</h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Amount For Moving ({watchedCurrency}) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          {...register("totalMovingAmount", {
                            required: "Total moving amount is required",
                            min: { value: 0, message: "Amount must be positive" },
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                          placeholder="Enter total amount for moving"
                        />
                        {errors.totalMovingAmount && (
                          <p className="text-red-500 text-sm mt-1">{errors.totalMovingAmount.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Summary Table for One Time Payment Receipt */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Receipt Summary</h4>
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
                            <td className="py-2 text-sm text-right font-bold text-aces-green">
                              {formatCurrency(Number(watch("totalMovingAmount") || 0))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Services for Box receipts only */
                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const isExpanded = expandedServices.has(index);
                      const hasContent =
                        watchedServices?.[index]?.description || 0 || (watchedServices?.[index]?.amount || 0) > 0;

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
                                  Service {index + 1}
                                  {hasContent && !isExpanded && (
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
                                    (watchedServices?.[index]?.quantity || 0) * (watchedServices?.[index]?.amount || 0)
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
                                {/* Quantity and Amount on the same row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  <div>
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

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Amount ({watchedCurrency}) *
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      {...register(`services.${index}.amount`, {
                                        required: "Amount is required",
                                        min: { value: 0, message: "Amount must be positive" },
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                                    />
                                    {errors.services?.[index]?.amount && (
                                      <p className="text-red-500 text-sm mt-1">
                                        {errors.services[index]?.amount?.message}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Service Description - Full width below */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Service Description *
                                  </label>
                                  <textarea
                                    {...register(`services.${index}.description`, {
                                      required: "Service description is required",
                                      minLength: { value: 1, message: "Description must have at least 1 character" },
                                      maxLength: { value: 500, message: "Description cannot exceed 500 characters" },
                                    })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                                    placeholder="Describe the service provided..."
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
                                    <span className="text-sm font-medium text-gray-600">Line Total:</span>
                                    <span className="text-lg font-semibold text-aces-green">
                                      {formatCurrency(
                                        (watchedServices?.[index]?.quantity || 0) *
                                          (watchedServices?.[index]?.amount || 0)
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

                    {/* Total Summary for regular receipts */}
                    <div className="bg-aces-green/5 rounded-lg p-6 border border-aces-green/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calculator className="w-5 h-5 text-aces-green" />
                          <span className="text-xl font-bold text-gray-900">Total Amount:</span>
                        </div>
                        <span className="text-2xl font-bold text-aces-green">{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Payment & Signatures */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Notebook className="w-5 h-5 text-aces-green" />
                  <h3 className="text-lg font-semibold text-gray-900">Review & Notes</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <select
                      {...register("payment.method")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                    >
                      <option value="mobile_money">Mobile Money</option>
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>

                  {/* Amount Received - Only for box receipts */}
                  {receiptType === "box" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount Received ({watchedCurrency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalAmount}
                        step="0.01"
                        {...register("amountReceived", {
                          min: { value: 0, message: "Amount must be positive" },
                          max: { value: totalAmount, message: `Amount cannot exceed total of ${formatCurrency(totalAmount)}` },
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                        placeholder="Enter amount received from client"
                      />
                      {errors.amountReceived && (
                        <p className="text-red-500 text-sm mt-1">{errors.amountReceived.message}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Leave blank if no payment received yet. You can add payments later.
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                    placeholder="Any additional notes or comments..."
                  />
                </div>

                {/* Final Summary */}
                <div className="bg-aces-green/5 rounded-lg p-6 border border-aces-green/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Receipt Summary</h4>
                    <CheckCircle className="w-6 h-6 text-aces-green" />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Receipt Type:</span>
                      <span className="font-medium capitalize">{receiptType}</span>
                    </div>
                    {receiptType === "box" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Services:</span>
                          <span className="font-medium">{fields.length} item(s)</span>
                        </div>
                        {watch("amountReceived") && Number(watch("amountReceived")) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Amount Received:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(Number(watch("amountReceived")))}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                      <span className="text-xl font-bold text-aces-green">
                        {receiptType === "commitment" &&
                          formatCurrency(
                            Number(watch("totalMovingAmount") || 0) - Number(watch("commitmentFeePaid") || 0)
                          )}
                        {receiptType === "final" &&
                          formatCurrency(
                            Number(watch("commitmentFeePaid") || 0) + Number(watch("finalPaymentReceived") || 0)
                          )}
                        {receiptType === "one_time" && formatCurrency(Number(watch("totalMovingAmount") || 0))}
                        {receiptType === "box" && formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
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
                  className="flex items-center space-x-1 w-full lg:w-auto justify-center"
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
                    <span>{isLoading ? "Creating..." : "Create Receipt"}</span>
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div className="flex-1 lg:w-1/2 lg:sticky lg:top-6 lg:self-start">
          <ReceiptPreview data={watchedFormData} />
        </div>
      </div>
    </div>
  );
};

export default ReceiptCreateForm;
