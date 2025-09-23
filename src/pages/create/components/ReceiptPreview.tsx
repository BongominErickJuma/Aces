import React from "react";
import { useAuth } from "../../../hooks/useAuth";

interface Service {
  description: string;
  amount: number;
  quantity: number;
  total?: number;
}

interface Client {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

interface Locations {
  from?: string;
  to?: string;
  movingDate?: string;
}

interface Payment {
  currency: string;
  method?: string;
  dueDate?: string;
}

interface ReceiptPreviewProps {
  data: {
    receiptType: "item" | "commitment" | "final" | "one_time";
    moveType?: "international" | "residential" | "office";
    client: Client;
    locations?: Locations;
    services?: Service[];
    payment: Payment;
    notes?: string;
    receiptNumber?: string;
    commitmentFeePaid?: number;
    totalMovingAmount?: number;
    finalPaymentReceived?: number;
    grandTotal?: number;
  };
}

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ data }) => {

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Mobile responsive wrapper */}
      <div className="lg:hidden">
        <div className="p-3 bg-gray-50 border-b border-gray-200 text-center">
          <p className="text-xs text-gray-600">Receipt Preview</p>
          <p className="text-xs text-gray-500">Tap and scroll to view full document</p>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-96">
          <div className="min-w-[600px] transform scale-75 origin-top-left">
            <ReceiptPreviewContent data={data} />
          </div>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden lg:block">
        <ReceiptPreviewContent data={data} />
      </div>
    </div>
  );
};

// Extracted preview content component
const ReceiptPreviewContent: React.FC<ReceiptPreviewProps> = ({ data }) => {
  const { user } = useAuth();

  const formatCurrencyDisplay = (amount: number) => {
    const currency = data.payment.currency || "UGX";
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

  // Get payment info from form data or defaults
  const receivedBy = user?.fullName || "Kamoga Geofrey";
  const paymentMode = data.payment.method ?
    data.payment.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) :
    "Mobile Money";

  const getReceiptNumber = () => {
    return data.receiptNumber || "PREVIEW";
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getMovingDate = () => {
    if (!data.locations?.movingDate) return "";
    return new Date(data.locations.movingDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getReceiptTitle = () => {
    switch (data.receiptType) {
      case "commitment":
        return "COMMITMENT RECEIPT";
      case "final":
        return "FINAL RECEIPT";
      case "one_time":
        return "ONE TIME PAYMENT RECEIPT";
      default:
        return "ITEM RECEIPT";
    }
  };

  const calculateTotals = () => {
    if (data.receiptType === "commitment") {
      const commitmentFee = data.commitmentFeePaid || 0;
      const totalAmount = data.totalMovingAmount || 0;
      const balance = totalAmount - commitmentFee;
      return { commitmentFee, totalAmount, balance };
    } else if (data.receiptType === "final") {
      const commitmentFee = data.commitmentFeePaid || 0;
      const finalPayment = data.finalPaymentReceived || 0;
      const grandTotal = commitmentFee + finalPayment;
      return { commitmentFee, finalPayment, grandTotal };
    } else if (data.receiptType === "one_time") {
      const totalAmount = data.totalMovingAmount || 0;
      return { totalAmount };
    } else {
      const total = data.services?.reduce((sum, service) => {
        return sum + (service.quantity * service.amount);
      }, 0) || 0;
      return { total };
    }
  };

  const totals = calculateTotals();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        {/* Header Top Section */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="mb-2">
              <div className="mb-1">
                <img
                  src="/vite.svg"
                  alt="Aces Movers Logo"
                  className="h-8 w-auto"
                />
              </div>
              <div className="text-xs text-green-600 font-medium">
                Aces Movers and Relocation Company Limited
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-blue-700 mb-2">{getReceiptTitle()}</div>
          </div>
        </div>

        {/* Header Bottom Section */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-200">
          <div className="text-xs text-gray-600 space-y-1">
            <p>Kigowa2 Kulambiro Kisasi Ring Road 83AD</p>
            <p>Kampala, Uganda.</p>
            <p className="text-blue-600">info@acesmovers.com</p>
            <p>+256 778 259191</p>
            <p>+256 725 711730</p>
            <p className="text-blue-600">acesmovers.com</p>
          </div>
          <div className="border border-gray-400 p-3 min-w-[160px]">
            <div className="flex justify-between text-xs mb-1">
              <span>Receipt No:</span>
              <span>{getReceiptNumber()}</span>
            </div>
            <div className="flex justify-between text-xs mb-1">
              <span>Date:</span>
              <span>{getCurrentDate()}</span>
            </div>
            {data.receiptType !== "item" && data.moveType && (
              <div className="flex justify-between text-xs">
                <span>Service Type:</span>
                <span className="capitalize">{data.moveType} Move</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Info Section */}
      <div className="p-6 border-b border-gray-200">
        {data.receiptType !== "item" && (
          <div className="text-sm font-medium text-gray-900 mb-3 pb-1 border-b border-gray-200">
            Client's Info
          </div>
        )}
        <div className="space-y-2 text-xs text-gray-700">
          <div className="flex">
            <span className="w-32 text-gray-600">{data.receiptType === "item" ? "Clients Name:" : "Clients Name:"}</span>
            <span>{data.client.name || 'Not specified'}</span>
          </div>
          <div className="flex">
            <span className="w-32 text-gray-600">Phone Number:</span>
            <span>{data.client.phone || 'Not specified'}</span>
          </div>
          {data.receiptType === "item" ? (
            <div className="flex">
              <span className="w-32 text-gray-600">Address:</span>
              <span>{data.client.address || ''}</span>
            </div>
          ) : (
            <>
              {data.locations?.from && (
                <div className="flex">
                  <span className="w-32 text-gray-600">Pickup Location:</span>
                  <span>{data.locations.from}</span>
                </div>
              )}
              {data.locations?.to && (
                <div className="flex">
                  <span className="w-32 text-gray-600">Destination:</span>
                  <span>{data.locations.to}</span>
                </div>
              )}
              {getMovingDate() && (
                <div className="flex">
                  <span className="w-32 text-gray-600">Moving Date:</span>
                  <span>{getMovingDate()}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Services/Details Section */}
      <div className="p-6 border-b border-gray-200">
        {data.receiptType === "item" && data.services && data.services.length > 0 ? (
          <>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-500 text-white">
                  <th className="px-3 py-2 text-left w-8">#</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.services.map((service, index) => {
                  const total = service.quantity * service.amount;
                  return (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-3 text-center">{index + 1}</td>
                      <td className="px-3 py-3">{service.description || 'Service description'}</td>
                      <td className="px-3 py-3 text-right">{service.quantity}</td>
                      <td className="px-3 py-3 text-right">{formatCurrencyDisplay(service.amount)}</td>
                      <td className="px-3 py-3 text-right">{formatCurrencyDisplay(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex justify-end items-center mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-12">
                <span className="text-sm">Total</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrencyDisplay(totals.total || 0)}
                </span>
              </div>
            </div>
          </>
        ) : data.receiptType === "commitment" ? (
          <div className="space-y-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-500 text-white">
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="px-3 py-3">Commitment Fee Paid</td>
                  <td className="px-3 py-3 text-right text-green-600 font-semibold">
                    {formatCurrencyDisplay(totals.commitmentFee || 0)}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-3">Total Amount For Moving</td>
                  <td className="px-3 py-3 text-right font-semibold">
                    {formatCurrencyDisplay(totals.totalAmount || 0)}
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-3 font-medium">Balance Due</td>
                  <td className="px-3 py-3 text-right font-bold text-red-600">
                    {formatCurrencyDisplay(totals.balance || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : data.receiptType === "final" ? (
          <div className="space-y-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-500 text-white">
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="px-3 py-3">Commitment Fee Paid (Previously)</td>
                  <td className="px-3 py-3 text-right font-semibold">
                    {formatCurrencyDisplay(totals.commitmentFee || 0)}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-3">Final Payment Received</td>
                  <td className="px-3 py-3 text-right text-green-600 font-semibold">
                    {formatCurrencyDisplay(totals.finalPayment || 0)}
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-3 font-medium">Grand Total</td>
                  <td className="px-3 py-3 text-right font-bold text-green-600">
                    {formatCurrencyDisplay(totals.grandTotal || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : data.receiptType === "one_time" ? (
          <div className="space-y-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-500 text-white">
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="px-3 py-3 font-medium">Total Amount For Moving</td>
                  <td className="px-3 py-3 text-right font-bold text-green-600">
                    {formatCurrencyDisplay(totals.totalAmount || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* Payment Info Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="space-y-2 text-xs">
          <div className="flex">
            <span className="w-32 text-gray-600">Payment Mode:</span>
            <span>{paymentMode}</span>
          </div>
          <div className="flex">
            <span className="w-32 text-gray-600">Received By:</span>
            <span>{receivedBy}</span>
          </div>
          <div className="flex items-center">
            <span className="w-32 text-gray-600">Signature:</span>
            <span className="inline-block">
              {user?.signature?.data ? (
                <img
                  src={user.signature.data}
                  alt="Signature"
                  className="max-w-[80px] max-h-[30px] object-contain"
                />
              ) : (
                <div className="w-20 h-8 border-b border-gray-400"></div>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Note Section */}
      {data.notes && (
        <div className="p-6 border-b border-gray-200">
          <div className="text-sm font-bold text-orange-500 mb-2">NOTE:</div>
          <div className="text-xs text-gray-700">{data.notes}</div>
        </div>
      )}

      {/* Footer Section */}
      <div className="p-6">
        <div className="text-xs text-green-600 text-left">
          Thank you for the support. We look forward to working with you in the future.
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;