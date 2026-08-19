import { z } from 'zod';

export const CreateSOSRequestSchema = z.object({
  body: z.object({
    bloodType: z.string().min(1, 'Blood type is required'),
    requiredQuantityMl: z.number().min(1, 'Quantity must be greater than 0'),
    urgencyLevel: z.enum(['Critical', 'High', 'Medium']),
    patientReference: z.string().optional(),
    hospitalId: z.string().min(1, 'Hospital is required'),
    fulfillmentDeadline: z.string().datetime({ message: 'Must be a valid ISO datetime' }).refine(
      (value) => new Date(value).getTime() > Date.now(),
      'Fulfillment deadline must be in the future'
    )
  })
});

export const UpdateSOSStatusSchema = z.object({
  body: z.object({
    status: z.enum(['Pending', 'EvaluationInProgress', 'NotificationsDispatched', 'InventoryDispatched', 'Fulfilled', 'Expired', 'Cancelled', 'EvaluationFailed'])
  })
});

export const SOSQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).refine((value) => Number(value) <= 100, 'Limit must not exceed 100').optional(),
    status: z.enum(['Pending', 'EvaluationInProgress', 'NotificationsDispatched', 'InventoryDispatched', 'Fulfilled', 'Expired', 'Cancelled', 'EvaluationFailed']).optional(),
    urgencyLevel: z.enum(['Critical', 'High', 'Medium']).optional(),
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']).optional(),
    search: z.string().trim().max(100).optional()
  })
});

export const RespondSOSSchema = z.object({
  body: z.object({
    response: z.enum(['accepted', 'declined'])
  })
});

export const FulfillFromInventorySchema = z.object({
  body: z.object({
    bagIds: z.array(z.string().length(24)).min(1, 'At least one bag ID is required').max(50)
  })
});

export const RecordDirectDonationSchema = z.object({
  body: z.object({
    volumeMl: z.number().min(50, 'Thể tích tối thiểu là 50ml').max(20000, 'Thể tích không được vượt quá 20.000ml'),
    fastTrackCode: z.string().optional(),
    donorId: z.string().optional(),
    donorName: z.string().min(1, 'Tên người hiến máu không được để trống'),
    idDocumentNumber: z.string().optional(),
    donorPhone: z.string().optional(),
    bloodType: z.string().optional(),
    note: z.string().optional()
  })
});
