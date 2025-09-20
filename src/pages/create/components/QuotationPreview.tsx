import React from "react";
import { formatDate, formatCurrency } from "../../../utils/formatters";

interface Service {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

interface Client {
  name: string;
  phone: string;
  email?: string;
  company?: string;
}

interface Locations {
  from: string;
  to: string;
  movingDate: string;
}

interface Pricing {
  currency: string;
  discount?: number;
  taxRate?: number;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
}

interface QuotationPreviewProps {
  data: {
    type: string;
    client: Client;
    locations: Locations;
    services: Service[];
    pricing: Pricing;
    notes?: string;
    quotationNumber?: string;
  };
}

const QuotationPreview: React.FC<QuotationPreviewProps> = ({ data }) => {
  const formatCurrencyDisplay = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: data.pricing.currency || "UGX",
      minimumFractionDigits: 0,
    }).format(amount).replace(/^UGX\s*/, 'UGX ');
  };

  const getQuotationNumber = () => {
    return data.quotationNumber || "PREVIEW";
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
            <div className="text-xl font-bold text-blue-700 mb-2">QUOTATION</div>
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
              <span>Quotation No:</span>
              <span>{getQuotationNumber()}</span>
            </div>
            <div className="flex justify-between text-xs mb-1">
              <span>Date:</span>
              <span>{getCurrentDate()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Service Type:</span>
              <span>{data.type} Move</span>
            </div>
          </div>
        </div>
      </div>

      {/* Client Info Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-900 mb-3 pb-1 border-b border-gray-200">
          Client's Info
        </div>
        <div className="space-y-2 text-xs text-gray-700">
          {data.client.company && (
            <div className="flex">
              <span className="w-24 text-gray-600">Company Name:</span>
              <span>{data.client.company}</span>
            </div>
          )}
          <div className="flex">
            <span className="w-24 text-gray-600">Contact Person:</span>
            <span>{data.client.name || 'Not specified'}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-gray-600">Contact:</span>
            <span>{data.client.phone || 'Not specified'}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-gray-600">Email:</span>
            <span>{data.client.email || 'Not specified'}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-gray-600">From:</span>
            <span>{data.locations.from || 'Not specified'}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-gray-600">To:</span>
            <span>{data.locations.to || 'Not specified'}</span>
          </div>
          {getMovingDate() && (
            <div className="flex">
              <span className="w-24 text-gray-600">Moving Date:</span>
              <span>{getMovingDate()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Services Section */}
      <div className="p-6 border-b border-gray-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-500 text-white">
              <th className="px-3 py-2 text-left w-8"></th>
              <th className="px-3 py-2 text-left">Services</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.services.map((service, index) => {
              const total = service.quantity * service.unitPrice;
              return (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-3 text-center">{index + 1}</td>
                  <td className="px-3 py-3">{service.name || 'Service name'}</td>
                  <td className="px-3 py-3 text-gray-600">{service.description || 'Service description'}</td>
                  <td className="px-3 py-3 text-right">{formatCurrencyDisplay(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end items-center mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-12">
            <span className="text-sm">Grand Total</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrencyDisplay(data.pricing.totalAmount || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Details Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex gap-20">
          <div className="flex-1">
            <div className="text-sm font-medium text-green-600 mb-3">Bank Details</div>
            <div className="space-y-1 text-xs">
              <div><span className="text-gray-600">Account Number:</span> 1044102306223</div>
              <div><span className="text-gray-600">Account Name:</span> KAMOGA GEOFREY</div>
              <div><span className="text-gray-600">Bank Name:</span> EQUITY BANK - NTINDA</div>
              <div><span className="text-gray-600">Swift Code:</span> EQBLUGKA</div>
              <div><span className="text-gray-600">Sort Code:</span> 100137</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-green-600 mb-3">MOBILE MONEY</div>
            <div className="space-y-1 text-xs">
              <div>KAMOGA GEOFREY</div>
              <div>0778259191</div>
              <div>0745711730</div>
            </div>
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
      <div className="p-6 text-center">
        <div className="text-xs text-green-600">
          Thank you for the support. We look forward to working with you in the future.
        </div>
      </div>
    </div>
  );
};

export default QuotationPreview;