import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User as UserIcon, Lock, CheckCircle, AlertCircle, FileSignature } from "lucide-react";
import { PageLayout } from "../../components/layout";
import { useAuth } from "../../context/useAuth";
import { api } from "../../services/api";
import type { User } from "../../types/auth";
import { ProfileOverview, PersonalInformationTab, SecuritySettingsTab } from "./components";
import { SignatureManager } from "../../components/signature";

const ProfilePage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/users/profile");
      if (response.data.success) {
        setProfileData(response.data.data.user);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      setMessage({
        type: "error",
        text: axiosError.response?.data?.message || "Failed to load profile data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!profileData) return;

    setSaving(true);
    try {
      const updateData = {
        fullName: profileData.fullName,
        phonePrimary: profileData.phonePrimary,
        phoneSecondary: profileData.phoneSecondary,
        address: profileData.address,
        emergencyContact: profileData.emergencyContact,
      };

      const response = await api.put("/users/profile", updateData);
      if (response.data.success) {
        setProfileData(response.data.data.user);
        setMessage({ type: "success", text: "Profile updated successfully" });
        await refreshUser();
        // Auto-hide success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      setMessage({
        type: "error",
        text: axiosError.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    setSaving(true);
    try {
      const response = await api.put("/users/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      if (response.data.success) {
        setMessage({ type: "success", text: "Password changed successfully. Please login again." });
        // Auto-hide success message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      console.error("Password change error:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      setMessage({
        type: "error",
        text: axiosError.response?.data?.message || "Failed to change password",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select a valid image file" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image file size must be less than 5MB" });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setAvatarUploading(true);
    try {
      const response = await api.post("/users/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        setMessage({ type: "success", text: "Avatar uploaded successfully" });
        await fetchProfile();
        await refreshUser();
        // Auto-hide success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      if (axiosError.response?.status === 501) {
        setMessage({ type: "error", text: "Avatar upload feature is not yet available" });
      } else {
        setMessage({
          type: "error",
          text: axiosError.response?.data?.message || "Failed to upload avatar",
        });
      }
    } finally {
      setAvatarUploading(false);
    }
  };

  // Auto-dismiss messages after some time
  useEffect(() => {
    if (message) {
      const timer = setTimeout(
        () => {
          setMessage(null);
        },
        message.type === "success" ? 3000 : 5000
      );
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <PageLayout title="Profile">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aces-green"></div>
        </div>
      </PageLayout>
    );
  }

  if (!profileData) {
    return (
      <PageLayout title="Profile">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Profile</h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Profile">
      <div className="mx-auto space-y-6">
        {/* Message Alert */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <div className="flex items-center">
              {message.type === "success" ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {message.text}
            </div>
          </motion.div>
        )}

        {/* Profile Overview Card */}
        <ProfileOverview
          profileData={profileData}
          avatarUploading={avatarUploading}
          onAvatarUpload={handleAvatarUpload}
        />

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", label: "Personal Information", icon: UserIcon },
              { id: "signature", label: "Digital Signature", icon: FileSignature },
              { id: "security", label: "Security Settings", icon: Lock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-aces-green text-aces-green"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" && (
            <PersonalInformationTab
              profileData={profileData}
              setProfileData={setProfileData}
              onSave={handleProfileUpdate}
              saving={saving}
            />
          )}

          {activeTab === "signature" && <SignatureManager />}

          {activeTab === "security" && <SecuritySettingsTab onPasswordChange={handlePasswordChange} saving={saving} />}
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default ProfilePage;
