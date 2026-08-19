import { z } from 'zod';

export const NotificationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    type: z.enum(['SOS', 'Campaign', 'Routine', 'Appointment']).optional(),
    status: z.enum(['read', 'unread', 'all']).optional(),
    channel: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
});

export const MarkReadSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid().or(z.string().length(24))).min(1).max(100).optional(),
    markAllAsRead: z.boolean().optional(),
  }).refine(data => data.ids?.length || data.markAllAsRead, {
    message: "Must provide either 'ids' array or 'markAllAsRead: true'",
  })
});

export const NotificationPreferenceSchema = z.object({
  body: z.object({
    sosEnabled: z.boolean().optional(),
    appointmentEnabled: z.boolean().optional(),
    campaignEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    timezone: z.string().optional(),
  })
});

export const SendNotificationSchema = z.object({
  body: z.object({
    recipientIds: z.array(z.string().length(24)).min(1).max(1000),
    type: z.enum(['SOS', 'Campaign', 'Routine', 'Appointment']),
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(2000),
    payload: z.record(z.string(), z.any()).optional(),
    channels: z.array(z.enum(['InApp', 'Email', 'WebPush'])).default(['InApp']),
    templateId: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
  })
});

export const NotificationTemplateSchema = z.object({
  body: z.object({
    eventType: z.enum([
      'AppointmentConfirmed',
      'AppointmentReminder24h',
      'AppointmentReminder2h',
      'CampaignPublished',
      'DonorEligibilityReached',
      'ProfileVerified',
      'SOSAlert',
      'SOSResponseConfirmed',
      'SOSRequestFulfilled',
      'AppointmentCancelled',
      'AppointmentRescheduled',
      'BloodBagStatusChanged',
      'CampaignReminder',
      'DonationCompleted',
      'EligibilityCheckFailed',
    ]),
    locale: z.string().default('vi'),
    subject: z.string().min(1).max(200),
    bodyHtml: z.string().min(1),
    bodyText: z.string().min(1),
    channels: z.array(z.enum(['InApp', 'Email', 'WebPush'])).default(['InApp']),
    isActive: z.boolean().default(true),
    variables: z.array(z.string()).optional(),
  })
});

export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;
export type MarkRead = z.infer<typeof MarkReadSchema>;
export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;
export type SendNotification = z.infer<typeof SendNotificationSchema>;
export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>;