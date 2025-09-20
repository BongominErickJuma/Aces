import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, BarChart3 } from "lucide-react";
import { PageLayout } from "../../components/layout";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";
import UserManagement from "./components/UserManagement";
import ReportsTab from "./components/ReportsTab";

type TabType = "users" | "settings" | "reports" | "audit";

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("users");

  // Check admin access
  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const tabs = [
    { id: "users", label: "User Management", icon: Users },
    // { id: 'settings', label: 'System Settings', icon: Settings },
    { id: "reports", label: "Reports", icon: BarChart3 },
    // { id: "audit", label: "Audit Logs", icon: Activity },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "users":
        return <UserManagement isAdmin={user?.role === "admin"} currentUser={user || undefined} />;
      // case 'settings':
      //   return <SystemSettings />;

      case "reports":
        return <ReportsTab />;
      // case "audit":
      //   return <AuditLogs />;
      default:
        return null;
    }
  };

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <PageLayout title="Admin Panel">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      isActive
                        ? "border-aces-green text-aces-green"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon
                      className={`mr-2 w-5 h-5 ${
                        isActive ? "text-aces-green" : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {tab.label}
                  </motion.button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default AdminPage;
