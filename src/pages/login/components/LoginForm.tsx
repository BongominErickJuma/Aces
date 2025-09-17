import React from "react";
import { useForm } from "react-hook-form";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { LoginCredentials } from "../../../types/auth";

interface LoginFormProps {
  onSubmit: (data: LoginCredentials) => Promise<void>;
  isLoading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        error={errors.email?.message}
        {...register("email", {
          required: "Email is required",
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "Invalid email address",
          },
        })}
      />

      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        showPasswordToggle
        error={errors.password?.message}
        {...register("password", {
          required: "Password is required",
          minLength: {
            value: 6,
            message: "Password must be at least 6 characters",
          },
        })}
      />

      <div className="flex justify-end">
        <Link
          to="/forgot-password"
          className="text-sm text-aces-green hover:text-aces-green-dark transition-colors duration-200 hover:underline"
        >
          Forgot your password?
        </Link>
      </div>

      <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
        {isLoading ? (
          "Signing In..."
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </Button>
    </form>
  );
};
