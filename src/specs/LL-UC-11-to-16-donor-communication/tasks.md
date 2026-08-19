# Implementation Tasks

## 1. Setup & Navigation
- [x] Add `News` and `SOS Alerts` to `SideNavBar.tsx` (or route navigation).
- [x] Create Donor Notification Center layout.

## 2. Donor Notification Center (NT-UC-01, NT-UC-02)
- [x] Build the `DonorNotificationPage` layout (List of notifications + filtering).
- [x] Integrate `NotificationPreferences.tsx` at the bottom of the notification list/sidebar.
- [x] Display visual markers for Routine vs SOS notifications (including Yellow Delivery Banner).

## 3. SOS Alert Response Flow (SOS-UC-01, SOS-UC-02)
- [x] Integrate `SOSAlertsPage.tsx` into the routing flow.
- [x] Build / Verify the "Response Detail" views in `SOSAlertsPage.tsx`:
  - [x] Success: Green heart, Next Steps, "Get Directions", "Call Hospital".
  - [x] Ineligible: Yellow panel, Progress Bar, Next eligible date.
  - [x] Fulfilled: Green shield, thank you message.

## 4. News Feed (NF-UC-01, NF-UC-02)
- [x] Review and test `NewsFeedPage.tsx`.
- [x] Ensure `PublicArticleDetailPage.tsx` displays properly.
- [x] Implement the **404 Modal Overlay** over a blurred background when an article is not found, instead of a blank page.
