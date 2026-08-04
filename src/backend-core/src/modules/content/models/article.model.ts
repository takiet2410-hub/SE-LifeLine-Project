import mongoose, { Document, Schema } from 'mongoose';

export type ArticleStatus = 'Draft' | 'Published' | 'Unpublished';

export interface IArticle extends Document {
  authorStaffId: mongoose.Types.ObjectId;
  title: string;
  bodyContent: string;
  imageUrls: string[];
  status: ArticleStatus;
  category?: 'News' | 'Alert' | 'Educational' | 'Campaign';
  targetAudience?: string[];
  readTimeMinutes?: number;
  viewsCount?: number;
  performance?: {
    reach?: number;
    shares?: number;
  };
  scheduledAt?: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema: Schema = new Schema({
  authorStaffId: { type: Schema.Types.ObjectId, ref: 'StaffProfile', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  bodyContent: { type: String, default: '' },
  imageUrls: { type: [String], default: [] },
  status: { 
    type: String, 
    enum: ['Draft', 'Published', 'Unpublished'], 
    default: 'Draft', 
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['News', 'Alert', 'Educational', 'Campaign'],
    default: 'News'
  },
  targetAudience: { type: [String], default: [] },
  readTimeMinutes: { type: Number, default: 0 },
  viewsCount: { type: Number, default: 0 },
  performance: {
    reach: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },
  scheduledAt: { type: Date, default: null },
  publishedAt: { type: Date, default: null }
}, {
  timestamps: true,
  collection: 'articles'
});

ArticleSchema.index({ title: 'text' });
ArticleSchema.index({ status: 1, publishedAt: -1 });

export const Article = mongoose.model<IArticle>('Article', ArticleSchema);
