# Spec: BC-UC-10 → BC-UC-11 — Notification Management (Frontend)

> **Spec-Kit Artifact** | **Covers**: BC-UC-10 (View Notification List), BC-UC-11 (View Notification Details)
> **Actor**: Blood Center Staff
> **Module**: `src/frontend/src/modules/notifications/`
> **Figma Section**: "Blood Center" → Notification screens (rows 6 of reference.png)
> **Updated**: 2026-07-21 — Added SOS Visual Distinction spec (NFR-U-03) + Responsive Design

---

## 1. Figma Reference

- **Figma File**: `https://www.figma.com/design/BkMtRpqqIa0J680q1DukPt/Untitled?node-id=1-29566`
- **Design tokens**: Same as shared LifeLine Blood Center theme

### 1.1 Screens Identified from Figma

| Screen ID | Name | Figma Position | Maps to UC |
| :--- | :--- | :--- | :--- |
| NOTIF-LIST | Notification List | Row 6, Col 1 | BC-UC-10 |
| NOTIF-DETAIL | Notification Detail | Row 6, Col 2 | BC-UC-11 |
| NOTIF-DETAIL-SOS | Notification Detail (SOS variant) | Not in Figma — spec-defined | BC-UC-11 + NFR-U-03 |
| NOTIF-CONFIRM-REMOVE | Remove Confirmation Dialog | Reused ConfirmDialog | BC-UC-10 AF-04 |

---

## 2. Screen-by-Screen Functional Requirements

### 2.1 NOTIF-LIST — Notification List Page (BC-UC-10)

**Purpose**: Display all incoming notifications from hospitals, emergency SOS requests, and system-generated alerts.

**UI Elements**:
- Page title: "Notifications"
- **Unread count badge** next to page title (e.g., "Notifications (3)")
- **Filter controls**: by type (All / Normal / SOS), by status (All / Unread / Read)
- **Notification list** (vertical card list):
  - Notification Title
  - Sender name (Hospital name / System)
  - **Type badge**: Normal (blue) vs **SOS (red, visually prominent)** per `NFR-U-03`
  - Creation date (ISO 8601, relative display e.g., "2 hours ago")
  - Read/Unread status (bold for unread, normal for read)
  - **"Remove" button** (trash icon) per row → confirmation dialog (AF-04)
- **Pagination**
- **Empty State**: "No notifications" illustration (AF-01)

**Data Binding** (from `DatabaseSchema.md → NOTIFICATION`):
```typescript
interface Notification {
  _id: string;
  recipientUserId: string;
  type: 'Routine' | 'SOS' | 'Campaign' | 'System';
  channel: 'Email' | 'WebPush';
  title: string;
  body: string;
  sourceRefId: string;
  sourceRefType: string;
  deliveryStatus: 'Pending' | 'Sent' | 'Failed' | 'Retried';
  createdAt: string;      // ISO 8601
  readAt: string | null;
}
```

**API Endpoint**: `GET /api/v1/bc/notifications` (paginated, filterable by type/status)

---

## 3. 🚨 SOS Visual Distinction Specification (NFR-U-03) — CRITICAL

> **Requirement Source**: `NFR-U-03` — "Emergency alerts are visually distinguishable from routine notifications"
> **Impact**: Failure to distinguish SOS from normal notifications can delay emergency response → **patient safety risk**
> **Status**: ✅ Fully specified below (supplements Figma which only partially addresses this)

### 3.1 Notification List Item — Normal vs SOS Comparison

#### Normal Notification Item
```
┌──────────────────────────────────────────────────────────────┐
│ 🔔  Campaign Update                          2 hours ago  🗑 │
│     From: Blood Center System                               │
│     Your campaign "Spring Drive" has 5 new registrations.    │
│                                           ┌─────────┐       │
│                                           │ Routine  │       │
│                                           └─────────┘       │
└──────────────────────────────────────────────────────────────┘
```

**Tailwind classes**:
```
container: bg-white border border-slate-200 rounded-lg p-4 hover:bg-slate-50
           transition-colors cursor-pointer
icon:      text-slate-400 (Bell icon)
title:     text-slate-900 font-medium (font-semibold if unread)
sender:    text-slate-500 text-sm
body:      text-slate-600 text-sm line-clamp-2
badge:     bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium
time:      text-slate-400 text-xs
```

#### SOS Notification Item — EMERGENCY STYLING
```
┌──────────────────────────────────────────────────────────────┐
│ ▌🚨 EMERGENCY: O- Blood Urgently Needed      5 min ago  🗑  │
│ ▌    From: City General Hospital                             │
│ ▌    Critical: 2000ml O- blood needed by 2026-07-22 14:00.  │
│ ▌    Patient in critical condition.                          │
│ ▌                                         ┌─────────────┐   │
│ ▌                                         │  🔴 SOS      │   │
│ ▌                                         └─────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Tailwind classes**:
```
container: bg-red-50 border border-red-300 border-l-4 border-l-red-600
           rounded-lg p-4 hover:bg-red-100 transition-colors cursor-pointer
           shadow-sm shadow-red-100
icon:      text-red-600 animate-pulse (AlertTriangle icon from lucide-react)
title:     text-red-900 font-bold text-base (always bold, larger than normal)
sender:    text-red-700 text-sm font-medium
body:      text-red-800 text-sm line-clamp-2 font-medium
badge:     bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-bold
           uppercase tracking-wide
time:      text-red-500 text-xs font-semibold
```

### 3.2 Key Visual Differences Summary

| Property | Normal | SOS |
| :--- | :--- | :--- |
| **Background** | `bg-white` | `bg-red-50` |
| **Border** | `border-slate-200` | `border-red-300` + `border-l-4 border-l-red-600` |
| **Icon** | 🔔 Bell (`text-slate-400`) | 🚨 AlertTriangle (`text-red-600 animate-pulse`) |
| **Title font** | `font-medium text-slate-900` | `font-bold text-red-900 text-base` |
| **Badge** | `bg-blue-100 text-blue-700` | `bg-red-600 text-white font-bold uppercase` |
| **Hover** | `hover:bg-slate-50` | `hover:bg-red-100` |
| **Shadow** | none | `shadow-sm shadow-red-100` |
| **Body text** | `text-slate-600` | `text-red-800 font-medium` |
| **Sorting** | Chronological | **SOS always pinned to top** (regardless of date filter) |

### 3.3 SOS Pinning Behavior

- When filter is "All", SOS notifications are **always displayed first** (pinned to top), followed by other notifications in chronological order
- A visual separator line or label "🚨 Emergency Alerts" can be shown above SOS items
- When filter is "SOS only", only SOS items are shown (chronological)
- When filter is "Normal only", SOS items are hidden

### 3.4 Implementation Component: `NotificationItem.tsx`

```typescript
// Pseudocode for conditional rendering
const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const isSOS = notification.type === 'SOS';
  const isUnread = notification.readAt === null;

  return (
    <div className={cn(
      'rounded-lg p-4 transition-colors cursor-pointer',
      isSOS
        ? 'bg-red-50 border border-red-300 border-l-4 border-l-red-600 shadow-sm shadow-red-100 hover:bg-red-100'
        : 'bg-white border border-slate-200 hover:bg-slate-50',
      isUnread && !isSOS && 'bg-blue-50/30'
    )}>
      {/* Icon */}
      {isSOS
        ? <AlertTriangle className="text-red-600 animate-pulse" />
        : <Bell className="text-slate-400" />
      }
      {/* Title */}
      <h3 className={cn(
        isSOS ? 'text-red-900 font-bold text-base' : 'text-slate-900',
        isUnread ? 'font-semibold' : 'font-medium'
      )}>
        {notification.title}
      </h3>
      {/* Badge */}
      <span className={cn(
        'px-2 py-0.5 rounded-full text-xs',
        isSOS
          ? 'bg-red-600 text-white font-bold uppercase tracking-wide px-2.5 py-1'
          : 'bg-blue-100 text-blue-700 font-medium'
      )}>
        {isSOS ? '🔴 SOS' : notification.type}
      </span>
    </div>
  );
};
```

---

## 4. NOTIF-DETAIL — Notification Detail Page (BC-UC-11)

**Purpose**: Display full notification content and mark it as read.

### 4.1 Normal Notification Detail

**UI Elements**:
- Breadcrumb: Notifications > [Notification Title]
- **Notification header card**: Title, Sender, Type badge, Creation date
- **Message body**: Full notification content (rendered text/HTML)
- **Status**: Auto-marked as "Read" when opened (`useEffect` on mount)
- **"Back to List" button** (← arrow + text)

### 4.2 SOS Notification Detail — EMERGENCY LAYOUT

When `type === 'SOS'`, the detail page renders a **prominent emergency banner** at the top:

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Notifications                                     │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │  🚨  EMERGENCY BLOOD REQUEST                             │ │
│ │  ──────────────────────────────────────────────────────── │ │
│ │  Blood Type Needed:   O-                                 │ │
│ │  Urgency Level:       🔴 CRITICAL                        │ │
│ │  Required Quantity:   2000 ml                            │ │
│ │  Requesting Hospital: City General Hospital               │ │
│ │  Deadline:            2026-07-22 14:00 (in 20 hours)     │ │
│ │  Patient Reference:   #PTN-20260722-001                  │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  From: City General Hospital                                 │
│  Received: July 21, 2026 at 18:00                           │
│                                                              │
│  Dear Blood Center Staff,                                    │
│  We urgently need 2000ml of O- blood for an emergency       │
│  surgery patient. The patient is in critical condition...    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**SOS Emergency Banner Component (`SOSAlertBanner.tsx`)**:
```
Tailwind classes:
  container: bg-red-600 text-white rounded-xl p-6 mb-6
             shadow-lg shadow-red-200
  header:    text-xl font-bold flex items-center gap-2
             (🚨 AlertTriangle icon + "EMERGENCY BLOOD REQUEST")
  divider:   border-t border-red-400 my-3
  label:     text-red-200 text-sm uppercase tracking-wide
  value:     text-white font-semibold text-base
  urgency:   (Critical → bg-white text-red-600 font-bold px-3 py-1 rounded-full)
             (High → bg-red-200 text-red-800)
             (Medium → bg-red-100 text-red-700)
  deadline:  text-white font-bold + relative time in parentheses
             if < 6 hours remaining: add "⏰" icon + "animate-pulse"
```

**Data source**: SOS detail data is enriched from `SOS_REQUEST` entity:
```typescript
interface SOSRequestInfo {
  bloodType: string;
  urgencyLevel: 'Critical' | 'High' | 'Medium';
  requiredQuantityMl: number;
  hospitalName: string;
  fulfillmentDeadline: string;  // ISO 8601
  patientReference: string;
}
```

**API enrichment**: `GET /api/v1/bc/notifications/:id` response includes `sosRequestInfo` field when `type === 'SOS'`.

### 4.3 States

- **Loading**: Skeleton (taller skeleton for SOS to account for banner)
- **Not Found**: Error message + "Back to Notifications" (AF-01)

**API Endpoints**:
- `GET /api/v1/bc/notifications/:notificationId`
- `PUT /api/v1/bc/notifications/:notificationId/read` (mark as read, called on mount)

---

## 5. Remove Notification (BC-UC-10 AF-04)

**Flow**:
1. Staff clicks "Remove" (trash icon) on a notification item
2. `ConfirmDialog` shows:
   - Normal: "Are you sure you want to remove this notification?"
   - **SOS**: "⚠ This is an emergency notification. Are you sure you want to remove it? This action cannot be undone." (extra warning for SOS)
3. On confirm → `DELETE /api/v1/bc/notifications/:notificationId`
4. Toast: "Notification removed"
5. Refresh list (optimistic update — remove item immediately from list)

---

## 6. Responsive Design (NFR-U-01)

### 6.1 Notification List Page

| Breakpoint | Layout |
| :--- | :--- |
| **Desktop** (≥1280px) | Sidebar visible, notification list centered (max-width: 800px), comfortable padding |
| **Tablet** (768–1279px) | Sidebar collapsed (icon-only or hidden), notification list full-width with 16px padding |
| **Mobile** (≤767px) | No sidebar (bottom nav or hamburger), notification cards stack full-width, reduced padding (12px), smaller font sizes |

### 6.2 Notification Detail Page

| Breakpoint | Layout |
| :--- | :--- |
| **Desktop** | Centered content (max-width: 720px), SOS banner full-width within container |
| **Tablet** | Full-width with 24px padding, SOS banner grid: 2 columns (label/value pairs) |
| **Mobile** | Full-width 12px padding, SOS banner grid: 1 column (stacked label/value), smaller font |

### 6.3 SOS Banner Responsive

```
Desktop (≥1280px):
┌───────────────────────────────────────────────────────┐
│  🚨 EMERGENCY     │  Blood: O-  │ Urgency: CRITICAL  │
│                    │ Qty: 2000ml │ Deadline: Jul 22   │
│  Hospital: City General Hospital                      │
└───────────────────────────────────────────────────────┘

Mobile (≤767px):
┌─────────────────────────────┐
│  🚨 EMERGENCY BLOOD REQUEST │
│  ────────────────────────── │
│  Blood Type: O-             │
│  Urgency: 🔴 CRITICAL       │
│  Quantity: 2000 ml          │
│  Hospital: City General     │
│  Deadline: Jul 22, 14:00    │
└─────────────────────────────┘
```

---

## 7. Figma vs. UseCaseSpec Alignment Review

| Figma Screen | Matches UC? | Notes |
| :--- | :--- | :--- |
| Notification list with type badges | ✅ BC-UC-10 | Filter by type visible |
| Notification detail page | ✅ BC-UC-11 | Full content displayed |
| SOS visual distinction | ✅ Fully specified | **Spec defines complete SOS styling** — Figma only partially addresses this, spec fills the gap with exact Tailwind classes and component wireframes |
| Remove notification | ✅ BC-UC-10 AF-04 | Remove icon visible on list items |
| Responsive design | ✅ Fully specified | **Spec defines mobile/tablet layouts** — not in Figma |

> **✅ RESOLVED (was ⚠)**: The SOS notification visual distinction is now fully specified in Section 3 with exact Tailwind classes, component wireframes, pinning behavior, and responsive layouts. Frontend devs can implement without Figma update.
