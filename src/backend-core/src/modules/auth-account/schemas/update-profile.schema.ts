import { z } from 'zod';

// Định nghĩa schema chung cho phần địa chỉ
const addressSchema = z.object({
  province: z.string().min(1, 'Tỉnh/Thành phố không được để trống'),
  ward: z.string().min(1, 'Phường/Xã không được để trống'),
  street: z.string().min(1, 'Số nhà/Tên đường không được để trống'),
});

export const updateProfileSchema = z.object({
  body: z.object({
    email: z.string().email('Email không đúng định dạng').optional(),
    phoneNumber: z.string().optional(),
    avatarUrl: z.string().url('URL ảnh không hợp lệ').optional(),
    permanentAddress: addressSchema.optional(),
    currentAddress: addressSchema.optional(),
  }),
});

// Export type để dùng trong Service
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];