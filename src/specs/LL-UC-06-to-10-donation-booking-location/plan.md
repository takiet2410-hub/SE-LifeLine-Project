# Implementation Plan: Donation Booking & Location

## 1. Technical Summary

This plan extends the existing Node.js/Express backend with a single booking module under the existing modular monolith structure. The module will implement the full LL-UC-06 to LL-UC-10 workflow for donation location discovery, appointment creation, appointment viewing, cancellation, and e-ticket download.

The implementation will remain within the current architecture by reusing:
- the existing Express application bootstrap in app.ts and server.ts
- the shared middleware in shared/ for authentication, validation, and error handling
- the existing MongoDB connection utility in utils/db.util.ts
- the existing Swagger configuration in config/swagger.config.ts

The booking module will be introduced as a new feature module under backend-core/src/modules/booking and will expose REST endpoints under /api/v1/bookings.

### Existing Infrastructure Reuse

The implementation extends the existing backend architecture without redesigning it.

The following shared components will be reused throughout the Booking module:

- `config/env.config.ts`
- `config/swagger.config.ts`
- `shared/auth.middleware.ts`
- `shared/validate.middleware.ts`
- `shared/error.middleware.ts`
- `utils/db.util.ts`

No duplicate infrastructure components will be created.


## 2. Existing Architecture Overview

The backend already follows a modular monolith approach with feature-oriented folders inside src/modules. The new booking feature will fit into this pattern by providing:
- controllers/ for request handling
- services/ for business logic
- routes/ for route registration
- models/ for Mongoose persistence
- schemas/ for request validation

Controllers will remain thin and delegate all business logic to services. Validation will be handled by the existing validation middleware and Zod-based schemas. Persistence will use Mongoose models connected through the shared database utility. Errors will flow through the centralized error middleware so that all booking failures return a consistent JSON structure.

                           Client
                              │
                              ▼
                       Express Application
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
        Authentication   Booking Module   Swagger
             │                 │
             ▼                 ▼
      auth.middleware     Controllers
                               │
                               ▼
                           Services
                               │
                               ▼
                        Mongoose Models
                               │
                               ▼
                           MongoDB

## 3. Project Structure

backend-core/
└── src/
    ├── app.ts
    ├── server.ts
    ├── config/
    │   ├── env.config.ts
    │   └── swagger.config.ts
    ├── shared/
    │   ├── auth.middleware.ts
    │   ├── validate.middleware.ts
    │   └── error.middleware.ts
    ├── utils/
    │   └── db.util.ts
    └── modules/
        └── booking/
            ├── controllers/
            │   └── booking.controller.ts
            ├── services/
            │   └── booking.service.ts
            ├── routes/
            │   └── booking.routes.ts
            ├── models/
            │   ├── appointment.model.ts
            │   ├── screening-form.model.ts
            │   └── eticket.model.ts
            ├── schemas/
            │   ├── create-appointment.schema.ts
            │   ├── cancel-appointment.schema.ts
            │   ├── search-location.schema.ts
            │   └── download-ticket.schema.ts
            └── index.ts

The module will be mounted from the existing application entry point, and the route definitions will be registered with the existing Express app.

## 4. Requirement Traceability

The implementation will preserve traceability from every functional requirement in the specification.

| Functional Requirement | Use Case | Controller | Service | Model(s) | Schema | API Endpoint |
| --- | --- | --- | --- | --- | --- | --- |
| FR-001 | LL-UC-06 | booking.controller.listLocations | booking.service.searchLocations | Campaign | search-location.schema | GET /api/v1/bookings/locations |
| FR-002 | LL-UC-06 | booking.controller.listLocations | booking.service.searchLocations | Campaign | search-location.schema | GET /api/v1/bookings/locations |
| FR-003 | LL-UC-06 | booking.controller.listLocations | booking.service.searchLocations | Campaign | search-location.schema | GET /api/v1/bookings/locations |
| FR-004 | LL-UC-07 | booking.controller.createAppointment | booking.service.createAppointment | Appointment, Campaign | create-appointment.schema | POST /api/v1 bookings/appointments |
| FR-005 | LL-UC-07 | booking.controller.createAppointment | booking.service.createAppointment | Appointment, Campaign, DonorProfile | create-appointment.schema | POST /api/v1/bookings/appointments |
| FR-006 | LL-UC-07 | booking.controller.createAppointment | booking.service.createAppointment | Appointment | create-appointment.schema | POST /api/v1/bookings/appointments |
| FR-007 | LL-UC-07 | booking.controller.createAppointment | booking.service.createAppointment | Appointment, Campaign | create-appointment.schema | POST /api/v1/bookings/appointments |
| FR-008 | LL-UC-07 | booking.controller.createAppointment | booking.service.createAppointment | Campaign | create-appointment.schema | POST /api/v1/bookings/appointments |
| FR-009 | LL-UC-07 | booking.controller.createAppointment | booking.service.createAppointment | ScreeningForm | create-appointment.schema | POST /api/v1/bookings/appointments |
| FR-010 | LL-UC-07 | booking.controller.createAppointment | booking.service.createAppointment | ETicket | create-appointment.schema | POST /api/v1/bookings/appointments |
| FR-009a ~ FR-009e | SYS-UC-01 | booking.controller.createAppointment | booking.service.generateScreeningForm | ScreeningForm | create-appointment.schema | POST /api/v1/bookings/appointments |
| FR-010 | SYS-UC-02 | booking.controller.createAppointment | booking.service.generateETicket | ETicket | create-appointment.schema | POST /api/v1/bookings/appointments |
| FR-011 | LL-UC-08 | booking.controller.getAppointmentById | booking.service.getAppointmentById | Appointment, ScreeningForm, ETicket | none | GET /api/v1/bookings/appointments/{id} |
| FR-012 | LL-UC-08 | booking.controller.listAppointments | booking.service.listAppointments | Appointment | none | GET /api/v1/bookings/appointments |
| FR-013 | LL-UC-09 | booking.controller.cancelAppointment | booking.service.cancelAppointment | Appointment, Campaign | cancel-appointment.schema | PATCH /api/v1/bookings/appointments/{id}/cancel |
| FR-014 | LL-UC-09 | booking.controller.cancelAppointment | booking.service.cancelAppointment | Campaign | cancel-appointment.schema | PATCH /api/v1/bookings/appointments/{id}/cancel |
| FR-015 | LL-UC-09 | booking.controller.cancelAppointment | booking.service.cancelAppointment | Appointment | cancel-appointment.schema | PATCH /api/v1/bookings/appointments/{id}/cancel |
| FR-016 | LL-UC-10 | booking.controller.downloadETicket | booking.service.downloadETicket | ETicket | download-ticket.schema | GET /api/v1/bookings/appointments/{id}/e-ticket |
| FR-017 | LL-UC-10 | booking.controller.downloadETicket | booking.service.downloadETicket | ETicket | download-ticket.schema | GET /api/v1/bookings/appointments/{id}/e-ticket |
| FR-018 | LL-UC-10 | booking.controller.downloadETicket | booking.service.downloadETicket | ETicket | download-ticket.schema | GET /api/v1/bookings/appointments/{id}/e-ticket |

## 5. Module Design

### Controllers
The controller layer will be responsible for:
- receiving HTTP requests
- applying the existing validation middleware and schema validation
- delegating to the service layer
- shaping responses to the API contract

The controller methods will be:
- listLocations
- createAppointment
- getAppointmentById
- cancelAppointment
- downloadETicket

### Services
The service layer will contain the core domain logic and enforce all business rules. It will provide the following responsibilities:
- coordinate location search using donor location or manual location input
- validate campaign activity and availability
- enforce the 84-day minimum donation interval
- prevent overlapping appointments for the same donor
- reserve capacity and release it on cancellation
- create linked ScreeningForm and ETicket records
- enforce cancellation timing and status transitions
- return the signed e-ticket payload or download artifact

Business logic will not be embedded in controllers.

BookingService
        │
        ├──────── GenerateScreeningForm()
        │
        ├──────── GenerateETicket()
        │
        └──────── CreateAppointment()
### Models
The module will introduce the following Mongoose models:
- Appointment
- ScreeningForm
- ETicket

The appointment model will reference campaign and donor profile data, while the ScreeningForm and ETicket models will reference the appointment record.

### Schemas
The module will define request validation schemas for:
- search-location.schema.ts for location browsing queries
- create-appointment.schema.ts for booking payloads
- cancel-appointment.schema.ts for cancellation requests
- download-ticket.schema.ts for ticket retrieval parameters

## 6. Module Dependencies

The Booking module collaborates with existing modules rather than reimplementing their responsibilities.

### Authentication Module

Provides:

- User authentication
- JWT verification
- Donor identity

The Booking module retrieves the authenticated donor from `auth.middleware.ts` and never accepts `donorId` from client requests.

### Campaign Module

Provides:

- Campaign information
- Available appointment slots
- Capacity constraints

Campaign entities are reused rather than recreated.

### Notification Module

Provides:

- Appointment confirmation
- Cancellation notifications

### Swagger

API documentation is generated through the existing Swagger configuration.
## 7. Data Model Integration

The booking module will integrate with the existing data model shape defined in the feature-specific data model artifact.

### Appointment
The Appointment model will store:
- donorId
- campaignId
- appointmentDate
- timeSlot
- status
- screeningFormId
- eTicketId
- createdAt / updatedAt

### ScreeningForm
The ScreeningForm model will store the pre-donation form payload and eligibility state.

### ETicket
The ETicket model will store:
- appointmentId
- ticketCode
- qrPayloadSigned
- fileUrl
- issuedAt

### Persistence behavior
- Appointment creation will be atomic to avoid partial state when booking fails.
- Campaign registeredCount/capacity updates will be applied as part of the same booking transaction path.
- A confirmed appointment must result in a linked e-ticket.
- Cancellation must restore capacity and update appointment state.

The Booking module introduces only three new business entities:

- Appointment
- ScreeningForm
- ETicket

The following entities are reused from existing modules:

- User
- Campaign

Relationships between entities follow the data model defined in `data-model.md`.
## 8. API Integration

The booking module will implement the five API contracts exactly as defined in the specification artifacts.

### GET /api/v1/bookings/locations
- accepts geolocation and filter query parameters
- returns nearby active donation campaigns and locations
- supports optional radius, date, blood type, and crowding-level filters

### POST /api/v1/bookings/appointments
- accepts campaignId, appointmentDate, and timeSlot
- validates authentication, active campaign state, capacity, 84-day rule, and overlap rules
- creates appointment, screening form, and e-ticket in one booking flow
- returns appointmentId, status, eTicketId, and signed QR payload information

### GET /api/v1/bookings/appointments
- retrieves a list of appointment history for the authenticated donor
- returns an array of basic appointment summaries

### GET /api/v1/bookings/appointments/{id}
- retrieves appointment details for the authenticated donor
- returns appointment, screening form, and e-ticket data

### PATCH /api/v1/bookings/appointments/{id}/cancel
- cancels a future appointment for the authenticated donor when allowed by the deadline policy
- returns the updated appointment state

### GET /api/v1/bookings/appointments/{id}/e-ticket
- retrieves or streams the donor’s e-ticket file or signed download artifact
- enforces access control so that only the appointment owner can download it

## 9. Validation Strategy

Validation will happen at the route boundary using Zod schemas and the existing validation middleware.

### Validation responsibilities
- query validation for location search parameters
- body validation for appointment creation
- parameter validation for appointment lookup and ticket download
- validation of cancellation requests and route parameters

### Schema coverage
- create-appointment.schema.ts will validate required booking fields and basic types
- cancel-appointment.schema.ts will validate the cancellation request contract
- search-location.schema.ts will validate filter inputs and optional geolocation values
- download-ticket.schema.ts will validate the request path parameter and any optional format selection

Invalid requests will be rejected before the service layer is called.

Validation is performed before entering controller logic.

Validation flow:

Client Request
        │
        ▼
Validation Schema
        │
        ▼
validate.middleware.ts
        │
        ▼
Controller
        │
        ▼
Service

Each endpoint owns a dedicated validation schema under:

modules/booking/schemas/

## 10. Authentication Strategy

Authentication is a cross-cutting concern and will be handled by the existing auth middleware.

Implementation approach:
- all booking endpoints will require authentication via the existing JWT-based middleware
- the authenticated donor will be derived from the request context populated by auth.middleware.ts
- the booking service will receive the donor identity from the controller, never from the request body
- donorId will not be accepted from client input and will be ignored if supplied

This ensures the booking feature honors the constitution’s authentication requirements and the specification’s actor model.

Authentication is mandatory for all Booking APIs.

Workflow:

JWT Token

↓

auth.middleware.ts

↓

Authenticated User

↓

Booking Controller

↓

Booking Service

The authenticated donor identifier is extracted from the JWT payload.

Client requests must never include donorId.

## 11. Error Handling Strategy

The booking module will reuse the centralized error middleware and follow the shared JSON error contract.

### Expected error categories
- 401 Unauthorized when no valid token is supplied
- 400 Bad Request for invalid payloads or malformed query params
- 403 Forbidden for eligibility failure, cancellation deadline violations, or unauthorized access
- 404 Not Found for missing campaign, appointment, or e-ticket
- 409 Conflict for slot unavailability or duplicate overlapping appointments

### Logging and security constraints
- no raw QR payloads, passwords, or full CCCD data will be logged
- errors must be surfaced consistently without silent catch blocks
- business-rule failures must be mapped to explicit error codes and messages

## 12. Swagger Integration

Swagger integration will reuse the existing configuration and register the booking endpoints under the existing /api-docs documentation.

Implementation approach:
- add Swagger JSDoc annotations for the five booking endpoints
- ensure the route definitions are registered before the app serves Swagger UI
- expose the endpoints in the same documentation structure already used by the auth module
- include request parameters, request bodies, and response examples aligned to the API contracts

All endpoints defined in the contracts artifact must appear in Swagger documentation.

Swagger documentation is integrated through the existing `swagger.config.ts`.

Requirements:

- Reuse existing Swagger configuration.
- Register Booking routes.
- Annotate all Booking endpoints with JSDoc/OpenAPI comments.
- Automatically expose documentation at:

/api-docs

No additional Swagger configuration files should be introduced.

## 13. Testing Strategy

The booking module will follow the constitution’s testing expectations for the Node.js core.

### Unit tests
At minimum, tests will cover:
- 84-day eligibility enforcement
- duplicate appointment prevention for overlapping dates and time slots
- capacity reservation and restoration logic
- cancellation deadline enforcement
- e-ticket creation and retrieval rules

### Integration tests
The implementation should also include route-level tests for:
- successful appointment creation
- ineligible donor rejection
- cancellation success and failure paths
- e-ticket download access control

Testing will use Jest with ts-jest, consistent with the constitution.

## 14. Implementation Phases

### Phase 1

Infrastructure Integration

- Register Booking Module
- Configure Route Registration
- Connect Swagger

--------------------

### Phase 2

Database Models

- Appointment
- ScreeningForm
- ETicket

--------------------

### Phase 3

Validation Schemas

- Create Appointment
- Cancel Appointment
- Search Location
- Download Ticket

--------------------

### Phase 4

Business Services

- Browse Locations
- Book Appointment
- View Appointment
- Cancel Appointment
- Download Ticket

--------------------

### Phase 5

Controllers & Routes

- Controllers
- Routes

--------------------

### Phase 6

Testing

- Unit Tests
- Integration Tests
- Swagger Verification

# Deliverables

The implementation phase is expected to produce the following artifacts:

- Booking module
- Booking controllers
- Booking services
- Booking routes
- Appointment model
- ScreeningForm model
- ETicket model
- Validation schemas
- Swagger API documentation
- Unit tests
- Integration tests

## 15. Risks and Mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Concurrent bookings exceed campaign capacity | double-booking and inconsistent availability | use atomic capacity updates and validation before final reservation |
| GPS or manual location input is missing | empty or low-quality search results | support both GPS-based and manual entry flow |
| Cancellation deadline policy is unclear | inconsistent cancel behavior | enforce a clearly defined deadline policy as a configurable business rule |
| e-ticket generation fails | appointment exists without ticket | create the e-ticket record as part of the same successful booking transaction path |
| unauthorized access to appointment or ticket data | security breach | enforce donor ownership checks on every appointment and e-ticket request |

## 16. Assumptions

The plan makes the following assumptions explicitly:
- the booking feature will be implemented in the existing backend-core monolith and will not introduce a separate service boundary
- campaign availability and capacity data will be available through the existing campaign data model or equivalent shared access path
- notification delivery can be invoked after successful booking or cancellation, even if the notification integration is implemented as a deferred call within the service layer
- e-ticket delivery can be represented as persisted ticket metadata plus a downloadable artifact or signed URL, rather than a fully separate document storage layer
- Authentication module is already available.
- Campaign information is managed by an existing Campaign module.
- Notification services are available for appointment confirmation.
- MongoDB connection is already configured.
- Swagger configuration already exists.

## 17. Outstanding Questions

The following items have been resolved:
- **Cancellation deadline policy:** Enforce a 24-hour deadline before the appointment time.
- **Campaign capacity updates:** The booking module directly updates campaign capacity records in the short term, to be refactored into a shared service contract later.
- **E-ticket download:** Return a direct PDF file stream.
- **Donor last donation date:** The booking module will obtain the donor's `lastDonationDate` from the `DonorProfile` model.

## Automation Traceability

The booking workflow includes two automated system use cases.

LL-UC-07
│
├── includes SYS-UC-01 Generate Pre-Donation Screening Form
│       ├── Retrieve active template
│       ├── Pre-populate donor information
│       ├── Validate screening responses
│       ├── Determine eligibility
│       └── Persist Screening Form
│
└── includes SYS-UC-02 Generate E-Ticket
        ├── Generate QR payload
        ├── Sign QR payload
        ├── Persist E-ticket
        └── Associate with Appointment