import { z } from 'zod';

export const CreateSOSRequestSchema = z.object({
  body: z.object({
    bloodType: z.string().min(1, 'Blood type is required'),
    requiredQuantityMl: z.number().min(1, 'Quantity must be greater than 0'),
    urgencyLevel: z.enum(['Critical', 'High', 'Medium']),
    patientReference: z.string().optional(),
    fulfillmentDeadline: z.string().datetime({ message: 'Must be a valid ISO datetime' })
  })
});

export const UpdateSOSStatusSchema = z.object({
  body: z.object({
    status: z.enum(['Pending', 'EvaluationInProgress', 'NotificationsDispatched', 'Fulfilled', 'Expired', 'Cancelled', 'EvaluationFailed'])
  })
});

export const SOSQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.string().optional(),
    urgencyLevel: z.string().optional()
  })
});

export const RespondSOSSchema = z.object({
  body: z.object({
    response: z.enum(['accepted', 'declined'])
  })
});
