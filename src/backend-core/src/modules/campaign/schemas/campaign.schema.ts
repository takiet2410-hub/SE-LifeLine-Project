import { z } from 'zod';

const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'ALL TYPES'] as const;
const validStatuses = ['Draft', 'Upcoming', 'Registration Pending', 'Active', 'Full', 'Completed', 'Cancelled'] as const;

export const CreateCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Campaign name is required'),
    description: z.string().optional(),
    venue: z.string().min(1, 'Venue is required'),
    fullAddress: z.string().min(1, 'Full address is required'),
    startDateTime: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid start date format'
    }).refine((date) => new Date(date).getTime() >= new Date().setHours(0, 0, 0, 0), {
      message: 'Campaign date cannot be in the past'
    }),
    endDateTime: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid end date format'
    }),
    targetBloodGroups: z.array(z.enum(validBloodGroups)).min(1, 'At least one target blood group is required'),
    capacity: z.number().int().positive('Participant capacity must be a positive number'),
    targetUnitsGoal: z.number().int().positive('Target units goal must be a positive number'),
    contactPerson: z.object({
      name: z.string().min(1, 'Contact person name is required'),
      phone: z.string().min(1, 'Contact person phone is required')
    }),
    internalRemarks: z.string().optional(),
    status: z.enum(validStatuses).optional()
  }).refine((data) => new Date(data.endDateTime) >= new Date(data.startDateTime), {
    message: 'End date time must be after or equal to start date time',
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
    startDateTime: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid start date format'
    }).optional(),
    endDateTime: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid end date format'
    }).optional(),
    targetBloodGroups: z.array(z.enum(validBloodGroups)).min(1).optional(),
    capacity: z.number().int().positive('Participant capacity must be a positive number').optional(),
    targetUnitsGoal: z.number().int().positive('Target units goal must be a positive number').optional(),
    contactPerson: z.object({
      name: z.string().min(1),
      phone: z.string().min(1)
    }).optional(),
    internalRemarks: z.string().optional(),
    status: z.enum(validStatuses).optional()
  })
});

export const GetCampaignDetailsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Campaign ID is required')
  })
});
