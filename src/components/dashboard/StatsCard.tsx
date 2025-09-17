import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { clsx } from "clsx";

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: "green" | "blue" | "purple" | "orange" | "red";
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color = "green",
  loading = false,
}) => {
  const colorClasses = {
    green: "bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200",
    blue: "bg-gradient-to-br from-blue-50 to-sky-100 border-blue-200",
    purple: "bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200",
    orange: "bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200",
    red: "bg-gradient-to-br from-red-50 to-rose-100 border-red-200",
  };

  const iconColorClasses = {
    green: "text-emerald-600 bg-emerald-100",
    blue: "text-blue-600 bg-blue-100",
    purple: "text-purple-600 bg-purple-100",
    orange: "text-orange-600 bg-orange-100",
    red: "text-red-600 bg-red-100",
  };

  const getTrendIcon = () => {
    if (!change) return null;
    const changeNum = parseFloat(change);
    if (changeNum > 0) return <TrendingUp className="w-4 h-4" />;
    if (changeNum < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!change) return "";
    const changeNum = parseFloat(change);
    if (changeNum > 0) return "text-green-600";
    if (changeNum < 0) return "text-red-600";
    return "text-gray-600";
  };

  if (loading) {
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
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={clsx(
        "rounded-xl p-6 border-2 shadow-sm hover:shadow-md transition-all duration-200",
        colorClasses[color]
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className={clsx("p-2 rounded-lg", iconColorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">
          {typeof value === "number" ? value.toLocaleString() : value}
        </h3>

        {change && (
          <div className={clsx("flex items-center gap-1 text-sm", getTrendColor())}>
            {getTrendIcon()}
            <span className="font-medium">{Math.abs(parseFloat(change))}%</span>
            <span className="text-gray-500">vs last period</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
