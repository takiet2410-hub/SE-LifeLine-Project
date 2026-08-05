import { z } from 'zod';

export const createCampaignSchema = z
  .object({
    name: z.string().min(3, 'Tên chiến dịch phải có ít nhất 3 ký tự'),
    description: z.string().min(1, 'Mô tả không được để trống'),
    venue: z.string().min(3, 'Tên địa điểm không được để trống'),
    fullAddress: z.string().min(3, 'Địa chỉ chi tiết không được để trống'),
    startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
    endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
    targetBloodGroups: z
      .array(z.string())
      .min(1, 'Chọn ít nhất 1 nhóm máu ưu tiên'),
    capacity: z
      .number({ invalid_type_error: 'Chỉ tiêu phải là số' })
      .positive('Chỉ tiêu phải lớn hơn 0'),
    targetUnitsGoal: z
      .number({ invalid_type_error: 'Mục tiêu đơn vị máu phải là số' })
      .positive('Mục tiêu phải lớn hơn 0'),
    contactPerson: z.object({
      name: z.string().min(2, 'Tên người liên hệ không được để trống'),
      phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
    }),
    status: z.enum(['Draft', 'Upcoming', 'Registration Pending', 'Active', 'Full', 'Completed', 'Cancelled']),
    timeslots: z.array(
      z.object({
        startTime: z.string(),
        endTime: z.string(),
        capacity: z.number().positive(),
        registeredCount: z.number().default(0),
      })
    ).min(1, 'Phải có ít nhất 1 khung giờ'),
  })
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    {
      message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
      path: ['endDate'],
    }
  );

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const screeningSchema = z.object({
  bloodPressure: z.string().optional().or(z.literal('')),
  weight: z.union([z.number().positive(), z.nan()]).optional(),
  bodyTemperature: z.union([z.number().positive(), z.nan()]).optional(),
  hemoglobinLevel: z.union([z.number().positive(), z.nan()]).optional(),
  screeningNotes: z.string().optional(),
  status: z.string(),
});

export type ScreeningInput = z.infer<typeof screeningSchema>;
