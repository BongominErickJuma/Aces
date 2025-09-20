import React from "react";
import { clsx } from "clsx";

interface StatsCardSkeletonProps {
  color?: "green" | "blue" | "purple" | "orange" | "red";
}

const StatsCardSkeleton: React.FC<StatsCardSkeletonProps> = ({ color = "green" }) => {
  const colorClasses = {
    green: "bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200",
    blue: "bg-gradient-to-br from-blue-50 to-sky-100 border-blue-200",
    purple: "bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200",
    orange: "bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200",
    red: "bg-gradient-to-br from-red-50 to-rose-100 border-red-200",
  };

  return (
    <div className={clsx("rounded-xl p-6 border-2 animate-pulse", colorClasses[color])}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </div>
  );
};

export default StatsCardSkeleton;