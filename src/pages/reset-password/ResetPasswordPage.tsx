import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { DecorativeElements } from "../../components/motions";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useForm } from "react-hook-form";
import { api } from "../../services/api";

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>("");

  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>();

  const password = watch("password");

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setError("");
    setIsLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        password: data.password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-aces-green hover:text-aces-green-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-aces-green/5 to-aces-blue/5" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white rounded-2xl pdf-shadow p-8 paper-texture relative overflow-hidden text-center">
            <motion.div
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-aces-green to-aces-blue"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Password Reset Successful
            </h1>

            <p className="text-gray-600 mb-8">
              Your password has been successfully reset. You can now login with your new password.
            </p>

            <Button
              onClick={() => navigate("/login")}
              className="w-full"
              size="lg"
            >
              <div className="flex items-center justify-center gap-2">
                <span>Go to Login</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Button>

            <DecorativeElements />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-aces-green/5 to-aces-blue/5" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-2xl pdf-shadow p-8 paper-texture relative overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-aces-green to-aces-blue"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Reset Your Password
            </h1>
            <p className="text-gray-600">
              Enter your new password below.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="New Password"
              type="password"
              placeholder="Enter your new password"
              showPasswordToggle
              error={errors.password?.message}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                },
              })}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm your new password"
              showPasswordToggle
              error={errors.confirmPassword?.message}
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
            />

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              {isLoading ? (
                "Resetting Password..."
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>

          <DecorativeElements />
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;