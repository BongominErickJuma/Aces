import React from 'react';
import { motion } from 'framer-motion';
import { Building, Smartphone, Save } from 'lucide-react';
import type { User } from '../../../types/auth';

interface FinancialInformationTabProps {
  profileData: User;
  setProfileData: (data: User) => void;
  onSave: () => void;
  saving: boolean;
}

const FinancialInformationTab: React.FC<FinancialInformationTabProps> = ({
  profileData,
  setProfileData,
  onSave,
  saving
}) => {
  const updateBankDetails = (field: string, value: string) => {
    setProfileData({
      ...profileData,
      bankDetails: {
        ...profileData.bankDetails,
        [field]: value
      }
    });
  };

  const updateMobileMoneyDetails = (field: string, value: string) => {
    setProfileData({
      ...profileData,
      mobileMoneyDetails: {
        ...profileData.mobileMoneyDetails,
        [field]: value
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Information</h3>

      {/* Bank Details */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <Building className="w-4 h-4" />
          Bank Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number *
            </label>
            <input
              type="text"
              value={profileData.bankDetails?.accountNumber || ''}
              onChange={(e) => updateBankDetails('accountNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              placeholder="Enter account number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              value={profileData.bankDetails?.accountName || ''}
              onChange={(e) => updateBankDetails('accountName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              placeholder="Enter account name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name *
            </label>
            <input
              type="text"
              value={profileData.bankDetails?.bankName || ''}
              onChange={(e) => updateBankDetails('bankName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              placeholder="Enter bank name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch
            </label>
            <input
              type="text"
              value={profileData.bankDetails?.branch || ''}
              onChange={(e) => updateBankDetails('branch', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              placeholder="Enter branch name"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SWIFT Code
            </label>
            <input
              type="text"
              value={profileData.bankDetails?.swiftCode || ''}
              onChange={(e) => updateBankDetails('swiftCode', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              placeholder="Enter SWIFT code"
              maxLength={11}
            />
          </div>
        </div>
      </div>

      {/* Mobile Money */}
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Mobile Money
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MTN Number
            </label>
            <input
              type="tel"
              value={profileData.mobileMoneyDetails?.mtnNumber || ''}
              onChange={(e) => updateMobileMoneyDetails('mtnNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              placeholder="Enter MTN mobile money number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Airtel Number
            </label>
            <input
              type="tel"
              value={profileData.mobileMoneyDetails?.airtelNumber || ''}
              onChange={(e) => updateMobileMoneyDetails('airtelNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              placeholder="Enter Airtel money number"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-aces-green text-white rounded-lg hover:bg-aces-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Financial Info'}
        </button>
      </div>
    </motion.div>
  );
};

export default FinancialInformationTab;