import { useState, useEffect, useCallback, useRef } from "react";
import { debounce } from "lodash";

export interface Draft<T = unknown> {
  data: T;
  savedAt: string;
  formKey: string;
  clientName?: string;
  clientPhone?: string;
  sessionId?: string;
}

interface DraftMetadata {
  formKey: string;
  savedAt: string;
  title?: string;
  clientName?: string;
  clientPhone?: string;
  sessionId?: string;
}

interface UseDraftOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
  maxDrafts?: number;
  onSave?: () => void;
  onLoad?: () => void;
  onDelete?: () => void;
}

export const useDraft = <T = unknown>(baseFormKey: string, options: UseDraftOptions = {}) => {
  // Smart draft key: Updates only when client is fully identified
  const [dynamicFormKey, setDynamicFormKey] = useState<string>(baseFormKey);
  const [sessionStartTime] = useState<string>(new Date().toISOString());
  const { autoSaveInterval = 3000, maxDrafts = 5, onSave, onLoad, onDelete } = options;

  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);

  // Smart key update with debouncing - only migrate from base key
  const updateDraftKeyRef = useRef(
    debounce((clientName: string, clientPhone: string, currentKey: string, baseKey: string) => {
      // Only create client-specific key when both name and phone are substantial
      // AND we're currently using the base key (not already client-specific)
      if (clientName.trim().length >= 3 && clientPhone.trim().length >= 8 && currentKey === baseKey) {
        const nameSlug = clientName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
        const phoneSlug = clientPhone.trim().replace(/[^0-9]/g, '');
        const newKey = `${baseKey}-${nameSlug}-${phoneSlug}`;

        // Check if this client-specific key already exists
        const newDraftKey = `draft_${newKey}`;
        const existingClientDraft = localStorage.getItem(newDraftKey);

        if (existingClientDraft) {
          // Client draft already exists - just switch to it, don't migrate
          setDynamicFormKey(newKey);
        } else {
          // No existing client draft - migrate from base key
          const currentDraftKey = `draft_${currentKey}`;
          const baseDraft = localStorage.getItem(currentDraftKey);

          if (baseDraft) {
            // Move draft to new client-specific key
            const draftObj = JSON.parse(baseDraft);
            draftObj.formKey = newKey;
            localStorage.setItem(newDraftKey, JSON.stringify(draftObj));
            localStorage.removeItem(currentDraftKey);

            // Update metadata
            const metadataStr = localStorage.getItem('draft_metadata');
            if (metadataStr) {
              const metadata: DraftMetadata[] = JSON.parse(metadataStr);
              const updatedMetadata = metadata.map(m =>
                m.formKey === currentKey ? { ...m, formKey: newKey } : m
              );
              localStorage.setItem('draft_metadata', JSON.stringify(updatedMetadata));
            }
          }

          setDynamicFormKey(newKey);
        }
      }
    }, 1500)
  );

  const updateDraftKey = useCallback((clientName: string, clientPhone?: string, isLoadingDraft = false) => {
    if (isLoadingDraft) {
      // When loading a draft, just switch to the key directly without migration
      if (clientName.trim().length >= 3 && (clientPhone?.trim().length || 0) >= 8) {
        const nameSlug = clientName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
        const phoneSlug = (clientPhone?.trim() || '').replace(/[^0-9]/g, '');
        const newKey = `${baseFormKey}-${nameSlug}-${phoneSlug}`;
        setDynamicFormKey(newKey);
      }
    } else {
      // Normal typing - use debounced migration
      updateDraftKeyRef.current(clientName, clientPhone || '', dynamicFormKey, baseFormKey);
    }
  }, [baseFormKey, dynamicFormKey]);

  // Check for draft on mount
  useEffect(() => {
    const draftKey = `draft_${dynamicFormKey}`;
    const draft = localStorage.getItem(draftKey);
    setHasDraft(!!draft);
  }, [dynamicFormKey]);

  // Simplified: No dynamic keys - always use base form key

  // Create debounced save function that persists across renders
  const debouncedSaveRef = useRef(
    debounce((data: T, key: string, max: number, timeoutRef: React.RefObject<number | null>, title?: string, clientName?: string, clientPhone?: string) => {
      try {
        setIsSaving(true);

        // Skip saving if data is null or undefined
        if (data === null || data === undefined) {
          return;
        }
        const draftKey = `draft_${key}`;
        const draft: Draft<T> = {
          data,
          savedAt: new Date().toISOString(),
          formKey: key,
          clientName,
          clientPhone,
          sessionId: sessionStartTime, // Track which session created this draft
        };

        localStorage.setItem(draftKey, JSON.stringify(draft));

        // Update metadata
        const metadataStr = localStorage.getItem("draft_metadata");
        const metadata: DraftMetadata[] = metadataStr ? JSON.parse(metadataStr) : [];

        const existingIndex = metadata.findIndex((m) => m.formKey === key);
        const newMetadata: DraftMetadata = {
          formKey: key,
          savedAt: new Date().toISOString(),
          title: title || `Draft - ${key}`,
          clientName,
          clientPhone,
          sessionId: sessionStartTime,
        };

        if (existingIndex >= 0) {
          metadata[existingIndex] = newMetadata;
        } else {
          metadata.push(newMetadata);
        }

        metadata.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

        // Cleanup old drafts if exceeds max
        if (metadata.length > max) {
          const toRemove = metadata.slice(max);
          toRemove.forEach((m) => {
            localStorage.removeItem(`draft_${m.formKey}`);
          });
          metadata.splice(max);
        }

        // Cleanup drafts older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const validMetadata = metadata.filter((m) => {
          const savedDate = new Date(m.savedAt);
          if (savedDate < thirtyDaysAgo) {
            localStorage.removeItem(`draft_${m.formKey}`);
            return false;
          }
          return true;
        });

        localStorage.setItem("draft_metadata", JSON.stringify(validMetadata));

        setLastSaved(new Date());
        setHasDraft(true);
        onSave?.();
      } catch (error) {
        console.error("Failed to save draft:", error);
        setIsSaving(false);

        // Handle quota exceeded error with improved cleanup
        if (error instanceof DOMException && error.name === "QuotaExceededError") {
          try {
            // More aggressive cleanup for quota issues
            const metadataStr = localStorage.getItem("draft_metadata");
            if (metadataStr) {
              const metadata: DraftMetadata[] = JSON.parse(metadataStr);
              // Sort by date and keep only the 3 most recent drafts
              metadata.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

              const draftsToKeep = metadata.slice(0, 3);
              const draftsToRemove = metadata.slice(3);

              // Remove old drafts
              draftsToRemove.forEach((m) => {
                localStorage.removeItem(`draft_${m.formKey}`);
              });

              localStorage.setItem("draft_metadata", JSON.stringify(draftsToKeep));

              // Try saving again with reduced data
              const draftKey = `draft_${key}`;
              const draft: Draft<T> = {
                data,
                savedAt: new Date().toISOString(),
                formKey: key,
                clientName,
                clientPhone,
                sessionId: sessionStartTime,
              };
              localStorage.setItem(draftKey, JSON.stringify(draft));
            }
          } catch (retryError) {
            console.error("Failed to save draft even after aggressive cleanup:", retryError);
          }
        }
      } finally {
        // Use timeout to ensure isSaving state is visible for at least 500ms
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setIsSaving(false);
        }, 500);
      }
    }, autoSaveInterval) // Use the provided autoSaveInterval
  );

  const saveDraft = useCallback(
    (data: T, title?: string, clientName?: string, clientPhone?: string) => {
      // Cancel any pending saves to prevent race conditions
      debouncedSaveRef.current.cancel();
      // Schedule new save
      debouncedSaveRef.current(data, dynamicFormKey, maxDrafts, saveTimeoutRef, title, clientName, clientPhone);
    },
    [dynamicFormKey, maxDrafts]
  );

  const loadDraft = useCallback((): T | null => {
    try {
      const draftKey = `draft_${dynamicFormKey}`;
      const draftStr = localStorage.getItem(draftKey);

      if (!draftStr) return null;

      const draft: Draft<T> = JSON.parse(draftStr);
      setHasDraft(true);
      setLastSaved(new Date(draft.savedAt));
      onLoad?.();
      return draft.data;
    } catch (error) {
      console.error("Failed to load draft:", error);
      return null;
    }
  }, [dynamicFormKey, onLoad]);

  const loadDraftByKey = useCallback((specificFormKey: string): T | null => {
    try {
      const draftKey = `draft_${specificFormKey}`;
      const draftStr = localStorage.getItem(draftKey);

      if (!draftStr) return null;

      const draft: Draft<T> = JSON.parse(draftStr);
      return draft.data;
    } catch (error) {
      console.error("Failed to load draft by key:", error);
      return null;
    }
  }, []);

  const deleteDraft = useCallback(
    (specificFormKey?: string) => {
      try {
        const targetKey = specificFormKey || dynamicFormKey;
        const draftKey = `draft_${targetKey}`;
        localStorage.removeItem(draftKey);

        // Remove from metadata
        const metadataStr = localStorage.getItem("draft_metadata");
        if (metadataStr) {
          const metadata: DraftMetadata[] = JSON.parse(metadataStr);
          const filtered = metadata.filter((m) => m.formKey !== targetKey);
          localStorage.setItem("draft_metadata", JSON.stringify(filtered));
        }

        if (!specificFormKey || specificFormKey === dynamicFormKey) {
          setHasDraft(false);
          setLastSaved(null);
        }
        onDelete?.();
      } catch (error) {
        console.error("Failed to delete draft:", error);
      }
    },
    [dynamicFormKey, onDelete]
  );

  const getAllDraftsForBaseKey = useCallback((): DraftMetadata[] => {
    try {
      const metadataStr = localStorage.getItem("draft_metadata");
      const allMetadata: DraftMetadata[] = metadataStr ? JSON.parse(metadataStr) : [];
      return allMetadata.filter((m) => m.formKey.startsWith(baseFormKey));
    } catch (error) {
      console.error("Failed to get drafts for base key:", error);
      return [];
    }
  }, [baseFormKey]);

  // Duplicate client detection removed - was causing confusion and false positives

  const getAllDrafts = useCallback((): DraftMetadata[] => {
    try {
      const metadataStr = localStorage.getItem("draft_metadata");
      return metadataStr ? JSON.parse(metadataStr) : [];
    } catch (error) {
      console.error("Failed to get all drafts:", error);
      return [];
    }
  }, []);

  // Cleanup debounced functions on unmount
  useEffect(() => {
    const saveFn = debouncedSaveRef.current;
    const updateFn = updateDraftKeyRef.current;
    return () => {
      saveFn.cancel();
      updateFn.cancel();
    };
  }, []);

  // Method to clear all drafts for current base key (for cleanup after submission)
  const clearAllDraftsForForm = useCallback(() => {
    try {
      console.log("Clearing all drafts for base key:", baseFormKey);
      const metadataStr = localStorage.getItem("draft_metadata");
      if (metadataStr) {
        const metadata: DraftMetadata[] = JSON.parse(metadataStr);
        const draftsToRemove = metadata.filter((m) => m.formKey.startsWith(baseFormKey));
        const draftsToKeep = metadata.filter((m) => !m.formKey.startsWith(baseFormKey));

        // Remove all draft data
        draftsToRemove.forEach((draft) => {
          localStorage.removeItem(`draft_${draft.formKey}`);
          console.log("Removed draft:", draft.formKey);
        });

        // Update metadata
        localStorage.setItem("draft_metadata", JSON.stringify(draftsToKeep));
        console.log(`Cleared ${draftsToRemove.length} drafts for ${baseFormKey}`);
      }

      // Clear state
      setHasDraft(false);
      setLastSaved(null);
      onDelete?.();
    } catch (error) {
      console.error("Failed to clear all drafts:", error);
    }
  }, [baseFormKey, onDelete]);

  // Method to clean up duplicate drafts for the same client
  const cleanupDuplicateDrafts = useCallback(() => {
    try {
      const metadataStr = localStorage.getItem("draft_metadata");
      if (!metadataStr) return;

      const metadata: DraftMetadata[] = JSON.parse(metadataStr);
      const baseKeyDrafts = metadata.filter((m) => m.formKey.startsWith(baseFormKey));

      // Group drafts by client (name or phone)
      const clientGroups = new Map<string, DraftMetadata[]>();
      baseKeyDrafts.forEach((draft) => {
        const clientKey = `${draft.clientName?.toLowerCase().trim() || ""}-${
          draft.clientPhone?.replace(/\s+/g, "") || ""
        }`;
        if (clientKey !== "-") {
          if (!clientGroups.has(clientKey)) {
            clientGroups.set(clientKey, []);
          }
          clientGroups.get(clientKey)!.push(draft);
        }
      });

      // For each client with multiple drafts, keep only the most recent one
      let removedCount = 0;
      clientGroups.forEach((drafts) => {
        if (drafts.length > 1) {
          // Sort by date, keep newest
          drafts.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
          const toRemove = drafts.slice(1); // Remove all but the first (newest)

          toRemove.forEach((draft) => {
            localStorage.removeItem(`draft_${draft.formKey}`);
            console.log("Removed duplicate draft:", draft.formKey);
            removedCount++;
          });
        }
      });

      // Update metadata
      if (removedCount > 0) {
        const cleanedMetadata = metadata.filter((m) => {
          const draftKey = `draft_${m.formKey}`;
          return localStorage.getItem(draftKey) !== null;
        });
        localStorage.setItem("draft_metadata", JSON.stringify(cleanedMetadata));
        console.log(`Cleaned up ${removedCount} duplicate drafts for ${baseFormKey}`);
      }
    } catch (error) {
      console.error("Failed to cleanup duplicate drafts:", error);
    }
  }, [baseFormKey]);

  return {
    saveDraft,
    loadDraft,
    loadDraftByKey,
    deleteDraft,
    clearAllDraftsForForm,
    cleanupDuplicateDrafts,
    updateDraftKey,
    getAllDraftsForBaseKey,
    currentDraftKey: dynamicFormKey,
    hasDraft,
    lastSaved,
    isSaving,
    getAllDrafts,
  };
};

export const clearAllDrafts = () => {
  try {
    const keys = Object.keys(localStorage);
    const draftKeys = keys.filter((key) => key.startsWith("draft_"));
    draftKeys.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("draft_metadata");
  } catch (error) {
    console.error("Failed to clear all drafts:", error);
  }
};
