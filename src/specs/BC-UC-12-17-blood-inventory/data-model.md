# Data Model: Blood Inventory Management (BC-UC-12 → BC-UC-17)

## 1. Entities & Schemas

### 1.1 `BloodBag` (Mongoose Entity)

**Collection**: `blood_bags`

```typescript
import { Schema, model, Document } from 'mongoose';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type BagStatus = 'Available' | 'Reserved' | 'Used' | 'Expired' | 'Discarded';

export interface IStatusHistory {
  previousStatus: string;
  newStatus: string;
  changedBy: string; // User ID / Staff Name
  changedAt: Date;
  reason?: string;
}

export interface ITestResults {
  hiv: 'Negative' | 'Positive';
  hbv: 'Negative' | 'Positive';
  hcv: 'Negative' | 'Positive';
  syphilis: 'Negative' | 'Positive';
  verifiedAt: Date;
}

export interface IBloodBag extends Document {
  bagCode: string; // e.g., "BB-2026-0451"
  bloodCenterId?: Schema.Types.ObjectId;
  bloodType: BloodType;
  volumeMl: number;
  collectionDate: Date;
  expiryDate: Date;
  storageLocation: string; // e.g. "Shelf A-2"
  shelfPosition?: string;
  temperatureCelsius?: number;
  status: BagStatus;
  donorSourceId?: Schema.Types.ObjectId;
  campaignSourceId?: Schema.Types.ObjectId;
  testResults: ITestResults;
  statusHistory: IStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const statusHistorySchema = new Schema<IStatusHistory>({
  previousStatus: { type: String, required: true },
  newStatus: { type: String, required: true },
  changedBy: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  reason: { type: String }
}, { _id: false });

const testResultsSchema = new Schema<ITestResults>({
  hiv: { type: String, enum: ['Negative', 'Positive'], default: 'Negative' },
  hbv: { type: String, enum: ['Negative', 'Positive'], default: 'Negative' },
  hcv: { type: String, enum: ['Negative', 'Positive'], default: 'Negative' },
  syphilis: { type: String, enum: ['Negative', 'Positive'], default: 'Negative' },
  verifiedAt: { type: Date, default: Date.now }
}, { _id: false });

export const bloodBagSchema = new Schema<IBloodBag>({
  bagCode: { type: String, required: true, unique: true, index: true },
  bloodCenterId: { type: Schema.Types.ObjectId, ref: 'BloodCenter' },
  bloodType: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], 
    required: true, 
    index: true 
  },
  volumeMl: { type: Number, required: true, min: 1 },
  collectionDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true, index: true },
  storageLocation: { type: String, required: true },
  shelfPosition: { type: String },
  temperatureCelsius: { type: Number, default: 4 },
  status: { 
    type: String, 
    enum: ['Available', 'Reserved', 'Used', 'Expired', 'Discarded'], 
    default: 'Available', 
    index: true 
  },
  donorSourceId: { type: Schema.Types.ObjectId, ref: 'User' },
  campaignSourceId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
  testResults: { type: testResultsSchema, default: () => ({}) },
  statusHistory: [statusHistorySchema]
}, {
  timestamps: true
});

// Indexes for FEFO queries and filtering
bloodBagSchema.index({ expiryDate: 1, status: 1 });
bloodBagSchema.index({ bloodType: 1, status: 1 });

export const BloodBag = model<IBloodBag>('BloodBag', bloodBagSchema);
```

---

## 2. Validation Rules & State Transitions

### 2.1 State Transition Matrix

```
[Available] ───► [Reserved] ───► [Used] (Terminal)
    │                │
    ├───► [Used]     └───► [Discarded] (Terminal)
    │
    ├───► [Expired] (Terminal)
    │
    └───► [Discarded] (Terminal)
```

- Terminal states (`Used`, `Expired`, `Discarded`) cannot transition to any other status.
