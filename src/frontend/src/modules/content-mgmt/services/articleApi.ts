import type { 
  Article, 
  ArticleListResponse, 
  CreateArticlePayload, 
  UpdateArticlePayload, 
  ContentStatsSummary 
} from '../types/article.types';
import { apiClient } from '../../../shared/api/apiClient';

// Helper to map BE article (imageUrls[]) to FE Article (coverImageUrl)
const mapBEArticleToFE = (beArticle: any): Article => ({
  ...beArticle,
  coverImageUrl: beArticle.imageUrls?.[0] || beArticle.coverImageUrl || '',
  // Ensure targetAudience is array
  targetAudience: Array.isArray(beArticle.targetAudience) ? beArticle.targetAudience : 
    (beArticle.targetAudience ? [beArticle.targetAudience] : ['Donors']),
  // Map category if needed
  category: beArticle.category === 'Educational' ? 'Educational' : beArticle.category,
  authorName: typeof beArticle.authorStaffId === 'object' && beArticle.authorStaffId?.fullName
    ? beArticle.authorStaffId.fullName
    : (beArticle.authorName || 'Blood Center Staff'),
  performance: {
    viewsCount: beArticle.viewsCount ?? beArticle.performance?.viewsCount ?? 0,
    publicReachCount: beArticle.performance?.publicReachCount ?? beArticle.performance?.reach ?? 0,
    sharesCount: beArticle.performance?.sharesCount ?? beArticle.performance?.shares ?? 0,
    engagementNote: beArticle.performance?.engagementNote || ''
  }
});

export const articleApi = {
  getArticles: async (params?: { page?: number; limit?: number; category?: string; status?: string; search?: string }): Promise<ArticleListResponse> => {
    const response = await apiClient.get(`/bc/articles`, { params });
    const data = response.data;
    if (data.data && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.map(mapBEArticleToFE)
      };
    }
    return data;
  },

  getArticleById: async (articleId: string): Promise<{ success: boolean; data: Article }> => {
    const response = await apiClient.get(`/bc/articles/${articleId}`);
    const data = response.data;
    if (data.data) {
      return { success: true, data: mapBEArticleToFE(data.data) };
    }
    return data;
  },

  createArticle: async (payload: CreateArticlePayload): Promise<{ success: boolean; message: string; data: Article }> => {
    const response = await apiClient.post(`/bc/articles`, payload);
    return response.data;
  },

  updateArticle: async (articleId: string, payload: UpdateArticlePayload): Promise<{ success: boolean; message: string; data: Article }> => {
    const response = await apiClient.put(`/bc/articles/${articleId}`, payload);
    return response.data;
  },

  deleteArticle: async (articleId: string): Promise<{ success: boolean; message: string; deletedArticleId: string }> => {
    const response = await apiClient.delete(`/bc/articles/${articleId}`);
    return response.data;
  },

  getContentStats: async (): Promise<{ success: boolean; data: ContentStatsSummary }> => {
    const response = await apiClient.get(`/bc/articles/stats/summary`);
    return response.data;
  },

  uploadImage: async (file: File): Promise<{ success: boolean; url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post(`/bc/articles/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getPublicArticles: async (params?: { page?: number; limit?: number; category?: string; search?: string }): Promise<ArticleListResponse> => {
    const response = await apiClient.get(`/articles`, { params });
    const data = response.data;
    if (data.data && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.map(mapBEArticleToFE)
      };
    }
    return data;
  },

  getPublicArticleById: async (articleId: string): Promise<{ success: boolean; data: Article }> => {
    const response = await apiClient.get(`/articles/${articleId}`);
    const data = response.data;
    if (data.data) {
      return { success: true, data: mapBEArticleToFE(data.data) };
    }
    return data;
  }
};
