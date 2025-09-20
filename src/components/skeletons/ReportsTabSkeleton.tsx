import React from "react";

const ReportsTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Period Filter */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <div className="h-4 bg-gray-300 rounded w-12 mb-1"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
        </div>

        <div className="h-10 w-40 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-32"></div>
              </div>
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-300 rounded w-40 mb-4"></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {['User', 'Role', 'Quotations', 'Receipts', 'Revenue'].map((header) => (
                  <th key={header} className="text-left py-3 px-4">
                    <div className="h-4 bg-gray-300 rounded w-16"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-gray-100">
                  {/* User */}
                  <td className="py-3 px-4">
                    <div>
                      <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-40"></div>
                    </div>
                  </td>
                  {/* Role */}
                  <td className="py-3 px-4">
                    <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
                  </td>
                  {/* Quotations */}
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-300 rounded w-8 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-20"></div>
                  </td>
                  {/* Receipts */}
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-300 rounded w-8 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                  </td>
                  {/* Revenue */}
                  <td className="py-3 px-4">
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-40"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Quotations */}
          <div>
            <div className="h-4 bg-gray-300 rounded w-36 mb-3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-20"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Receipts */}
          <div>
            <div className="h-4 bg-gray-300 rounded w-32 mb-3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-28 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-20"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-300 rounded w-20 mb-1"></div>
                    <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsTabSkeleton;