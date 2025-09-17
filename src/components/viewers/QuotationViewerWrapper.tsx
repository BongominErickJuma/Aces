import React from "react";
import { useParams } from "react-router-dom";
import QuotationViewer from "../../pages/quotations/components/QuotationViewer";

const QuotationViewerWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Invalid quotation ID</div>;
  }

  return <QuotationViewer quotationId={id} />;
};

export default QuotationViewerWrapper;
