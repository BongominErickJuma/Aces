import React from "react";

const QuotationsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Search and Filters Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search bar */}
          <div className="flex-1 relative">
            <div className="h-12 bg-gray-200 rounded-lg"></div>
          </div>

          {/* Column Settings (desktop only) */}
          <div className="relative hidden 2xl:block">
            <div className="h-12 w-20 bg-gray-200 rounded-lg"></div>
          </div>

          {/* Filter Toggle */}
          <div className="h-12 w-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center gap-4">
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>

      {/* Content Section */}
      <div>
        {/* Desktop Table View (>1200px) */}
        <div className="hidden 2xl:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {/* Checkbox + 9 columns */}
                  <th className="w-12 px-4 py-3">
                    <div className="h-4 w-4 bg-gray-300 rounded"></div>
                  </th>
                  {[
                    "Quotation #",
                    "Type",
                    "Client",
                    "Status",
                    "Amount",
                    "Valid Until",
                    "Created",
                    "Created By",
                    "Days Left",
                  ].map((header) => (
                    <th key={header} className="text-left px-4 py-3">
                      <div className="h-3 bg-gray-300 rounded w-20"></div>
                    </th>
                  ))}
                  <th className="text-left px-4 py-3">
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => (
                  <tr key={i}>
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <div className="h-4 w-4 bg-gray-300 rounded"></div>
                    </td>
                    {/* Quotation Number */}
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                    </td>
                    {/* Type with icon */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 bg-gray-300 rounded"></div>
                        <div className="h-4 bg-gray-300 rounded w-20"></div>
                      </div>
                    </td>
                    {/* Client */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                        <div className="h-3 bg-gray-300 rounded w-24"></div>
                      </div>
                    </td>
                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
                    </td>
                    {/* Amount */}
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                    </td>
                    {/* Valid Until */}
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                    </td>
                    {/* Created */}
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                    </td>
                    {/* Created By */}
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-300 rounded w-28"></div>
                    </td>
                    {/* Days Left */}
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((action) => (
                          <div key={action} className="h-6 w-6 bg-gray-300 rounded"></div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile/Tablet Card View (≤1200px) */}
        <div className="block 2xl:hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Card Header */}
                <div className="p-5 pb-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-4 w-4 bg-gray-300 rounded"></div>
                      <div className="flex items-center space-x-2">
                        <div className="h-5 w-5 bg-gray-300 rounded"></div>
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
                  </div>

                  {/* Quotation Number */}
                  <div className="mb-3">
                    <div className="h-6 bg-gray-300 rounded w-32 mb-2"></div>
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-gray-300 rounded"></div>
                      <div className="h-3 bg-gray-300 rounded w-24"></div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-5 pb-4">
                  {/* Client Information */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-40"></div>
                      <div className="h-3 bg-gray-300 rounded w-32"></div>
                      <div className="flex items-center space-x-1">
                        <div className="h-3 w-3 bg-gray-300 rounded"></div>
                        <div className="h-3 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Timeline Info */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="h-5 bg-gray-300 rounded w-20 mx-auto mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-16 mx-auto"></div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="h-4 bg-gray-300 rounded w-16 mx-auto mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-12 mx-auto"></div>
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-gray-300 rounded w-24"></div>
                    <div className="h-3 bg-gray-300 rounded w-20"></div>
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3].map((action) => (
                        <div key={action} className="h-8 w-8 bg-gray-300 rounded-lg"></div>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      {[1, 2].map((action) => (
                        <div key={action} className="h-8 w-8 bg-gray-300 rounded-lg"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {/* Desktop pagination for table view */}
      <div className="hidden 2xl:flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
          {[1, 2, 3, 4, 5].map((page) => (
            <div key={page} className="h-8 w-8 bg-gray-200 rounded"></div>
          ))}
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Mobile/Tablet pagination for card view - arrow style */}
      <div className="flex 2xl:hidden items-center justify-center gap-2">
        {/* First page button */}
        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
        {/* Previous page button */}
        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
        {/* Page indicator */}
        <div className="h-10 w-20 bg-gray-200 rounded-lg"></div>
        {/* Next page button */}
        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
        {/* Last page button */}
        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
};

export default QuotationsSkeleton;
