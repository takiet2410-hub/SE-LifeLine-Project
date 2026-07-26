# Tasks: BC-UC-10 → BC-UC-11 — Notification Management (Frontend)

> **Reference**: [spec.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/BC-UC-10-11-notification-management/spec.md) | [plan.md](file:///c:/HOCTAP/Project/INTRO2SE/LIFELINE/SE-LifeLine-Project/src/specs/BC-UC-10-11-notification-management/plan.md)
> **Branch**: `feature/BC-UC-10-11-notification-management`

---

## Phase 1: Notification List (BC-UC-10)

- [ ] **T-1.1**: Create types — `notification.types.ts`
- [ ] **T-1.2**: Create hooks — `useNotifications.ts`, `useRemoveNotification.ts`
- [ ] **T-1.3**: Build `NotificationTypeBadge.tsx` — color-coded by type
- [ ] **T-1.4**: Build `NotificationItem.tsx`
  - Title, sender, type badge, date, read/unread styling
  - SOS items get `border-l-4 border-red-600 bg-red-50` + alert icon
  - Remove button (icon)
- [ ] **T-1.5**: Build `NotificationFilterBar.tsx` — filter by type + read status
- [ ] **T-1.6**: Build `NotificationList.tsx` — renders list of NotificationItems
- [ ] **T-1.7**: Build `NotificationListPage.tsx`
  - FilterBar + NotificationList + pagination
  - Empty state
  - Remove confirmation dialog integration

---

## Phase 2: Notification Detail (BC-UC-11)

- [ ] **T-2.1**: Create hooks — `useNotification.ts`, `useMarkAsRead.ts`
- [ ] **T-2.2**: Build `SOSAlertBanner.tsx`
  - Red banner showing: Blood type, Urgency level, Hospital name, Deadline
- [ ] **T-2.3**: Build `NotificationDetailPage.tsx`
  - Header with title, sender, type, date
  - Body content
  - SOSAlertBanner (conditional, if type === SOS)
  - Auto-mark as read on mount
  - Back button
  - Loading/NotFound states

---

## Phase 3: Verification

- [ ] **T-3.1**: Type check — `npx tsc --noEmit`
- [ ] **T-3.2**: Lint — `npm run lint`
- [ ] **T-3.3**: Verify SOS visual distinction meets NFR-U-03
- [ ] **T-3.4**: Functional test — list, filter, detail, mark read, remove
- [ ] **T-3.5**: i18n — all strings translated
- [ ] **T-3.6**: Update Spec-Kit artifacts
