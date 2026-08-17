import { z } from 'zod';
import { Types } from 'mongoose';

const isValidObjectId = (val: string) => Types.ObjectId.isValid(val);

export const ArticleCategorySchema = z.enum(['News', 'Alert', 'Educational', 'Campaign']);
export const ArticleStatusSchema = z.enum(['Draft', 'Published', 'Scheduled']);
export const TargetAudienceSchema = z.enum(['Donors', 'Staff', 'Hospitals']);

export const QueryArticleListSchema = z.object({
  query: z.object({
    page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1)).default(1),
    limit: z.preprocess((val) => (val ? Number(val) : 10), z.number().int().min(1).max(100)).default(10),
    category: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional()
  }).optional()
});

export const GetArticleByIdSchema = z.object({
  params: z.object({
    articleId: z.string().refine(isValidObjectId, { message: 'Invalid articleId format' })
  })
});

export const CreateArticleSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
    bodyContent: z.string().optional().default(''),
    category: ArticleCategorySchema.default('News'),
    status: ArticleStatusSchema.default('Draft'),
    coverImageUrl: z.string().url().or(z.string().length(0)).optional(),
    scheduledAt: z.string().or(z.date()).optional().nullable(),
    targetAudience: z.array(TargetAudienceSchema).optional().default(['Donors'])
  }).superRefine((article, ctx) => {
    if (article.status === 'Scheduled' && !article.scheduledAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scheduledAt'], message: 'Scheduled articles require a publish date' });
    }
    if (article.scheduledAt && new Date(article.scheduledAt).getTime() <= Date.now()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scheduledAt'], message: 'Publish date must be in the future' });
    }
  })
});

export const UpdateArticleSchema = z.object({
  params: z.object({
    articleId: z.string().refine(isValidObjectId, { message: 'Invalid articleId format' })
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    bodyContent: z.string().optional(),
    category: ArticleCategorySchema.optional(),
    status: ArticleStatusSchema.optional(),
    coverImageUrl: z.string().optional().nullable(),
    scheduledAt: z.string().or(z.date()).optional().nullable(),
    targetAudience: z.array(TargetAudienceSchema).optional()
  }).superRefine((article, ctx) => {
    if (article.status === 'Scheduled' && !article.scheduledAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scheduledAt'], message: 'Scheduled articles require a publish date' });
    }
    if (article.scheduledAt && new Date(article.scheduledAt).getTime() <= Date.now()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scheduledAt'], message: 'Publish date must be in the future' });
    }
  })
});

export type CreateArticleInput = z.infer<typeof CreateArticleSchema>['body'];
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>['body'];
