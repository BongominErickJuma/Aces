import React from "react";
import { motion } from "framer-motion";
import { FloatingShapes, FloatingDocuments, ParticleSystem } from "../motions";
import Header from "./Header";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Sophisticated Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingShapes />
        <FloatingDocuments />
        <ParticleSystem />
      </div>

      {/* Header Navigation */}
      <Header />

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 pt-24" // pt-24 to account for h-24 header height
      >
        <div className="container mx-auto px-4 py-8">
          {title && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <motion.h1
                className="text-3xl font-bold text-gray-900 mb-2"
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
                {title}
              </motion.h1>
              <motion.div
                className="h-1 bg-gradient-to-r from-aces-green to-aces-blue rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </motion.main>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center z-10"
      >
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Aces Movers. Professional Document Management.
        </p>
      </motion.div>
    </div>
  );
};

export default PageLayout;
