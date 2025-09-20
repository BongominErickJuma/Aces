import React from "react";

const AdminTabNavigationSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[1, 2].map((tab) => (
              <div key={tab} className="group inline-flex items-center py-4 px-1 border-b-2 border-transparent">
                <div className="h-5 w-5 bg-gray-300 rounded mr-2"></div>
                <div className="h-4 bg-gray-300 rounded w-24"></div>
              </div>
            ))}
          </nav>
        </div>

        {/* Tab Content Placeholder */}
        <div className="mt-6">
          <div className="h-96 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default AdminTabNavigationSkeleton;