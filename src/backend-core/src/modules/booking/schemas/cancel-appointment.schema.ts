import { z } from 'zod';

export const CancelAppointmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Appointment ID is required')
  })
});
