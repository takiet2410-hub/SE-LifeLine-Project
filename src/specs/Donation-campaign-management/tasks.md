# Backend Implementation Tasks: Campaign Management

**Feature IDs:** BC-UC-01, BC-UC-02, BC-UC-03

This task list covers backend implementation only. The UI prototype is a visual workflow reference only.

## Phase 1 – Module Foundation

### Module Structure
- [x] Create or extend the `campaign-management` backend module using the existing modular monolith architecture. [BC-UC-01][BC-UC-02][BC-UC-03]
- [x] Register campaign routes in the existing API routing layer. [BC-UC-01][BC-UC-02][BC-UC-03]
- [x] Implement the Route → Controller → Service → Repository pattern for campaign APIs. [BC-UC-01][BC-UC-02][BC-UC-03]

### Validation
- [x] Implement create validation schema for campaign payloads using shared validation.
- [x] Implement update validation schema with partial-update support and server-managed field protections.
- [x] Validate all campaign request payloads before service-layer processing.

### Repository
- [x] Implement repository method to create a Campaign.
- [x] Implement repository method to retrieve all Campaigns.
- [x] Implement repository method to retrieve a Campaign by ID.
- [x] Implement repository method to update an existing Campaign.

## Phase 2 – API Endpoints

### Campaign Creation (BC-UC-01)
- [x] Implement `POST /api/v1/campaigns`.
- [x] Accept only fields supported by the Campaign schema: `bloodCenterId`, `name`, `venue`, `location`, `startDateTime`, `endDateTime`, `targetBloodGroups`, `capacity`, `status`.
- [x] Ignore or reject unsupported prototype fields such as description, contact person, phone number, target units goal, and internal notes.
- [x] Initialize `registeredCount` as a server-managed field.
- [x] Return `201 Created` on success.

### Campaign List (BC-UC-02)
- [x] Implement `GET /api/v1/campaigns`.
- [x] Return campaign summaries using the existing Campaign model.
- [x] Return an empty list when no campaigns exist.
- [x] Return `200 OK`.

### Campaign Detail (BC-UC-02 / BC-UC-03)
- [x] Implement `GET /api/v1/campaigns/:id`.
- [x] Return the complete Campaign payload.
- [x] Return `404 Not Found` if the campaign does not exist.

### Campaign Update (BC-UC-03)
- [x] Implement `PATCH /api/v1/campaigns/:id`.
- [x] Allow updates only to editable Campaign fields.
- [x] Reject updates to server-managed fields such as `registeredCount`.
- [x] Return the updated Campaign document upon success.

## Phase 3 – Business Rules

### Validation Rules
- [x] Enforce required fields:
  - `name`
  - `venue`
  - `startDateTime`
  - `endDateTime`
  - `capacity`
  - `status`
- [x] Validate:
  - `endDateTime` is later than `startDateTime`
  - `capacity` is greater than 0
  - `status` belongs to the supported enum
  - `targetBloodGroups` contains only supported blood-group values

### Update Rules
- [x] Prevent reducing capacity below the current `registeredCount`.
- [x] Reject updates to server-managed properties.
- [x] Preserve existing data when validation or persistence fails.
- [x] Ensure update operations remain atomic.

## Phase 4 – Security & Error Handling

### Authorization
- [x] Restrict campaign creation to authenticated Blood Center Staff users. [BC-UC-01]
- [x] Restrict campaign updates to authenticated Blood Center Staff users. [BC-UC-03]
- [x] Reuse the project’s existing RBAC middleware.

### Error Handling
- [x] Return `400 Bad Request` for validation failures.
- [x] Return `401 Unauthorized` for unauthenticated requests.
- [x] Return `403 Forbidden` for insufficient permissions.
- [x] Return `404 Not Found` when the campaign does not exist.
- [x] Return `500 Internal Server Error` for unexpected failures.
- [x] Use the project’s standard error response:

```json
{
  "code": "...",
  "message": "...",
  "details": {}
}
```

## Phase 5 – Audit Logging
- [x] Log successful campaign creation events.
- [x] Log successful campaign update events.
- [x] Include:
  - acting staff user ID
  - campaign ID
  - operation type
  - timestamp
- [x] Reuse the project’s existing audit logging infrastructure.

## Phase 6 – Testing

### Unit Tests
- [x] Validation schema tests.
- [x] `CampaignService` business-rule tests.
- [x] `CampaignController` response tests.
- [x] Error handling tests.
- [x] Authorization tests.

### Integration Tests
- [x] Campaign creation flow.
- [x] Campaign list retrieval.
- [x] Campaign detail retrieval.
- [x] Campaign update flow.
- [x] Validation failure scenarios.
- [x] Authorization failure scenarios.
- [x] Repository persistence flow.

## Phase 7 – Review & Verification
- [x] Verify traceability to BC-UC-01, BC-UC-02, and BC-UC-03.
- [x] Verify compliance with the Feature Specification.
- [x] Verify compliance with the existing Campaign schema.
- [x] Verify module boundaries are respected.
- [x] Verify no unsupported UI fields are persisted.
- [x] Verify naming conventions follow the project standards.
- [x] Verify all endpoints follow the versioned REST API conventions.
- [x] Confirm that no schema changes or additional collections were introduced.