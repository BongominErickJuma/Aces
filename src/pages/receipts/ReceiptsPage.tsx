import React from "react";
import { PageLayout } from "../../components/layout";
import ReceiptsList from "./components/ReceiptsList";

const ReceiptsPage: React.FC = () => {
  return (
    <PageLayout title="Receipts">
      <ReceiptsList />
    </PageLayout>
  );
};

export default ReceiptsPage;
