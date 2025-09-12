import React, { useState } from 'react';
import { PageLayout } from '../../components/layout';
import QuotationsList from './components/QuotationsList';
import { type Quotation } from '../../services/quotations';

type ViewMode = 'list' | 'view';

const QuotationsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Removed create/edit handlers - use Create page instead

  const handleViewQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setViewMode('view');
  };

  // Removed save handler - not needed without edit mode

  const handleCancel = () => {
    setViewMode('list');
    setSelectedQuotation(null);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'view':
        // For now, redirect to the dedicated viewer page
        // In a real app, you might want to implement an inline viewer here
        return (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Redirecting to quotation viewer...</p>
          </div>
        );

      case 'list':
      default:
        return (
          <QuotationsList
            onViewQuotation={handleViewQuotation}
          />
        );
    }
  };

  return (
    <PageLayout title="Quotations">
      {renderContent()}
    </PageLayout>
  );
};

export default QuotationsPage;