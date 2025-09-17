// General API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export type PaginatedResponse<T> = ApiResponse<{
  items: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>;

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      field?: string;
      reason?: string;
    };
  };
  timestamp: string;
}