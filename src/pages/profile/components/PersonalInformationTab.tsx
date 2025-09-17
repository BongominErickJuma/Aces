import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Save } from "lucide-react";
import type { User } from "../../../types/auth";

interface PersonalInformationTabProps {
  profileData: User;
  setProfileData: (data: User) => void;
  onSave: () => void;
  saving: boolean;
}

const PersonalInformationTab: React.FC<PersonalInformationTabProps> = ({
  profileData,
  setProfileData,
  onSave,
  saving,
}) => {
  const isFormValid = () => {
    return profileData.fullName && profileData.email && profileData.phonePrimary && profileData.emergencyContact;
  };

  const handleFullNameChange = (firstName: string, lastName: string) => {
    const fullName = `${firstName} ${lastName}`.trim();
    setProfileData({ ...profileData, fullName });
  };

  // Parse fullName into first and last name for display
  const getFirstLastName = () => {
    const nameParts = profileData.fullName?.split(" ") || [];
    return {
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
    };
  };

  const { firstName, lastName } = getFirstLastName();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => handleFullNameChange(e.target.value, lastName)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
            placeholder="Enter first name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => handleFullNameChange(firstName, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
            placeholder="Enter last name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="email"
              value={profileData.email || ""}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Primary Phone *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="tel"
              value={profileData.phonePrimary || ""}
              onChange={(e) => setProfileData({ ...profileData, phonePrimary: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              placeholder="Enter primary phone number"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="tel"
              value={profileData.phoneSecondary || ""}
              onChange={(e) => setProfileData({ ...profileData, phoneSecondary: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              placeholder="Enter secondary phone number"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="tel"
              value={profileData.emergencyContact || ""}
              onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              placeholder="Enter emergency contact number"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <textarea
              value={profileData.address || ""}
              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              rows={3}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aces-green focus:border-transparent"
              placeholder="Enter your address"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onSave}
          disabled={saving || !isFormValid()}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2 bg-aces-green text-white rounded-lg hover:bg-aces-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
};

export default PersonalInformationTab;
