import axios from 'axios';
import type { 
  Article, 
  ArticleListResponse, 
  CreateArticlePayload, 
  UpdateArticlePayload, 
  ContentStatsSummary 
} from '../types/article.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const articleApi = {
  getArticles: async (params?: { page?: number; limit?: number; category?: string; status?: string; search?: string }): Promise<ArticleListResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bc/articles`, {
        headers: getAuthHeaders(),
        params
      });
      return response.data;
    } catch (error) {
      console.warn('Falling back to mock article list data:', error);
      return {
        success: true,
        data: mockArticles,
        pagination: { total: mockArticles.length, page: 1, limit: 10, totalPages: 1 },
        summary: mockContentStats
      };
    }
  },

  getArticleById: async (articleId: string): Promise<{ success: boolean; data: Article }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bc/articles/${articleId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.warn('Falling back to mock article details:', error);
      const found = mockArticles.find(a => a._id === articleId) || mockArticles[0];
      return { success: true, data: found };
    }
  },

  createArticle: async (payload: CreateArticlePayload): Promise<{ success: boolean; message: string; data: Article }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/bc/articles`, payload, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.warn('Backend unavailable, simulating article creation:', error);
      const newArt: Article = {
        _id: `art-${Date.now()}`,
        title: payload.title,
        bodyContent: payload.bodyContent || '',
        category: payload.category,
        status: payload.status,
        coverImageUrl: payload.coverImageUrl,
        scheduledAt: payload.scheduledAt || undefined,
        targetAudience: payload.targetAudience || ['Donors'],
        authorStaffId: 'staff-1',
        authorName: 'Dr. Sarah Chen',
        readTimeMinutes: Math.ceil((payload.bodyContent?.length || 100) / 500) || 1,
        viewsCount: 0,
        publicReachCount: 0,
        sharesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockArticles.unshift(newArt);
      return { success: true, message: 'Article created successfully', data: newArt };
    }
  },

  updateArticle: async (articleId: string, payload: UpdateArticlePayload): Promise<{ success: boolean; message: string; data: Article }> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/bc/articles/${articleId}`, payload, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.warn('Backend unavailable, simulating article update:', error);
      const index = mockArticles.findIndex(a => a._id === articleId);
      if (index !== -1) {
        mockArticles[index] = { ...mockArticles[index], ...payload, updatedAt: new Date().toISOString() };
        return { success: true, message: 'Article updated successfully', data: mockArticles[index] };
      }
      throw new Error('Article not found');
    }
  },

  deleteArticle: async (articleId: string): Promise<{ success: boolean; message: string; deletedArticleId: string }> => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/bc/articles/${articleId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.warn('Backend unavailable, simulating article deletion:', error);
      const idx = mockArticles.findIndex(a => a._id === articleId);
      if (idx !== -1) {
        mockArticles.splice(idx, 1);
        return { success: true, message: 'Article deleted successfully', deletedArticleId: articleId };
      }
      throw new Error('Article not found or already deleted');
    }
  },

  getContentStats: async (): Promise<{ success: boolean; data: ContentStatsSummary }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bc/articles/stats/summary`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return { success: true, data: mockContentStats };
    }
  },

  uploadImage: async (file: File): Promise<{ success: boolean; url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await axios.post(`${API_BASE_URL}/bc/articles/upload-image`, formData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.warn('Using local ObjectURL preview fallback for image upload:', error);
      return { success: true, url: URL.createObjectURL(file) };
    }
  }
};

const mockContentStats: ContentStatsSummary = {
  totalArticles: 14,
  publicReach: 18500,
  activeAlerts: 3
};

const mockArticles: Article[] = [
  {
    _id: 'art-001',
    title: 'Kế hoạch hiến máu khẩn cấp nhóm máu O+ mùa hè 2026',
    bodyContent: '<p>Nhu cầu nhóm máu O+ tại các bệnh viện tuyến đầu đang gia tăng nhanh chóng...</p>',
    category: 'Alert',
    status: 'Published',
    coverImageUrl: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800&auto=format&fit=crop&q=60',
    publishedAt: '2026-07-27T08:00:00.000Z',
    targetAudience: ['Donors', 'Hospitals'],
    authorStaffId: 'staff-1',
    authorName: 'Dr. Sarah Chen',
    readTimeMinutes: 3,
    viewsCount: 1420,
    publicReachCount: 1100,
    sharesCount: 56,
    performance: {
      viewsCount: 1420,
      publicReachCount: 1100,
      sharesCount: 56,
      engagementNote: 'Article has 24% more engagement than monthly average'
    },
    createdAt: '2026-07-27T07:30:00.000Z',
    updatedAt: '2026-07-27T08:00:00.000Z'
  },
  {
    _id: 'art-002',
    title: 'Những điều cần lưu ý trước và sau khi hiến máu toàn phần',
    bodyContent: '<p>Hiến máu là nghĩa cử cao đẹp. Để đảm bảo sức khỏe tốt nhất cho người hiến...</p>',
    category: 'Educational',
    status: 'Published',
    coverImageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&auto=format&fit=crop&q=60',
    publishedAt: '2026-07-25T10:00:00.000Z',
    targetAudience: ['Donors'],
    authorStaffId: 'staff-2',
    authorName: 'BS. Nguyễn Văn A',
    readTimeMinutes: 5,
    viewsCount: 890,
    publicReachCount: 750,
    sharesCount: 32,
    performance: {
      viewsCount: 890,
      publicReachCount: 750,
      sharesCount: 32,
      engagementNote: 'Steady reader engagement over the past 3 days'
    },
    createdAt: '2026-07-25T09:00:00.000Z',
    updatedAt: '2026-07-25T10:00:00.000Z'
  },
  {
    _id: 'art-003',
    title: 'Dự thảo thông báo lịch tập huấn công tác tiếp nhận máu',
    bodyContent: '<p>Tài liệu nội bộ về quy trình tiếp nhận và bảo quản túi máu đạt chuẩn ISO...</p>',
    category: 'News',
    status: 'Draft',
    targetAudience: ['Staff'],
    authorStaffId: 'staff-1',
    authorName: 'Dr. Sarah Chen',
    readTimeMinutes: 2,
    viewsCount: 0,
    publicReachCount: 0,
    sharesCount: 0,
    createdAt: '2026-07-28T06:00:00.000Z',
    updatedAt: '2026-07-28T06:00:00.000Z'
  }
];
