import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DecorativeElements } from "../../components/motions";
import type { LoginCredentials } from "../../types/auth";
import { useAuth } from "../../hooks/useAuth";
import { LoginHeader, ErrorMessage, LoginForm, FeaturesPreview, LoginBackground, LoginFooter } from "./components";

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated, isInitializing } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isInitializing, navigate]);

  const onSubmit = async (data: LoginCredentials) => {
    setError("");
    try {
      await login(data);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      <LoginBackground />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-2xl pdf-shadow p-8 paper-texture relative overflow-hidden">
          {/* Header Shimmer Effect */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-aces-green to-aces-blue"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />

          <LoginHeader />
          <ErrorMessage error={error} />
          <LoginForm onSubmit={onSubmit} isLoading={isLoading} />
          <FeaturesPreview />

          <DecorativeElements />
        </div>
      </motion.div>

      <LoginFooter />
    </div>
  );
};

export default LoginPage;
