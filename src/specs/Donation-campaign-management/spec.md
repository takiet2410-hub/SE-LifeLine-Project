# Feature Specification: Campaign Management

**Feature IDs**: BC-UC-01, BC-UC-02, BC-UC-03
**Status**: Final backend-only implementation draft
**Primary source documents**: Use-Case Specification, Database Schema, System Architecture, Coding Conventions, Project Plan.

## 1. Feature Summary

This feature enables Blood Center Staff to manage donation campaigns through backend APIs only. The implementation supports campaign creation, campaign listing, campaign detail retrieval, and campaign updates.

This specification is backend-only. The attached UI prototype is a visual workflow reference only; it does not add implementation scope, UI requirements, or frontend deliverables.

The implementation must reuse the existing Campaign entity from the database schema, remain inside the campaign-management backend module boundaries, and avoid introducing new collections, schema migrations, or unsupported fields.

## 2. Scope

### In scope
- POST /api/v1/campaigns
- GET /api/v1/campaigns
- GET /api/v1/campaigns/:id
- PATCH /api/v1/campaigns/:id
- Request validation at the route/controller boundary
- Authorization for Blood Center Staff
- Business rule enforcement in service/repository layers
- Persistence using the existing Campaign model
- Standard backend error handling and audit logging

### Out of scope
- Frontend/UI implementation, pages, forms, components, styling, or client-side validation
- New collections, schema redesign, or schema migration
- Persisting unsupported prototype fields such as description, full address, contact person, phone number, internal notes, or target units goal
- Donor-facing campaign browsing
- Frontend API integration or frontend DTOs

## 3. Use Cases and Acceptance Criteria

### BC-UC-01: Create Donation Campaign
As Blood Center Staff, I want to create a new donation campaign so that the campaign can be tracked and managed.

Acceptance criteria:
1. An authenticated Blood Center Staff user with campaign-management permission can create a campaign.
2. The backend validates required fields before persistence.
3. The backend persists a new Campaign document using the supported fields.
4. The API returns `201 Created` with the newly created Campaign payload.

### BC-UC-02: View Campaign List
As Blood Center Staff, I want to retrieve the campaign list so that I can see the available campaigns.

Acceptance criteria:
1. The API returns a list of campaigns.
2. The list uses the existing Campaign model fields.
3. The API returns `200 OK`.
4. If no campaigns exist, the API returns an empty list.

### BC-UC-03: View/Edit Campaign Detail
As Blood Center Staff, I want to retrieve and update campaign details so that existing campaigns remain accurate.

Acceptance criteria:
1. `GET /api/v1/campaigns/:id` returns the Campaign payload for the requested ID.
2. If the campaign does not exist, the API returns `404 Not Found`.
3. `PATCH /api/v1/campaigns/:id` validates editable fields and updates the campaign.
4. The API returns `200 OK` with the updated Campaign on success.
5. Invalid requests return appropriate validation errors.
6. Existing campaign data remains unchanged when update validation or persistence fails.

## 4. Functional Requirements

- FR-001: Reuse the existing Campaign entity and persist only supported fields.
- FR-002: Implement backend-only APIs for campaign creation, listing, detail retrieval, and updates.
- FR-003: Validate required fields and reject invalid requests before persistence.
- FR-004: Prevent update operations from modifying server-managed fields.
- FR-005: Preserve existing campaign data when a write attempt fails.
- FR-006: Return standard error responses for validation, authorization, not-found, and unexpected failures.
- FR-007: Log campaign creation and update actions for auditability.
- FR-008: Enforce authorization for campaign creation and updates.
- FR-009: Keep the work within the campaign-management backend module boundaries.
- FR-010: Do not invent new Campaign database fields or new collections.

## 5. Non-Functional Requirements

- NFR-001: Follow the modular monolith architecture and reuse existing backend module boundaries.
- NFR-002: Use versioned REST API paths under `/api/v1`.
- NFR-003: Reuse existing shared validation, service, repository, authentication, authorization, error handling, and logging infrastructure.
- NFR-004: Avoid duplicate business logic across route, service, and repository layers.
- NFR-005: Ensure endpoint requests and responses remain deterministic and consistent.
- NFR-006: Support unit tests and integration tests for all backend behavior.
- NFR-007: Do not require frontend or UI implementation for this feature.

## 6. Validation Rules

The implementation MUST support the following fields from the existing Campaign schema:
- `bloodCenterId`: required, must reference an existing blood center or be derived from authenticated staff context if that is the project convention.
- `name`: required, non-empty string.
- `venue`: required, non-empty string.
- `location`: optional, validated in the project’s supported format if provided.
- `startDateTime`: required, valid date/time.
- `endDateTime`: required, valid date/time, and must be later than `startDateTime`.
- `targetBloodGroups`: required array of supported blood-group values.
- `capacity`: required positive integer.
- `registeredCount`: server-managed, not accepted from API clients.
- `status`: required, must be one of `Draft`, `Active`, `Full`, `Closed`, `Cancelled`.

Additional rules:
- On update, `capacity` may not be reduced below the current `registeredCount`.
- Unsupported prototype fields such as description, full address, contact person, phone number, internal notes, and target units goal must be ignored or rejected and must not be persisted.
- Update operations must be atomic.

## 7. Backend and API Requirements

The feature MUST expose only these endpoints:
- `POST /api/v1/campaigns`
- `GET /api/v1/campaigns`
- `GET /api/v1/campaigns/:id`
- `PATCH /api/v1/campaigns/:id`

The backend MUST:
- validate request payloads at the route/controller boundary,
- authenticate requests,
- authorize Blood Center Staff with campaign-management permission for create and update operations,
- reuse the existing Campaign model and shared repository/service patterns,
- return standard error responses in the shape:
  ```json
  {
    "code": "...",
    "message": "...",
    "details": {}
  }
  ```
- preserve data consistency and avoid partial persistence.

## 8. Authorization

- `POST /api/v1/campaigns` and `PATCH /api/v1/campaigns/:id` require authenticated Blood Center Staff users with campaign-management permission.
- `GET /api/v1/campaigns` and `GET /api/v1/campaigns/:id` follow existing authorization rules for campaign retrieval.
- Reuse the project’s existing RBAC middleware and permission model.

## 9. Error Handling

The backend MUST return:
- `400 Bad Request` for validation failures.
- `401 Unauthorized` for unauthenticated requests.
- `403 Forbidden` for insufficient permissions.
- `404 Not Found` when the campaign does not exist.
- `500 Internal Server Error` for unexpected failures.

## 10. Audit Logging

The backend MUST log:
- campaign creation events,
- campaign update events.

Each audit entry MUST include:
- acting staff user ID,
- campaign ID,
- operation type,
- timestamp.

Reuse the existing audit logging infrastructure.

## 11. Success Criteria

- Backend APIs support campaign creation, listing, detail retrieval, and updates.
- Required campaign validation rules are enforced.
- Unsupported prototype fields are not persisted.
- Authorization is enforced for create and update operations.
- Standard error responses are returned for all failure modes.
- Audit logging records create and update operations.

## 12. Assumptions

- The existing Campaign schema is authoritative for this feature.
- The system already provides authenticated staff context and RBAC primitives.
- No frontend or UI work is required for delivery.

## 13. Traceability

- BC-UC-01: Create Donation Campaign
- BC-UC-02: View Campaign List
- BC-UC-03: View/Edit Campaign Detail

## 14. Open Issues

- Confirm whether `bloodCenterId` should be derived from the authenticated staff user context or accepted explicitly in the request payload.
- Confirm any additional supported blood-group values and the exact normalization rules for `targetBloodGroups`.
- Confirm whether status transitions require further business rules beyond the allowed enum values.
