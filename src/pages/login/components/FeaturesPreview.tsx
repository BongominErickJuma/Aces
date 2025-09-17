import React from "react";
import { motion } from "framer-motion";
import { FileText, Users, Shield } from "lucide-react";

export const FeaturesPreview: React.FC = () => {
  const features = [
    { icon: FileText, label: "Quotations" },
    { icon: Users, label: "User Mgmt" },
    { icon: Shield, label: "Secure" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mt-8 pt-6 border-t border-gray-200"
    >
      <p className="text-xs text-gray-500 text-center mb-4">Features</p>
      <div className="grid grid-cols-3 gap-4 text-center">
        {features.map(({ icon: Icon, label }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Icon size={16} className="text-aces-green" />
            <span className="text-xs text-gray-600">{label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
