import React from "react";

const RecentDocumentsSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="animate-pulse">
        {/* Header Section */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            {/* Title */}
            <div className="h-8 bg-gray-200 rounded w-48"></div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Search bar skeleton */}
              <div className="relative flex-1 sm:max-w-xs">
                <div className="h-10 bg-gray-200 rounded-lg"></div>
              </div>

              {/* Filter button skeleton */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-10 w-20 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 md:p-6">
          {/* Mobile/Tablet Card View (≤1200px) */}
          <div className="block 2xl:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-5 w-5 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                    </div>
                    <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
                  </div>

                  {/* Card Content */}
                  <div className="space-y-3">
                    {/* Client, Created By, Date rows */}
                    {[1, 2, 3].map((row) => (
                      <div key={row} className="flex items-center justify-between">
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                        <div className="h-3 bg-gray-300 rounded w-20"></div>
                      </div>
                    ))}

                    {/* Amount row with border */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="h-3 bg-gray-300 rounded w-16"></div>
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-4">
                      <div className="flex-1 h-8 bg-gray-300 rounded-md"></div>
                      <div className="flex-1 h-8 bg-gray-300 rounded-md"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View (>1200px) */}
          <div className="hidden 2xl:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {/* Table headers - 7 columns */}
                    {["Document", "Client", "Amount", "Status", "Created By", "Date", "Actions"].map((header) => (
                      <th key={header} className="text-left py-3 px-4">
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Table rows */}
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <tr key={i}>
                      {/* Document column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 bg-gray-300 rounded"></div>
                          <div className="h-4 bg-gray-300 rounded w-20"></div>
                        </div>
                      </td>
                      {/* Client column */}
                      <td className="py-3 px-4">
                        <div className="h-4 bg-gray-300 rounded w-24"></div>
                      </td>
                      {/* Amount column */}
                      <td className="py-3 px-4">
                        <div className="h-4 bg-gray-300 rounded w-20"></div>
                      </td>
                      {/* Status column */}
                      <td className="py-3 px-4">
                        <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
                      </td>
                      {/* Created By column */}
                      <td className="py-3 px-4">
                        <div className="h-4 bg-gray-300 rounded w-20"></div>
                      </td>
                      {/* Date column */}
                      <td className="py-3 px-4">
                        <div className="h-4 bg-gray-300 rounded w-16"></div>
                      </td>
                      {/* Actions column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-6 w-6 bg-gray-300 rounded"></div>
                          <div className="h-6 w-6 bg-gray-300 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentDocumentsSkeleton;
