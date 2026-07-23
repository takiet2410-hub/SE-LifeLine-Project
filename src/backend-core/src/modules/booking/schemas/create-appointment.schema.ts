import { z } from 'zod';

export const CreateAppointmentSchema = z.object({
  body: z.object({
    campaignId: z.string().min(1, 'Campaign ID is required'),
    appointmentDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format'
    }),
    timeSlot: z.string().min(1, 'Time slot is required'),
    answers: z.object({
      responses: z.array(z.object({
        questionId: z.string(),
        selectedOptions: z.array(z.string()).min(1, 'Phải chọn ít nhất 1 đáp án'),
        description: z.string().optional()
      })).min(8, 'Phải trả lời đầy đủ 8 câu hỏi sàng lọc')
    })
  })
});
