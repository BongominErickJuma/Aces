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
} from "lucide-react";
import { receiptsAPI, type CreateReceiptData } from "../../../services/receipts";
import { quotationsAPI, type Quotation } from "../../../services/quotations";
import { Button } from "../../../components/ui/Button";

interface ReceiptCreateFormProps {
  onCancel: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  fromQuotationId?: string | null;
}

interface FormData extends CreateReceiptData {
  commitmentFeePaid?: number;
  totalMovingAmount?: number;
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
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [showQuotationSelect, setShowQuotationSelect] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      receiptType: "box",
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
    if (fromQuotationId) {
      loadQuotationData(fromQuotationId);
    }
  }, [fromQuotationId]);

  const loadQuotationData = async (quotationId: string) => {
    try {
      setIsLoading(true);
      const quotation = await quotationsAPI.getQuotationById(quotationId);

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
        amount: service.unitPrice * service.quantity,
      }));

      setValue("services", receiptServices);
      setSelectedQuotation(quotation);
    } catch (err) {
      setError("Failed to load quotation data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableQuotations = async () => {
    try {
      setLoadingQuotations(true);
      const response = await quotationsAPI.getQuotations({
        page: 1,
        limit: 50,
        status: "active",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setQuotations(response.data.items);
    } catch (err) {
      console.error("Failed to load quotations:", err);
    } finally {
      setLoadingQuotations(false);
    }
  };

  // Calculate totals
  const totalAmount = watchedServices?.reduce((sum, service) => sum + (service.quantity * service.amount || 0), 0) || 0;

  const onSubmit = async (data: FormData) => {
    // Prevent submission if not on the final step
    if (currentStep !== 4) {
      console.warn("Form submitted but not on step 4, current step:", currentStep);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let receiptData: any = {
        receiptType: data.receiptType,
        quotationId: data.quotationId || undefined,
        client: {
          name: data.client.name,
          phone: data.client.phone,
          email: data.client.email || undefined,
          address: data.client.address || undefined,
        },
        locations:
          data.locations.from || data.locations.to || data.locations.movingDate
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
        notes: data.notes || undefined,
      };

      // Handle commitment receipts specially
      if (data.receiptType === "commitment") {
        // Add commitment-specific fields
        receiptData.commitmentFeePaid = Number(data.commitmentFeePaid) || 0;
        receiptData.totalMovingAmount = Number(data.totalMovingAmount) || 0;
        // Backend will generate the 3 service items automatically
      } else {
        // Include total field for services - backend validation requires it
        const services = data.services.map((service) => ({
          description: service.description,
          quantity: Number(service.quantity),
          amount: Number(service.amount),
          total: Number(service.quantity) * Number(service.amount),
        }));
        receiptData.services = services;
      }

      const response = await receiptsAPI.createReceipt(receiptData);
      // Navigate to receipts list after successful creation
      navigate("/receipts", {
        state: { message: `Receipt ${response.data.receipt.receiptNumber} created successfully` },
      });
    } catch (err: any) {
      console.error("Receipt creation error:", err);
      console.error("Error response:", err.response?.data);

      // Better error messages
      let errorMessage = "Failed to create receipt";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error?.details) {
        const details = err.response.data.error.details;
        errorMessage = Array.isArray(details)
          ? details.map((d: any) => d.msg || d.message).join(", ")
          : details.reason || details.message || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const addService = () => {
    append({
      description: "Service description",
      quantity: 1,
      amount: 0,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: watchedCurrency || "UGX",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const steps = [
    { id: 1, title: "Receipt Type", icon: FileText },
    { id: 2, title: "Client Info", icon: User },
    { id: 3, title: "Services", icon: Package },
    { id: 4, title: "Payment", icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
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

      {/* Progress Steps */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-aces-green text-white"
                      : isCompleted
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${isCompleted ? "bg-green-300" : "bg-gray-300"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Step 1: Receipt Type Selection */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-aces-green" />
              <h3 className="text-lg font-semibold text-gray-900">Receipt Type</h3>
            </div>

            {/* Receipt Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Receipt Type *</label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          </motion.div>
        )}

        {/* Step 2: Client Information */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-aces-green" />
              <h3 className="text-lg font-semibold text-gray-900">Client Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  {...register("client.email")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  placeholder="john@example.com"
                />
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

            {/* Location Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Location Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Location *</label>
                  <textarea
                    {...register("locations.from", { required: "From location is required" })}
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
                    {...register("locations.to", { required: "To location is required" })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                    placeholder="Delivery location"
                  />
                  {errors.locations?.to && <p className="text-red-500 text-sm mt-1">{errors.locations.to.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Moving Date *</label>
                <input
                  type="date"
                  {...register("locations.movingDate", { required: "Moving date is required" })}
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                />
                {errors.locations?.movingDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.locations.movingDate.message}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Services */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-aces-green" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {receiptType === "commitment" ? "Commitment Receipt Details" : "Services"}
                </h3>
              </div>
              {receiptType !== "commitment" && (
                <Button
                  type="button"
                  onClick={addService}
                  variant="secondary"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <span>Add Service</span>
                </Button>
              )}
            </div>

            {/* Commitment Receipt - Special Fields */}
            {receiptType === "commitment" ? (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Commitment Fee Information</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {formatCurrency((watch("totalMovingAmount") || 0) - (watch("commitmentFeePaid") || 0))}
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
                          {formatCurrency((watch("totalMovingAmount") || 0) - (watch("commitmentFeePaid") || 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Regular Services for other receipt types */
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 rounded-lg p-6 relative"
                  >
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-4 right-4 p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Description *</label>
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
                          <p className="text-red-500 text-sm mt-1">{errors.services[index]?.description?.message}</p>
                        )}
                      </div>

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
                          <p className="text-red-500 text-sm mt-1">{errors.services[index]?.quantity?.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
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
                        <p className="text-red-500 text-sm mt-1">{errors.services[index]?.amount?.message}</p>
                      )}
                    </div>

                    {/* Service Total */}
                    <div className="mt-4 p-3 bg-white rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Line Total:</span>
                        <span className="text-lg font-semibold text-aces-green">
                          {formatCurrency(
                            (watchedServices[index]?.quantity || 0) * (watchedServices[index]?.amount || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}

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
          </motion.div>
        )}

        {/* Step 4: Payment & Signatures */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Notebook className="w-5 h-5 text-aces-green" />
              <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
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
                <div className="flex justify-between">
                  <span className="text-gray-600">Services:</span>
                  <span className="font-medium">{fields.length} item(s)</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-xl font-bold text-aces-green">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                variant="secondary"
                disabled={isLoading}
              >
                Previous
              </Button>
            )}
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              disabled={isLoading}
              className="flex items-center space-x-1"
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
              >
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading} variant="primary" className="flex items-center space-x-2">
                <span>{isLoading ? "Creating..." : "Create Receipt"}</span>
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReceiptCreateForm;
