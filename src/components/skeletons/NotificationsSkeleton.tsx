import React from "react";

const NotificationsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          {/* Bulk Actions Placeholder */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-4">
            {[1, 2, 3].map((tab) => (
              <div key={tab} className="px-4 py-3">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5, 6].map((notification) => (
            <div key={notification} className="p-3 sm:p-4">
              {/* Mobile Layout (< xl) */}
              <div className="xl:hidden">
                {/* Top Row: Checkbox, Icon, Title, and Actions */}
                <div className="flex items-start gap-2 mb-2">
                  <div className="h-4 w-4 bg-gray-200 rounded mt-1"></div>
                  <div className="h-5 w-5 bg-gray-200 rounded mt-1"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  </div>
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                </div>

                {/* Message Body */}
                <div className="ml-8">
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>

                  <div className="flex flex-col gap-1 mt-2">
                    <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                    <div className="flex flex-col gap-1">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout (xl+) */}
              <div className="hidden xl:flex items-start gap-3">
                <div className="h-4 w-4 bg-gray-200 rounded mt-1"></div>
                <div className="h-5 w-5 bg-gray-200 rounded mt-1"></div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                        <div className="flex items-center gap-3">
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </div>

                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="px-3 sm:px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="h-4 bg-gray-200 rounded w-48"></div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSkeleton;