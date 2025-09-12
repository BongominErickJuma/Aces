import { api } from './api';
import type {
  DashboardStats,
  RecentDocumentsResponse,
  UserPerformanceReport,
  DocumentStatsReport,
  Period,
  DocumentType
} from '../types/dashboard';

export const dashboardAPI = {
  getStats: async (period: Period = '30d'): Promise<DashboardStats> => {
    try {
      const response = await api.get('/dashboard/stats', {
        params: { period }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  getRecentDocuments: async (
    limit: number = 10,
    type: DocumentType = 'all',
    status: string = 'all'
  ): Promise<RecentDocumentsResponse> => {
    try {
      const response = await api.get('/dashboard/recent', {
        params: { limit, type, status }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recent documents:', error);
      throw error;
    }
  },

  getUserPerformanceReport: async (
    period: Period = '30d',
    userId?: string
  ): Promise<UserPerformanceReport> => {
    try {
      const response = await api.get('/reports/user-performance', {
        params: { period, ...(userId && { userId }) }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user performance:', error);
      throw error;
    }
  },

  getDocumentStatsReport: async (
    period: Period = '30d',
    granularity: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<DocumentStatsReport> => {
    try {
      const response = await api.get('/reports/document-stats', {
        params: { period, granularity }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching document stats:', error);
      throw error;
    }
  }
};