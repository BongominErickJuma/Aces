import React from "react";

const UserManagementSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search bar - ~400px width */}
          <div className="relative flex-1 sm:flex-initial">
            <div className="w-full sm:w-64 h-10 bg-gray-200 rounded-lg"></div>
          </div>

          {/* Filters button - ~200px width (half of search) */}
          <div className="h-10 w-full sm:w-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>

      {/* Desktop Table View (>1200px) - matches exact table structure */}
      <div className="hidden xl:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {/* Checkbox */}
                <th className="px-6 py-3 text-left">
                  <div className="h-4 w-4 bg-gray-300 rounded"></div>
                </th>
                {/* Table headers - proper sizes matching real headers */}
                <th className="px-6 py-3 text-left">
                  <div className="h-3 bg-gray-300 rounded w-8"></div> {/* User */}
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="h-3 bg-gray-300 rounded w-16"></div> {/* Contact */}
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="h-3 bg-gray-300 rounded w-24"></div> {/* Role & Status */}
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="h-3 bg-gray-300 rounded w-20"></div> {/* Statistics */}
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="h-3 bg-gray-300 rounded w-16"></div> {/* Activity */}
                </th>
                <th className="px-6 py-3 text-left">
                  <div className="h-3 bg-gray-300 rounded w-16"></div> {/* Actions */}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3, 4, 5, 6, 8, 9].map((i) => (
                <tr key={i}>
                  {/* Checkbox */}
                  <td className="px-6 py-4">
                    <div className="h-4 w-4 bg-gray-300 rounded"></div>
                  </td>
                  {/* User info with avatar - exact layout */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                      </div>
                      <div className="ml-4">
                        <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                        <div className="h-3 bg-gray-300 rounded w-40"></div>
                      </div>
                    </div>
                  </td>
                  {/* Contact info */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                      <div className="h-3 bg-gray-300 rounded w-20"></div>
                    </div>
                  </td>
                  {/* Role & Status - stacked badges */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="h-6 w-12 bg-gray-300 rounded-full"></div>
                      <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
                    </div>
                  </td>
                  {/* Statistics */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                      <div className="h-3 bg-gray-300 rounded w-28"></div>
                    </div>
                  </td>
                  {/* Activity */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                      <div className="h-3 bg-gray-300 rounded w-20"></div>
                    </div>
                  </td>
                  {/* Actions - only 2 icons */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-gray-300 rounded"></div>
                      <div className="h-4 w-4 bg-gray-300 rounded"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card View (≤1200px) - simplified cards */}
      <div className="block xl:hidden">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-4 w-4 bg-gray-300 rounded"></div>
                  <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-300 rounded w-28 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-36"></div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-gray-300 rounded"></div>
                  <div className="h-4 w-4 bg-gray-300 rounded"></div>
                </div>
              </div>

              {/* Role & Status badges */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="h-6 w-12 bg-gray-300 rounded-full"></div>
                <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
              </div>

              {/* Contact & Statistics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="h-3 bg-gray-300 rounded w-12 mb-1"></div>
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                </div>
                <div>
                  <div className="h-3 bg-gray-300 rounded w-16 mb-1"></div>
                  <div className="h-4 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {/* Desktop pagination for table view */}
      <div className="hidden xl:flex items-center justify-between">
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
      <div className="flex xl:hidden items-center justify-center gap-2">
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

export default UserManagementSkeleton;
