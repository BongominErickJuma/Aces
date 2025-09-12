import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Save,
  X,
  Plus,
  Trash2,
  Calculator,
  AlertCircle,
  Package,
  FileText,
  CheckCircle,
  CreditCard,
  Calendar,
  User,
  MapPin,
  DollarSign,
  Search,
  ExternalLink,
} from "lucide-react";
import { receiptsAPI, type CreateReceiptData, type Receipt } from "../../../services/receipts";
import { quotationsAPI, type Quotation } from "../../../services/quotations";
import { Button } from "../../../components/ui/Button";

interface ReceiptCreateFormProps {
  onSuccess: (receipt: Receipt) => void;
  onCancel: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  fromQuotationId?: string | null;
}

interface FormData extends CreateReceiptData {}

const ReceiptCreateForm: React.FC<ReceiptCreateFormProps> = ({
  onSuccess,
  onCancel,
  isLoading,
  setIsLoading,
  fromQuotationId,
}) => {
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
        movingDate: "",
      },
      services: [
        {
          description: "",
          amount: 0,
          quantity: 1,
        },
      ],
      payment: {
        currency: "UGX",
        method: "cash",
        dueDate: "",
      },
      signatures: {
        receivedBy: "",
        receivedByTitle: "",
        clientName: "",
        signatureDate: new Date().toISOString().split("T")[0],
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
  const selectedQuotationId = watch("quotationId");

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
      setValue("receiptType", quotation.type === "International" ? "international" : "box");
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
    try {
      setIsLoading(true);
      setError(null);

      const receiptData = {
        ...data,
        totalAmount,
      };

      const response = await receiptsAPI.createReceipt(receiptData);
      onSuccess(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create receipt");
    } finally {
      setIsLoading(false);
    }
  };

  const addService = () => {
    append({
      description: "",
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

            {/* Create from Quotation Option */}
            {!fromQuotationId && (
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-semibold text-blue-900">Create from Quotation</h4>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowQuotationSelect(!showQuotationSelect);
                      if (!showQuotationSelect) loadAvailableQuotations();
                    }}
                    variant="secondary"
                    size="sm"
                    disabled={loadingQuotations}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {showQuotationSelect ? "Hide" : "Browse"} Quotations
                  </Button>
                </div>

                {showQuotationSelect && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    {loadingQuotations ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-blue-600 mt-2">Loading quotations...</p>
                      </div>
                    ) : quotations.length > 0 ? (
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {quotations.map((quotation) => (
                          <button
                            key={quotation._id}
                            type="button"
                            onClick={() => loadQuotationData(quotation._id)}
                            className="w-full text-left p-3 bg-white rounded border hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-gray-900">{quotation.quotationNumber}</div>
                                <div className="text-sm text-gray-600">
                                  {quotation.client.name} • {quotation.type}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-aces-green">
                                  {formatCurrency(quotation.pricing.totalAmount)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(quotation.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-blue-600 text-sm">No active quotations found.</p>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Receipt Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Receipt Type *</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: "box", label: "Box Receipt", description: "Standard moving box receipt" },
                  { value: "office", label: "Office Receipt", description: "Office moving receipt" },
                  { value: "international", label: "International", description: "International moving receipt" },
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
                <h3 className="text-lg font-semibold text-gray-900">Services</h3>
              </div>
              <Button
                type="button"
                onClick={addService}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Service</span>
              </Button>
            </div>

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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount ({watchedCurrency}) *</label>
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
            </div>

            {/* Total Summary */}
            <div className="bg-aces-green/5 rounded-lg p-6 border border-aces-green/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-aces-green" />
                  <span className="text-xl font-bold text-gray-900">Total Amount:</span>
                </div>
                <span className="text-2xl font-bold text-aces-green">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
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
              <CreditCard className="w-5 h-5 text-aces-green" />
              <h3 className="text-lg font-semibold text-gray-900">Payment & Signatures</h3>
            </div>

            {/* Payment Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Payment Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    {...register("payment.currency")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  >
                    <option value="UGX">UGX - Ugandan Shilling</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                  <select
                    {...register("payment.method", { required: "Payment method is required" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                  {errors.payment?.method && (
                    <p className="text-red-500 text-sm mt-1">{errors.payment.method.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    {...register("payment.dueDate")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Signatures</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Received By *</label>
                  <input
                    type="text"
                    {...register("signatures.receivedBy", { required: "Received by is required" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                    placeholder="Employee name"
                  />
                  {errors.signatures?.receivedBy && (
                    <p className="text-red-500 text-sm mt-1">{errors.signatures.receivedBy.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title/Position</label>
                  <input
                    type="text"
                    {...register("signatures.receivedByTitle")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                    placeholder="e.g., Manager, Sales Rep"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
                  <input
                    type="text"
                    {...register("signatures.clientName", { required: "Client signature name is required" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                    placeholder="Client's full name"
                  />
                  {errors.signatures?.clientName && (
                    <p className="text-red-500 text-sm mt-1">{errors.signatures.clientName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Signature Date *</label>
                  <input
                    type="date"
                    {...register("signatures.signatureDate", { required: "Signature date is required" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  />
                  {errors.signatures?.signatureDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.signatures.signatureDate.message}</p>
                  )}
                </div>
              </div>
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
                onClick={() => setCurrentStep(currentStep + 1)}
                variant="primary"
                disabled={isLoading}
              >
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading} variant="primary" className="flex items-center space-x-2">
                <Save className="w-4 h-4" />
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
