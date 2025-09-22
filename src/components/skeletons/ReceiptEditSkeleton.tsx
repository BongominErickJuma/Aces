import React from "react";

const ReceiptEditSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Client Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="h-5 w-5 bg-gray-300 rounded mr-2"></div>
          <div className="h-5 bg-gray-300 rounded w-36"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-10 bg-gray-300 rounded-lg w-full"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Locations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="h-5 w-5 bg-gray-300 rounded mr-2"></div>
          <div className="h-5 bg-gray-300 rounded w-24"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-10 bg-gray-300 rounded-lg w-full"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Services/Details Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="h-5 w-5 bg-gray-300 rounded mr-2"></div>
            <div className="h-5 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="h-8 w-24 bg-gray-300 rounded"></div>
        </div>

        {/* Service Items or Amount Fields */}
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-10 bg-gray-300 rounded-lg w-full"></div>
                </div>
                <div className="md:col-span-2">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-10 bg-gray-300 rounded-lg w-full"></div>
                </div>
                <div className="md:col-span-2">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-10 bg-gray-300 rounded-lg w-full"></div>
                </div>
                <div className="md:col-span-2">
                  <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
                  <div className="h-10 bg-gray-300 rounded-lg w-full"></div>
                </div>
                <div className="md:col-span-1 flex items-end">
                  <div className="h-10 w-10 bg-gray-300 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}

          {/* Summary Table for special receipt types */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="h-4 bg-gray-300 rounded w-32 mb-3"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-gray-300 rounded w-28"></div>
              <div className="h-6 bg-gray-300 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="h-5 w-5 bg-gray-300 rounded mr-2"></div>
          <div className="h-5 bg-gray-300 rounded w-36"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-10 bg-gray-300 rounded-lg w-full"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Signatures */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="h-5 w-5 bg-gray-300 rounded mr-2"></div>
          <div className="h-5 bg-gray-300 rounded w-24"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-10 bg-gray-300 rounded-lg w-full"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="h-5 bg-gray-300 rounded w-32 mb-4"></div>
        <div className="h-24 bg-gray-300 rounded-lg w-full"></div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4">
        <div className="h-10 w-20 bg-gray-300 rounded-lg"></div>
        <div className="h-10 w-28 bg-gray-300 rounded-lg"></div>
      </div>
    </div>
  );
};

export default ReceiptEditSkeleton;