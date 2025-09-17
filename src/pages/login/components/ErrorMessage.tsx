import React from "react";
import { motion } from "framer-motion";

interface ErrorMessageProps {
  error: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => {
  if (!error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
    >
      {error}
    </motion.div>
  );
};
