---
description: "Task list for Donation Booking & Location feature implementation"
---

# Tasks: Donation Booking & Location

**Input**: Design documents from `specs/LL-UC-06-to-10-donation-booking-location/`

**Prerequisites**

- plan.md
- spec.md
- data-model.md
- contracts/api.md

---

## Task Format

`[ID] [P?] [Story] Description`

- **[P]** = Parallelizable
- **[Story]** = Related User Story

---

# Phase 1 — Infrastructure

**Purpose**

Integrate the Booking module into the existing backend architecture.

---

### [X] T001 Initialize Booking Module

Create the Booking module structure.

Deliverables

- controllers/
- services/
- routes/
- models/
- schemas/
- index.ts

---

### [X] T002 Register Booking Module

Register Booking routes inside the existing application bootstrap.

Deliverables

- app.ts updated
- `/api/v1/bookings` mounted

Dependencies

- T001

---

### [X] T003 Configure Module Entry

Configure `booking/index.ts` to export controllers, services, and routes following the existing project architecture.

Dependencies

- T001

---

## Checkpoint

Booking module successfully integrated into backend.

---

# Phase 2 — Foundation

**Purpose**

Implement persistence models and validation schemas.

---

### [X] T004 [P]

Implement Appointment Mongoose Schema and Model.

Deliverables

- appointment.model.ts

---

### [X] T005 [P]

Implement ScreeningForm Mongoose Schema and Model.

Deliverables

- screening-form.model.ts

---

### [X] T006 [P]

Implement ETicket Mongoose Schema and Model.

Deliverables

- eticket.model.ts

---

### [X] T007 [P]

Define Appointment relationships.

Reuse

- existing User model
- existing Campaign model

Do not duplicate either model.

---

### [X] T008 [P]

Create Zod schema for location search.

Integrate with

validate.middleware.ts

Deliverables

- search-location.schema.ts

---

### [X] T009 [P]

Create Zod schema for appointment creation.

Deliverables

- create-appointment.schema.ts

---

### [X] T010 [P]

Create Zod schema for cancellation.

Deliverables

- cancel-appointment.schema.ts

---

### [X] T011 [P]

Create Zod schema for E-ticket download.

Deliverables

- download-ticket.schema.ts

---

## Checkpoint

Database layer and validation layer completed.

---

# Phase 3 — User Story 1

## Browse Donation Locations (Priority P1)

Goal

Allow donors to search donation campaigns.

Independent Test

Search locations using every supported query parameter.

---

### [X] T012 [US1]

Implement location search service.

Support

- latitude
- longitude
- radius
- bloodType
- date
- crowdingLevel

Deliverables

booking.service.ts

---

### [X] T013 [US1]

Implement controller.

GET

/api/v1/bookings/locations

---

### [X] T014 [US1]

Register route.

---

## Checkpoint

Location browsing works independently.

---

# Phase 4 — User Story 2

## Book Appointment (Priority P1)

Goal

Allow donors to book appointments.

---

### [X] T015 [P] [US2]

Implement 84-day eligibility validation.

---

### [X] T016 [P] [US2]

Validate campaign status.

Campaign must be Active.

---

### [X] T017 [P] [US2]

Validate campaign capacity.

Available slots must exist.

---

### [X] T018 [P] [US2]

Prevent duplicate appointments.

---

### [X] T019 [US2]

Implement appointment booking transaction.

Responsibilities

- Start MongoDB transaction
- Execute all booking validations
- Invoke SYS-UC-01
- Create Appointment
- Update Campaign capacity
- Invoke SYS-UC-02
- Commit transaction
- Rollback on failure

POST

/api/v1/bookings/appointments

Dependencies

- T015
- T016
- T017
- T018

---

### [X] T020 [US2]

Retrieve the latest active Screening Form template.

Deliverables

- screening-template.service.ts

Related Use Case

SYS-UC-01

---

### [X] T021 [US2]

Pre-populate donor profile and campaign information into the Screening Form.

Related Use Case

SYS-UC-01

---

### [X] T022 [US2]

Validate all required screening questions.

Block appointment confirmation if validation fails.

Related Use Case

SYS-UC-01

---

### [X] T023 [US2]

Determine preliminary donor eligibility based on screening responses.

Related Use Case

SYS-UC-01

---

### [X] T024 [US2]

Persist the completed Screening Form.

Responsibilities

- Save ScreeningForm
- Associate ScreeningForm with Appointment

Dependencies

- T020
- T021
- T022
- T023

Related Use Case

SYS-UC-01

---

### [X] T025 [US2]

Generate electronic appointment confirmation.

Responsibilities

- Generate ETicket
- Generate signed QR payload
- Persist ETicket
- Associate ETicket with Appointment

Dependencies

- T019
- T024

Related Use Case

SYS-UC-02

---

## Checkpoint

Appointment booking completed.

---

# Phase 5 — User Story 3

## View & Manage Appointment (Priority P1)

Goal

Allow donors to manage appointments.

---

### [X] T026 [US3]

Retrieve appointment.

Responsibilities

- Verify donor ownership
- Retrieve Campaign
- Retrieve ETicket
- Retrieve Screening summary
- Return appointment details

---

### [X] T027 [US3]

Implement

GET

/api/v1/bookings/appointments/:id

---

### [X] T027a [US3]

Implement appointment history retrieval.

Responsibilities

- Verify donor ownership
- Retrieve list of appointments sorted by date
- Return appointment summaries

GET

/api/v1/bookings/appointments

---

### [X] T028 [US3]

Implement cancellation.

Responsibilities

- Update appointment status
- Release campaign slot
- Invalidate ETicket
- Validate cancellation deadline

Dependencies

- T026
---

### [X] T029 [US3]

Implement

PATCH

/api/v1/bookings/appointments/:id/cancel

---

### [X] T030 [US3]

Implement E-ticket retrieval.

Responsibilities

- Verify donor ownership
- Verify ETicket exists
- Return QR payload
---

### [X] T031 [US3]

Implement

GET

/api/v1/bookings/appointments/:id/e-ticket

---

### [X] T032 [US3]

Register remaining routes.

---

## Checkpoint

Complete appointment lifecycle finished.

---

# Phase 6 — Documentation & Cross-cutting

---

### [X] T033

Document every Booking endpoint using Swagger JSDoc.

Requirements

- swagger-jsdoc
- swagger-ui-express

Document

- JWT Bearer Authentication
- Request Body
- Response Body
- Error Responses
- Examples

Expose

/api-docs

---

### [X] T034

Verify middleware chain.

Every endpoint must use

- auth.middleware.ts
- validate.middleware.ts
- error.middleware.ts

---

### [X] T035

Verify Booking module registration.

Confirm

- app.ts
- booking/index.ts
- swagger.config.ts

are correctly integrated.

---

# Phase 7 — Testing

---

### [X] T036

Unit Tests

Cover

- 84-day eligibility
- Duplicate booking
- Campaign full
- Campaign inactive
- Screening validation
- Ineligible donor
- ETicket generation
- Cancellation deadline
- MongoDB transaction rollback

---

### [X] T037

Integration Tests

Cover

- Browse locations
- Book appointment
- View appointment
- Cancel appointment
- Download ETicket
- Transaction rollback

---

### [X] T038

Swagger Verification

Verify

- Every endpoint documented
- Security scheme rendered
- Schemas rendered
- Try-it-Out works

---

# Dependencies

```
T001
 ├──► T002
 ├──► T003
 ├──► T004
 ├──► T005
 ├──► T006
 ├──► T007
 ├──► T008
 ├──► T009
 ├──► T010
 └──► T011

Infrastructure
      │
      ▼

Foundation
      │
      ▼

US1
      │
      ▼

US2
      │
      ├── Validation
      ├── Screening Form
      ├── Appointment
      ├── Campaign Update
      └── ETicket
      │
      ▼

US3
      │
      ▼

Documentation
      │
      ▼

Testing
```

---

# Milestones

## M1

Infrastructure Ready

---

## M2

Persistence & Validation Ready

---

## M3

Browse Locations Completed

---

## M4

Appointment booking completed.

Verified

- 84-day rule
- Campaign validation
- Capacity validation
- Screening Form generation (SYS-UC-01)
- Appointment creation
- Campaign capacity update
- ETicket generation (SYS-UC-02)
- Transaction commit/rollback

---

## M5

Appointment Management Completed

---

## M6

Production Ready

---

# Implementation Strategy

1. Infrastructure
2. Foundation
3. User Story 1
4. Validate
5. User Story 2
6. Validate
7. User Story 3
8. Documentation
9. Testing
10. Release