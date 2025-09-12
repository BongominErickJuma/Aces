import React from "react";
import { motion } from "framer-motion";

export const LoginHeader: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="text-center mb-8"
    >
      <motion.div
        whileHover={{ scale: 1.05, rotate: 1 }}
        className="bg-white rounded-xl flex items-center justify-center mx-auto mb-4"
      >
        <img src="/img/Aces_logo.svg" alt="Aces Movers Logo" className="object-contain" />
      </motion.div>

      <motion.h1
        className="text-sm font-bold text-gray-900 mb-2"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          background: "linear-gradient(90deg, #2e8a56, #0000ff, #2e8a56)",
          backgroundSize: "200% 100%",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        Aces Movers and Relocation Company Limited
      </motion.h1>
    </motion.div>
  );
};