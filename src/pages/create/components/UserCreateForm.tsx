import React, { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { User, Mail, Phone, Shield, AlertCircle, CheckCircle, Key, UserCheck, Settings } from "lucide-react";
import { usersAPI, type CreateUserData } from "../../../services/users";
import { Button } from "../../../components/ui/Button";
interface UserCreateFormProps {
  onCancel: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

type FormData = CreateUserData;

const UserCreateForm: React.FC<UserCreateFormProps> = ({ onCancel, isLoading, setIsLoading }) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      fullName: "",
      email: "",
      phonePrimary: "",
      phoneSecondary: "",
      role: "user",
      sendWelcomeEmail: true,
      requirePasswordChange: true,
    },
  });

  const watchedRole = watch("role");
  const watchedSendWelcomeEmail = watch("sendWelcomeEmail");
  const watchedRequirePasswordChange = watch("requirePasswordChange");

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await usersAPI.createUser(data);

      if (response.success) {
        setGeneratedPassword(response.data.temporaryPassword);
        setSuccess("User created successfully!");
        // Clear draft after successful creation
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const validateCurrentStep = () => {
    const formData = watch();

    switch (currentStep) {
      case 1:
        return (
          formData.fullName &&
          formData.email &&
          formData.role &&
          formData.fullName.length >= 2 &&
          /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
        );
      case 2:
        return true; // Contact info is optional
      case 3:
        return true; // Settings have defaults
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
      setError(null);
    } else {
      setError("Please fill in all required fields before proceeding");
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onSubmit)(e);
  };
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-5 h-5 text-red-600" />;
      default:
        return <User className="w-5 h-5 text-blue-600" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "admin":
        return "Full system access, can manage users and all documents";
      default:
        return "Standard user access, can create and manage documents";
    }
  };

  const steps = [
    { id: 1, title: "Basic Info", icon: User },
    { id: 2, title: "Contact", icon: Phone },
    { id: 3, title: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Draft Prompt */}

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Success Alert with Generated Password */}
      {success && generatedPassword && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="text-green-800 font-semibold">User Created Successfully!</h3>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Temporary Password:</span>
              <Button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-1"
              >
                <span>{showPassword ? "Hide" : "Show"}</span>
              </Button>
            </div>
            <div className="font-mono text-lg bg-gray-100 p-3 rounded border">
              {showPassword ? generatedPassword : "••••••••••••"}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Please save this password securely. The user will be required to change it on first login.
            </p>
          </div>
        </motion.div>
      )}

      {/* Progress Steps */}
      <div className="bg-gray-50 rounded-lg p-3 lg:p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-aces-green text-white"
                      : isCompleted
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs lg:text-sm font-medium hidden lg:inline">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-4 lg:w-8 h-0.5 mx-1 lg:mx-2 ${isCompleted ? "bg-green-300" : "bg-gray-300"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form className="space-y-6 lg:space-y-8">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-aces-green" />
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  {...register("fullName", {
                    required: "Full name is required",
                    minLength: { value: 2, message: "Name must be at least 2 characters" },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  placeholder="John Doe"
                />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  {...register("email", {
                    required: "Email address is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  placeholder="john.doe@company.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">User Role *</label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                  { value: "user", label: "Standard User", adminOnly: false },
                  { value: "admin", label: "Administrator", adminOnly: false },
                ].map((role) => (
                  <label key={role.value} className="relative">
                    <input
                      type="radio"
                      value={role.value}
                      {...register("role", { required: "Role is required" })}
                      className="peer sr-only"
                    />
                    <div className="p-4 border border-gray-300 rounded-lg cursor-pointer peer-checked:border-aces-green peer-checked:bg-aces-green/5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        {getRoleIcon(role.value)}
                        <div>
                          <div className="font-medium text-gray-900">{role.label}</div>
                          <div className="text-sm text-gray-500">{getRoleDescription(role.value)}</div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Contact Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Phone className="w-5 h-5 text-aces-green" />
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Phone Number</label>
                <input
                  type="tel"
                  {...register("phonePrimary", {
                    pattern: {
                      value: /^[+]?[0-9\s\-()]+$/,
                      message: "Invalid phone number format",
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  placeholder="+256 700 000 000"
                />
                {errors.phonePrimary && <p className="text-red-500 text-sm mt-1">{errors.phonePrimary.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Phone Number</label>
                <input
                  type="tel"
                  {...register("phoneSecondary", {
                    pattern: {
                      value: /^[+]?[0-9\s\-()]+$/,
                      message: "Invalid phone number format",
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
                  placeholder="+256 700 000 001"
                />
                {errors.phoneSecondary && <p className="text-red-500 text-sm mt-1">{errors.phoneSecondary.message}</p>}
              </div>
            </div>

            {/* Contact Information Note */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Contact Information</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Phone numbers are optional but recommended for better communication. Users can update their contact
                    information later in their profile.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Account Settings */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="w-5 h-5 text-aces-green" />
              <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
            </div>

            {/* Account Settings */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <Key className="w-4 h-4 mr-2" />
                Password & Access Settings
              </h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium text-gray-900">Send Welcome Email</div>
                      <div className="text-sm text-gray-600">
                        Send login credentials and welcome information via email
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" {...register("sendWelcomeEmail")} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-aces-green/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-aces-green"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <UserCheck className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="font-medium text-gray-900">Require Password Change</div>
                      <div className="text-sm text-gray-600">User must change password on first login</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" {...register("requirePasswordChange")} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-aces-green/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-aces-green"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Account Summary */}
            <div className="bg-aces-green/5 rounded-lg p-6 border border-aces-green/20">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-aces-green mr-2" />
                Account Summary
              </h4>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Role:</span>
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(watchedRole)}
                    <span className="font-medium capitalize">{watchedRole}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Welcome Email:</span>
                  <span className="font-medium">{watchedSendWelcomeEmail ? "Will be sent" : "Will not be sent"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Password Change Required:</span>
                  <span className="font-medium">{watchedRequirePasswordChange ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-900">Security Note</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    A secure temporary password will be generated automatically. Make sure to securely share the
                    credentials with the new user.
                    {watchedRequirePasswordChange &&
                      " The user will be prompted to change their password on first login."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between pt-6 border-t border-gray-200 space-y-4 lg:space-y-0">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center space-y-3 lg:space-y-0 lg:space-x-3">
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                variant="secondary"
                disabled={isLoading || !!success}
                className="w-full lg:w-auto"
              >
                Previous
              </Button>
            )}
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              disabled={isLoading}
              className="flex items-center space-x-1 w-full lg:w-auto justify-center"
            >
              <span>Cancel</span>
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                variant="primary"
                disabled={isLoading || !!success}
                className="w-full lg:w-auto"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleCreateUser}
                disabled={isLoading || !!success}
                variant="primary"
                className="flex items-center space-x-2 w-full lg:w-auto justify-center"
              >
                <span>{isLoading ? "Creating..." : success ? "User Created!" : "Create User"}</span>
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserCreateForm;
