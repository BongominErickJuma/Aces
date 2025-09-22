import React from "react";
import StatsCardSkeleton from "./StatsCardSkeleton";
import RecentDocumentsSkeleton from "./RecentDocumentsSkeleton";

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatsCardSkeleton color="green" />
        <StatsCardSkeleton color="blue" />
        <StatsCardSkeleton color="purple" />
        <StatsCardSkeleton color="orange" />
        <StatsCardSkeleton color="red" />
      </div>

      {/* Recent Documents Section */}
      <RecentDocumentsSkeleton />

      {/* Activity Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="h-6 w-36 mb-4 bg-gray-200 rounded" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;