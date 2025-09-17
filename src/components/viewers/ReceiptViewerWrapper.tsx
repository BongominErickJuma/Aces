import React from "react";
import { useParams } from "react-router-dom";
import ReceiptViewer from "../../pages/receipts/components/ReceiptViewer";

const ReceiptViewerWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Invalid receipt ID</div>;
  }

  return <ReceiptViewer receiptId={id} />;
};

export default ReceiptViewerWrapper;
