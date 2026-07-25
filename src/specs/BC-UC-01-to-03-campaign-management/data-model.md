# Phase 1 Data Model: Campaign Management Module

## Entity Definition: `Campaign`

**Collection Name**: `campaigns`

### Mongoose Interface (`ICampaign`)

```typescript
export interface ICampaign extends Document {
  campaignCode: string;           // Unique code (e.g. ABC-2025-001, CMP-2026-001)
  name: string;                   // Campaign title
  description?: string;           // Optional description
  venue: string;                  // Venue name
  fullAddress: string;            // Physical address
  location?: {                    // GeoJSON Point for 2dsphere spatial index
    type: string;
    coordinates: number[];
  };
  startDateTime: Date;            // Campaign start date/time
  endDateTime: Date;              // Campaign end date/time
  targetBloodGroups: string[];    // Array of blood groups e.g. ["A+", "O-"] or ["ALL TYPES"]
  capacity: number;               // Total participant donor capacity
  registeredCount: number;        // Current registered donors count (default 0)
  targetUnitsGoal: number;        // Target blood units goal
  contactPerson: {
    name: string;
    phone: string;
  };
  internalRemarks?: string;       // Optional staff internal remarks
  status: 'Draft' | 'Upcoming' | 'Registration Pending' | 'Active' | 'Full' | 'Completed' | 'Cancelled';
  bloodCenterId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### Schema Indexes

- Unique index on `campaignCode`
- Index on `startDateTime`
- Index on `status`
- Text index on `venue`, `fullAddress`, `name`
- `2dsphere` index on `location`

### Related Entities

- **Appointment**: Links to `Campaign` via `campaignId: ObjectId FK → Campaign`.
- **User / DonorProfile**: Linked to Appointments under `campaigns/:id/registrations`.
