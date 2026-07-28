import mongoose, { Document, Schema } from 'mongoose';

export type ArticleCategory = 'News' | 'Alert' | 'Educational' | 'Campaign';
export type ArticleStatus = 'Draft' | 'Published' | 'Scheduled';
export type TargetAudience = 'Donors' | 'Staff' | 'Hospitals';

export interface IArticle extends Document {
  title: string;
  bodyContent: string;
  category: ArticleCategory;
  status: ArticleStatus;
  coverImageUrl?: string;
  publishedAt?: Date;
  scheduledAt?: Date;
  targetAudience: TargetAudience[];
  authorStaffId: mongoose.Types.ObjectId;
  authorName?: string;
  viewsCount: number;
  publicReachCount: number;
  sharesCount: number;
  readTimeMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  bodyContent: { type: String, default: '' },
  category: { 
    type: String, 
    enum: ['News', 'Alert', 'Educational', 'Campaign'], 
    default: 'News', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Draft', 'Published', 'Scheduled'], 
    default: 'Draft', 
    required: true 
  },
  coverImageUrl: { type: String },
  publishedAt: { type: Date },
  scheduledAt: { type: Date },
  targetAudience: { 
    type: [String], 
    enum: ['Donors', 'Staff', 'Hospitals'], 
    default: ['Donors'] 
  },
  authorStaffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, default: 'Dr. Sarah Chen' },
  viewsCount: { type: Number, default: 0, min: 0 },
  publicReachCount: { type: Number, default: 0, min: 0 },
  sharesCount: { type: Number, default: 0, min: 0 },
  readTimeMinutes: { type: Number, default: 1, min: 1 }
}, {
  timestamps: true,
  collection: 'articles'
});

ArticleSchema.index({ status: 1, category: 1, publishedAt: -1 });
ArticleSchema.index({ authorStaffId: 1 });
ArticleSchema.index({ title: 'text' });

export const Article = mongoose.model<IArticle>('Article', ArticleSchema);
