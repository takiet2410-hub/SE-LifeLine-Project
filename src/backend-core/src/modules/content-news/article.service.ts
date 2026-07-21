import { Types } from 'mongoose';
import { CreateArticleInput, UpdateArticleInput, ArticleQueryParams } from './schemas/article.schema';
import articleRepository from './article.repository';
import { IArticle } from './models/article.model';

export class ArticleService {
  /**
   * Create a new article
   */
  async createArticle(input: CreateArticleInput, authorStaffId: string = '64f1a0000000000000000001'): Promise<IArticle> {
    const status = input.status || 'Draft';
    const targetAudience = input.targetAudience || [];

    if (status === 'Published' && targetAudience.length === 0) {
      const error = new Error('At least one target audience must be selected before publishing.') as any;
      error.statusCode = 400;
      error.code = 'BUSINESS_RULE_VIOLATION';
      error.details = { field: 'targetAudience' };
      throw error;
    }

    const staffIdStr = input.authorStaffId || authorStaffId;
    const authorStaffIdObj = Types.ObjectId.isValid(staffIdStr)
      ? new Types.ObjectId(staffIdStr)
      : new Types.ObjectId('64f1a0000000000000000001');

    const imageUrls = input.featuredMediaUrl ? [input.featuredMediaUrl] : [];

    const articleData = {
      ...input,
      authorStaffId: authorStaffIdObj,
      imageUrls,
      status,
      targetAudience,
      viewCount: 0,
      reachCount: 0,
    };

    return await articleRepository.create(articleData);
  }

  /**
   * Retrieve all articles with pagination and filtering
   */
  async getAllArticles(params: ArticleQueryParams) {
    const result = await articleRepository.findAll(params);

    // If requested page exceeds totalPages and articles exist, fetch last valid page (FR-008 redirect rule)
    if (params.page && result.totalPages > 0 && params.page > result.totalPages) {
      return await articleRepository.findAll({
        ...params,
        page: result.totalPages,
      });
    }

    return result;
  }

  /**
   * Get article dashboard statistics
   */
  async getArticleStats() {
    return await articleRepository.getStats();
  }

  /**
   * Retrieve an article by ID
   */
  async getArticleById(id: string): Promise<IArticle | null> {
    return await articleRepository.findById(id);
  }

  /**
   * Update an article
   */
  async updateArticle(id: string, input: UpdateArticleInput): Promise<IArticle | null> {
    const article = await articleRepository.findById(id);
    if (!article) {
      return null;
    }

    const newStatus = input.status !== undefined ? input.status : article.status;
    const newTargetAudience = input.targetAudience !== undefined ? input.targetAudience : article.targetAudience;

    if (newStatus === 'Published' && (!newTargetAudience || newTargetAudience.length === 0)) {
      const error = new Error('At least one target audience must be selected before publishing.') as any;
      error.statusCode = 400;
      error.code = 'BUSINESS_RULE_VIOLATION';
      error.details = { field: 'targetAudience' };
      throw error;
    }

    const updateData: any = { ...input };
    if (input.authorStaffId) {
      updateData.authorStaffId = Types.ObjectId.isValid(input.authorStaffId)
        ? new Types.ObjectId(input.authorStaffId)
        : new Types.ObjectId('64f1a0000000000000000001');
    }
    if (input.featuredMediaUrl) {
      updateData.imageUrls = [input.featuredMediaUrl];
    }

    return await articleRepository.update(id, updateData);
  }

  /**
   * Soft-delete an article
   */
  async deleteArticle(id: string): Promise<IArticle | null> {
    const article = await articleRepository.findById(id);
    return await articleRepository.softDelete(id);
  }

  /**
   * Upload featured media image to Cloudinary
   */
  async uploadArticleMedia(fileBuffer: Buffer): Promise<{ url: string }> {
    const cloudinaryService = (await import('./cloudinary.service')).default;
    const url = await cloudinaryService.uploadArticleMedia(fileBuffer);
    return { url };
  }
}

export default new ArticleService();
