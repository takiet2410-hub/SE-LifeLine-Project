# Donor Communication (News Feed, Notifications & SOS Alerts) - Specification

## 1. Overview
This module covers the Donor-facing communication features (`NF-UC-01`, `NF-UC-02`, `NT-UC-01`, `NT-UC-02`, `SOS-UC-01`, `SOS-UC-02`), enabling donors to consume news, receive updates, and respond to critical emergencies.

## 2. Use Cases

### 2.1 News Feed (NF-UC-01, NF-UC-02)
- **NF-UC-01 Browse News Feed**: Donors can view published articles, filter by category (`All`, `News`, `Alert`, `Health Tips`, `Campaign`), search by keyword, and paginate. If no articles match or exist, an Empty State is shown.
- **NF-UC-02 View Article Details**: Donors click an article card to view full content, cover image, and read time.
  - **Special Requirement (404 Modal)**: If an article is no longer available (e.g. unpublished), the system displays a modal overlay over a blurred background with a "<- Back to News Feed" button, instead of a standard 404 page.

### 2.2 Routine Notifications (NT-UC-01, NT-UC-02)
- **NT-UC-01 Receive Routine Notification**: The Donor Notification Center displays alerts (Campaigns, Appointments, System).
  - Notifications are grouped in a dropdown/sidebar accessible via the Bell icon in `DashboardLayout`.
  - Types are visually distinguished (e.g., Megaphone for campaigns, Calendar for appointments).
- **NT-UC-02 Manage Notification Preferences**: Configured at the *bottom* of the Notification Center sidebar using toggles (SOS Alerts, Appointment Updates, Campaign News). Toggles save instantly without a submit button.

### 2.3 SOS Alerts (SOS-UC-01, SOS-UC-02)
- **SOS-UC-01 Receive SOS Alert**: Critical alerts appear at the top of the notification list, distinctly styled in Red with "🚨 SOS EMERGENCY".
- **SOS-UC-02 Respond to SOS Alert**: Clicking an SOS notification opens a detail view.
  - Shows Blood Type, Hospital, Required Quantity, Deadline.
  - Donor clicks **"I Can Help"**.
  - **Success**: Shows Response Confirmation screen (Green heart) -> "Next Steps" -> "Get Directions" / "Call Hospital".
  - **Ineligible**: Shows Yellow warning panel -> Progress Bar (e.g. 48/84 days) -> "Next eligible date".
  - **Fulfilled**: Shows Green shield "Emergency Request Fulfilled".
