import React from "react";
import { motion } from "framer-motion";

export const LoginFooter: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center"
    >
      <p className="text-xs text-gray-400">
        © {new Date().getFullYear()} Aces Movers. Professional Document Management.
      </p>
    </motion.div>
  );
};