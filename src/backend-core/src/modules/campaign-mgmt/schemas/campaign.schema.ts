import { z } from 'zod';

const SUPPORTED_BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;

const CAMPAIGN_STATUSES = [
  'Draft',
  'Active',
  'Full',
  'Closed',
  'Cancelled',
] as const;

/**
 * Base body schema
 */
const campaignBodySchema = z.object({
  bloodCenterId: z
    .string()
    .min(1, 'Blood Center ID is required'),

  name: z
    .string()
    .min(1, 'Campaign name is required')
    .trim(),

  venue: z
    .string()
    .min(1, 'Venue is required')
    .trim(),

  location: z.object({
    type: z.literal('Point'),

    coordinates: z.tuple(
      [
        z.number(),
        z.number(),
      ],
      {
        errorMap: () => ({
          message:
            'Coordinates must contain [longitude, latitude]',
        }),
      }
    ),
  }),

  startDateTime: z
    .string()
    .datetime('Start date/time must be a valid ISO 8601 date')
    .transform((value) => new Date(value)),

  endDateTime: z
    .string()
    .datetime('End date/time must be a valid ISO 8601 date')
    .transform((value) => new Date(value)),

  targetBloodGroups: z
    .array(
      z.enum(SUPPORTED_BLOOD_GROUPS, {
        errorMap: () => ({
          message: 'Invalid blood group',
        }),
      })
    )
    .min(1, 'At least one blood group must be selected'),

  capacity: z
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be greater than 0'),

  status: z
    .enum(CAMPAIGN_STATUSES, {
      errorMap: () => ({
        message: 'Invalid campaign status',
      }),
    })
    .default('Draft'),
});

/**
 * Create Campaign Body Schema
 */
const createCampaignBodySchema = campaignBodySchema.refine(
  (data) => data.endDateTime > data.startDateTime,
  {
    message: 'End date/time must be after start date/time',
    path: ['endDateTime'],
  }
);

/**
 * Create Campaign Schema for validate middleware
 */
export const createCampaignSchema = z.object({
  body: createCampaignBodySchema,
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

/**
 * Update Campaign Body Schema
 */
const updateCampaignBodySchema = campaignBodySchema
  .partial()
  .passthrough()
  .refine(
    (data) => {
      if (data.startDateTime && data.endDateTime) {
        return data.endDateTime > data.startDateTime;
      }
      return true;
    },
    {
      message: 'End date/time must be after start date/time',
      path: ['endDateTime'],
    }
  );

/**
 * Update Campaign Schema for validate middleware
 */
export const updateCampaignSchema = z.object({
  body: updateCampaignBodySchema,
  query: z.object({}).passthrough().optional(),
  params: z.object({ id: z.string().optional() }).passthrough().optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>['body'];
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>['body'];
