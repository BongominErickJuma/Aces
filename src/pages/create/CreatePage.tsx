import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FileText, Receipt, UserPlus, AlertTriangle, Loader2 } from "lucide-react";
import { PageLayout } from "../../components/layout";
import { useAuth } from "../../context/useAuth";
import QuotationCreateForm from "./components/QuotationCreateForm";
import ReceiptCreateForm from "./components/ReceiptCreateForm";
import UserCreateForm from "./components/UserCreateForm";

type CreateType = "quotation" | "receipt" | "user";

interface TabConfig {
  id: CreateType;
  label: string;
  icon: React.ElementType;
  description: string;
  adminOnly?: boolean;
}

const CreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<CreateType>("quotation");
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  const tabs: TabConfig[] = [
    {
      id: "quotation",
      label: "Quotation",
      icon: FileText,
      description: "Create a new quotation for potential customers",
    },
    {
      id: "receipt",
      label: "Receipt",
      icon: Receipt,
      description: "Generate receipts for completed services",
    },
    {
      id: "user",
      label: "User",
      icon: UserPlus,
      description: "Add new team members to the system",
      adminOnly: true,
    },
  ];

  // Filter tabs based on user role
  const availableTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);

  // Initialize tab from URL params or default
  useEffect(() => {
    const tabParam = searchParams.get("type") as CreateType;
    const fromQuotation = searchParams.get("fromQuotation");

    if (fromQuotation) {
      setActiveTab("receipt");
    } else if (tabParam && availableTabs.some((tab) => tab.id === tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab("quotation");
    }
  }, [searchParams, availableTabs]);

  // Update URL when tab changes
  const handleTabChange = (tabId: CreateType) => {
    setActiveTab(tabId);
    setSearchParams({ type: tabId });
  };

  const handleCancel = () => {
    // Navigate back to the appropriate listing page
    switch (activeTab) {
      case "quotation":
        navigate("/quotations");
        break;
      case "receipt":
        navigate("/receipts");
        break;
      case "user":
        navigate("/admin");
        break;
      default:
        navigate("/dashboard");
    }
  };

  const renderTabContent = () => {
    const fromQuotationId = searchParams.get("fromQuotation");

    switch (activeTab) {
      case "quotation":
        return <QuotationCreateForm onCancel={handleCancel} isLoading={isLoading} setIsLoading={setIsLoading} />;

      case "receipt":
        return (
          <ReceiptCreateForm
            onCancel={handleCancel}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            fromQuotationId={fromQuotationId}
          />
        );

      case "user":
        if (!isAdmin) {
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600">Only administrators can create new user accounts.</p>
            </motion.div>
          );
        }
        return <UserCreateForm onCancel={handleCancel} isLoading={isLoading} setIsLoading={setIsLoading} />;

      default:
        return null;
    }
  };

  const currentTab = availableTabs.find((tab) => tab.id === activeTab);

  return (
    <PageLayout title="Create">
      <div className="mx-auto space-y-4 lg:space-y-6">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 lg:p-6"
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-2 lg:space-x-8" aria-label="Tabs">
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`group inline-flex items-center py-3 lg:py-4 px-2 lg:px-1 border-b-2 font-medium text-sm transition-colors duration-200 min-w-0 ${
                      isActive
                        ? "border-aces-green text-aces-green"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    disabled={isLoading}
                  >
                    {!isActive && (
                      <Icon
                        className={`w-5 h-5 lg:mr-2 text-gray-400 group-hover:text-gray-500`}
                      />
                    )}
                    <span className={isActive ? "inline" : "hidden lg:inline"}>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-4 lg:mt-6">
            {renderTabContent()}
          </div>
        </motion.div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-xl p-8 flex flex-col items-center space-y-4"
              >
                <Loader2 className="w-8 h-8 text-aces-green animate-spin" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Creating {currentTab?.label}...</h3>
                  <p className="text-gray-600 text-sm mt-1">Please wait while we process your request</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
};

export default CreatePage;
