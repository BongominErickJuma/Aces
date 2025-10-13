import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import type { AdminSummaryResponse, SystemHealth } from "../../types/notification";

interface BulkDeleteModalProps {
  isOpen: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  adminSummary?: AdminSummaryResponse["data"] | null;
  systemHealth?: SystemHealth | null;
}

const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  isOpen,
  loading,
  onConfirm,
  onCancel,
  adminSummary,
  systemHealth,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-lg mx-auto shadow-xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Clean Up Read Notifications</h3>
                <p className="text-xs sm:text-sm text-gray-600">Permanently delete notifications that everyone has seen</p>
              </div>
            </div>

            {/* Explanation Section */}
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs sm:text-sm font-medium text-blue-900">What does this do?</h4>
                  <p className="text-xs sm:text-sm text-blue-800 mt-1">
                    This will permanently delete notifications that have been read by <strong>ALL users</strong> who were supposed to see them.
                    This helps clean up your notification system and free up storage space.
                  </p>
                </div>
              </div>
            </div>

            {/* System Health Info */}
            {systemHealth && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Current System Health</span>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                        systemHealth.healthScore?.level === "good" || systemHealth.healthScore?.level === "excellent"
                          ? "bg-green-500"
                          : systemHealth.healthScore?.level === "warning"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      {systemHealth.healthScore?.score || 0}/100
                    </span>
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-600">
                  Cleaning up read notifications will help improve system performance and storage usage.
                </p>
              </div>
            )}

            {/* Statistics */}
            {adminSummary && (
              <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-green-50 p-2 sm:p-3 rounded-lg text-center">
                  <div className="text-base sm:text-lg font-bold text-green-700">
                    {adminSummary.overallStats?.[0]?.totalReadByAll || 0}
                  </div>
                  <div className="text-[10px] sm:text-xs text-green-600">Will be deleted</div>
                </div>
                <div className="bg-blue-50 p-2 sm:p-3 rounded-lg text-center">
                  <div className="text-base sm:text-lg font-bold text-blue-700">
                    {(adminSummary.overallStats?.[0]?.totalNotifications || 0) -
                     (adminSummary.overallStats?.[0]?.totalReadByAll || 0)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-blue-600">Will remain</div>
                </div>
              </div>
            )}

            <div className="mt-4 sm:mt-6 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-yellow-800">
                    <strong>Warning:</strong> This action cannot be undone. Only notifications that have been
                    read by every intended recipient will be deleted.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin inline" />
                    Cleaning up...
                  </>
                ) : (
                  <span className="whitespace-nowrap">Clean Up Read Notifications</span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkDeleteModal;