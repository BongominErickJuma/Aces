import { useState, useEffect, useCallback, useRef } from "react";
import { debounce } from "lodash";
import { draftsAPI, draftHelpers, type DraftType } from "../services/drafts";
import { useAuth } from "./useAuth";

interface UseDraftOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
}

type SyncStatus = "synced" | "syncing" | "error" | "offline";

export const useDraft = <T = unknown>(formKey: DraftType, options: UseDraftOptions = {}) => {
  const { autoSave = true, autoSaveInterval = 3000 } = options;
  const { user } = useAuth();

  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("offline");
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  // Check for existing cloud draft on mount
  useEffect(() => {
    const checkExistingDraft = async () => {
      if (!user) {
        setSyncStatus("offline");
        setHasDraft(false);
        return;
      }

      try {
        setSyncStatus("syncing");
        const exists = await draftHelpers.checkDraftExists(formKey);
        setHasDraft(exists);

        if (exists) {
          const response = await draftsAPI.getDraftByType(formKey);
          if (response.success && response.data) {
            setLastSaved(new Date(response.data.lastModified));
          }
        }

        setSyncStatus("synced");
      } catch (error) {
        console.error("Failed to check cloud draft:", error);
        setSyncStatus("error");
        setLastSyncError(error instanceof Error ? error.message : "Failed to check draft");
      }
    };

    checkExistingDraft();
  }, [formKey, user]);

  // Create debounced save function for cloud storage
  const debouncedCloudSaveRef = useRef(
    debounce(async (data: T) => {
      if (!user) {
        console.warn("Cannot save draft: User not authenticated");
        return;
      }

      try {
        setIsSaving(true);
        setSyncStatus("syncing");
        setLastSyncError(null);

        const success = await draftHelpers.saveDraftWithTitle(formKey, data as Record<string, unknown>);

        if (success) {
          setLastSaved(new Date());
          setHasDraft(true);
          setSyncStatus("synced");
        } else {
          throw new Error("Failed to save to cloud");
        }
      } catch (error) {
        console.error("Failed to save cloud draft:", error);
        setSyncStatus("error");
        setLastSyncError(error instanceof Error ? error.message : "Failed to save draft");
      } finally {
        setTimeout(() => setIsSaving(false), 500);
      }
    }, autoSaveInterval)
  );

  // Save draft (cloud-only)
  const saveDraft = useCallback(
    (data: T) => {
      if (!autoSave || !user) return;

      // Cancel any pending saves and schedule new one
      debouncedCloudSaveRef.current.cancel();
      debouncedCloudSaveRef.current(data);
    },
    [autoSave, user]
  );

  // Load draft (cloud-only)
  const loadDraft = useCallback(async (): Promise<T | null> => {
    if (!user) {
      console.warn("Cannot load draft: User not authenticated");
      setSyncStatus("offline");
      return null;
    }

    try {
      setSyncStatus("syncing");
      const data = await draftHelpers.loadDraftData(formKey);

      if (data) {
        setHasDraft(true);

        // Get the latest modified date from cloud
        const response = await draftsAPI.getDraftByType(formKey);
        if (response.success && response.data) {
          setLastSaved(new Date(response.data.lastModified));
        }

        setSyncStatus("synced");
        return data as T;
      } else {
        setSyncStatus("synced");
        return null;
      }
    } catch (error) {
      console.error("Failed to load cloud draft:", error);
      setSyncStatus("error");
      setLastSyncError(error instanceof Error ? error.message : "Failed to load draft");
      return null;
    }
  }, [formKey, user]);

  // Clear draft (cloud-only)
  const clearDraft = useCallback(async () => {
    if (!user) {
      console.warn("Cannot clear draft: User not authenticated");
      return;
    }

    try {
      setSyncStatus("syncing");
      await draftHelpers.clearDraft(formKey);

      setHasDraft(false);
      setLastSaved(null);
      setLastSyncError(null);
      setSyncStatus("synced");

      // Cancel any pending saves
      debouncedCloudSaveRef.current.cancel();
    } catch (error) {
      console.error("Failed to clear draft:", error);
      setSyncStatus("error");
      setLastSyncError(error instanceof Error ? error.message : "Failed to clear draft");
    }
  }, [formKey, user]);

  // Manual sync trigger (for retry on errors)
  const syncDraft = useCallback(async () => {
    // In cloud-only mode, this just retries the last check
    if (!user) {
      console.warn("Cannot sync: User not authenticated");
      return false;
    }

    try {
      setSyncStatus("syncing");
      setLastSyncError(null);

      const exists = await draftHelpers.checkDraftExists(formKey);
      setHasDraft(exists);

      if (exists) {
        const response = await draftsAPI.getDraftByType(formKey);
        if (response.success && response.data) {
          setLastSaved(new Date(response.data.lastModified));
        }
      }

      setSyncStatus("synced");
      return true;
    } catch (error) {
      console.error("Failed to sync draft:", error);
      setSyncStatus("error");
      setLastSyncError(error instanceof Error ? error.message : "Failed to sync draft");
      return false;
    }
  }, [formKey, user]);

  // Cleanup on unmount
  useEffect(() => {
    const debouncedSave = debouncedCloudSaveRef.current;
    return () => {
      debouncedSave.cancel();
    };
  }, []);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    syncDraft,
    hasDraft,
    lastSaved,
    isSaving,
    syncStatus,
    lastSyncError,
    isCloudSyncEnabled: !!user,
  };
};
