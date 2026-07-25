# Implementation Plan: Donor Registration & Health Screening Module (BC-UC-04, BC-UC-05)

**Branch**: `feature/BC-UC-04-to-05-donor-registration` | **Date**: 2026-07-25 | **Spec**: [spec.md](file:///D:/HK3/CNPM/Code/LamLai/HyVongLamDc/SE-LifeLine-Project/src/specs/BC-UC-04-to-05-donor-registration/spec.md)

**Input**: Feature specification for BC-UC-04 (View Donor Registration List) and BC-UC-05 (View/Edit Donor Registration Details & Screening) in backend-core service.

---

## Summary

Implement the backend-only Donor Registration and Health Screening module in `backend-core` to enable Blood Center Staff and Administrators to view paginated campaign registration lists, view donor registration details, and update health screening vitals and donor statuses. The implementation strictly adheres to an ADD-ONLY policy (creating `src/modules/registration` without modifying existing modules), reuses `auth-account` models (`User`, `DonorProfile`) as read-only imports, enforces atomic MongoDB transactions for multi-document screening updates, and records immutable audit logs for all access and update operations.

---

## Technical Context

**Language/Version**: Node.js Core, TypeScript 5.5 (strict mode enabled)

**Primary Dependencies**: Express 5.2, Mongoose 9.7, Zod 4.4, jsonwebtoken

**Storage**: MongoDB Atlas (`appointments`, `screening_forms`, `digital_donor_records`, `audit_logs`)

**Testing**: Jest + ts-jest

**Target Platform**: Node.js REST API service (`/api/v1/campaigns/:campaignId/registrations`, `/api/v1/registrations/:registrationId`)

**Project Type**: Web service (Modular Monolith Node.js backend)

**Performance Goals**: Registration list query <500ms; screening update & transactional write <1.5s

**Constraints**:
1. BACKEND ONLY — No UI/UX or client components.
2. ADD-ONLY — No edits, refactoring, or deletions of existing modules/files. Existing `auth-account` models imported read-only.
3. STRUCTURE CONSISTENCY — Mirror exact `modules/` folder layout (`controllers/`, `services/`, `routes/`, `schemas/`, `models/`, `__tests__/`).
4. NO INVENTED BUSINESS RULES — Four open clinical threshold questions left uninvented; manual status selection kept fully functional.

**Scale/Scope**: 3 endpoints (`GET /api/v1/campaigns/:campaignId/registrations`, `GET /api/v1/registrations/:registrationId`, `PUT /api/v1/registrations/:registrationId/screening`)

---

## Constitution Check

*GATE: All checks PASSED.*

1. **Architecture & Module Boundaries**: Additive feature placed in `src/backend-core/src/modules/registration`. Reads from `auth-account` via read-only imports; no direct cross-module DB entity mutations outside own module.
2. **Security & Compliance**: Standard JWT authentication (`authenticateJWT`) and role-based staff authorization (`requireStaffRole`) applied to all endpoints. Sensitive identity data (CCCD, passwords) masked in audit logs using ObjectId references.
3. **Code Quality & Maintainability**: TypeScript strict mode (`tsc --noEmit` clean), Zod validation schemas (`validateRequest`), standard error format (`{ code, message, details }`).
4. **Testing & Definition of Done**: Jest unit & integration tests covering list pagination, search compatibility, status validation, and transactional rollback.

---

## Project Structure

### Documentation (this feature)

```text
specs/BC-UC-04-to-05-donor-registration/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Technical research & decisions (Phase 0)
├── data-model.md        # Mongoose schemas & data contracts (Phase 1)
├── quickstart.md        # Runnable integration testing guide (Phase 1)
└── contracts/
    └── registration-api-contract.md # API contract specification
```

### Source Code (repository root)

```text
src/backend-core/src/
├── app.ts                                                # Shared express app (APPEND ONLY: register router)
└── modules/
    └── registration/
        ├── __tests__/
        │   └── registration.test.ts                      # Unit & integration tests
        ├── controllers/
        │   └── registration.controller.ts                # Express HTTP request handlers
        ├── models/
        │   ├── digital-donor-record.model.ts             # IDigitalDonorRecord & Schema
        │   └── audit-log.model.ts                        # IAuditLog & Schema
        ├── routes/
        │   └── registration.routes.ts                    # Express router & Swagger annotations
        ├── schemas/
        │   └── registration.schema.ts                    # Zod validation schemas (vitals & status)
        ├── services/
        │   └── registration.service.ts                   # Business logic, pagination & DB transactions
        └── index.ts                                      # Barrel export
```

**Structure Decision**: Placed inside `src/backend-core/src/modules/registration`, mirroring existing module architecture (`auth-account`, `booking`, `campaign`).

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| None | All additions follow existing codebase conventions. | N/A |

---

## 1. Tech Stack & Conventions Confirmation

- **Node.js & TypeScript**: Node.js Core with TypeScript 5.5 in `strict: true` mode (`tsc --noEmit` required CI check).
- **Web Framework**: Express 5.2 using standard router pattern (`Router()`).
- **Database / ODM**: MongoDB Atlas using Mongoose 9.7 with document schemas, indexes, and session transactions.
- **Validation**: Zod 4.4 used with existing `validateRequest` middleware from `src/shared/validate.middleware.ts`.
- **Authentication**: JWT authentication via `authenticateJWT` from `src/shared/auth.middleware.ts`.
- **Role Authorization**: Role checking (`req.user.role === 'BloodCenterStaff' || req.user.role === 'Administrator'`) built as an additive middleware helper (`requireStaffRole`) following `auth.middleware.ts` conventions.
- **Error Handling**: Uses centralized `errorHandler` from `src/shared/error.middleware.ts` returning JSON shape `{ code, message, details }`.
- **Testing**: Jest + `ts-jest` framework located in `__tests__/` subfolder under module root.
- **Model Import Pattern**: `User` (`src/modules/auth-account/models/user.model.ts`) and `DonorProfile` (`src/modules/auth-account/models/donor-profile.model.ts`) imported as read-only models without editing `auth-account`.

---

## 2. Module & File Structure Plan

1. **`models/digital-donor-record.model.ts`**:
   - Schema for `DigitalDonorRecord` (`digital_donor_records` collection) with `appointmentId`, `donorId`, `screeningSummary`, `donationStatus`, and `clinicalNotes`.
2. **`models/audit-log.model.ts`**:
   - Additive schema for `AuditLog` (`audit_logs` collection) with `actorUserId`, `action`, `resourceType`, `resourceId`, `previousValue`, `newValue`, `timestamp`, and `ipAddress`.
3. **`schemas/registration.schema.ts`**:
   - `QueryRegistrationListSchema`: Validates query parameters (`page`, `limit`, `status`, `bloodType`, `startDate`, `endDate`, `sortBy`, `sortOrder`, `search`).
   - `GetRegistrationDetailsSchema`: Validates route param `:registrationId` (ObjectId string).
   - `UpdateScreeningSchema`: Validates `vitals` (`bloodPressure` pattern `/^\d{2,3}\/\d{2,3}$/`, `weight` > 0, `bodyTemperature` > 0, `hemoglobinLevel` > 0), `screeningNotes`, and `status` enum (`Eligible for Donation`, `Ineligible for Donation`, `Donation Completed`).
4. **`services/registration.service.ts`**:
   - Encapsulates query pagination, aggregate pipelines (joining `Appointment`, `User`, `DonorProfile`), detail retrieval, and atomic screening transactions.
5. **`controllers/registration.controller.ts`**:
   - Request handlers: `listCampaignRegistrations`, `getRegistrationById`, `updateRegistrationScreening`.
6. **`routes/registration.routes.ts`**:
   - Express router registering `/campaigns/:campaignId/registrations`, `/registrations/:registrationId`, and `/registrations/:registrationId/screening` with `authenticateJWT`, `requireStaffRole`, and `validateRequest`.
7. **`index.ts`**:
   - Barrel export file exporting `registrationRoutes`.

---

## 3. Endpoint Implementation Plan

### Sequential Build Order & Dependency Chain:
`Models & Schemas` → `Audit Utility` → `Service Layer` → `Controller Layer` → `Routes Wiring` → `App Mount` → `Jest Unit/Integration Tests`

#### Endpoint 1: `GET /api/v1/campaigns/:campaignId/registrations` (BC-UC-04)
1. **Route**: Receives request at `/api/v1/campaigns/:campaignId/registrations`.
2. **Middleware**: `authenticateJWT` → `requireStaffRole` → `validateRequest(QueryRegistrationListSchema)`.
3. **Controller**: Calls `RegistrationService.getCampaignRegistrations(campaignId, query, actorUserId)`.
4. **Service**:
   - Validates existence of Campaign record.
   - Constructs MongoDB query with optional filters (`status`, `bloodType`, `startDate`, `endDate`, `search`).
   - Executes paginated query using Mongoose `.find()` / `.aggregate()` with `.skip((page-1)*limit)` and `.limit(limit)`.
   - Joins `User` and `DonorProfile` fields to populate donor summary (`fullName`, `bloodType`, `phoneNumber`, `idDocumentNumber`).
   - Handles empty result set: returns `{ items: [], totalCount: 0, currentPage: page, pageSize: limit, totalPages: 0 }`.
   - Writes access audit entry to `AuditLog` (`action: "VIEW_REGISTRATION_LIST"`).
5. **Response**: HTTP 200 with items and pagination metadata.

#### Endpoint 2: `GET /api/v1/registrations/:registrationId` (BC-UC-05 Read / BC-UC-07 Reusable)
1. **Route**: Receives request at `/api/v1/registrations/:registrationId`.
2. **Middleware**: `authenticateJWT` → `requireStaffRole` → `validateRequest(GetRegistrationDetailsSchema)`.
3. **Controller**: Calls `RegistrationService.getRegistrationById(registrationId)`.
4. **Service**:
   - Fetches `Appointment` by `registrationId`. Returns HTTP 404 if not found.
   - Fetches associated `DonorProfile` and `User` for full profile info (`fullName`, `dateOfBirth`, `idDocumentNumber`, `phoneNumber`, `email`, `bloodType`, `permanentAddress`, `lastDonationDate`, `totalDonations`).
   - Fetches associated `ScreeningForm` (vitals, questionnaire answers).
   - Combines into unified detail object payload.
5. **Response**: HTTP 200 OK or HTTP 404 Not Found.

#### Endpoint 3: `PUT /api/v1/registrations/:registrationId/screening` (BC-UC-05 Write)
1. **Route**: Receives request at `/api/v1/registrations/:registrationId/screening`.
2. **Middleware**: `authenticateJWT` → `requireStaffRole` → `validateRequest(UpdateScreeningSchema)`.
3. **Controller**: Calls `RegistrationService.updateRegistrationScreening(registrationId, body, actorUserId, ipAddress)`.
4. **Service (Transaction Execution)**:
   - Starts Mongoose session: `session = await mongoose.startSession()`.
   - Executes inside `session.withTransaction(async () => { ... })`:
     a. Fetches `Appointment` record. If missing, throws 404 error.
     b. Updates or creates `ScreeningForm` document with vitals and screening notes.
     c. Updates `Appointment.status` to requested status enum (`Eligible for Donation`, `Ineligible for Donation`, `Donation Completed`).
     d. Upserts `DigitalDonorRecord` summary.
     e. Creates immutable `AuditLog` entry (`action: "UPDATE_REGISTRATION_SCREENING"`, `previousValue`, `newValue`).
   - In case of any error, transaction aborts cleanly ("No changes saved").
5. **Response**: HTTP 200 with full updated registration payload.

---

## 4. Cross-Cutting Concerns Plan

- **Role-Based Access Control (RBAC)**:
  - Create additive `requireStaffRole` middleware helper in `src/modules/registration/middleware/role.middleware.ts` (or `src/shared/role.middleware.ts`).
  - Verifies `req.user.role === 'BloodCenterStaff' || req.user.role === 'Administrator'`. If false, returns HTTP 403 Forbidden `{ code: 'FORBIDDEN', message: 'Insufficient permissions' }`.
- **Error Handling**:
  - Reuses existing `errorHandler` middleware from `src/shared/error.middleware.ts` to convert thrown errors or Zod errors into standard JSON shape `{ code, message, details }`.
- **Audit Logging & Privacy**:
  - `actorUserId` and `resourceId` stored as Mongoose ObjectId references. Full CCCD numbers and passwords are NEVER written to log text or metadata.
- **MongoDB Session & Transaction Support**:
  - Service methods use `mongoose.startSession()` and `withTransaction()` for multi-document atomicity.
  - Test suites use Mongoose transaction mocks or standalone session handlers if local test database runs without a replica set.

---

## 5. Testing Plan

### 5.1 Unit Tests (`src/modules/registration/__tests__/registration.test.ts`)
- **Pagination & Query Logic**: Test pagination math (`page`, `limit`, `totalPages`) and query filter assembly.
- **Empty Result Handling**: Verify that empty query matches return HTTP 200 with `{ items: [], totalCount: 0 }`.
- **Status Enum Validation**: Test Zod schema rejection of invalid statuses (e.g. `"Approved"`, `"Passed"`).
- **Transaction Rollback**: Mock DB failure on `DigitalDonorRecord` write and verify transaction aborts with zero partial mutations.

### 5.2 Integration Tests
- **Endpoint Security**: Verify HTTP 401 for unauthenticated calls and HTTP 403 for `Donor` role calls.
- **BC-UC-04 List Flow**: Call list endpoint with filters, verify item shape and audit log creation.
- **BC-UC-05 Detail & Edit Flow**: Read registration details, issue valid PUT update, verify HTTP 200 response and DB state.
- **BC-UC-06 Forward Search Compatibility**: Pass `search` query parameter to list endpoint and verify filtering by keyword.

---

## 6. Risks & Open Items to Carry Forward

1. **Unresolved Clinical Thresholds (Open Questions)**:
   - The four clinical numeric ranges from `spec.md` (`bloodPressure`, `weight`, `bodyTemperature`, `hemoglobinLevel`) remain open questions pending stakeholder/medical staff confirmation.
   - **Plan Action**: Automated eligibility calculation is NOT implemented in this phase. Manual status selection (`Eligible for Donation`, `Ineligible for Donation`, `Donation Completed`) by staff remains the sole functional status management mechanism.
2. **Structural Dependencies**:
   - Assumes `auth-account` module (`User`, `DonorProfile` models) is read-only and stable.
   - Assumes MongoDB environment supports transactions (replica set mode enabled or mocked in test environment).
