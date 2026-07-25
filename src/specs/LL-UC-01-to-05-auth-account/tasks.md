---
description: "Task list for feature implementation"
---

# Tasks: Auth & Account Management

**Input**: Design documents from `specs/LL-UC-01-to-05-auth-account/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize environment configuration management in `src/backend-core/src/config/env.config.ts`
- [X] T002 Initialize base Express app and server in `src/backend-core/src/server.ts`


---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Setup MongoDB connection utility in `src/backend-core/src/utils/db.util.ts`
- [X] T004 Setup centralized error handling middleware in `src/backend-core/src/middleware/error.middleware.ts`
- [X] T005 [P] Setup base routing structure in `src/backend-core/src/app.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Register via Citizen ID (Priority: P1) 🎯 MVP

**Goal**: Allow new donors to register an account by scanning CCCD QR code, extracting data, and creating a pending account.
**Independent Test**: Can be fully tested by extracting QR data, validating form, and verifying pending account creation and email dispatch.

### Implementation for User Story 1

- [X] T006 [P] [US1] Create User model in `src/backend-core/src/modules/auth-account/models/user.model.ts`
- [X] T007 [P] [US1] Create DonorProfile model in `src/backend-core/src/modules/auth-account/models/donor-profile.model.ts`
- [X] T008 [P] [US1] Define Zod schema for registration payload in `src/backend-core/src/modules/auth-account/schemas/register.schema.ts`
- [X] T009 [US1] Implement registration business logic (bcrypt, Brevo email dispatch) in `src/backend-core/src/modules/auth-account/auth-account.service.ts`
- [X] T010 [US1] Implement POST `/api/v1/users/register` handler in `src/backend-core/src/modules/auth-account/auth-account.controller.ts`
- [X] T011 [US1] Register registration route in `src/backend-core/src/modules/auth-account/auth-account.routes.ts`
- [X] T011a [P] [US1] Define Zod schema for email verification payload in `src/backend-core/src/modules/auth-account/schemas/verify-email.schema.ts`
- [X] T011b [US1] Implement email verification business logic (token validation and status update) in `src/backend-core/src/modules/auth-account/auth-account.service.ts`
- [X] T011c [US1] Implement POST `/api/v1/users/verify-email` handler in `src/backend-core/src/modules/auth-account/auth-account.controller.ts`
- [X] T011d [US1] Register verify-email route in `src/backend-core/src/modules/auth-account/auth-account.routes.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Authenticate Session (Priority: P1)

**Goal**: Securely log in with ID number and password, handle brute-force lockout, and generate JWT. Log out to invalidate token.
**Independent Test**: Can be fully tested by submitting valid credentials to receive a JWT session token, and invalidating it on logout.

### Implementation for User Story 2

- [X] T012 [P] [US2] Define Zod schema for login payload in `src/backend-core/src/modules/auth-account/schemas/login.schema.ts`
- [X] T013 [P] [US2] Implement JWT verification middleware in `src/backend-core/src/middleware/auth.middleware.ts`
- [X] T014 [US2] Implement login/logout business logic (brute-force check, JWT signing) in `src/backend-core/src/modules/auth-account/auth-account.service.ts`
- [X] T015 [US2] Implement POST `/api/v1/users/login` and `/api/v1/users/logout` handlers in `src/backend-core/src/modules/auth-account/auth-account.controller.ts`
- [X] T016 [US2] Register login and logout routes in `src/backend-core/src/modules/auth-account/auth-account.routes.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Reset Password (Priority: P2)

**Goal**: Reset password using a time-limited 10-minute OTP sent to email.
**Independent Test**: Request an OTP, verify OTP, and successfully set a new password.

### Implementation for User Story 3

- [X] T017 [P] [US3] Define Zod schemas for OTP request and reset submission in `src/backend-core/src/modules/auth-account/schemas/reset-password.schema.ts`
- [X] T018 [US3] Implement OTP generation and validation logic in `src/backend-core/src/modules/auth-account/auth-account.service.ts`
- [X] T019 [US3] Implement reset-password-request and reset-password handlers in `src/backend-core/src/modules/auth-account/auth-account.controller.ts`
- [X] T020 [US3] Register reset password routes in `src/backend-core/src/modules/auth-account/auth-account.routes.ts`

**Checkpoint**: All auth-related user stories should now be functional.

---

## Phase 6: User Story 4 - Manage Profile (Priority: P2)

**Goal**: Update contact information (email, phone, address) and ensure identity fields cannot be modified.
**Independent Test**: Modify contact fields and confirm database updates while verifying identity fields remain immutable.

### Implementation for User Story 4

- [X] T021 [P] [US4] Define Zod schema for profile updates in `src/backend-core/src/modules/auth-account/schemas/update-profile.schema.ts`
- [X] T022 [US4] Implement profile update logic ensuring identity-fields exclusion in `src/backend-core/src/modules/auth-account/auth-account.service.ts`
- [X] T023 [US4] Implement PATCH `/api/v1/users/profile` handler in `src/backend-core/src/modules/auth-account/auth-account.controller.ts`
- [X] T024 [US4] Register protected profile update route in `src/backend-core/src/modules/auth-account/auth-account.routes.ts`

**Checkpoint**: All user stories are fully implemented.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T025 Setup `swagger-ui-express` and `swagger-jsdoc` in `src/backend-core/src/config/swagger.config.ts`
- [X] T026 Add Swagger JSDoc annotations to all endpoints in `src/backend-core/src/modules/auth-account/auth-account.routes.ts`
- [X] T027 Run quickstart.md validation to ensure all endpoints respond as expected

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies
- **User Story 1 (P1)**: Can start after Foundational (Phase 2).
- **User Story 2 (P1)**: Can start after Foundational (Phase 2).
- **User Story 3 (P2)**: Can start after Foundational (Phase 2).
- **User Story 4 (P2)**: Requires JWT auth middleware from US2 to secure the endpoint.

### Parallel Opportunities
- Models and schemas for US1, US2, US3, US4 can be implemented in parallel.
- Different developers can tackle US1, US2, and US3 simultaneously.

---

## Parallel Example: User Story 1
```bash
# Launch all models and schemas for User Story 1 together:
Task: "Create User model in src/backend-core/src/modules/auth-account/models/user.model.ts"
Task: "Create DonorProfile model in src/backend-core/src/modules/auth-account/models/donor-profile.model.ts"
Task: "Define Zod schema for registration payload in src/backend-core/src/modules/auth-account/schemas/register.schema.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (cURL registration).
