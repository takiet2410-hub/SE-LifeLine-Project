import Article, { IArticle } from './models/article.model';

export interface ArticleFilterOptions {
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class ArticleRepository {
  /**
   * Create a new article
   */
  async create(articleData: Partial<IArticle>): Promise<IArticle> {
    const article = new Article(articleData);
    return await article.save();
  }

  /**
   * Retrieve articles with pagination and optional filtering
   */
  async findAll(options: ArticleFilterOptions = {}): Promise<{ articles: IArticle[]; total: number; totalPages: number; page: number; limit: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 12);
    const skip = (page - 1) * limit;

    const query: any = { deletedAt: null };
    if (options.category) {
      query.category = options.category;
    }
    if (options.status) {
      query.status = options.status;
    }

    const [articles, total] = await Promise.all([
      Article.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Article.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      articles,
      total,
      totalPages,
      page,
      limit,
    };
  }

  /**
   * Retrieve a non-deleted article by ID
   */
  async findById(id: string): Promise<IArticle | null> {
    return await Article.findOne({ _id: id, deletedAt: null }).exec();
  }

  /**
   * Update an existing article
   */
  async update(id: string, updateData: Partial<IArticle>): Promise<IArticle | null> {
    return await Article.findOneAndUpdate(
      { _id: id, deletedAt: null },
      updateData,
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Soft-delete an article by setting deletedAt
   */
  async softDelete(id: string): Promise<IArticle | null> {
    return await Article.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    ).exec();
  }

  /**
   * Get article metrics (Total Articles, Public Reach, Active Alerts)
   */
  async getStats(): Promise<{ totalArticles: number; publicReach: number; activeAlerts: number }> {
    const [totalArticles, activeAlerts, reachAggregate] = await Promise.all([
      Article.countDocuments({ deletedAt: null }).exec(),
      Article.countDocuments({ deletedAt: null, category: 'Alert', status: 'Published' }).exec(),
      Article.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: null, totalReach: { $sum: '$reachCount' } } },
      ]).exec(),
    ]);

    const publicReach = reachAggregate.length > 0 ? reachAggregate[0].totalReach : 0;

    return {
      totalArticles,
      publicReach,
      activeAlerts,
    };
  }
}

export default new ArticleRepository();
