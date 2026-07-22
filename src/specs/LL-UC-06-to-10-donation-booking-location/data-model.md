# Data Model: Donation Booking & Location

## Appointment Entity (`appointments` collection)
- `_id`: ObjectId
- `donorId`: ObjectId (ref `donor_profiles`)
- `campaignId`: ObjectId (ref `campaigns`)
- `appointmentDate`: Date
- `timeSlot`: String
- `status`: Enum (`Scheduled`, `CheckedIn`, `Completed`, `Cancelled`, `NoShow`)
- `screeningFormId`: ObjectId (optional, ref `screening_forms`)
- `eTicketId`: ObjectId (optional, ref `e_tickets`)
- `createdAt`: Date
- `updatedAt`: Date

## Campaign Entity (`campaigns` collection)
- `_id`: ObjectId
- `name`: String
- `location`: GeoJSON Point
- `startDateTime`: Date
- `endDateTime`: Date
- `capacity`: Number
- `registeredCount`: Number
- `status`: Enum (`Draft`, `Active`, `Full`, `Closed`, `Cancelled`)
- `targetBloodGroups`: Array<String>

## ScreeningForm Entity (`screening_forms` collection)

- `_id`: ObjectId
- `appointmentId`: ObjectId (ref `appointments`)
- `templateId`: ObjectId (optional)
- `medicalHistory`: Object
- `currentHealthStatus`: String
- `recentTravel`: String
- `medicationHistory`: String
- `consentGiven`: Boolean
- `eligibilityFlag`: Enum (`Eligible`, `RequiresReview`, `Ineligible`)
- `submittedAt`: Date


## ETicket Entity (`e_tickets` collection)
- `_id`: ObjectId
- `appointmentId`: ObjectId (ref `appointments`)
- `ticketCode`: String (unique)
- `qrPayloadSigned`: String
- `fileUrl`: String
- `issuedAt`: Date

## Validation Rules
- A donor must not have overlapping confirmed appointments.
- Campaign capacity must be reduced when a booking is confirmed and restored on cancellation.
- Each confirmed appointment must have one associated e-ticket.
- Screening Form must be completed before Appointment confirmation.
- Screening Form must be associated with exactly one Appointment.

---

# Relationships

Campaign (1)
    |
    |------< Appointment >------(1) Donor Profile

Appointment (1)
    |
    |------(0..1) Screening Form

Appointment (1)
    |
    |------(1) E-ticket

---

# Collection Indexes

## appointments

- donorId
- campaignId
- appointmentDate
- status

Compound Index

(donorId, appointmentDate)

---

## campaigns

- location (2dsphere)
- status
- startDateTime

---

## e_tickets

- ticketCode (Unique)

---

# Constraints

## Appointment

- appointmentDate >= Current Date
- status must be valid enum

---

## Campaign

registeredCount <= capacity

---

## E-ticket

ticketCode must be unique

---

# Lifecycle

Appointment

↓

Scheduled

↓

Checked In

↓

Completed

OR

↓

Cancelled

OR

↓

No Show