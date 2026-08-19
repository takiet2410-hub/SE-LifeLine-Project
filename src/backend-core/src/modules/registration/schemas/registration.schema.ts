import { z } from 'zod';
import { Types } from 'mongoose';

const isValidObjectId = (val: string) => Types.ObjectId.isValid(val);

export const QueryRegistrationListSchema = z.object({
  params: z.object({
    campaignId: z.string().refine((val) => val === 'all' || isValidObjectId(val), { message: 'Invalid campaignId format' })
  }),
  query: z.object({
    page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1)).default(1),
    limit: z.preprocess((val) => (val ? Number(val) : 20), z.number().int().min(1).max(100)).default(20),
    status: z.string().optional(),
    bloodType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.enum(['appointmentDate', 'createdAt', 'status']).optional().default('appointmentDate'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
    search: z.string().optional()
  }).optional()
});

export const GetRegistrationDetailsSchema = z.object({
  params: z.object({
    registrationId: z.string().refine(isValidObjectId, { message: 'Invalid registrationId format' })
  })
});

export const UpdateScreeningSchema = z.object({
  params: z.object({
    registrationId: z.string().refine(isValidObjectId, { message: 'Invalid registrationId format' })
  }),
  body: z.object({
    bloodType: z.enum([
      'A+',
      'A-',
      'B+',
      'B-',
      'AB+',
      'AB-',
      'O+',
      'O-',
      'Unknown'
    ], {
      message: "Blood type must be one of: 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'"
    }).optional(),
    testResult: z.enum(['Pass', 'Rejected', 'Pending'], {
      message: "testResult must be 'Pass', 'Rejected', or 'Pending'"
    }).optional(),
    donationVolume: z.number().positive({ message: 'donationVolume must be greater than 0' }).optional(),
    vitals: z.object({
      bloodPressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/, {
        message: 'bloodPressure must match pattern SYS/DIA (e.g. 120/80)'
      }).optional(),
      weight: z.number().positive({ message: 'weight must be greater than 0' }).optional(),
      bodyTemperature: z.number().positive({ message: 'bodyTemperature must be greater than 0' }).optional(),
      hemoglobinLevel: z.number().positive({ message: 'hemoglobinLevel must be greater than 0' }).optional()
    }).optional(),
    screeningNotes: z.string().max(1000).optional(),
    status: z.enum([
      'Pending',
      'Confirmed',
      'Rejected',
      'CheckedIn',
      'Examining',
      'Eligible',
      'Ineligible',
      'Completed',
      'Eligible for Donation',
      'Ineligible for Donation',
      'Donation Completed'
    ], {
      message: "Status must be one of: 'Pending', 'Confirmed', 'Rejected', 'CheckedIn', 'Examining', 'Eligible', 'Ineligible', 'Completed', 'Eligible for Donation', 'Ineligible for Donation', 'Donation Completed'"
    }).optional(),
    responses: z.array(
      z.object({
        questionId: z.string(),
        selectedOptions: z.array(z.string()),
        description: z.string().optional()
      })
    ).optional()
  })
});
