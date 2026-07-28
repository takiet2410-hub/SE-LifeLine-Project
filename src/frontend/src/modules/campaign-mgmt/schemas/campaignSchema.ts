import { z } from 'zod';

export const createCampaignSchema = z
  .object({
    name: z.string().min(3, 'Tên chiến dịch phải có ít nhất 3 ký tự'),
    venue: z.string().min(3, 'Địa điểm tổ chức không được để trống'),
    startDateTime: z.string().min(1, 'Vui lòng chọn thời gian bắt đầu'),
    endDateTime: z.string().min(1, 'Vui lòng chọn thời gian kết thúc'),
    targetBloodGroups: z
      .array(z.string())
      .min(1, 'Chọn ít nhất 1 nhóm máu ưu tiên'),
    capacity: z
      .number({ invalid_type_error: 'Chỉ tiêu phải là số' })
      .positive('Chỉ tiêu phải lớn hơn 0'),
    status: z.enum(['Draft', 'Active', 'Full', 'Closed', 'Cancelled']),
  })
  .refine(
    (data) => new Date(data.endDateTime) > new Date(data.startDateTime),
    {
      message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
      path: ['endDateTime'],
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
