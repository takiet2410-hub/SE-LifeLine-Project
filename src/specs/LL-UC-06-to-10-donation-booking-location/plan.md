# Implementation Plan: Donation Booking & Location

## 1. Technical Summary

This plan outlines the architecture and implementation of the booking module within the Express backend-core and the corresponding Vite/React frontend module (`modules/booking-location`). The module implements the complete LL-UC-06 to LL-UC-10 workflow for donation location discovery, interactive map search, appointment creation, appointment viewing, cancellation, e-ticket generation/download, and BloodCenter staff processing.

The implementation builds on the existing architecture by reusing:
- existing Express application bootstrap in `app.ts` and `server.ts`
- shared middleware in `shared/` (`auth.middleware.ts`, `validate.middleware.ts`, `error.middleware.ts`)
- MongoDB models for User, Campaign, Appointment, ScreeningForm, and ETicket
- Swagger configuration in `config/swagger.config.ts`
- Frontend UI modules in `src/frontend/src/modules/booking-location` with interactive Leaflet map, health questionnaire step, appointment management dashboard, and timeslot expiration validation utilities (`timeslotUtils.ts`).

The booking module exposes REST endpoints under `/api/v1/bookings`.

---

## 2. Architecture Overview

### Backend Architecture

The backend follows a modular monolith approach inside `src/modules/booking`:
- `controllers/`: `booking.controller.ts`
- `services/`: `booking.service.ts`
- `routes/`: `booking.routes.ts`
- `models/`: `appointment.model.ts`, `screening-form.model.ts`, `eticket.model.ts`
- `schemas/`: Zod schemas for query and body validations (`search-location.schema.ts`, `create-appointment.schema.ts`, `cancel-appointment.schema.ts`, `download-ticket.schema.ts`)

```
                         Frontend App (Vite/React)
                                   │
                                   ▼
                            Express Backend Core
                                   │
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
         Authentication     Booking Module         Swagger
         (auth.middleware)  (BookingController)    (/api-docs)
                                   │
                                   ▼
                             BookingService
                                   │
                                   ▼
                       Mongoose Database Models
                                   │
                                   ▼
                                MongoDB
```

### Frontend Module Structure (`src/frontend/src/modules/booking-location`)

- `pages/`:
  - `InteractiveMapPage.tsx`: Interactive Leaflet map with radius filtering, GPS location detection, blood type options, and drawer timeslot selection with expiration validation.
  - `MyAppointmentPage.tsx`: Appointment management view (All, Upcoming, Completed, Cancelled tabs, e-ticket modal, cancellation modal).
  - `schedule/Step1_LocationTime.tsx`: Location and timeslot selection step with real-time expiration validation (`timeslotUtils.ts`).
  - `schedule/Step2_HealthForm.tsx`: Pre-donation screening form questionnaire pre-populated with donor & campaign info.
  - `schedule/Step3_Summary.tsx`: Appointment confirmation summary.
  - `schedule/SuccessPage.tsx`: Confirmation page displaying QR e-ticket.
- `utils/`:
  - `timeslotUtils.ts`: Real-time timeslot expiration check (`isSlotPassed`, `areAllSlotsPassedOnDate`, `getFirstAvailableSlot`).
  - `eTicketGenerator.ts`: Client-side E-ticket PDF generation.

---

## 3. Requirement Traceability Matrix

| Requirement | Use Case | Controller Method | Service Method | Model(s) | Endpoint |
| --- | --- | --- | --- | --- | --- |
| FR-001 | LL-UC-06 | `listLocations` | `searchLocations` | Campaign | GET `/api/v1/bookings/locations` |
| FR-002 | LL-UC-06 | `listLocations` | `searchLocations` | Campaign | GET `/api/v1/bookings/locations` |
| FR-003 | LL-UC-06 | `listLocations` | `searchLocations` | Campaign | GET `/api/v1/bookings/locations` |
| FR-004 ~ FR-008 | LL-UC-07 | `createAppointment` | `createAppointment` | Appointment, Campaign | POST `/api/v1/bookings/appointments` |
| FR-009 | SYS-UC-01 | `createAppointment` | `createAppointment` | ScreeningForm | POST `/api/v1/bookings/appointments` |
| FR-010 | SYS-UC-02 | `createAppointment` | `createAppointment` | ETicket | POST `/api/v1/bookings/appointments` |
| FR-010a | UI Logic | UI Component | `timeslotUtils.ts` | Frontend UI | Step1 & InteractiveMapPage |
| FR-011 | LL-UC-08 | `getAppointmentById` | `getAppointmentById` | Appointment, ScreeningForm, ETicket | GET `/api/v1/bookings/appointments/:id` |
| FR-012 | LL-UC-08 | `listAppointments` | `listAppointments` | Appointment | GET `/api/v1/bookings/appointments` |
| FR-013 ~ FR-015 | LL-UC-09 | `cancelAppointment` | `cancelAppointment` | Appointment, Campaign | PATCH `/api/v1/bookings/appointments/:id/cancel` |
| FR-016 ~ FR-018 | LL-UC-10 | `downloadETicket` | `downloadETicket` | ETicket | GET `/api/v1/bookings/appointments/:id/e-ticket` |
| FR-019 | Staff Sync | `syncToBloodCenter` | `syncToBloodCenter` | Appointment, ScreeningForm | POST `/api/v1/bookings/appointments/:id/sync-bloodcenter` |
| FR-020 | Staff Confirm | `confirmAppointment` | `confirmAppointment` | Appointment, ETicket | POST `/api/v1/bookings/appointments/:id/confirm` |
| FR-021 | Staff Reject | `rejectAppointment` | `rejectAppointment` | Appointment | POST `/api/v1/bookings/appointments/:id/reject` |

---

## 4. Business Rules & Logic Implementation

1. **84-Day Donation Interval Rule**:
   - The booking service checks the donor's previous appointment date or `lastDonationDate` in `DonorProfile`. If less than 84 days have elapsed, appointment creation returns `403 Forbidden`.

2. **Duplicate Booking Prevention**:
   - Checks if the donor already has an active appointment on the target `appointmentDate`.

3. **Campaign Capacity & Slot Management**:
   - Atomically increments `registeredCount` on booking confirmation and decrements it on cancellation.

4. **Timeslot Expiration Rule**:
   - Built into `timeslotUtils.ts`. Compares local system time against timeslot `endTime`. If the current time is past the final timeslot on a given date, booking for that date is disabled.

5. **Screening Form Evaluation (SYS-UC-01)**:
   - Evaluates mandatory responses (`PASS`, `REVIEW`, `REJECT`). Rejections block appointment creation immediately.

6. **E-Ticket & QR Code Generation (SYS-UC-02)**:
   - Generates a signed QR payload (`LL-TICKET-<id>`) and creates an `ETicket` record linked to the appointment.

---

## 5. API Endpoints Overview

- `GET /api/v1/bookings/locations`: Search campaigns/locations with spatial and filter parameters.
- `POST /api/v1/bookings/appointments`: Book appointment with screening answers.
- `GET /api/v1/bookings/appointments`: Retrieve appointment history for logged-in donor.
- `GET /api/v1/bookings/appointments/:id`: Retrieve appointment details.
- `PATCH /api/v1/bookings/appointments/:id/cancel`: Cancel future appointment.
- `GET /api/v1/bookings/appointments/:id/e-ticket`: Retrieve/download E-ticket.
- `POST /api/v1/bookings/appointments/:id/sync-bloodcenter`: Sync appointment to BloodCenter.
- `POST /api/v1/bookings/appointments/:id/confirm`: BloodCenter staff confirm appointment.
- `POST /api/v1/bookings/appointments/:id/reject`: BloodCenter staff reject/defer appointment.