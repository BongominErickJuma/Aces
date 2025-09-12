import React, { useState } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../utils/cn";

interface InputProps extends Omit<HTMLMotionProps<"input">, "ref"> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  type = "text",
  showPasswordToggle = false,
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = showPasswordToggle && type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
      {label && (
        <motion.label
          animate={{
            color: error ? "#ef4444" : isFocused ? "#2e8a56" : "#374151",
            scale: isFocused ? 1.02 : 1,
          }}
          className="block text-sm font-medium transition-all duration-200"
        >
          {label}
        </motion.label>
      )}

      <div className="relative">
        <motion.input
          type={inputType}
          className={cn(
            "w-full px-4 py-3 text-gray-900 placeholder-gray-500 bg-white border rounded-lg transition-all duration-200 pdf-shadow paper-texture",
            "focus:outline-none focus:ring-2 focus:ring-aces-green focus:border-transparent",
            "hover:shadow-md",
            error ? "border-red-300 focus:ring-red-500" : "border-gray-300",
            showPasswordToggle && "pr-12",
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          whileFocus={{
            scale: 1.01,
            boxShadow: "0 4px 12px rgba(46, 138, 86, 0.15)",
          }}
          {...props}
        />

        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.1 }}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </motion.div>
          </button>
        )}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="text-sm text-red-500 flex items-center gap-1"
        >
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1 h-1 bg-red-500 rounded-full" />
          {error}
        </motion.p>
      )}
    </motion.div>
  );
};
