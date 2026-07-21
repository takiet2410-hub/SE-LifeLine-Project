# Research Notes: Donation Booking & Location

## Objective

Summarize architectural and implementation decisions that influence the design of the Donation Booking & Location feature.

---

# Findings from Existing Project Documents

## Vision Document

The system provides a complete digital blood donation workflow where donors can discover donation campaigns, schedule appointments, manage bookings, and receive electronic tickets.

---

## Use Case Specification

The feature covers:

- LL-UC-06 Browse Donation Locations
- LL-UC-07 Book Appointment
- LL-UC-08 View Appointment
- LL-UC-09 Cancel Appointment
- LL-UC-10 Download E-ticket

---

## Database

Appointments are linked to:

- Campaign
- Donor Profile
- Screening Form
- E-ticket

Campaigns maintain remaining capacity during booking.

---

## Architecture

The Booking module is implemented inside

backend-core/src/modules/booking

and communicates with:

- Authentication Module
- Campaign Module
- Notification Module

---

# Implementation Considerations

## Geospatial Search

Campaigns should use MongoDB GeoJSON with a 2dsphere index.

Reason:

- Efficient nearby search
- Native MongoDB support

---

## Capacity Updates

Capacity updates should use atomic database operations.

Reason:

Prevent race conditions during concurrent bookings.

---

## Appointment Validation

Booking validation includes:

- Authentication
- Campaign availability
- Donation interval
- Duplicate appointments
- Slot availability

---

## QR Code Generation

Every confirmed appointment generates a signed QR payload.

Reason:

Prevent forgery.

---

# Alternatives Considered

## Option A

Store appointment information directly inside Campaign.

Rejected because:

- Difficult to maintain
- Poor scalability

---

## Option B

Separate Appointment collection.

Chosen because:

- Better normalization
- Easier querying
- Cleaner business logic

---

## Option C

Generate QR dynamically.

Rejected because:

- Increased response time
- Harder validation

---

## Option D

Persist generated QR ticket.

Chosen because:

- Faster retrieval
- Easier download
- Better auditability

---

# Design Decisions

Decision 1

Appointment creation must be atomic.

Reason:

Booking affects

- Appointment
- Campaign Capacity
- Screening Form
- E-ticket

---

Decision 2

Campaign location uses GeoJSON.

Reason:

Support radius search.

---

Decision 3

E-ticket is stored after booking.

Reason:

Avoid regenerating QR every request.

---
Decision 4

The Screening Form is generated as an independent automated workflow (SYS-UC-01) instead of being embedded directly into Appointment creation.

Reason

- Improves traceability.
- Aligns with UseCase Specification.
- Enables future template versioning.

---

Decision 5

E-ticket generation is implemented as an independent automation (SYS-UC-02).

Reason

- Clear separation of responsibilities.
- Easier maintenance.
- Supports future QR regeneration without modifying Appointment logic.
---
# Risks

- Concurrent bookings may exceed campaign capacity.
- GPS permission may be denied.
- Booking timeout during high traffic.
- Invalid QR reuse.

Mitigation:

- Atomic transactions
- Signed QR
- Validation middleware