# Data Model: Donation Booking & Location

## Appointment Entity (`appointments` collection)
- `_id`: ObjectId
- `donorId`: ObjectId (ref `users`)
- `campaignId`: ObjectId (ref `campaigns`)
- `appointmentDate`: Date
- `timeSlot`: String
- `status`: Enum (`Pending`, `Confirmed`, `Scheduled`, `CheckedIn`, `Completed`, `Cancelled`, `Rejected`, `NoShow`)
- `screeningFormId`: ObjectId (optional, ref `screening_forms`)
- `eTicketId`: ObjectId (optional, ref `e_tickets`)
- `createdAt`: Date
- `updatedAt`: Date

## Campaign Entity (`campaigns` collection)
- `_id`: ObjectId
- `name`: String
- `location`: GeoJSON Point (`type`: 'Point', `coordinates`: [lng, lat])
- `venue`: String
- `fullAddress`: String
- `startDateTime`: Date
- `endDateTime`: Date
- `capacity`: Number
- `targetUnitsGoal`: Number
- `registeredCount`: Number
- `status`: Enum (`Draft`, `Upcoming`, `Active`, `Full`, `Completed`, `Closed`, `Cancelled`)
- `targetBloodGroups`: Array<String>
- `timeslots`: Array of Timeslot Object (`startTime`, `endTime`, `capacity`, `registeredCount`)

## ScreeningFormTemplate Entity (`screening_form_templates` collection)
- `_id`: ObjectId
- `versionName`: String (unique)
- `isActive`: Boolean
- `questions`: Array of `Question`
  - `questionId`: String
  - `questionText`: String
  - `isMultiSelect`: Boolean
  - `options`: Array of `QuestionOption`
    - `label`: String
    - `requiresDescription`: Boolean
    - `outcomeFlag`: Enum (`PASS`, `REVIEW`, `REJECT`)
- `createdAt`: Date
- `updatedAt`: Date

## ScreeningForm Entity (`screening_forms` collection)
- `_id`: ObjectId
- `appointmentId`: ObjectId (ref `appointments`)
- `donorId`: ObjectId (ref `users`)
- `campaignId`: ObjectId (ref `campaigns`)
- `templateId`: ObjectId (optional)
- `responses`: Array of `QuestionAnswer`
  - `questionId`: String
  - `selectedOptions`: Array of String
  - `description`: String (optional)
- `outcome`: Enum (`PASS`, `REVIEW`, `REJECT`)
- `submittedAt`: Date

## ETicket Entity (`e_tickets` collection)
- `_id`: ObjectId
- `appointmentId`: ObjectId (ref `appointments`)
- `donorId`: ObjectId (ref `users`)
- `ticketCode`: String (unique)
- `qrPayloadSigned`: String
- `fileUrl`: String
- `issuedAt`: Date

---

## Validation Rules & Business Constraints
- A donor must not have overlapping confirmed appointments.
- 84-day donation interval must be respected between consecutive donations.
- Campaign capacity must be reduced when a booking is confirmed and restored on cancellation.
- Each confirmed appointment must have one associated e-ticket and QR code payload.
- Screening Form must be completed before Appointment confirmation.
- **Timeslot Expiration**: Once the current time passes the end time of the last timeslot on a campaign date, booking for that date is blocked.

---

# Relationships

Campaign (1)
    |
    |------< Appointment >------(1) User / Donor Profile

Appointment (1)
    |
    |------(0..1) Screening Form

Appointment (1)
    |
    |------(1) E-ticket

---

# Collection Indexes

## appointments

- donorId: 1
- campaignId: 1
- appointmentDate: 1
- status: 1
- Compound Index: `{ donorId: 1, appointmentDate: 1 }`

---

## campaigns

- location (2dsphere)
- status
- startDateTime

---

## e_tickets

- ticketCode (Unique)
- appointmentId: 1

---

# Lifecycle

Appointment

↓

Pending / Scheduled

↓

Confirmed

↓

Checked In

↓

Completed

OR

Cancelled / Rejected / No Show