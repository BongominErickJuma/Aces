import React from "react";
import { PageLayout } from "../../components/layout";
import QuotationsList from "./components/QuotationsList";
import { type Quotation } from "../../services/quotations";

const QuotationsPage: React.FC = () => {
  const handleViewQuotation = (quotation: Quotation) => {
    // For now, just redirect to the dedicated viewer page
    // In a real app, you might want to implement an inline viewer here
    console.log("Viewing quotation:", quotation);
  };

  const renderContent = () => {
    return <QuotationsList onViewQuotation={handleViewQuotation} />;
  };

  return <PageLayout title="Quotations">{renderContent()}</PageLayout>;
};

export default QuotationsPage;
