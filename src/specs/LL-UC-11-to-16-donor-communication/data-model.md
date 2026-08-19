# Data Models: Notification, SOS & Content Management
> Extracted from `DatabaseSchema.md`

## NOTIFICATION
```typescript
interface Notification {
  _id: ObjectId;
  recipientUserId: ObjectId; // FK
  type: 'Routine' | 'SOS' | 'Campaign' | 'Appointment';
  channel: 'Email' | 'WebPush';
  title: string;
  body: string;
  sourceRefId: ObjectId; // polymorphic: Appointment/Campaign/SOSRequest/Article
  sourceRefType: string;
  deliveryStatus: 'Pending' | 'Sent' | 'Failed' | 'Retried';
  createdAt: Date;
  readAt: Date | null;
}
```

## NOTIFICATION_PREFERENCE
```typescript
interface NotificationPreference {
  _id: ObjectId;
  donorId: ObjectId; // FK
  sosEmergencyAlerts: boolean;
  appointmentUpdates: boolean;
  campaignNews: boolean;
  updatedAt: Date;
}
```

## ARTICLE
```typescript
interface Article {
  _id: ObjectId;
  authorStaffId: ObjectId; // FK
  title: string;
  bodyContent: string;
  imageUrls: string[]; // Cloudinary
  status: 'Draft' | 'Published' | 'Scheduled';
  publishedAt: Date | null;
}
```
