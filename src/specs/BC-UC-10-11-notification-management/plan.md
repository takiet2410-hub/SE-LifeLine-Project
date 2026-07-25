# Plan: BC-UC-10 → BC-UC-11 — Notification Management (Frontend)

> **Module**: `src/frontend/src/modules/notifications/`
> **Reference**: [spec.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/BC-UC-10-11-notification-management/spec.md)

---

## 1. Component Architecture

```
src/frontend/src/modules/notifications/
├── pages/
│   ├── NotificationListPage.tsx       # BC-UC-10
│   └── NotificationDetailPage.tsx     # BC-UC-11
│
├── components/
│   ├── NotificationItem.tsx           # Single notification row/card
│   ├── NotificationList.tsx           # List of NotificationItems
│   ├── NotificationTypeBadge.tsx      # Routine(blue)/SOS(red)/Campaign(green)/System(gray)
│   ├── SOSAlertBanner.tsx            # Red alert banner for SOS notification details
│   └── NotificationFilterBar.tsx      # Filter by type + read status
│
├── hooks/
│   ├── useNotifications.ts            # React Query: GET list
│   ├── useNotification.ts             # React Query: GET single
│   ├── useMarkAsRead.ts               # React Query mutation: PUT mark read
│   └── useRemoveNotification.ts       # React Query mutation: DELETE
│
├── types/
│   └── notification.types.ts
│
└── i18n/
    ├── notification.vi.json
    └── notification.en.json
```

---

## 2. Routing Plan

```typescript
const notificationRoutes = [
  { path: '/bc/notifications',              element: <NotificationListPage /> },
  { path: '/bc/notifications/:notifId',     element: <NotificationDetailPage /> },
];
```

---

## 3. SOS Visual Distinction Strategy

To satisfy `NFR-U-03`:

| Element | Normal Notification | SOS Notification |
| :--- | :--- | :--- |
| Left border | None or `border-l-4 border-blue-500` | `border-l-4 border-red-600` |
| Background | `bg-white` | `bg-red-50` |
| Badge | `bg-blue-100 text-blue-700` | `bg-red-100 text-red-700 font-bold` |
| Icon | 🔔 Bell icon | 🚨 Alert/Siren icon |
| Font weight | Normal | **Bold title** |
| Detail header | Standard | Red banner with urgency level + blood type |

---

## 4. API Integration

| Method | Path | UC | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/bc/notifications` | BC-UC-10 | List notifications |
| GET | `/bc/notifications/:id` | BC-UC-11 | Get notification detail |
| PUT | `/bc/notifications/:id/read` | BC-UC-11 | Mark as read |
| DELETE | `/bc/notifications/:id` | BC-UC-10 AF-04 | Remove notification |
