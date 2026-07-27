# Tasks: Donor Registration & Health Screening Module (BC-UC-04, BC-UC-05)

**Input**: Design documents from `/specs/BC-UC-04-to-05-donor-registration/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`)

---

## Explicit Non-Goals

1. **BACKEND ONLY**: No frontend/UI tasks, screens, or components.
2. **ADD-ONLY CONSTRAINTS**: No editing, refactoring, or deleting of existing files in `auth-account`, `booking`, `campaign`, or `src/shared`, except for the single, isolated, append-only router registration task in `app.ts` (T016).
3. **NO INVENTED BUSINESS RULES**: No implementation of automatic eligibility calculation from clinical thresholds (blood pressure, weight, body temperature, hemoglobin ranges). Manual status enum selection (`Eligible for Donation`, `Ineligible for Donation`, `Donation Completed`) by staff is the only status-setting mechanism to implement.
4. **NO OUT-OF-SCOPE USE CASES**: Do not implement BC-UC-06 (search) or BC-UC-07 (QR verification) themselves — only ensure `search` query parameter and direct detail lookup endpoint remain forward-compatible per spec.md User Story 3.
5. **READ-ONLY IMPORTS**: Any task requiring donor profile or account data MUST import `User` and `DonorProfile` models from `src/modules/auth-account/models/` as read-only dependencies without modifying those files.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story mapping (`[US1]`, `[US2]`, `[US3]`)

---

## Phase 1: Setup (Module Skeleton)

**Purpose**: Initialize module folder structure mirroring existing modules in `backend-core`

- [x] **T001** Create module directory skeleton at `src/backend-core/src/modules/registration/` containing `models/`, `schemas/`, `middleware/`, `services/`, `controllers/`, `routes/`, `__tests__/`, and `index.ts`
  - **Type**: Additive-new-files
  - **Dependencies**: None
  - **Acceptance Check**: Directory tree exists at `src/backend-core/src/modules/registration/` with all 7 subdirectories and `index.ts`.

---

## Phase 2: Foundational (Models, Schemas & Middleware)

**Purpose**: Core Mongoose schemas, Zod validation rules, and RBAC middleware required by all endpoints

- [x] **T002** `[P]` Create `DigitalDonorRecord` Mongoose schema/model in `src/backend-core/src/modules/registration/models/digital-donor-record.model.ts`
  - **Type**: Additive-new-file
  - **Dependencies**: T001
  - **Acceptance Check**: File exports `IDigitalDonorRecord` interface and `DigitalDonorRecord` Mongoose model for `digital_donor_records` collection with `appointmentId`, `donorId`, `screeningSummary`, `donationStatus`, and `clinicalNotes`.

- [x] **T003** `[P]` Create `AuditLog` Mongoose schema/model in `src/backend-core/src/modules/registration/models/audit-log.model.ts`
  - **Type**: Additive-new-file
  - **Dependencies**: T001
  - **Acceptance Check**: Verifies if an audit log model exists elsewhere; exports `IAuditLog` interface and `AuditLog` Mongoose model for `audit_logs` collection containing `actorUserId` (ObjectId), `action`, `resourceType`, `resourceId`, `previousValue`, `newValue`, `timestamp`, and `ipAddress`.

- [x] **T004** `[P]` Create Zod validation schemas in `src/backend-core/src/modules/registration/schemas/registration.schema.ts`
  - **Type**: Additive-new-file
  - **Dependencies**: T001
  - **Acceptance Check**: Exports `QueryRegistrationListSchema`, `GetRegistrationDetailsSchema`, and `UpdateScreeningSchema`. Zod validation rejects invalid blood pressure format (not matching `/^\d{2,3}\/\d{2,3}$/`), non-positive vitals (`weight`, `bodyTemperature`, `hemoglobinLevel` <= 0), and invalid status values outside `['Eligible for Donation', 'Ineligible for Donation', 'Donation Completed']`.

- [x] **T005** `[P]` Create `requireStaffRole` RBAC authorization middleware in `src/backend-core/src/modules/registration/middleware/role.middleware.ts`
  - **Type**: Additive-new-file
  - **Dependencies**: T001
  - **Acceptance Check**: Middleware checks `req.user.role === 'BloodCenterStaff' || req.user.role === 'Administrator'`. Passes `next()` for authorized roles; returns HTTP 403 `{ code: "FORBIDDEN", message: "Insufficient permissions to access donor registration data" }` for `Donor` or `HospitalStaff` roles.

---

## Phase 3: User Story 1 - View Campaign Donor Registration List (BC-UC-04) (Priority: P1) 🎯 MVP

**Goal**: Retrieve a paginated, filterable, and sortable list of donor registration records for a specified donation campaign with mandatory access audit logging.

**Independent Test**: Send `GET /api/v1/campaigns/:campaignId/registrations?page=1&limit=20` with Staff JWT. Verify HTTP 200 response with paginated items, metadata, empty result handling, and audit log write.

- [x] **T006** `[US1]` Implement `RegistrationService.getCampaignRegistrations` in `src/backend-core/src/modules/registration/services/registration.service.ts`
  - **Type**: Additive-new-file (Read-only imports from `auth-account`)
  - **Dependencies**: T002, T003, T004
  - **Acceptance Check**: Queries `Appointment` collection by `campaignId` with pagination (`page`, `limit`), sorting, date range, `status`, `bloodType`, and `search` query parameter. Populates donor summary fields (`fullName`, `bloodType`, `phoneNumber`, `idDocumentNumber`) via read-only join/import of `User` (`src/modules/auth-account/models/user.model.ts`) and `DonorProfile` (`src/modules/auth-account/models/donor-profile.model.ts`). Returns `{ items: [], totalCount: 0, currentPage: 1, pageSize: 20, totalPages: 0 }` for empty results. Writes `VIEW_REGISTRATION_LIST` entry to `AuditLog`.

- [x] **T007** `[US1]` Implement `listCampaignRegistrations` HTTP controller handler in `src/backend-core/src/modules/registration/controllers/registration.controller.ts`
  - **Type**: Additive-new-file
  - **Dependencies**: T006
  - **Acceptance Check**: Handler calls `RegistrationService.getCampaignRegistrations`, maps parameters from `req.params` and `req.query`, and returns HTTP 200 JSON payload or passes errors to `next(err)`.

- [x] **T008** `[US1]` Add `GET /campaigns/:campaignId/registrations` route in `src/backend-core/src/modules/registration/routes/registration.routes.ts`
  - **Type**: Additive-new-file
  - **Dependencies**: T005, T007
  - **Acceptance Check**: Route wires `authenticateJWT` → `requireStaffRole` → `validateRequest(QueryRegistrationListSchema)` → `RegistrationController.listCampaignRegistrations`.

- [x] **T009** `[P]` `[US1]` Add unit tests for `getCampaignRegistrations` service method in `src/backend-core/src/modules/registration/__tests__/registration.test.ts`
  - **Type**: Additive-new-file
  - **Dependencies**: T006
  - **Acceptance Check**: Unit tests verify pagination calculations, query filter assembly, empty list response shape (`totalCount: 0`), and audit log creation.

**Checkpoint**: User Story 1 is functional and testable independently.

---

## Phase 4: User Story 2 - View & Edit Donor Registration Details and Health Screening (BC-UC-05) (Priority: P1)

**Goal**: Retrieve full donor registration and screening details, and update screening vitals and donor status atomically in a single MongoDB transaction with modification audit logging.

**Independent Test**: Send `GET /api/v1/registrations/:registrationId` to verify full detail retrieval, and send `PUT /api/v1/registrations/:registrationId/screening` to verify atomic update across `ScreeningForm`, `Appointment`, `DigitalDonorRecord`, and `AuditLog`.

- [x] **T010** `[US2]` Implement `RegistrationService.getRegistrationById` and `RegistrationService.updateRegistrationScreening` in `src/backend-core/src/modules/registration/services/registration.service.ts`
  - **Type**: Additive-code-addition (Read-only imports from `auth-account`)
  - **Dependencies**: T006
  - **Acceptance Check**: `getRegistrationById` aggregates `Appointment`, `ScreeningForm`, and read-only `User`/`DonorProfile` fields (returning 404 if missing). `updateRegistrationScreening` uses a MongoDB Client Session Transaction (`mongoose.startSession()`) wrapping `ScreeningForm` upsert, `Appointment.status` update, `DigitalDonorRecord` upsert, and `AuditLog` insert (`action: "UPDATE_REGISTRATION_SCREENING"`). On any error, transaction aborts completely ("No changes saved").

- [x] **T011** `[US2]` Implement `getRegistrationById` and `updateRegistrationScreening` HTTP controller handlers in `src/backend-core/src/modules/registration/controllers/registration.controller.ts`
  - **Type**: Additive-code-addition
  - **Dependencies**: T007, T010
  - **Acceptance Check**: Controller routes request payloads to service methods and handles success (HTTP 200 with full updated object) or forwards error to `next(err)`.

- [x] **T012** `[US2]` Add `GET /registrations/:registrationId` and `PUT /registrations/:registrationId/screening` routes in `src/backend-core/src/modules/registration/routes/registration.routes.ts`
  - **Type**: Additive-code-addition
  - **Dependencies**: T008, T011
  - **Acceptance Check**: Wires `GET /registrations/:registrationId` (`authenticateJWT` → `requireStaffRole` → `validateRequest(GetRegistrationDetailsSchema)`) and `PUT /registrations/:registrationId/screening` (`authenticateJWT` → `requireStaffRole` → `validateRequest(UpdateScreeningSchema)`).

- [x] **T013** `[P]` `[US2]` Add unit tests for registration detail retrieval, status validation, and transactional rollback in `src/backend-core/src/modules/registration/__tests__/registration.test.ts`
  - **Type**: Additive-code-addition
  - **Dependencies**: T009, T010
  - **Acceptance Check**: Unit tests confirm 404 handling, Zod rejection of invalid status values (returning HTTP 400), and complete transactional rollback when DB write fails.

**Checkpoint**: User Stories 1 and 2 are fully functional and independently testable.

---

## Phase 5: User Story 3 - Search & QR Verification Endpoint Compatibility (BC-UC-06 / BC-UC-07 Compatibility) (Priority: P2)

**Goal**: Ensure registration list `search` query parameter and direct detail lookup endpoint are forward-compatible with future BC-UC-06 and BC-UC-07 implementations without breaking contracts.

**Independent Test**: Verify `GET /api/v1/campaigns/:campaignId/registrations?search=ND2026` filters results by keyword, and `GET /api/v1/registrations/:registrationId` accepts a decoded QR registration ID directly.

- [x] **T014** `[US3]` Add compatibility unit tests for search query filtering and direct QR ID detail lookup in `src/backend-core/src/modules/registration/__tests__/registration.test.ts`
  - **Type**: Additive-code-addition
  - **Dependencies**: T009, T013
  - **Acceptance Check**: Test confirms `search` parameter filters by donor name/CCCD/registration ID and detail endpoint resolves registration ID directly without requiring campaign list context.

---

## Phase 6: Module Integration & Isolated App Mount

**Purpose**: Export module barrel and mount registration router in `app.ts` as a single isolated append-only task.

- [x] **T015** Create barrel export in `src/backend-core/src/modules/registration/index.ts`
  - **Type**: Additive-new-file
  - **Dependencies**: T012
  - **Acceptance Check**: Exports `registrationRoutes`, `RegistrationController`, `RegistrationService`, `DigitalDonorRecord`, and `AuditLog`.

- [x] **T016** Isolated append-only route registration in `src/backend-core/src/app.ts`
  - **Type**: Isolated Append-Only Exception (Single-line addition)
  - **Dependencies**: T015
  - **Acceptance Check**: Appends `import registrationRoutes from './modules/registration/routes/registration.routes';` and `app.use('/api/v1', registrationRoutes);` to `src/backend-core/src/app.ts`. Zero changes or deletions to existing imports or routes.

---

## Phase 7: Polish, Documentation & E2E Integration Testing

**Purpose**: OpenAPI documentation and full end-to-end integration validation

- [x] **T017** `[P]` Add `@openapi` Swagger JSDoc annotations for all 3 endpoints in `src/backend-core/src/modules/registration/routes/registration.routes.ts`
  - **Type**: Additive-code-addition
  - **Dependencies**: T012
  - **Acceptance Check**: Swagger UI (`/api-docs`) displays documented specifications for `GET /api/v1/campaigns/:campaignId/registrations`, `GET /api/v1/registrations/:registrationId`, and `PUT /api/v1/registrations/:registrationId/screening`.

- [x] **T018** Write integration tests for Quickstart scenarios 1–5 in `src/backend-core/src/modules/registration/__tests__/registration.test.ts`
  - **Type**: Additive-code-addition
  - **Dependencies**: T016
  - **Acceptance Check**: Integration test suite passes Quickstart Scenarios 1–5: HTTP 401 unauthenticated, HTTP 403 invalid role, HTTP 404 not found, HTTP 400 validation error (status enum / vitals regex), and HTTP 200 successful transactional update.

---

## Dependencies & Execution Order

```
Phase 1: Setup (T001)
   │
   ▼
Phase 2: Foundational (T002, T003, T004, T005)
   │
   ├───────────────────────────────┐
   ▼                               ▼
Phase 3: User Story 1 (P1)     Phase 4: User Story 2 (P1)
(T006 -> T007 -> T008 -> T009)  (T010 -> T011 -> T012 -> T013)
   │                               │
   └───────────────┬───────────────┘
                   ▼
       Phase 5: User Story 3 (P2)
                   (T014)
                   │
                   ▼
       Phase 6: Integration (T015 -> T016)
                   │
                   ▼
       Phase 7: Polish (T017, T018)
```

---

## Parallel Opportunities

- **Phase 2**: T002 (`DigitalDonorRecord`), T003 (`AuditLog`), T004 (`Zod Schemas`), and T005 (`RBAC Middleware`) can all be built in parallel.
- **Phase 3 & Phase 4 Unit Tests**: T009 (`US1 Unit Tests`) and T013 (`US2 Unit Tests`) can run in parallel after their respective service methods are implemented.
- **Phase 7**: T017 (`OpenAPI Annotations`) can run in parallel with T018 (`Integration Tests`).
