import { z } from 'zod';

export const stockInSingleSchema = z
  .object({
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    volumeMl: z.number().positive('Thể tích phải lớn hơn 0'),
    collectionDate: z.string().min(1, 'Chọn ngày lấy máu'),
    expiryDate: z.string().min(1, 'Chọn ngày hết hạn'),
    storageLocation: z.string().min(2, 'Nhập vị trí kho lưu trữ'),
  })
  .refine(
    (data) => new Date(data.expiryDate) > new Date(data.collectionDate),
    {
      message: 'Ngày hết hạn phải sau ngày lấy máu',
      path: ['expiryDate'],
    }
  );

export type StockInSingleInput = z.infer<typeof stockInSingleSchema>;

export const stockOutSchema = z.object({
  reason: z.enum(['Dispatch', 'Disposal', 'Transfer', 'Other']),
  notes: z.string().optional(),
});

export type StockOutInput = z.infer<typeof stockOutSchema>;
