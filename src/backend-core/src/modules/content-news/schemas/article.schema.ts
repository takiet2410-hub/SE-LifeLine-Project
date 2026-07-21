import { z } from 'zod';

export const ARTICLE_CATEGORIES = ['News', 'Alert', 'Educational'] as const;
export const ARTICLE_STATUSES = ['Draft', 'Published'] as const;
export const TARGET_AUDIENCES = ['Donors', 'Staff', 'Hospitals'] as const;

/**
 * Base Article body schema
 */
const articleBodySchema = z.object({
  authorStaffId: z.string().optional(),
  authorName: z.string().optional(),

  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),

  bodyContent: z
    .string({ required_error: 'Body content is required' })
    .min(1, 'Body content is required')
    .trim(),

  category: z.enum(ARTICLE_CATEGORIES, {
    errorMap: () => ({ message: 'Invalid article category' }),
  }),

  status: z
    .enum(ARTICLE_STATUSES, {
      errorMap: () => ({ message: 'Invalid article status' }),
    })
    .default('Draft'),

  targetAudience: z
    .array(
      z.enum(TARGET_AUDIENCES, {
        errorMap: () => ({ message: 'Invalid target audience' }),
      })
    )
    .default([]),

  featuredMediaUrl: z.string().optional(),
});

/**
 * Create Article Body Schema with targetAudience rule for Published
 */
const createArticleBodySchema = articleBodySchema.refine(
  (data) => {
    if (data.status === 'Published') {
      return Array.isArray(data.targetAudience) && data.targetAudience.length > 0;
    }
    return true;
  },
  {
    message: 'At least one target audience must be selected before publishing.',
    path: ['targetAudience'],
  }
);

/**
 * Create Article Schema for validate middleware
 */
export const createArticleSchema = z.object({
  body: createArticleBodySchema,
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

/**
 * Update Article Body Schema
 */
const updateArticleBodySchema = articleBodySchema
  .partial()
  .passthrough()
  .refine(
    (data) => {
      if (data.status === 'Published' && data.targetAudience !== undefined) {
        return Array.isArray(data.targetAudience) && data.targetAudience.length > 0;
      }
      return true;
    },
    {
      message: 'At least one target audience must be selected before publishing.',
      path: ['targetAudience'],
    }
  );

/**
 * Update Article Schema for validate middleware
 */
export const updateArticleSchema = z.object({
  body: updateArticleBodySchema,
  query: z.object({}).passthrough().optional(),
  params: z.object({ id: z.string().optional() }).passthrough().optional(),
});

/**
 * Article List Query Schema
 */
export const articleQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 12) : 12)),
    category: z.enum(ARTICLE_CATEGORIES).optional(),
    status: z.enum(ARTICLE_STATUSES).optional(),
  }),
  body: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>['body'];
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>['body'];
export type ArticleQueryParams = z.infer<typeof articleQuerySchema>['query'];
