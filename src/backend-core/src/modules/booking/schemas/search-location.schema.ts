import { z } from 'zod';

export const SearchLocationSchema = z.object({
  query: z.object({
    lat: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
    lng: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
    radius: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
    date: z.string().optional(),
    bloodType: z.string().optional(),
    crowdingLevel: z.enum(['Low', 'Medium', 'High']).optional(),
    includeFacilities: z.string().optional().transform(val => val === 'true')
  })
});
