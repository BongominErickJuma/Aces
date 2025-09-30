import React from "react";
import { Cloud, CloudOff, Loader, AlertCircle, RefreshCw } from "lucide-react";

interface DraftSyncIndicatorProps {
  syncStatus: "synced" | "syncing" | "error" | "offline";
  lastSaved: Date | null;
  isSaving: boolean;
  lastSyncError?: string | null;
  isCloudSyncEnabled: boolean;
  hasDraft: boolean;
  onClearDraft: () => void;
  onSyncDraft?: () => void;
}

export const DraftSyncIndicator: React.FC<DraftSyncIndicatorProps> = ({
  syncStatus,
  lastSaved,
  isSaving,
  lastSyncError,
  isCloudSyncEnabled,
  hasDraft,
  onClearDraft,
  onSyncDraft,
}) => {

  const getSyncIcon = () => {
    if (!hasDraft || !isCloudSyncEnabled) {
      return <CloudOff className="w-4 h-4 text-gray-500" />;
    }

    switch (syncStatus) {
      case "syncing":
        return <Loader className="w-4 h-4 text-blue-600 animate-spin" />;
      case "synced":
        return <Cloud className="w-4 h-4 text-green-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <CloudOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSyncMessage = () => {
    if (!hasDraft) {
      if (!isCloudSyncEnabled) {
        return "Sign in to enable draft saving";
      }
      return "No draft saved";
    }

    if (isSaving) {
      return "Saving draft...";
    }

    if (!isCloudSyncEnabled) {
      return "Sign in to enable draft saving";
    }

    switch (syncStatus) {
      case "syncing":
        return "Syncing to cloud...";
      case "synced":
        if (lastSaved) {
          return `Cloud synced ${new Date(lastSaved).toLocaleTimeString()}`;
        }
        return "Cloud synced";
      case "error":
        return lastSyncError || "Sync failed";
      default:
        return "Offline - unable to save draft";
    }
  };

  const getIndicatorColor = () => {
    if (!hasDraft || !isCloudSyncEnabled) return "bg-gray-50 border-gray-200";

    switch (syncStatus) {
      case "syncing":
        return "bg-blue-50 border-blue-200";
      case "synced":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getTextColor = () => {
    if (!hasDraft || !isCloudSyncEnabled) return "text-gray-600";

    switch (syncStatus) {
      case "syncing":
        return "text-blue-600";
      case "synced":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getIndicatorColor()} transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getSyncIcon()}
          <span className={`text-sm ${getTextColor()}`}>{getSyncMessage()}</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Manual sync button (only show if cloud sync is enabled and there's an error) */}
          {hasDraft && isCloudSyncEnabled && syncStatus === "error" && onSyncDraft && (
            <button
              type="button"
              onClick={onSyncDraft}
              className="p-1.5 rounded hover:bg-white/50 transition-colors"
              title="Retry sync"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          )}

          {/* Clear draft button - only show when there's a draft */}
          {hasDraft && (
            <button
              type="button"
              onClick={onClearDraft}
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Clear Draft
            </button>
          )}
        </div>
      </div>

      {/* Error details */}
      {hasDraft && syncStatus === "error" && lastSyncError && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
          {lastSyncError}
        </div>
      )}

      {/* Not authenticated notice */}
      {!isCloudSyncEnabled && (
        <div className="mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <CloudOff className="w-3 h-3" />
            <span>Sign in to save drafts</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact version for inline use
export const DraftSyncBadge: React.FC<{
  syncStatus: "synced" | "syncing" | "error" | "offline";
  isCloudSyncEnabled: boolean;
}> = ({ syncStatus, isCloudSyncEnabled }) => {
  if (!isCloudSyncEnabled) {
    return (
      <div className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full">
        <CloudOff className="w-3 h-3 text-gray-500" />
        <span className="text-xs text-gray-600">Local</span>
      </div>
    );
  }

  const getBadgeContent = () => {
    switch (syncStatus) {
      case "syncing":
        return (
          <>
            <Loader className="w-3 h-3 text-blue-600 animate-spin" />
            <span className="text-xs text-blue-600">Syncing</span>
          </>
        );
      case "synced":
        return (
          <>
            <Cloud className="w-3 h-3 text-green-600" />
            <span className="text-xs text-green-600">Synced</span>
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="w-3 h-3 text-red-600" />
            <span className="text-xs text-red-600">Error</span>
          </>
        );
      default:
        return (
          <>
            <CloudOff className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-600">Offline</span>
          </>
        );
    }
  };

  const getBadgeColor = () => {
    switch (syncStatus) {
      case "syncing":
        return "bg-blue-100";
      case "synced":
        return "bg-green-100";
      case "error":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${getBadgeColor()}`}>
      {getBadgeContent()}
    </div>
  );
};