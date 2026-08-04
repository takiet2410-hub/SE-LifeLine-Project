export type ArticleCategory = 'News' | 'Alert' | 'Health Tips' | 'Campaign';
export type ArticleStatus = 'Draft' | 'Published' | 'Scheduled';
export type TargetAudience = 'Donors' | 'Staff' | 'Hospitals';

export interface ArticlePerformance {
  viewsCount: number;
  publicReachCount: number;
  sharesCount: number;
  engagementNote?: string;
}

export interface Article {
  _id: string;
  title: string;
  bodyContent: string;
  category: ArticleCategory;
  status: ArticleStatus;
  coverImageUrl?: string;
  publishedAt?: string;
  scheduledAt?: string | null;
  targetAudience: TargetAudience[];
  authorStaffId: string;
  authorName: string;
  readTimeMinutes: number;
  viewsCount: number;
  publicReachCount: number;
  sharesCount: number;
  performance?: ArticlePerformance;
  createdAt: string;
  updatedAt: string;
}

export interface ContentStatsSummary {
  totalArticles: number;
  publicReach: number;
  activeAlerts: number;
}

export interface ArticleListResponse {
  success: boolean;
  data: Article[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary?: ContentStatsSummary;
}

export interface CreateArticlePayload {
  title: string;
  bodyContent?: string;
  category: ArticleCategory;
  status: ArticleStatus;
  coverImageUrl?: string;
  scheduledAt?: string | null;
  targetAudience?: TargetAudience[];
}

export interface UpdateArticlePayload extends Partial<CreateArticlePayload> {}
