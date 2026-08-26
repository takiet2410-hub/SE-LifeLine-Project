import { z } from 'zod';

export const bloodTypeEnum = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
export const bagStatusEnum = z.enum(['Available', 'Reserved', 'Used', 'Expired', 'Discarded']);

export const updateStatusSchema = z.object({
  status: bagStatusEnum,
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do chuyển trạng thái túi máu')
});

export const stockInEntrySchema = z.object({
  bloodType: bloodTypeEnum,
  volumeMl: z.number().positive('Volume must be > 0'),
  collectionDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()),
  storageLocation: z.string().min(1, 'Storage location is required')
});

export const stockInBatchSchema = z.object({
  entries: z.array(stockInEntrySchema).min(1, 'At least one blood bag entry is required')
});

export const stockOutSchema = z.object({
  bagIds: z.array(z.string()).min(1, 'Select at least one blood bag'),
  reason: z.enum(['Dispatch', 'Disposal', 'Transfer', 'Quality Quarantine', 'Other']),
  notes: z.string().optional()
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type StockInEntryInput = z.infer<typeof stockInEntrySchema>;
export type StockInBatchInput = z.infer<typeof stockInBatchSchema>;
export type StockOutInput = z.infer<typeof stockOutSchema>;
