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
  User,
  MapPin,
} from "lucide-react";
import { receiptsAPI, type CreateReceiptData, type Receipt } from "../../../services/receipts";
import { Button } from "../../../components/ui/Button";

interface ReceiptFormProps {
  receipt?: Receipt | null;
  onSave: (receipt: Receipt) => void;
  onCancel: () => void;
}

type FormData = CreateReceiptData;

const ReceiptForm: React.FC<ReceiptFormProps> = ({ receipt, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!receipt;

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
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
  const watchedCommitmentFeePaid = watch("commitmentFeePaid");
  const watchedFinalPaymentReceived = watch("finalPaymentReceived");
  const watchedTotalMovingAmount = watch("totalMovingAmount");
  // const selectedQuotationId = watch("quotationId"); // Unused variable

  // Load existing receipt data for editing
  useEffect(() => {
    if (isEditing && receipt) {
      reset({
        receiptType: receipt.receiptType,
        moveType: receipt.moveType || "residential",
        quotationId: receipt.quotationId?._id,
        client: receipt.client,
        locations: receipt.locations
          ? {
              from: receipt.locations.from || "",
              to: receipt.locations.to || "",
              movingDate: receipt.locations.movingDate ? receipt.locations.movingDate.split("T")[0] : "",
            }
          : undefined,
        services:
          receipt.receiptType === "box"
            ? receipt.services.map((service) => ({
                description: service.description,
                amount: service.amount,
                quantity: service.quantity,
              }))
            : [],
        payment: {
          currency: receipt.payment.currency,
          method: receipt.payment.method,
          dueDate: receipt.payment.dueDate ? receipt.payment.dueDate.split("T")[0] : "",
        },
        signatures: {
          receivedBy: receipt.signatures.receivedBy || "",
          receivedByTitle: receipt.signatures.receivedByTitle || "",
          clientName: receipt.signatures.clientName || "",
          signatureDate: receipt.signatures.signatureDate
            ? receipt.signatures.signatureDate.split("T")[0]
            : new Date().toISOString().split("T")[0],
        },
        commitmentFee: receipt.commitmentFee,
        commitmentFeePaid: receipt.commitmentFeePaid,
        totalMovingAmount: receipt.totalMovingAmount,
        finalPaymentReceived: receipt.finalPaymentReceived,
        notes: receipt.notes || "",
      });
    }
  }, [receipt, isEditing, reset]);

  // Calculate totals based on receipt type
  const calculations = React.useMemo(() => {
    if (receiptType === "box") {
      // For box receipts, calculate from services
      const total =
        watchedServices?.reduce((sum, service) => {
          return sum + (service.quantity || 0) * (service.amount || 0);
        }, 0) || 0;
      return { total };
    } else if (receiptType === "commitment") {
      // For commitment receipts, use commitment fee paid
      return { total: watchedCommitmentFeePaid || 0 };
    } else if (receiptType === "final") {
      // For final receipts, use final payment received
      return { total: watchedFinalPaymentReceived || 0 };
    } else if (receiptType === "one_time") {
      // For one-time receipts, use total moving amount
      return { total: watchedTotalMovingAmount || 0 };
    }

    return { total: 0 };
  }, [watchedServices, receiptType, watchedCommitmentFeePaid, watchedFinalPaymentReceived, watchedTotalMovingAmount]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: watchedCurrency || "UGX",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const addService = () => {
    append({
      description: "",
      amount: 0,
      quantity: 1,
      total: 0,
    });
  };

  const getReceiptTypeIcon = (type: string) => {
    switch (type) {
      case "box":
        return <Package size={20} className="text-purple-600" />;
      case "commitment":
        return <FileText size={20} className="text-blue-600" />;
      case "final":
        return <CheckCircle size={20} className="text-green-600" />;
      case "one_time":
        return <CreditCard size={20} className="text-orange-600" />;
      default:
        return <FileText size={20} className="text-gray-600" />;
    }
  };

  const requiresLocations = ["commitment", "final", "one_time"].includes(receiptType);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);

      // Validate locations for certain receipt types
      if (requiresLocations && (!data.locations?.from || !data.locations?.to)) {
        setError("Pickup and destination locations are required for this receipt type");
        return;
      }

      let result;
      if (isEditing && receipt) {
        result = await receiptsAPI.updateReceipt(receipt._id, data);
      } else {
        result = await receiptsAPI.createReceipt(data);
      }

      onSave(result.data.receipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save receipt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? `Edit Receipt ${receipt?.receiptNumber}` : "Create New Receipt"}
          </h2>
          <p className="text-gray-600 mt-1">
            {isEditing ? "Update receipt details" : "Fill in the details to generate a new receipt"}
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
        {/* Receipt Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receipt Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                value: "box",
                label: "Box Receipt",
                description: "For box storage and packing services",
              },
              {
                value: "commitment",
                label: "Commitment Receipt",
                description: "Initial payment to secure moving service",
              },
              {
                value: "final",
                label: "Final Receipt",
                description: "Final payment after move completion",
              },
              {
                value: "one_time",
                label: "One-Time Payment",
                description: "Complete payment for full service",
              },
            ].map((type) => (
              <label key={type.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={type.value}
                  {...register("receiptType", { required: "Please select a receipt type" })}
                  className="sr-only"
                />
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    receiptType === type.value
                      ? "border-aces-green bg-green-50 text-aces-green"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {getReceiptTypeIcon(type.value)}
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{type.description}</p>
                </motion.div>
              </label>
            ))}
          </div>
          {errors.receiptType && <p className="text-red-600 text-sm mt-2">{errors.receiptType.message}</p>}
        </motion.div>

        {/* Move Type - Only for non-box receipts */}
        {receiptType !== "box" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Move Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: "residential", label: "Residential Move", description: "Moving homes and apartments" },
                { value: "office", label: "Office Move", description: "Commercial and office relocations" },
                { value: "international", label: "International Move", description: "Cross-border relocations" },
              ].map((type) => (
                <label key={type.value} className="cursor-pointer">
                  <input
                    type="radio"
                    value={type.value}
                    {...register("moveType", {
                      required: "Move type is required for this receipt type",
                    })}
                    className="sr-only"
                  />
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      watch("moveType") === type.value
                        ? "border-aces-green bg-green-50 text-aces-green"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium mb-1">{type.label}</div>
                    <p className="text-xs text-gray-600">{type.description}</p>
                  </motion.div>
                </label>
              ))}
            </div>
            {errors.moveType && <p className="text-red-600 text-sm mt-2">{errors.moveType.message}</p>}
          </motion.div>
        )}

        {/* Client Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                {...register("client.address")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="Enter client address"
              />
            </div>
          </div>
        </motion.div>

        {/* Locations (for certain receipt types) */}
        {requiresLocations && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="mr-2" size={20} />
              Move Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From (Pickup Location) *</label>
                <input
                  type="text"
                  {...register("locations.from", {
                    required: requiresLocations ? "Pickup location is required" : false,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  placeholder="Enter pickup location"
                />
                {errors.locations?.from && <p className="text-red-600 text-sm mt-1">{errors.locations.from.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To (Destination) *</label>
                <input
                  type="text"
                  {...register("locations.to", {
                    required: requiresLocations ? "Destination is required" : false,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  placeholder="Enter destination"
                />
                {errors.locations?.to && <p className="text-red-600 text-sm mt-1">{errors.locations.to.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Moving Date</label>
                <input
                  type="date"
                  {...register("locations.movingDate")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Services or Receipt-Specific Fields */}
        {receiptType === "box" ? (
          // BOX RECEIPT: Show services list
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
                    <div className="md:col-span-6">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                      <input
                        type="text"
                        {...register(`services.${index}.description`, { required: "Description is required" })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                        placeholder="Enter service description"
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

                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        {...register(`services.${index}.amount`, {
                          required: "Amount is required",
                          min: { value: 0, message: "Amount cannot be negative" },
                          valueAsNumber: true,
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                      />
                      {errors.services?.[index]?.amount && (
                        <p className="text-red-600 text-xs mt-1">{errors.services[index].amount.message}</p>
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
                      {formatCurrency(
                        (watchedServices?.[index]?.quantity || 0) * (watchedServices?.[index]?.amount || 0)
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : receiptType === "commitment" ? (
          // COMMITMENT RECEIPT: Show commitment fee and total amount fields
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commitment Fee Paid *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("commitmentFeePaid", {
                    required: "Commitment fee is required",
                    min: { value: 0, message: "Amount cannot be negative" },
                    valueAsNumber: true,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  placeholder="Enter commitment fee amount"
                />
                {errors.commitmentFeePaid && (
                  <p className="text-red-600 text-sm mt-1">{errors.commitmentFeePaid.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount For Moving *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("totalMovingAmount", {
                    required: "Total moving amount is required",
                    min: { value: 0, message: "Amount cannot be negative" },
                    valueAsNumber: true,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  placeholder="Enter total moving amount"
                />
                {errors.totalMovingAmount && (
                  <p className="text-red-600 text-sm mt-1">{errors.totalMovingAmount.message}</p>
                )}
              </div>
            </div>
          </motion.div>
        ) : receiptType === "final" ? (
          // FINAL RECEIPT: Show commitment fee paid previously and final payment
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commitment Fee Paid (Previously) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("commitmentFeePaid", {
                    required: "Commitment fee is required",
                    min: { value: 0, message: "Amount cannot be negative" },
                    valueAsNumber: true,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  placeholder="Enter previously paid commitment fee"
                />
                {errors.commitmentFeePaid && (
                  <p className="text-red-600 text-sm mt-1">{errors.commitmentFeePaid.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Final Payment Received *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("finalPaymentReceived", {
                    required: "Final payment is required",
                    min: { value: 0, message: "Amount cannot be negative" },
                    valueAsNumber: true,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  placeholder="Enter final payment amount"
                />
                {errors.finalPaymentReceived && (
                  <p className="text-red-600 text-sm mt-1">{errors.finalPaymentReceived.message}</p>
                )}
              </div>
            </div>
          </motion.div>
        ) : receiptType === "one_time" ? (
          // ONE TIME PAYMENT RECEIPT: Show total amount only
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount For Moving *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                {...register("totalMovingAmount", {
                  required: "Total moving amount is required",
                  min: { value: 0, message: "Amount cannot be negative" },
                  valueAsNumber: true,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="Enter total moving amount"
              />
              {errors.totalMovingAmount && (
                <p className="text-red-600 text-sm mt-1">{errors.totalMovingAmount.message}</p>
              )}
            </div>
          </motion.div>
        ) : null}

        {/* Payment Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calculator className="mr-2" size={20} />
            Payment Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency *</label>
              <select
                {...register("payment.currency", { required: "Currency is required" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              >
                <option value="UGX">UGX - Uganda Shillings</option>
                <option value="USD">USD - US Dollars</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                {...register("payment.method")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
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

          {/* Total Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Total Amount:</span>
              <span className="text-2xl font-bold text-aces-green">{formatCurrency(calculations.total)}</span>
            </div>
          </div>
        </motion.div>

        {/* Signatures */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="mr-2" size={20} />
            Signatures
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Received By</label>
              <input
                type="text"
                {...register("signatures.receivedBy")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="Staff member name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title/Position</label>
              <input
                type="text"
                {...register("signatures.receivedByTitle")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="e.g., Sales Manager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
              <input
                type="text"
                {...register("signatures.clientName")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="Client signature name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Signature Date</label>
              <input
                type="date"
                {...register("signatures.signatureDate")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
          <textarea
            rows={4}
            {...register("notes")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
            placeholder="Any additional notes or special instructions..."
          />
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
            {loading ? "Saving..." : isEditing ? "Update Receipt" : "Create Receipt"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReceiptForm;
