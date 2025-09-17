import React from "react";
import { motion } from "framer-motion";

interface DecorativeElementsProps {
  className?: string;
  showTopRight?: boolean;
  showBottomLeft?: boolean;
}

const DecorativeElements: React.FC<DecorativeElementsProps> = ({
  className = "",
  showTopRight = true,
  showBottomLeft = true,
}) => {
  return (
    <>
      {showTopRight && (
        <motion.div
          className={`absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-aces-green/20 to-aces-blue/20 rounded-full blur-xl ${className}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {showBottomLeft && (
        <motion.div
          className={`absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-tr from-aces-blue/20 to-aces-green/20 rounded-full blur-xl ${className}`}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      )}
    </>
  );
};

export default DecorativeElements;
