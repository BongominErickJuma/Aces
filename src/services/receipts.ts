import { api } from "./api";
import type { ApiResponse, PaginatedResponse } from "../types/api";

// Receipt types
export interface ReceiptClient {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gender?: string;
}

export interface ReceiptLocations {
  from?: string;
  to?: string;
  movingDate?: string;
}

export interface ReceiptService {
  description: string;
  amount: number;
  quantity: number;
  total: number;
}

export interface PaymentHistory {
  amount: number;
  date: string;
  method: "cash" | "bank_transfer" | "mobile_money";
  reference?: string;
  receivedBy: {
    _id: string;
    fullName: string;
  };
  notes?: string;
}

export interface ReceiptPayment {
  totalAmount: number;
  amountPaid: number;
  balance: number;
  currency: "UGX" | "USD";
  status: "pending" | "partial" | "paid" | "overdue" | "refunded" | "cancelled";
  method?: "cash" | "bank_transfer" | "mobile_money";
  dueDate?: string;
  paymentHistory: PaymentHistory[];
}

export interface ReceiptSignatures {
  receivedBy?: string;
  receivedByTitle?: string;
  clientName?: string;
  signatureDate: string;
}

export interface CommitmentFee {
  commitmentReceiptId?: string;
  amount?: number;
  paidDate?: string;
}

export interface ReceiptVersion {
  versionNumber: number;
  editedBy: {
    _id: string;
    fullName: string;
  };
  editedAt: string;
  changes: Record<string, unknown>;
  reason?: string;
}

export interface Receipt {
  _id: string;
  receiptNumber: string;
  receiptType: "item" | "commitment" | "final" | "one_time";
  moveType?: "international" | "residential" | "office";
  quotationId?: {
    _id: string;
    quotationNumber: string;
    type: string;
  };
  client: ReceiptClient;
  locations?: ReceiptLocations;
  services: ReceiptService[];
  payment: ReceiptPayment;
  signatures: ReceiptSignatures;
  commitmentFee?: CommitmentFee;
  // Receipt type specific fields
  commitmentFeePaid?: number;
  totalMovingAmount?: number;
  finalPaymentReceived?: number;
  version: number;
  versions: ReceiptVersion[];
  createdBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  pdfUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  daysOverdue: number;
}

export interface CreateReceiptData {
  receiptType: "item" | "commitment" | "final" | "one_time";
  moveType?: "international" | "residential" | "office";
  quotationId?: string;
  client: ReceiptClient;
  locations?: ReceiptLocations;
  services?: ReceiptService[];
  payment: {
    currency: "UGX" | "USD";
    method?: "cash" | "bank_transfer" | "mobile_money";
    dueDate?: string;
  };
  signatures?: Partial<ReceiptSignatures>;
  commitmentFee?: CommitmentFee;
  commitmentFeePaid?: number; // For commitment and final receipts
  totalMovingAmount?: number; // For commitment and one_time receipts
  finalPaymentReceived?: number; // For final receipts
  notes?: string;
}

export interface CreateFromQuotationData {
  receiptType: "commitment" | "final" | "one_time";
  payment?: {
    method?: "cash" | "bank_transfer" | "mobile_money";
    dueDate?: string;
  };
  signatures?: Partial<ReceiptSignatures>;
  client?: {
    address?: string;
  };
}

export interface ReceiptFilters {
  page?: number;
  limit?: number;
  receiptType?: string;
  paymentStatus?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
  createdBy?: string;
  overdue?: boolean;
}

export interface AddPaymentData {
  amount: number;
  method: "cash" | "bank_transfer" | "mobile_money";
  reference?: string;
  notes?: string;
}

export interface SendReceiptData {
  recipientEmail: string;
  message?: string;
}

export interface BulkOperationData {
  ids: string[];
}

// Receipts API
export const receiptsAPI = {
  // Get all receipts with filters
  getReceipts: async (filters?: ReceiptFilters): Promise<PaginatedResponse<Receipt[]>> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`/receipts?${params.toString()}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to fetch receipts");
    }
  },

  // Get single receipt by ID
  getReceiptById: async (id: string): Promise<ApiResponse<{ receipt: Receipt }>> => {
    try {
      const response = await api.get(`/receipts/${id}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to fetch receipt");
    }
  },

  // Create new receipt
  createReceipt: async (data: CreateReceiptData): Promise<ApiResponse<{ receipt: Receipt }>> => {
    try {
      const response = await api.post("/receipts", data);
      return response.data;
    } catch (error: unknown) {
      console.error("Full error object:", error);
      const axiosError = error as {
        response?: {
          status?: number;
          data?: { message?: string; error?: { details?: { field?: string; reason?: string } } };
        };
        message?: string;
        code?: string;
      };

      console.error("Axios error details:", {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
        code: axiosError.code,
      });

      let errorMessage = "Failed to create receipt";

      if (axiosError.response?.data?.error?.details?.reason) {
        errorMessage = axiosError.response.data.error.details.reason;
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (axiosError.message) {
        errorMessage = `Network error: ${axiosError.message}`;
      }

      throw new Error(errorMessage);
    }
  },

  // Create receipt from quotation
  createFromQuotation: async (
    quotationId: string,
    data: CreateFromQuotationData
  ): Promise<ApiResponse<{ receipt: Receipt }>> => {
    try {
      const response = await api.post(`/receipts/from-quotation/${quotationId}`, data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to create receipt from quotation");
    }
  },

  // Update receipt
  updateReceipt: async (id: string, data: Partial<CreateReceiptData>): Promise<ApiResponse<{ receipt: Receipt }>> => {
    try {
      const response = await api.put(`/receipts/${id}`, data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: {
          data?: {
            message?: string;
            error?: Record<string, unknown>;
          };
        };
        message?: string;
      };

      let errorMessage = "Failed to update receipt";

      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (axiosError.response?.data?.error) {
        errorMessage =
          typeof axiosError.response.data.error === "string"
            ? axiosError.response.data.error
            : JSON.stringify(axiosError.response.data.error);
      } else if (axiosError.message) {
        errorMessage = axiosError.message;
      }

      throw new Error(errorMessage);
    }
  },

  // Delete receipt (Admin only)
  deleteReceipt: async (id: string): Promise<ApiResponse<{ receiptNumber: string }>> => {
    try {
      const response = await api.delete(`/receipts/${id}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to delete receipt");
    }
  },

  // Add payment to receipt
  addPayment: async (
    id: string,
    data: AddPaymentData
  ): Promise<ApiResponse<{ receipt: { receiptNumber: string; payment: ReceiptPayment } }>> => {
    try {
      const response = await api.post(`/receipts/${id}/payments`, data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to add payment");
    }
  },

  // Get receipt statistics
  getReceiptStats: async (period?: "week" | "month" | "year"): Promise<ApiResponse<{ stats: Record<string, unknown> }>> => {
    try {
      const params = period ? `?period=${period}` : "";
      const response = await api.get(`/receipts/stats${params}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to fetch receipt statistics");
    }
  },

  // Generate receipt PDF
  generatePDF: async (
    id: string
  ): Promise<ApiResponse<{ pdfUrl: string; fileName: string; receiptNumber: string }>> => {
    try {
      const response = await api.get(`/receipts/${id}/pdf`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to generate PDF");
    }
  },

  // Download receipt PDF
  downloadPDF: async (id: string): Promise<Blob> => {
    try {
      const response = await api.get(`/receipts/${id}/download`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to download PDF");
    }
  },

  // Send receipt PDF via email
  sendPDF: async (
    id: string,
    data: SendReceiptData
  ): Promise<ApiResponse<{ receiptNumber: string; sentTo: string }>> => {
    try {
      const response = await api.post(`/receipts/${id}/send`, data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to send receipt PDF");
    }
  },

  // Bulk operations
  bulkDelete: async (ids: string[]): Promise<ApiResponse<{ deletedCount: number; requestedCount: number }>> => {
    try {
      const response = await api.post("/receipts/bulk/delete", { receiptIds: ids });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to delete receipts");
    }
  },

  bulkDownload: async (
    ids: string[]
  ): Promise<
    ApiResponse<{ receipts: Array<{ id: string; receiptNumber: string; downloadUrl: string }>; count: number }>
  > => {
    try {
      const response = await api.post("/receipts/bulk/download", { receiptIds: ids });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || "Failed to prepare bulk download");
    }
  },
};
