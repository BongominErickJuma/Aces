import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SecuritySettingsTabProps {
  onPasswordChange: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => void;
  saving: boolean;
}

const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({
  onPasswordChange,
  saving
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Partial<PasswordChangeData>>({});

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    return errors;
  };

  const handleSubmit = () => {
    const newErrors: Partial<PasswordChangeData> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      const passwordErrors = validatePassword(passwordData.newPassword);
      if (passwordErrors.length > 0) {
        newErrors.newPassword = passwordErrors[0];
      }
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'New passwords do not match';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onPasswordChange({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      // Clear form on successful submission
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  const isFormValid = () => {
    return (
      passwordData.currentPassword &&
      passwordData.newPassword &&
      passwordData.confirmPassword &&
      passwordData.newPassword === passwordData.confirmPassword &&
      validatePassword(passwordData.newPassword).length === 0
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>

      <div className="max-w-md">
        <h4 className="text-md font-medium text-gray-800 mb-4">Change Password</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, currentPassword: e.target.value });
                  if (errors.currentPassword) {
                    setErrors({ ...errors, currentPassword: undefined });
                  }
                }}
                className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent ${
                  errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, newPassword: e.target.value });
                  if (errors.newPassword) {
                    setErrors({ ...errors, newPassword: undefined });
                  }
                }}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent ${
                  errors.newPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter new password"
              />
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
            )}
            {passwordData.newPassword && validatePassword(passwordData.newPassword).length === 0 && (
              <p className="mt-1 text-sm text-green-600">Password strength: Good</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined });
                  }
                }}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Confirm new password"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
            {passwordData.confirmPassword &&
             passwordData.newPassword === passwordData.confirmPassword &&
             passwordData.newPassword && (
              <p className="mt-1 text-sm text-green-600">Passwords match</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h5>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• At least 6 characters long</li>
              <li>• Contains uppercase and lowercase letters</li>
              <li>• Contains at least one number</li>
            </ul>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !isFormValid()}
            className="flex items-center gap-2 px-6 py-2 bg-aces-green text-white rounded-lg hover:bg-aces-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SecuritySettingsTab;