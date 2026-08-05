import { z } from 'zod';

const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'ALL TYPES', 'All Types'] as const;
const validStatuses = ['Draft', 'Upcoming', 'Registration Pending', 'Active', 'Full', 'Completed', 'Cancelled'] as const;

export const CreateCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Campaign name is required'),
    description: z.string().optional(),
    venue: z.string().min(1, 'Venue is required'),
    fullAddress: z.string().min(1, 'Full address is required'),
    startDate: z.string().optional(),
    startDateTime: z.string().optional(),
    endDate: z.string().optional(),
    endDateTime: z.string().optional(),
    targetBloodGroups: z.array(z.enum(validBloodGroups)).min(1, 'At least one target blood group is required'),
    capacity: z.number().int().positive('Participant capacity must be a positive number'),
    targetUnitsGoal: z.number().int().positive('Target units goal must be a positive number').optional(),
    contactPerson: z.object({
      name: z.string().min(1, 'Contact person name is required'),
      phone: z.string().min(1, 'Contact person phone is required')
    }).optional(),
    internalRemarks: z.string().optional(),
    status: z.enum(validStatuses).optional(),
    bloodCenterId: z.string().optional(),
    timeslots: z.array(z.object({
      startTime: z.string(),
      endTime: z.string(),
      capacity: z.number().int().positive(),
      registeredCount: z.number().int().nonnegative().optional().default(0)
    })).optional()
  }).refine((data) => (data.startDate || data.startDateTime), {
    message: 'Start date or start date time is required',
    path: ['startDateTime']
  }).refine((data) => (data.endDate || data.endDateTime), {
    message: 'End date or end date time is required',
    path: ['endDateTime']
  })
});

export const QueryCampaignSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    location: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});

export const UpdateCampaignSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Campaign ID is required')
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    venue: z.string().min(1).optional(),
    fullAddress: z.string().min(1).optional(),
    startDate: z.string().optional(),
    startDateTime: z.string().optional(),
    endDate: z.string().optional(),
    endDateTime: z.string().optional(),
    targetBloodGroups: z.array(z.enum(validBloodGroups)).min(1).optional(),
    capacity: z.number().int().positive('Participant capacity must be a positive number').optional(),
    targetUnitsGoal: z.number().int().positive('Target units goal must be a positive number').optional(),
    contactPerson: z.object({
      name: z.string().min(1),
      phone: z.string().min(1)
    }).optional(),
    internalRemarks: z.string().optional(),
    status: z.enum(validStatuses).optional(),
    bloodCenterId: z.string().optional(),
    timeslots: z.array(z.object({
      startTime: z.string(),
      endTime: z.string(),
      capacity: z.number().int().positive(),
      registeredCount: z.number().int().nonnegative().optional().default(0)
    })).optional()
  })
});

export const GetCampaignDetailsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Campaign ID is required')
  })
});
