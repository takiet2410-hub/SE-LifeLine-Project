import { z } from 'zod';

export const CreateAppointmentSchema = z.object({
  body: z.object({
    campaignId: z.string().min(1, 'Campaign ID is required'),
    appointmentDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format'
    }),
    timeSlot: z.string().min(1, 'Time slot is required'),
    answers: z.object({
      medicalHistory: z.record(z.string(), z.any()).optional(),
      currentHealthStatus: z.string().optional(),
      recentTravel: z.string().optional(),
      medicationHistory: z.string().optional(),
      consentGiven: z.boolean().optional()
    }).optional()
  })
});
