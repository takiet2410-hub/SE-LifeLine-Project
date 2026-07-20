# Backend Implementation Plan: Campaign Management

**Feature**: Campaign Management
**Feature Branch**: `feature/BE-campaign-management`
**Feature IDs**: BC-UC-01, BC-UC-02, BC-UC-03
**Status**: Final backend-only implementation plan

## 1. Implementation Goal

Deliver the backend implementation for Campaign Management supporting campaign creation, list retrieval, detail retrieval, and updates. The work must reuse existing backend architecture, shared validation, repository, service, authorization, error handling, and logging patterns.

This plan excludes frontend/UI development.

## 2. Architecture Alignment

- Backend module: `src/backend-core/src/modules/campaign-mgmt`
- Shared validation and types: `src/backend-core/src/shared`
- Shared middleware: authentication, authorization, error handling, logging
- Traceability: BC-UC-01, BC-UC-02, BC-UC-03

## 3. Implementation Phases

### Phase 1 — Backend foundation
1. Extend or create the backend campaign-management module using the existing project module pattern.
2. Add route/controller/service/repository definitions for campaign APIs.
3. Define create and update validation schemas with the shared validation library.
4. Implement the endpoints: POST, GET, GET/:id, PATCH.
5. Enforce RBAC and audit logging for create and update operations.

### Phase 2 — Business rules and persistence
1. Implement validation rules for required fields, date ordering, capacity, status, and targetBloodGroups.
2. Enforce server-managed `registeredCount` semantics.
3. Prevent capacity updates below the current `registeredCount`.
4. Only persist supported Campaign fields and ignore unsupported prototype fields.
5. Ensure repository updates are atomic and avoid partial persistence.

### Phase 3 — Testing and review
1. Add unit tests for validation schemas, service business rules, controller responses, authorization, and error handling.
2. Add integration tests for campaign creation, list retrieval, detail retrieval, update flow, validation failures, and authorization failures.
3. Review implementation against BC-UC-01, BC-UC-02, and BC-UC-03.
4. Verify module boundaries, naming conventions, and reuse of shared backend infrastructure.

## 4. Backend Plan

### API surface
- POST /api/v1/campaigns
- GET /api/v1/campaigns
- GET /api/v1/campaigns/:id
- PATCH /api/v1/campaigns/:id

### Backend responsibilities
- Validate request payloads at the route/controller boundary.
- Authenticate users.
- Authorize Blood Center Staff for create and update operations.
- Use the existing Campaign entity and persist only supported fields.
- Return standard error responses in the shape `{ code, message, details }`.
- Log campaign create/update operations using the existing audit infrastructure.
- Avoid frontend/UI responsibilities.

### Validation rules
- Required fields: `name`, `venue`, `startDateTime`, `endDateTime`, `capacity`, `status`.
- `endDateTime` must be later than `startDateTime`.
- `capacity` must be a positive integer.
- `targetBloodGroups` must contain only supported values.
- `status` must be one of `Draft`, `Active`, `Full`, `Closed`, `Cancelled`.
- `registeredCount` must be server-managed and not accepted from API clients.
- On update, `capacity` may not be reduced below the current `registeredCount`.

## 5. Data Handling Notes

The implementation must use the existing Campaign fields from the schema only:
- `bloodCenterId`
- `name`
- `venue`
- `location`
- `startDateTime`
- `endDateTime`
- `targetBloodGroups`
- `capacity`
- `registeredCount`
- `status`

The backend must not introduce new Campaign fields, collections, or schema migrations.

## 6. Review Checklist

- The implementation is traceable to BC-UC-01, BC-UC-02, and BC-UC-03.
- The feature remains within the campaign-management backend module boundaries.
- The implementation reuses existing shared validation, authorization, service, repository, error handling, and logging patterns.
- Create and update actions are audited.
- Unsupported prototype fields are not persisted.
- No new schema changes or additional collections are introduced.
