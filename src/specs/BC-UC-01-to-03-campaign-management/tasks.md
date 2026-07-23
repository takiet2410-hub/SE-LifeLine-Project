# Tasks: Campaign Management Module (BC-UC-01, BC-UC-02, BC-UC-03)

**Input**: Design documents from `/specs/BC-UC-01-to-03-campaign-management/`

**Prerequisites**: spec.md (required), plan.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Explicit file paths included in every task description

---

## Phase 1: Setup (Module Skeleton)

**Purpose**: Initialize module folder structure mirroring existing modules in `backend-core`

- [x] T001 Create module directory skeleton at `src/backend-core/src/modules/campaign/` containing `models/`, `schemas/`, `services/`, `controllers/`, `routes/`, `__tests__/`, and `index.ts` barrel file

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model and validation schemas required by all user stories

- [x] T002 [P] Create Mongoose ICampaign interface and CampaignSchema in `src/backend-core/src/modules/campaign/models/campaign.model.ts` (FR-002, FR-006, FR-007)
- [x] T003 [P] Create Zod validation schemas (CreateCampaignSchema, QueryCampaignSchema, UpdateCampaignSchema, GetCampaignDetailsSchema) in `src/backend-core/src/modules/campaign/schemas/campaign.schema.ts` (FR-001 to FR-010)

---

## Phase 3: User Story 1 - View Campaign List (BC-UC-01) (Priority: P1) 🎯 MVP

**Goal**: Implement paginated, filterable, and sortable campaign list retrieval for staff and donors

**Independent Test**: Execute `GET /api/v1/campaigns` with query filters and verify paginated response with `capacityProgress` calculations

- [x] T004 [US1] Implement `listCampaigns()` method with location, date range, status filters, sorting, and `capacityProgress` calculations in `src/backend-core/src/modules/campaign/services/campaign.service.ts` (FR-001, FR-002, FR-003)
- [x] T005 [US1] Implement `listCampaigns` HTTP request handler in `src/backend-core/src/modules/campaign/controllers/campaign.controller.ts` (FR-001)
- [x] T006 [US1] Add `GET /` route with `validateRequest(QueryCampaignSchema)` in `src/backend-core/src/modules/campaign/routes/campaign.routes.ts` (FR-001)
- [x] T007 [P] [US1] Add unit tests for `listCampaigns()` pagination and query filters in `src/backend-core/src/modules/campaign/__tests__/campaign.test.ts`

**Checkpoint**: User Story 1 is functional and testable independently.

---

## Phase 4: User Story 2 - Create Donation Campaign (BC-UC-02) (Priority: P1)

**Goal**: Enable staff to publish new donation campaigns with validation, auto-generated codes, and initial status

**Independent Test**: Execute `POST /api/v1/campaigns` with valid campaign payload and verify HTTP 201 response with auto-assigned `campaignCode` and initial status

- [x] T008 [US2] Implement `createCampaign()` method with past-date rejection, positive capacity/units validation, `campaignCode` auto-generation, and default status assignment in `src/backend-core/src/modules/campaign/services/campaign.service.ts` (FR-004, FR-005, FR-006)
- [x] T009 [US2] Implement `createCampaign` HTTP request handler in `src/backend-core/src/modules/campaign/controllers/campaign.controller.ts` (FR-004)
- [x] T010 [US2] Add `POST /` route protected by `authenticateJWT` and `validateRequest(CreateCampaignSchema)` in `src/backend-core/src/modules/campaign/routes/campaign.routes.ts` (FR-004)
- [x] T011 [P] [US2] Add unit tests for past-date rejection and invalid capacity/goal rejection in `src/backend-core/src/modules/campaign/__tests__/campaign.test.ts` (FR-005)

**Checkpoint**: User Stories 1 and 2 are functional independently.

---

## Phase 5: User Story 3 - View & Edit Campaign Details & Registrations (BC-UC-03) (Priority: P2)

**Goal**: Provide detailed campaign performance metrics, support editing with capacity reduction guards, and expose campaign registrations

**Independent Test**: Verify `GET /:id` returns performance metrics, `PUT /:id` blocks capacity reduction below registered donor count, and `GET /:id/registrations` returns linked appointments

- [x] T012 [US3] Implement `getCampaignById()`, `updateCampaign()` with capacity reduction guard, and `getCampaignRegistrations()` in `src/backend-core/src/modules/campaign/services/campaign.service.ts` (FR-007, FR-008, FR-009, FR-10)
- [x] T013 [US3] Implement `getCampaignById`, `updateCampaign`, and `getCampaignRegistrations` HTTP handlers in `src/backend-core/src/modules/campaign/controllers/campaign.controller.ts` (FR-007, FR-008, FR-010)
- [x] T014 [US3] Add `GET /:id`, `PUT /:id`, and `GET /:id/registrations` routes in `src/backend-core/src/modules/campaign/routes/campaign.routes.ts` (FR-007, FR-008, FR-010)
- [x] T015 [P] [US3] Add unit tests for capacity reduction guard (`CAPACITY_BELOW_REGISTERED`) and 404 handling in `src/backend-core/src/modules/campaign/__tests__/campaign.test.ts` (FR-009)

**Checkpoint**: All user stories (US1, US2, US3) are fully implemented and testable.

---

## Phase 6: Module Integration & Barrel Export

**Purpose**: Export module components and wire campaign router into main express application

- [x] T016 Export `campaignRoutes`, `CampaignController`, `CampaignService`, and `Campaign` from `src/backend-core/src/modules/campaign/index.ts`
- [x] T017 Append-only route registration in `src/backend-core/src/app.ts`:
  Add import: `import { campaignRoutes } from './modules/campaign';`
  Add route: `app.use('/api/v1/campaigns', campaignRoutes);`

---

## Phase 7: Polish & Documentation

**Purpose**: OpenAPI documentation and final governance validation

- [x] T018 [P] Add `@openapi` Swagger JSDoc annotations for all 5 endpoints in `src/backend-core/src/modules/campaign/routes/campaign.routes.ts`
- [x] T019 Perform final verification against quickstart scenarios in `specs/BC-UC-01-to-03-campaign-management/quickstart.md`

---

## Dependencies & Execution Order

```
Phase 1: Setup (T001)
   │
   ▼
Phase 2: Foundational (T002, T003)
   │
   ├───────────────────────────────┐
   ▼                               ▼
Phase 3: User Story 1 (P1)     Phase 4: User Story 2 (P1)
(T004 -> T005 -> T006 -> T007)  (T008 -> T009 -> T010 -> T011)
   │                               │
   └───────────────┬───────────────┘
                   ▼
       Phase 5: User Story 3 (P2)
       (T012 -> T013 -> T014 -> T015)
                   │
                   ▼
       Phase 6: Integration (T016, T017)
                   │
                   ▼
       Phase 7: Polish (T018, T019)
```

## Parallel Opportunities

- **Phase 2**: T002 (Mongoose Model) and T003 (Zod Schemas) can run in parallel.
- **Phase 3**: T007 (US1 Unit Tests) can run in parallel after T004.
- **Phase 4**: T011 (US2 Unit Tests) can run in parallel after T008.
- **Phase 5**: T015 (US3 Unit Tests) can run in parallel after T012.
- **Phase 7**: T018 (OpenAPI docs) can run in parallel with review.
