export interface DashboardStats {
  period: string;
  totalUsers: number;
  totalQuotations: number;
  totalReceipts: number;
  internationalOrders: number;
  officeMoves: number;
  residentialMoves: number;
  overview: {
    totalUsers: {
      count: number;
      active: number;
      change: string;
    };
    totalDocuments: {
      quotations: number;
      receipts: number;
      quotationsChange: string;
      receiptsChange: string;
    };
    revenue: {
      total: number;
      current: number;
      change: string;
      currency: string;
    };
    notifications: {
      unread: number;
    };
  };
  breakdowns: {
    quotationsByStatus: Record<string, number>;
    receiptsByStatus: Record<string, number>;
    receiptsByPaymentStatus: Record<string, number>;
  };
  recentActivity: {
    quotations: QuotationSummary[];
    receipts: ReceiptSummary[];
  };
  dateRange: {
    start: string;
    end: string;
    period: string;
  };
}

export interface QuotationSummary {
  _id: string;
  quotationNumber: string;
  type: "Residential" | "International" | "Office";
  client: {
    fullName: string;
    email?: string;
    phone?: string;
  };
  pricing?: {
    totalAmount: number;
    currency: string;
  };
  validity?: {
    status: "active" | "expired" | "converted";
  };
  createdAt: string;
  createdBy: {
    _id: string;
    fullName: string;
    email?: string;
  };
}

export interface ReceiptSummary {
  _id: string;
  receiptNumber: string;
  client: {
    fullName: string;
    email?: string;
    phone?: string;
  };
  payment?: {
    totalAmount: number;
    amountPaid: number;
    balance: number;
    status: "paid" | "partial" | "pending";
    currency: string;
  };
  createdAt: string;
  createdBy: {
    _id: string;
    fullName: string;
    email?: string;
  };
  receiptType?: "box" | "commitment" | "final" | "one_time";
}

export interface RecentDocumentsResponse {
  quotations?: QuotationSummary[];
  receipts?: ReceiptSummary[];
  documents: (QuotationSummary | ReceiptSummary)[];
}

export interface UserPerformance {
  user: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  quotationCount: number;
  totalQuotationValue: number;
  convertedQuotations: number;
  conversionRate: string;
  receiptCount: number;
  totalReceiptValue: number;
  paidReceipts: number;
  paymentRate?: string;
}

export interface UserPerformanceReport {
  period: string;
  totalUsers: number;
  performance: UserPerformance[];
}

export interface DocumentTrend {
  _id: string;
  count: number;
  totalValue: number;
  converted?: number;
  paid?: number;
}

export interface DocumentStatsReport {
  period: string;
  granularity: "daily" | "weekly" | "monthly";
  trends: {
    quotations: DocumentTrend[];
    receipts: DocumentTrend[];
  };
  distribution: {
    quotationStatus: Array<{ _id: string; count: number }>;
    receiptPaymentStatus: Array<{ _id: string; count: number }>;
  };
  dateRange: {
    start: string;
    end: string;
  };
}

export type DocumentType = "quotations" | "receipts" | "all";
export type Period = "7d" | "30d" | "90d" | "1y";
export type MoveType = "International" | "Office" | "Residential" | "all";
