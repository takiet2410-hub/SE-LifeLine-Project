import { z } from 'zod';
import { Types } from 'mongoose';

// Định nghĩa schema chung cho phần địa chỉ
const addressSchema = z.object({
  province: z.string().min(1, 'Tỉnh/Thành phố không được để trống'),
  ward: z.string().min(1, 'Phường/Xã không được để trống'),
  street: z.string().min(1, 'Số nhà/Tên đường không được để trống'),
});

const locationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
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

// BloodCenterStaff tự gán bloodCenterId
export const assignBloodCenterSchema = z.object({
  body: z.object({
    bloodCenterId: z.string().refine((val) => Types.ObjectId.isValid(val), {
      message: 'bloodCenterId không hợp lệ',
    }),
  }),
});

// Donor bật/tắt nhận SOS khẩn cấp
export const emergencyOptInSchema = z.object({
  body: z.object({
    emergencyOptIn: z.boolean(),
  }),
});

// Donor cập nhật vị trí (cho SOS geoNear)
export const updateDonorLocationSchema = z.object({
  body: z.object({
    location: locationSchema,
  }),
});

// Blood Center CRUD (Administrator)
export const createBloodCenterSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên trung tâm không được để trống'),
    address: z.string().min(1, 'Địa chỉ không được để trống'),
    location: locationSchema,
    contactPhone: z.string().min(1, 'Số điện thoại không được để trống'),
    operatingHours: z.string().min(1, 'Giờ hoạt động không được để trống'),
  }),
});

export const updateBloodCenterSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => Types.ObjectId.isValid(val), { message: 'ID không hợp lệ' }),
  }),
  body: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    location: locationSchema.optional(),
    contactPhone: z.string().optional(),
    operatingHours: z.string().optional(),
  }),
});

// Hospital CRUD (Administrator)
export const createHospitalSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên bệnh viện không được để trống'),
    address: z.string().min(1, 'Địa chỉ không được để trống'),
    location: locationSchema,
    contactPhone: z.string().min(1, 'Số điện thoại không được để trống'),
  }),
});

export const updateHospitalSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => Types.ObjectId.isValid(val), { message: 'ID không hợp lệ' }),
  }),
  body: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    location: locationSchema.optional(),
    contactPhone: z.string().optional(),
    isVerified: z.boolean().optional(),
  }),
});

// Export types
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type AssignBloodCenterInput = z.infer<typeof assignBloodCenterSchema>['body'];
export type EmergencyOptInInput = z.infer<typeof emergencyOptInSchema>['body'];
export type UpdateDonorLocationInput = z.infer<typeof updateDonorLocationSchema>['body'];
export type CreateBloodCenterInput = z.infer<typeof createBloodCenterSchema>['body'];
export type UpdateBloodCenterInput = z.infer<typeof updateBloodCenterSchema>['body'];
export type CreateHospitalInput = z.infer<typeof createHospitalSchema>['body'];
export type UpdateHospitalInput = z.infer<typeof updateHospitalSchema>['body'];