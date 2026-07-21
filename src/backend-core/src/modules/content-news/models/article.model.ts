import { Schema, model, Document, Types } from 'mongoose';

export interface IArticle extends Document {
  authorStaffId: Types.ObjectId;
  authorName?: string;
  title: string;
  bodyContent: string;
  category: 'News' | 'Alert' | 'Educational';
  status: 'Draft' | 'Published';
  targetAudience: ('Donors' | 'Staff' | 'Hospitals')[];
  featuredMediaUrl?: string;
  imageUrls?: string[];
  viewCount: number;
  reachCount: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const articleSchema = new Schema<IArticle>(
  {
    authorStaffId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      default: 'Admin',
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    bodyContent: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['News', 'Alert', 'Educational'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Published'],
      default: 'Draft',
      required: true,
      index: true,
    },
    targetAudience: {
      type: [String],
      enum: ['Donors', 'Staff', 'Hospitals'],
      default: [],
    },
    featuredMediaUrl: {
      type: String,
      default: '',
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reachCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

articleSchema.index({ deletedAt: 1, status: 1, category: 1 });

const Article = model<IArticle>('Article', articleSchema);

export default Article;
