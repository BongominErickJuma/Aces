import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Trash2, Clock, User, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from './Button';

interface DraftMetadata {
  formKey: string;
  savedAt: string;
  title?: string;
  clientName?: string;
  clientPhone?: string;
}

interface DraftManagerProps {
  drafts: DraftMetadata[];
  currentDraftKey: string;
  onLoadDraft: (formKey: string) => void;
  onDeleteDraft: (formKey: string) => void;
  onClose: () => void;
  compact?: boolean;
}

export const DraftManager: React.FC<DraftManagerProps> = ({
  drafts,
  currentDraftKey,
  onLoadDraft,
  onDeleteDraft,
  onClose,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const sortedDrafts = drafts.sort((a, b) =>
    new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getClientDisplay = (draft: DraftMetadata) => {
    if (draft.clientName) {
      return draft.clientName;
    }
    const parts = draft.formKey.split('-');
    if (parts.length > 2) {
      return parts.slice(2).join('-').replace(/-/g, ' ');
    }
    return 'Untitled Draft';
  };

  if (drafts.length === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <FileText className="w-4 h-4" />
        <span>{drafts.length} draft{drafts.length !== 1 ? 's' : ''} available</span>
        <Button
          type="button"
          onClick={() => setIsExpanded(true)}
          variant="secondary"
          className="text-xs px-2 py-1"
        >
          View
        </Button>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-80 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Available Drafts</h3>
                <Button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  variant="secondary"
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {sortedDrafts.map((draft) => {
                  const clientDisplay = getClientDisplay(draft);
                  const isCurrentDraft = draft.formKey === currentDraftKey;

                  return (
                    <div
                      key={draft.formKey}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isCurrentDraft
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <User className={`w-4 h-4 ${
                          isCurrentDraft ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                        <div>
                          <div className="font-medium text-sm">
                            {clientDisplay}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(draft.savedAt)}</span>
                            {isCurrentDraft && (
                              <span className="text-blue-600 font-medium">(Current)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!isCurrentDraft && (
                          <Button
                            type="button"
                            onClick={() => {
                              onLoadDraft(draft.formKey);
                              setIsExpanded(false);
                            }}
                            variant="primary"
                            className="text-xs px-2 py-1"
                          >
                            Load
                          </Button>
                        )}
                        <Button
                          type="button"
                          onClick={() => onDeleteDraft(draft.formKey)}
                          variant="secondary"
                          className="text-xs px-2 py-1 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg shadow-sm"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">
            Available Drafts ({drafts.length})
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            variant="secondary"
            className="text-sm px-2 py-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Expand
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            className="text-sm px-2 py-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 space-y-2 max-h-60 overflow-y-auto"
          >
            {sortedDrafts.map((draft) => {
              const clientDisplay = getClientDisplay(draft);
              const isCurrentDraft = draft.formKey === currentDraftKey;

              return (
                <div
                  key={draft.formKey}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    isCurrentDraft
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <User className={`w-4 h-4 ${
                      isCurrentDraft
                        ? 'text-blue-600'
                        : 'text-gray-500'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {clientDisplay}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(draft.savedAt)}</span>
                        {isCurrentDraft && (
                          <span className="text-blue-600 font-medium">(Current)</span>
                        )}
                      </div>
                      {draft.clientPhone && (
                        <div className="text-xs text-gray-400">
                          {draft.clientPhone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isCurrentDraft && (
                      <Button
                        type="button"
                        onClick={() => onLoadDraft(draft.formKey)}
                        variant="primary"
                        className="text-xs px-3 py-1"
                      >
                        Load
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={() => onDeleteDraft(draft.formKey)}
                      variant="secondary"
                      className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};