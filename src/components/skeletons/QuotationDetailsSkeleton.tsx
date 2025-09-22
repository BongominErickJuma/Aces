import React from "react";

const QuotationDetailsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Title and Status - Responsive */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
              <div className="h-7 bg-gray-300 rounded w-48"></div>
              <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
            </div>

            {/* Details Grid - Responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-16"></div>
              </div>
              <div>
                <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </div>
              <div>
                <div className="h-3 bg-gray-200 rounded w-18 mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-24"></div>
              </div>
              <div>
                <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </div>
            </div>
          </div>

          {/* Download Button - Full width on small screens */}
          <div className="w-full sm:w-auto">
            <div className="h-10 bg-gray-300 rounded-lg w-full sm:w-32"></div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Client Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="h-5 w-5 bg-gray-300 rounded mr-2"></div>
              <div className="h-5 bg-gray-300 rounded w-36"></div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
                <div className="h-4 bg-gray-300 rounded w-40"></div>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
                <div className="h-4 bg-gray-300 rounded w-32"></div>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
                <div className="h-4 bg-gray-300 rounded w-48"></div>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
                <div className="h-4 bg-gray-300 rounded w-36"></div>
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="h-5 w-5 bg-gray-300 rounded mr-2"></div>
              <div className="h-5 bg-gray-300 rounded w-24"></div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
                <div className="h-4 bg-gray-300 rounded w-36"></div>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
                <div className="h-4 bg-gray-300 rounded w-40"></div>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
                <div className="h-4 bg-gray-300 rounded w-28"></div>
              </div>
            </div>
          </div>

          {/* Validity Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="h-5 w-5 bg-gray-300 rounded mr-2"></div>
              <div className="h-5 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-4 bg-gray-300 rounded w-28"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-300 rounded w-16"></div>
                <div className="h-4 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Services */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="h-5 w-5 bg-gray-300 rounded mr-2"></div>
              <div className="h-5 bg-gray-300 rounded w-20"></div>
            </div>

            {/* Service Items */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-5 bg-gray-300 rounded w-32"></div>
                    <div className="h-5 bg-gray-300 rounded w-20"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="flex justify-between text-sm">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="h-5 w-5 bg-gray-300 rounded mr-2"></div>
              <div className="h-5 bg-gray-300 rounded w-32"></div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-4 bg-gray-300 rounded w-24"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-300 rounded w-16"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-300 rounded w-12"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-gray-300 rounded w-24"></div>
                  <div className="h-6 bg-gray-300 rounded w-32"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="h-5 w-5 bg-gray-300 rounded mr-2"></div>
          <div className="h-5 bg-gray-300 rounded w-40"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      {/* Notes Section (if present) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="h-5 w-5 bg-gray-300 rounded mr-2"></div>
          <div className="h-5 bg-gray-300 rounded w-28"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default QuotationDetailsSkeleton;