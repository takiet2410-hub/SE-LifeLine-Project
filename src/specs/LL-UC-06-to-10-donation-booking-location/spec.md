# Feature Specification: Donation Booking & Location

**Feature ID:** FG2  
**Covered Use Cases:** LL-UC-06 → LL-UC-10  
**Created:** 2026-07-20  
**Updated:** 2026-08-05 (Synchronized with codebase)  
**Status:** Approved & Implemented

---

# Summary

The Donation Booking & Location feature enables authenticated donors to discover nearby blood donation opportunities, schedule donation appointments, manage existing appointments, and download secure electronic tickets. It also integrates with BloodCenter staff operations to allow appointment confirmation, deferral/rejection with email notifications, and automated screening form evaluation. It provides an end-to-end booking experience from campaign discovery to appointment attendance while ensuring donor eligibility, campaign capacity, and appointment integrity.

---

# Scope

This specification covers the following use cases:

- LL-UC-06 – Browse Donation Locations
- LL-UC-07 – Book Appointment
- LL-UC-08 – View Appointment
- LL-UC-09 – Cancel Appointment
- LL-UC-10 – Download E-ticket
- Integration Operations: BloodCenter Appointment Sync, Staff Confirmation & Rejection

This feature belongs to **Functional Group FG2 – Donation Booking & Location**.

---

# Actors

## Primary Actor

- Donor

## Supporting Actors

- Blood Center Staff
- System / Notification Service

---

# Business Value

This feature simplifies the appointment booking process, improves donor convenience, reduces waiting time at donation sites, and increases campaign participation through an efficient digital booking workflow.

---

# User Stories

## User Story 1 – Browse Donation Opportunities (Priority: P1)

As a donor, I want to browse nearby donation locations and campaigns on an interactive map so that I can easily choose a convenient donation site.

---

## User Story 2 – Schedule a Donation Appointment (Priority: P1)

As a donor, I want to reserve an available appointment slot so that I can donate blood at my preferred time and location.

---

## User Story 3 – Manage My Appointment (Priority: P1)

As a donor, I want to view my appointment details, cancel appointments when necessary, and download my electronic ticket so that I can manage my donation journey conveniently.

---

## User Story 4 – BloodCenter Staff Verification & Processing (Priority: P2)

As a blood center staff member, I want to review submitted appointments, confirm valid registrations, or reject/defer ineligible registrations with automated email notifications.

---

# Functional Requirements

## LL-UC-06 – Browse Donation Locations

### FR-001

The system MUST display active and upcoming donation campaigns and permanent donation locations on an interactive map.

### FR-002

The system MUST allow donors to search and filter donation locations by:

- Radius (km)
- Geolocation (lat/lng)
- Date
- Blood type requirement (supports multi-select & "All Types")
- Crowding level (Low, Moderate, High)

### FR-003

The system MUST support both GPS-based location detection and manual location search.

---

## LL-UC-07 – Book Appointment

### FR-004

The system MUST validate donor authentication before allowing appointment booking.

### FR-005

The system MUST validate donor eligibility before confirming an appointment.

Validation includes:

- Minimum 84-day donation interval
- Existing appointment conflicts
- Campaign availability and capacity

### FR-006

The system MUST prevent duplicate overlapping appointments.

### FR-007

The system MUST reserve the selected appointment slot immediately after successful booking.

### FR-008

The system MUST update campaign capacity immediately after successful booking.

### FR-009

The system MUST retrieve the active pre-donation screening form template, pre-populate donor and campaign information, collect and validate the donor's responses, and persist the completed Screening Form before creating the appointment.

#### FR-009a

The system MUST retrieve the latest active screening form template.

#### FR-009b

The system MUST pre-populate donor profile information and campaign details.

#### FR-009c

The system MUST validate all required screening questions.

#### FR-009d

The system MUST evaluate the screening form answers to determine the outcome:
- **PASS**: Only "Không" selected.
- **REVIEW**: Manual medical judgement needed (e.g. "Khác", "Bệnh khác").
- **REJECT**: Indicates temporary or permanent deferral according to Vietnamese blood donation guidelines.
The system MUST block appointment confirmation if the outcome is REJECT or the form is incomplete.

#### FR-009e

The system MUST save the completed Screening Form and associate it with the Appointment.

### FR-010

The system MUST generate an electronic appointment confirmation and signed QR E-ticket upon appointment approval/confirmation.

### FR-010a (Timeslot Expiration Rule)

The system MUST enforce timeslot availability based on current local time:
- If on a specific campaign date, the current local time passes the end time (`endTime`) of the last timeslot, booking for that date MUST be disabled and blocked in the UI.
- Expired individual timeslots (`currentTime >= slot.endTime`) MUST be marked as unavailable/passed.

---

## Automation Requirements

### SYS-UC-01 – Generate Pre-Donation Screening Form

This automation is included by **LL-UC-07 – Book Appointment**.

The system shall:

1. Retrieve the latest active Screening Form template.
2. Pre-populate donor profile information.
3. Pre-populate selected campaign information.
4. Validate all mandatory screening questions.
5. Determine preliminary donor eligibility.
6. Prevent appointment confirmation if the donor is ineligible.
7. Persist the completed Screening Form.
8. Associate the Screening Form with the Appointment.

### SYS-UC-02 – Generate E-Ticket

This automation is included by **LL-UC-07 – Book Appointment**.

The system shall:

1. Generate a unique appointment ticket code.
2. Generate a signed QR payload.
3. Store the generated ticket and QR payload.
4. Associate the ticket with the Appointment.
5. Allow later download through LL-UC-10.

---

## LL-UC-08 – View Appointment

### FR-011

The system MUST allow donors to view appointment details including:

- Campaign
- Location / Address
- Date
- Time slot
- Appointment status (`Pending`, `Confirmed`, `Scheduled`, `CheckedIn`, `Completed`, `Cancelled`, `Rejected`, `NoShow`)
- QR E-ticket

### FR-012

The system MUST display appointment history sorted by date.

---

## LL-UC-09 – Cancel Appointment

### FR-013

The system MUST allow donors to cancel future appointments before the cancellation deadline.

### FR-014

The system MUST restore campaign capacity after successful cancellation.

### FR-015

The system MUST record cancellation history and cancellation reason.

---

## LL-UC-10 – Download E-ticket

### FR-016

The system MUST generate a unique cryptographically signed QR code for every confirmed appointment.

### FR-017

The system MUST allow donors to download their E-ticket in PDF format.

### FR-018

The system MUST allow donors to view their E-ticket directly within the application.

---

## BloodCenter Staff Operations

### FR-019 – Sync Appointment to BloodCenter

The system MUST allow syncing appointment data and screening responses to the BloodCenter system.

### FR-020 – Confirm Appointment

BloodCenter staff MUST be able to confirm a pending appointment and generate the corresponding E-ticket for the donor.

### FR-021 – Reject Appointment

BloodCenter staff MUST be able to reject/defer an appointment and automatically dispatch a rejection notification email to the donor.

---

# Business Rules

### BR-001

Only authenticated donors may create appointments.

### BR-002

Appointments can only be booked for active or upcoming campaigns.

### BR-003

Campaign capacity must never exceed the configured maximum.

### BR-004

A donor must satisfy the minimum donation interval (84 days).

### BR-005

A donor may not hold multiple appointments that overlap in time.

### BR-006

Appointments may only be cancelled before the configured cancellation deadline (24 hours prior to appointment time).

### BR-007

Cancelled appointments immediately release their reserved slot.

### BR-008

Every confirmed appointment must have exactly one valid electronic ticket.

### BR-009 (Timeslot Expiration Rule)

On a campaign date, once the current local time passes the end time of the last scheduled timeslot, booking for that date is blocked, requiring the donor to select a future date.

---

# Acceptance Criteria

## Scenario 1 – Browse Donation Locations

**Given** The donor opens the donation map.  
**When** Location services are available.  
**Then** Nearby active donation locations are displayed within the specified radius.

---

## Scenario 2 – Manual Location Search

**Given** Location permission is denied.  
**When** The donor enters a location or campaign search query manually.  
**Then** Relevant donation locations are displayed.

---

## Scenario 3 – Successful Booking

**Given** The donor is eligible (84-day rule passed, screening form outcome is PASS/REVIEW).  
And the selected campaign has available capacity and valid timeslot.  
**When** The donor confirms the booking.  
**Then** The appointment is created, campaign capacity is updated, screening form is saved, and an E-ticket is generated.

---

## Scenario 4 – Ineligible Donor

**Given** The donor donated within the last 84 days or screening outcome is REJECT.  
**When** The donor attempts to book.  
**Then** The booking is rejected and the next eligible donation date or rejection message is displayed.

---

## Scenario 5 – Expired Timeslots on Campaign Date

**Given** A campaign date has timeslots ending at 16:30.  
**When** The current time is 17:00.  
**Then** All timeslots for today are disabled, a warning banner is shown, and booking for today is blocked.

---

## Scenario 6 – Cancel Appointment

**Given** The donor has a future appointment.  
**When** The donor cancels it before the deadline.  
**Then** The appointment status becomes `Cancelled`, reserved slot is released, and campaign capacity is restored.

---

## Scenario 7 – Download E-ticket

**Given** The appointment is confirmed/scheduled.  
**When** The donor selects Download E-ticket.  
**Then** A signed PDF E-ticket is generated and downloaded successfully.

---

# Non-Functional Requirements

## Performance

### NFR-001

Map data must load within **1 second** under normal conditions.

### NFR-002

Appointment confirmation must complete within **5 seconds**.

### NFR-003

E-ticket generation must complete within **5 seconds**.

---

## Reliability

### NFR-004

Appointment creation must be atomic. No partial booking may persist after failure.

### NFR-005

Appointment records must never be lost.

---

## Security

### NFR-006

Appointment information must only be accessible by the appointment owner or authorized staff.

### NFR-007

QR codes must be unique and cryptographically signed.

### NFR-008

All booking operations require authenticated sessions (JWT).

---

# Dependencies

This feature depends on:

- Authentication & Account Module
- Campaign Management Module
- Notification Module
- QR Code Generation Utility
- Screening Form Template Service

---

# Data Objects

The feature primarily manages the following entities:

- User
- Donor Profile
- Campaign
- Appointment
- ScreeningForm
- ETicket

---

# Out of Scope

- Blood inventory management
- Hospital emergency SOS requests
- AI chatbot functionality