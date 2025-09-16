import React from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import type { User as UserType } from '../../../types/auth';

interface ProfileOverviewProps {
  profileData: UserType;
  avatarUploading: boolean;
  onAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileOverview: React.FC<ProfileOverviewProps> = ({
  profileData,
  avatarUploading,
  onAvatarUpload
}) => {
  const getProfileCompletionColor = (completion: boolean) => {
    return completion ? 'text-green-600' : 'text-red-600';
  };

  const getCompletionPercentage = () => {
    if (!profileData.profileCompletionStatus) return profileData.profileCompleted ? 100 : 0;

    const totalFields = 7; // Based on backend required fields
    const missingFields = profileData.profileCompletionStatus.missingFields.length;
    return Math.round(((totalFields - missingFields) / totalFields) * 100);
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar Section */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {profileData.profilePhoto?.url ? (
              <img
                src={profileData.profilePhoto.url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-16 h-16 text-gray-400" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-aces-green text-white rounded-full p-2 cursor-pointer hover:bg-aces-green/90 transition-colors">
            <Camera className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarUpload}
              className="hidden"
              disabled={avatarUploading}
            />
          </label>
          {avatarUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {profileData.fullName}
          </h1>
          <p className="text-gray-600 mb-2">{profileData.email}</p>
          <div className="flex items-center gap-4 mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
              {profileData.role}
            </span>
            <div className="flex items-center gap-2">
              {profileData.profileCompleted ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${getProfileCompletionColor(profileData.profileCompleted)}`}>
                Profile {completionPercentage}% Complete
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-aces-green h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>

          {!profileData.profileCompleted && (
            <div className="text-sm text-gray-500">
              <p className="mb-1">Complete your profile to unlock all features</p>
              {profileData.profileCompletionStatus?.missingFields && profileData.profileCompletionStatus.missingFields.length > 0 && (
                <div className="text-xs text-red-600">
                  Missing: {profileData.profileCompletionStatus.missingFields.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileOverview;