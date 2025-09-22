import React, { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { receiptsAPI, type Receipt, type AddPaymentData } from "../../../services/receipts";
import { Button } from "../../../components/ui/Button";

interface PaymentManagerProps {
  receipt: Receipt;
  onUpdate: (updatedReceipt: Receipt) => void;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({ receipt, onUpdate }) => {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<AddPaymentData>({
    amount: 0,
    method: "cash",
    reference: "",
    notes: "",
  });

  const formatCurrency = (amount: number, currency: string) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-UG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-600 bg-green-100";
      case "partial":
        return "text-yellow-600 bg-yellow-100";
      case "pending":
        return "text-gray-600 bg-gray-100";
      case "overdue":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle size={16} />;
      case "partial":
        return <Clock size={16} />;
      case "overdue":
        return <AlertTriangle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return <CreditCard size={14} className="text-blue-600" />;
      case "mobile_money":
        return <DollarSign size={14} className="text-green-600" />;
      default:
        return <DollarSign size={14} className="text-gray-600" />;
    }
  };

  const handleAddPayment = async () => {
    if (paymentData.amount <= 0) {
      setError("Payment amount must be greater than 0");
      return;
    }

    if (paymentData.amount > receipt.payment.balance) {
      setError(
        `Payment amount cannot exceed balance of ${formatCurrency(receipt.payment.balance, receipt.payment.currency)}`
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await receiptsAPI.addPayment(receipt._id, paymentData);

      // Update the receipt with new payment info
      const updatedReceipt = {
        ...receipt,
        payment: result.data.receipt.payment,
      };

      onUpdate(updatedReceipt);

      // Reset form
      setPaymentData({
        amount: 0,
        method: "cash",
        reference: "",
        notes: "",
      });
      setShowAddPayment(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add payment");
    } finally {
      setLoading(false);
    }
  };

  const remainingBalance = receipt.payment.balance;
  const paymentProgress = (receipt.payment.amountPaid / receipt.payment.totalAmount) * 100;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <DollarSign className="text-aces-green" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Payment Management</h3>
            <p className="text-sm text-gray-600 hidden sm:block">Track and manage receipt payments</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-3">
          <span
            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(
              receipt.payment.status
            )}`}
          >
            {getPaymentStatusIcon(receipt.payment.status)}
            <span className="capitalize">{receipt.payment.status}</span>
          </span>

          {receipt.payment.status !== "paid" && (
            <Button onClick={() => setShowAddPayment(!showAddPayment)} variant="primary" size="sm" className="whitespace-nowrap">
              Add Payment
            </Button>
          )}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total Amount</div>
          <div className="text-lg sm:text-xl font-bold text-gray-900">
            {formatCurrency(receipt.payment.totalAmount, receipt.payment.currency)}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Amount Paid</div>
          <div className="text-lg sm:text-xl font-bold text-green-600">
            {formatCurrency(receipt.payment.amountPaid, receipt.payment.currency)}
          </div>
        </div>

        <div className={`rounded-lg p-4 ${remainingBalance > 0 ? "bg-red-50" : "bg-green-50"}`}>
          <div className="text-sm text-gray-600 mb-1">Balance</div>
          <div className={`text-lg sm:text-xl font-bold ${remainingBalance > 0 ? "text-red-600" : "text-green-600"}`}>
            {formatCurrency(remainingBalance, receipt.payment.currency)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {receipt.payment.status === "partial" && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Payment Progress</span>
            <span>{paymentProgress.toFixed(1)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-aces-green h-3 rounded-full transition-all duration-500"
              style={{ width: `${paymentProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Payment Form */}
      {showAddPayment && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50"
        >
          <h4 className="text-md font-semibold text-gray-900 mb-4">Add New Payment</h4>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount *</label>
              <input
                type="number"
                min="0"
                max={remainingBalance}
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
              <select
                value={paymentData.method}
                onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value as "cash" | "bank_transfer" | "mobile_money" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:space-x-3">
            <Button
              onClick={() => {
                setShowAddPayment(false);
                setError(null);
              }}
              variant="secondary"
              className="order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button onClick={handleAddPayment} variant="primary" disabled={loading || paymentData.amount <= 0} className="order-1 sm:order-2">
              {loading ? "Adding..." : "Add Payment"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Payment History */}
      {receipt.payment.paymentHistory.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Payment History</h4>
          <div className="space-y-3">
            {receipt.payment.paymentHistory.map((payment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getPaymentMethodIcon(payment.method)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(payment.amount, receipt.payment.currency)}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {payment.method.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      {payment.reference && ` • ${payment.reference}`}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-sm text-gray-900">{formatDate(payment.date)}</div>
                  <div className="text-xs text-gray-600">by {payment.receivedBy.fullName}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManager;
