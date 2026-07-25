# Feature Specification: Donor Registration & Health Screening Module (BC-UC-04, BC-UC-05)

**Feature Branch**: `feature/BC-UC-04-to-05-donor-registration`

**Created**: 2026-07-25

**Status**: Draft

**Input**: User description: "Scope: BACKEND ONLY. Translate use cases BC-UC-04 (View Donor Registration List) and BC-UC-05 (View/Edit Donor Registration Details) into backend API, service-layer, and data-layer specifications for Blood Center Staff actors."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Campaign Donor Registration List (BC-UC-04) (Priority: P1)

As an authenticated Blood Center Staff member, I want to retrieve a paginated, filterable, and sortable list of donor registration records for a specified donation campaign so that I can manage upcoming donor check-ins, monitor registration counts, and inspect donor readiness.

**Why this priority**: Retrieving donor registration lists for a campaign is essential for operational execution at blood donation drives and serves as the entry point for donor check-in and screening details.

**Independent Test**: Can be tested independently by issuing `GET /api/v1/campaigns/:campaignId/registrations` with valid staff credentials, verifying pagination metadata, filter query parameters (`status`, `bloodType`, `startDate`, `endDate`), default sorting, empty result handling, and audit logging.

**Acceptance Scenarios**:

1. **Given** an existing campaign ID with active donor registrations, **When** authorized Blood Center Staff requests `GET /api/v1/campaigns/:campaignId/registrations` without extra parameters, **Then** the system returns HTTP 200 with a paginated list of registration items (default `pageSize: 20`, `currentPage: 1`), including `registrationId` (maps to `appointmentId`), donor summary (reusing `fullName`, `bloodType`, `phoneNumber` from `auth-account` module), appointment date, time slot, current registration status, and pagination metadata (`totalCount`, `currentPage`, `pageSize`, `totalPages`).
2. **Given** a campaign ID with no registration records, **When** Staff requests the registration list, **Then** the system returns HTTP 200 with an empty array response shape (`{ items: [], totalCount: 0, currentPage: 1, pageSize: 20, totalPages: 0 }`), not an error.
3. **Given** a campaign registration list request with query parameters `status=Scheduled`, `bloodType=O+`, `page=2`, and `limit=10`, **When** Staff submits the query, **Then** the system filters and paginates matching records accordingly.
4. **Given** any call to the registration list endpoint, **When** processed by the backend, **Then** the system creates an immutable access log entry recording `actorUserId`, `timestamp`, `campaignId`, `filterCriteria`, and `ipAddress`.

---

### User Story 2 - View & Edit Donor Registration Details and Health Screening (BC-UC-05) (Priority: P1)

As an authorized Blood Center Staff member, I want to retrieve full registration and health screening details for a donor and update their screening vitals and donation status atomically so that clinical staff can record health evaluations and update donor eligibility safely.

**Why this priority**: Recording medical screening results (vitals, hemoglobin, screening notes) and setting final donor status (`Eligible for Donation`, `Ineligible for Donation`, `Donation Completed`) is a mandatory clinical requirement prior to blood collection.

**Independent Test**: Can be tested independently by issuing `GET /api/v1/registrations/:registrationId` to verify complete retrieval (including donor profile info from `auth-account` module, screening form data, and donation history), and issuing `PUT /api/v1/registrations/:registrationId/screening` with updated vitals and status to verify schema validation, atomic transactional database persistence, audit logging, and response payload.

**Acceptance Scenarios**:

1. **Given** a valid `registrationId`, **When** Staff requests `GET /api/v1/registrations/:registrationId`, **Then** the system retrieves and returns full donor details (reusing `DonorProfile` fields: `fullName`, `dateOfBirth`, `idDocumentNumber`, `phoneNumber`, `email`, `bloodType`, `permanentAddress`, `lastDonationDate`, `totalDonations`), health screening info, and current donation status.
2. **Given** an invalid or non-existent `registrationId`, **When** Staff requests registration details, **Then** the system returns HTTP 404 with error shape `{ code: "NOT_FOUND", message: "Donor registration record not found", details: [] }`.
3. **Given** valid screening vitals (`bloodPressure`, `weight`, `bodyTemperature`, `hemoglobinLevel`, `screeningNotes`) and a valid status (`Eligible for Donation`, `Ineligible for Donation`, or `Donation Completed`), **When** Staff submits `PUT /api/v1/registrations/:registrationId/screening`, **Then** the system updates the screening form and registration status atomically in a single database transaction, writes an immutable audit log entry (recording previous and new values), and returns HTTP 200 with the full updated registration object.
4. **Given** an update request containing an invalid status value (e.g., `"Approved"` or `"Pending"`), **When** Staff submits the request, **Then** the system rejects the update with HTTP 400 validation error and performs no database updates.
5. **Given** a database or system failure during the update execution, **When** the transaction fails, **Then** all changes (screening form, status update, digital donor record) are rolled back completely ("No changes are saved") and HTTP 500 error is returned.

---

### User Story 3 - Search & QR Verification Endpoint Compatibility (Priority: P2)

As a backend system architect, I want the registration list and detail endpoints to support seamless integration with future search (BC-UC-06) and QR code verification (BC-UC-07) flows without breaking API contracts.

**Why this priority**: Enables reuse of registration list query parameters for search/filtering and ensures the detail retrieval endpoint can be invoked directly following a QR code decode operation.

**Independent Test**: Verify that `GET /api/v1/campaigns/:campaignId/registrations` accepts an optional `search` query parameter, and `GET /api/v1/registrations/:registrationId` can be resolved directly using a registration/appointment ID extracted from a QR code.

**Acceptance Scenarios**:

1. **Given** a search query `search=ND2026`, **When** sent to `GET /api/v1/campaigns/:campaignId/registrations?search=ND2026`, **Then** the backend filters results by matching registration ID, donor name, or identity document number while maintaining standard pagination structure.
2. **Given** a decoded QR payload producing `registrationId: "65f1a2b3c4d5e6f7a8b9c0d1"`, **When** the QR verification flow invokes `GET /api/v1/registrations/65f1a2b3c4d5e6f7a8b9c0d1`, **Then** the backend returns the exact same detail payload as BC-UC-05 without requiring list navigation context.

---

### Edge Cases

- **Non-existent Campaign ID**: Querying `GET /api/v1/campaigns/:campaignId/registrations` for a non-existent campaign returns HTTP 404 (`{ code: "NOT_FOUND", message: "Campaign not found" }`).
- **Unauthorized Role Access**: Requests to BC-UC-04 or BC-UC-05 endpoints by users with role `Donor` or `HospitalStaff` return HTTP 403 (`{ code: "FORBIDDEN", message: "Insufficient permissions to access donor registration data" }`).
- **Unauthenticated Requests**: Requests missing valid JWT access tokens return HTTP 401 (`{ code: "UNAUTHORIZED", message: "Authentication required" }`).
- **Concurrent Status Updates**: Simultaneous updates to the same donor registration record are managed via database transactional locks to prevent dirty writes or race conditions.
- **Client-Side Cancellation (AF-02)**: Cancelling or discarding edits in the UI is purely client-side; no backend state rollback endpoint is required since unsaved changes are never transmitted.

---

## Requirements *(mandatory)*

### Scope: BACKEND ONLY
This specification covers backend REST API routes, controllers, services, MongoDB schemas, validation, business logic, authorization middleware, and audit logging. UI/UX design, screens, and components are strictly out of scope.

### Functional Requirements

- **FR-001**: System MUST expose a REST endpoint `GET /api/v1/campaigns/:campaignId/registrations` allowing authenticated Blood Center Staff and Administrators to retrieve donor registrations for a campaign.
- **FR-002**: System MUST enforce pagination on the registration list endpoint with query parameters `page` (default: 1, min: 1) and `limit` (default: 20, min: 1, max: 100).
- **FR-003**: Registration list endpoint MUST return pagination metadata in the payload root: `totalCount`, `currentPage`, `pageSize`, `totalPages`.
- **FR-004**: If no registration records exist for a campaign, the registration list endpoint MUST return HTTP 200 with `{ items: [], totalCount: 0, currentPage: 1, pageSize: 20, totalPages: 0 }`.
- **FR-005**: Registration list endpoint MUST support query parameter filtering on `status` (enum filter), `bloodType` (enum filter), `startDate` (ISO 8601), `endDate` (ISO 8601), and optional `search` (keyword matching donor name, registration ID, or identity document number for BC-UC-06 extension compatibility).
- **FR-006**: Registration list items MUST include `registrationId` (Appointment `_id`), `appointmentDate`, `timeSlot`, `status`, and donor summary fields (`donorId`, `fullName`, `bloodType`, `phoneNumber`, `idDocumentNumber`) sourced from the `auth-account` module (`DonorProfile` / `User`).
- **FR-007**: System MUST log every list view access in the `audit_logs` collection with `actorUserId`, `action: "VIEW_REGISTRATION_LIST"`, `resourceType: "Campaign"`, `resourceId: campaignId`, query criteria, timestamp, and IP address.
- **FR-008**: System MUST expose a REST endpoint `GET /api/v1/registrations/:registrationId` to retrieve full donor registration details, health screening data, and donation history.
- **FR-009**: System MUST reuse existing fields from the `auth-account` module (`User` and `DonorProfile` collections: `fullName`, `dateOfBirth`, `idDocumentNumber`, `phoneNumber`, `email`, `permanentAddress`, `currentAddress`, `bloodType`, `lastDonationDate`, `totalDonations`) rather than duplicating personal donor attributes in registration tables.
- **FR-010**: System MUST expose a REST endpoint `PUT /api/v1/registrations/:registrationId/screening` allowing authorized staff to record or update health screening info and donor status.
- **FR-011**: Health screening fields MUST include: `bloodPressure` (string, e.g. `"120/80"`), `weight` (number in kg), `bodyTemperature` (number in °C), `hemoglobinLevel` (number in g/dL), and `screeningNotes` (string, optional).
- **FR-012**: Donor status updates MUST be restricted to an exact enum vocabulary: `Eligible for Donation`, `Ineligible for Donation`, `Donation Completed`. Requests containing any other status value MUST be rejected with HTTP 400 validation error.
- **FR-013**: System MUST execute health screening updates and status modifications within a single atomic database transaction across `Appointment` (or `DigitalDonorRecord`), `ScreeningForm`, and `AuditLog`. If any write fails, no changes MUST be saved.
- **FR-014**: System MUST log every registration update in the `audit_logs` collection, recording `actorUserId`, `action: "UPDATE_REGISTRATION_SCREENING"`, `resourceType: "Registration"`, `resourceId: registrationId`, `previousValue`, `newValue`, timestamp, and IP address.
- **FR-015**: Backend MUST require Role-Based Access Control (RBAC) enforcing `role === 'BloodCenterStaff' || role === 'Administrator'` for all endpoints defined in this spec.

---

### Key Entities & Data Schema Integration

#### 1. Reused Entities from `auth-account` Module (No Duplication)
- **`User`** (`users` collection):
  - `_id`: ObjectId (PK)
  - `idDocumentNumber`: string (Citizen ID / CCCD)
  - `email`: string
  - `phone`: string
  - `role`: enum (`Donor`, `BloodCenterStaff`, `HospitalStaff`, `Administrator`)
- **`DonorProfile`** (`donor_profiles` collection):
  - `_id`: ObjectId (PK)
  - `userId`: ObjectId (FK → `User`)
  - `fullName`: string
  - `dateOfBirth`: Date
  - `permanentAddress`: string
  - `currentAddress`: Mixed / string
  - `bloodType`: enum (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`, `Unknown`)
  - `lastDonationDate`: Date (optional)
  - `totalDonations`: number (default: 0)

#### 2. Registration & Screening Entities (Module: `booking` / `donor-registration`)
- **`Appointment` / Registration Record** (`appointments` collection):
  - `_id`: ObjectId (PK) — acts as `registrationId`
  - `donorId`: ObjectId (FK → `User`)
  - `campaignId`: ObjectId (FK → `Campaign`)
  - `appointmentDate`: Date
  - `timeSlot`: string (e.g. `"08:00 - 09:00"`)
  - `status`: enum (`Scheduled`, `CheckedIn`, `Eligible for Donation`, `Ineligible for Donation`, `Donation Completed`, `Cancelled`)
  - `screeningFormId`: ObjectId (FK → `ScreeningForm`)
  - `createdAt` / `updatedAt`: Date
- **`ScreeningForm`** (`screening_forms` collection):
  - `_id`: ObjectId (PK)
  - `appointmentId`: ObjectId (FK → `Appointment`)
  - `medicalHistory`: object (donor pre-donation questionnaire answers)
  - `currentHealthStatus`: string
  - `recentTravel`: string
  - `medicationHistory`: string
  - `vitals`: object:
    - `bloodPressure`: string (e.g. `"120/80"`)
    - `weight`: number (kg)
    - `bodyTemperature`: number (°C)
    - `hemoglobinLevel`: number (g/dL)
  - `screeningNotes`: string
  - `eligibilityFlag`: enum (`Eligible`, `RequiresReview`, `Ineligible`)
  - `reviewedByStaffId`: ObjectId (FK → `User`)
  - `submittedAt` / `updatedAt`: Date
- **`DigitalDonorRecord`** (`digital_donor_records` collection):
  - `_id`: ObjectId (PK)
  - `appointmentId`: ObjectId (FK → `Appointment`)
  - `donorId`: ObjectId (FK → `User`)
  - `screeningSummary`: object
  - `donationStatus`: string (mapped to registration status enum)
  - `clinicalNotes`: string
  - `lastUpdatedAt`: Date
- **`AuditLog`** (`audit_logs` collection):
  - `_id`: ObjectId (PK)
  - `actorUserId`: ObjectId (FK → `User`)
  - `action`: string (`"VIEW_REGISTRATION_LIST"`, `"UPDATE_REGISTRATION_SCREENING"`)
  - `resourceType`: string (`"Campaign"`, `"Registration"`)
  - `resourceId`: ObjectId
  - `previousValue`: object (optional)
  - `newValue`: object (optional)
  - `timestamp`: Date
  - `ipAddress`: string

---

## Audit & Logging Requirements

Per LifeLine Constitution §2 (Security & Compliance) and Use-Case Special Requirements:

1. **Access Audit Logging (BC-UC-04)**:
   - Every execution of `GET /api/v1/campaigns/:campaignId/registrations` MUST write an audit record to MongoDB `audit_logs`.
   - Log attributes: `actorUserId`, `action: "VIEW_REGISTRATION_LIST"`, `resourceType: "Campaign"`, `resourceId: campaignId`, `filterCriteria: { page, limit, status, bloodType, search }`, `timestamp: ISO8601`, `ipAddress: string`.

2. **Modification Audit Logging (BC-UC-05)**:
   - Every execution of `PUT /api/v1/registrations/:registrationId/screening` MUST write an immutable audit record within the update transaction.
   - Log attributes: `actorUserId`, `action: "UPDATE_REGISTRATION_SCREENING"`, `resourceType: "Registration"`, `resourceId: registrationId`, `previousValue: { vitals, status }`, `newValue: { vitals, status }`, `timestamp: ISO8601`, `ipAddress: string`.

3. **Privacy Masking**:
   - Audit log entries MUST NEVER log full CCCD numbers in plain text or passwords. `actorUserId` and `resourceId` object references MUST be used.

---

## Pagination, Sorting, and Filtering Contracts

### Request Contract: `GET /api/v1/campaigns/:campaignId/registrations`

#### Query Parameters:
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | integer | `1` | Page number (1-indexed, min: 1) |
| `limit` | integer | `20` | Number of items per page (min: 1, max: 100) |
| `status` | string | `undefined` | Filter by status (`Scheduled`, `CheckedIn`, `Eligible for Donation`, `Ineligible for Donation`, `Donation Completed`, `Cancelled`) |
| `bloodType` | string | `undefined` | Filter by blood type (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) |
| `startDate` | string (ISO 8601) | `undefined` | Filter registrations on or after this date |
| `endDate` | string (ISO 8601) | `undefined` | Filter registrations on or before this date |
| `sortBy` | string | `appointmentDate` | Sort field (`appointmentDate`, `createdAt`, `status`) |
| `sortOrder` | string | `asc` | Sort direction (`asc`, `desc`) |
| `search` | string | `undefined` | Optional search query (matches donor name, registration ID, or CCCD for BC-UC-06 compatibility) |

#### Response Contract (HTTP 200 OK):
```json
{
  "items": [
    {
      "registrationId": "65f1a2b3c4d5e6f7a8b9c0d1",
      "campaignId": "65f1a2b3c4d5e6f7a8b9c0a0",
      "donor": {
        "donorId": "65f1a2b3c4d5e6f7a8b9c001",
        "fullName": "Nguyen Van A",
        "idDocumentNumber": "012345678901",
        "phoneNumber": "0901234567",
        "bloodType": "O+"
      },
      "appointmentDate": "2026-08-10T00:00:00.000Z",
      "timeSlot": "08:00 - 09:00",
      "status": "CheckedIn",
      "createdAt": "2026-08-01T10:30:00.000Z"
    }
  ],
  "totalCount": 45,
  "currentPage": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

---

## Validation Rules, Atomicity, and Status Vocabulary

### Request Contract: `PUT /api/v1/registrations/:registrationId/screening`

#### Request Body Payload:
```json
{
  "vitals": {
    "bloodPressure": "120/80",
    "weight": 65.5,
    "bodyTemperature": 36.6,
    "hemoglobinLevel": 13.5
  },
  "screeningNotes": "Donor is in good physical condition.",
  "status": "Eligible for Donation"
}
```

#### Status Enum Vocabulary (API Level Enforcement):
Must be strictly one of:
1. `Eligible for Donation`
2. `Ineligible for Donation`
3. `Donation Completed`

Any value outside this enum will trigger HTTP 400 error:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid donor status value",
  "details": [
    {
      "field": "status",
      "message": "Status must be one of: 'Eligible for Donation', 'Ineligible for Donation', 'Donation Completed'"
    }
  ]
}
```

#### Field Validation Rules:
- `vitals.bloodPressure`: Required string matching pattern `/^\d{2,3}\/\d{2,3}$/` (e.g. `"120/80"`).
- `vitals.weight`: Required positive number (> 0).
- `vitals.bodyTemperature`: Required positive number (> 0).
- `vitals.hemoglobinLevel`: Required positive number (> 0).
- `screeningNotes`: Optional string (max 1000 chars).
- `status`: Required enum (`Eligible for Donation`, `Ineligible for Donation`, `Donation Completed`).

#### Transactional Atomicity:
All writes within `PUT /api/v1/registrations/:registrationId/screening` MUST be executed within a MongoDB Client Session Transaction:
1. Update `ScreeningForm` document with new vitals, screening notes, and reviewer ID.
2. Update `Appointment` document status field to the requested enum status.
3. Upsert `DigitalDonorRecord` summary.
4. Append `AuditLog` entry.

If any operation fails, `session.abortTransaction()` is called, ensuring zero partial state persistence.

---

## Open Questions & Business Rule Confirmations

The following clinical numeric thresholds determine automatic or suggested eligibility flags but are not explicitly specified in the source use case text. They are marked as open questions pending medical staff confirmation:

- **[OPEN QUESTION: Clinical Threshold - Blood Pressure]**: What are the exact allowable systolic and diastolic ranges for blood pressure (e.g., Systolic 90–140 mmHg, Diastolic 60–90 mmHg) to automatically classify a donor as `Eligible for Donation` vs `Ineligible for Donation`?
- **[OPEN QUESTION: Clinical Threshold - Minimum Weight]**: Is the minimum weight threshold for blood donation strictly 45 kg (for females) and 50 kg (for males), or a flat 45 kg across all genders?
- **[OPEN QUESTION: Clinical Threshold - Body Temperature]**: What is the maximum allowable body temperature (e.g., <= 37.5 °C) before marking a donor ineligible due to fever?
- **[OPEN QUESTION: Clinical Threshold - Hemoglobin Level]**: What are the exact minimum hemoglobin levels required (e.g., >= 12.5 g/dL for females, >= 13.0 g/dL for males) for eligibility?

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Registration list endpoint queries (`GET /api/v1/campaigns/:campaignId/registrations`) return HTTP 200 with paginated payload in under 500ms for dataset volumes up to 10,000 registration records.
- **SC-002**: Health screening updates (`PUT /api/v1/registrations/:registrationId/screening`) complete and return updated records within 1.5 seconds.
- **SC-003**: 100% of unauthorized access attempts by non-staff users (e.g. Donors) are blocked with HTTP 403 Forbidden.
- **SC-004**: 100% of screening update operations write a corresponding immutable record to the `audit_logs` collection.
- **SC-005**: 100% of failed screening updates undergo complete transactional rollback without partial database persistence.

---

## Assumptions

- Authentication is handled via existing JWT Bearer tokens in the `Authorization` header.
- Blood Center Staff and Administrator roles are defined in `User` entity (`role === 'BloodCenterStaff' || role === 'Administrator'`).
- The system reuses existing `User` and `DonorProfile` models from `src/modules/auth-account` for donor personal data.
- Shared error response shapes (`{ code, message, details }`) and Zod validation middleware (`validateRequest`) from `src/shared` are used for consistency across all endpoints.
