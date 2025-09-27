import React from 'react';
import { Save, FileText } from 'lucide-react';
import { Button } from './Button';
import { DraftManager } from './DraftManager';

interface DraftMetadata {
  formKey: string;
  savedAt: string;
  title?: string;
  clientName?: string;
  clientPhone?: string;
}

interface DraftStatusProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasDraft: boolean;
  drafts: DraftMetadata[];
  currentDraftKey: string;
  showDraftManager: boolean;
  setShowDraftManager: (show: boolean) => void;
  onLoadDraft: (formKey: string) => void;
  onDeleteDraft: (formKey?: string) => void;
}

export const DraftStatus: React.FC<DraftStatusProps> = ({
  isSaving,
  lastSaved,
  hasDraft,
  drafts,
  currentDraftKey,
  showDraftManager,
  setShowDraftManager,
  onLoadDraft,
  onDeleteDraft,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-3">
      {/* Main Draft Status Bar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-3">
          {/* Save Status */}
          <div className="flex items-center space-x-2">
            {isSaving ? (
              <>
                <Save className="w-4 h-4 animate-pulse text-blue-500" />
                <span className="text-sm text-gray-600">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Save className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">
                  Saved {formatTime(lastSaved)}
                </span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Not saved</span>
              </>
            )}
          </div>

          {/* No more confusing duplicate warnings */}
        </div>

        {/* Draft Actions */}
        <div className="flex items-center space-x-2">
          {drafts.length > 0 && (
            <DraftManager
              drafts={drafts}
              currentDraftKey={currentDraftKey}
              onLoadDraft={onLoadDraft}
              onDeleteDraft={onDeleteDraft}
              onClose={() => setShowDraftManager(false)}
              compact={true}
            />
          )}

          {hasDraft && (
            <Button
              type="button"
              onClick={() => onDeleteDraft()}
              variant="secondary"
              className="text-xs px-2 py-1 text-red-600 hover:bg-red-50"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Full Draft Manager (when expanded) */}
      {showDraftManager && (
        <DraftManager
          drafts={drafts}
          currentDraftKey={currentDraftKey}
          onLoadDraft={onLoadDraft}
          onDeleteDraft={onDeleteDraft}
          onClose={() => setShowDraftManager(false)}
        />
      )}
    </div>
  );
};