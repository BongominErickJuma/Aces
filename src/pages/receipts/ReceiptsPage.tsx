import React, { useState } from 'react';
import { PageLayout } from '../../components/layout';
import ReceiptsList from './components/ReceiptsList';
import { type Receipt } from '../../services/receipts';

type ViewMode = 'list' | 'view';

const ReceiptsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Removed create/edit handlers - use Create page instead

  const handleViewReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setViewMode('view');
  };

  // Removed save handler - not needed without edit mode

  const handleCancel = () => {
    setViewMode('list');
    setSelectedReceipt(null);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'view':
        // For now, redirect to the dedicated viewer page
        // In a real app, you might want to implement an inline viewer here
        return (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Redirecting to receipt viewer...</p>
          </div>
        );

      case 'list':
      default:
        return (
          <ReceiptsList
            onViewReceipt={handleViewReceipt}
          />
        );
    }
  };

  return (
    <PageLayout title="Receipts">
      {renderContent()}
    </PageLayout>
  );
};

export default ReceiptsPage;