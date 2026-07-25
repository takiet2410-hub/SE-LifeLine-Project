import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string().min(5, 'Tiêu đề bài viết phải có ít nhất 5 ký tự'),
  category: z.string().min(1, 'Vui lòng chọn danh mục bài viết'),
  bodyContent: z.string().min(10, 'Nội dung bài viết phải có ít nhất 10 ký tự'),
  thumbnailUrl: z.string().url('URL hình ảnh không hợp lệ').or(z.string().min(1, 'Nhập link ảnh')),
  status: z.enum(['Draft', 'Published', 'Unpublished']),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
