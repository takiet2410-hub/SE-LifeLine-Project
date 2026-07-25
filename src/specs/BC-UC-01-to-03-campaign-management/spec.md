# Feature Specification: Campaign Management Module (BC-UC-01, BC-UC-02, BC-UC-03)

**Feature Branch**: `feature/BC-UC-01-to-03-campaign-management`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "Implement use cases BC-UC-01, BC-UC-02, and BC-UC-03 for the 'Campaign Management' module in the LifeLine backend system. BC-UC-01: View Campaign List, BC-UC-02: Create Donation Campaign, BC-UC-03: View & Edit Campaign Details."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Blood Donation Campaign List (Priority: P1)

As a Blood Center Staff or Admin Staff user, I want to view a paginated list of blood donation campaigns with location, date range, and status filters so that I can easily discover, manage, and monitor past, current, and upcoming donation campaigns.

**Why this priority**: Viewing campaigns is foundational for staff workflow and enables discovery of active and upcoming events.

**Independent Test**: Can be tested independently by querying `GET /api/v1/campaigns` with various query parameters (page, limit, location, date range, status, sorting, clear filters) and verifying that the returned campaign items match expectations.

**Acceptance Scenarios**:

1. **Given** existing campaigns in the database, **When** Blood Center Staff requests the campaign list without filters, **Then** the system returns a paginated list of campaigns with default pagination and default sorting, containing campaign code, name, venue, schedule, target blood groups, capacity progress (registered/total with percentage), and status.
2. **Given** existing campaigns, **When** Staff applies filtering by location (search string), date range (startDate to endDate), and/or status (`Upcoming`, `Active`, `Registration Pending`, `Completed`, `Cancelled`), **Then** the system returns only matching campaign records.
3. **Given** applied filters, **When** Staff submits an empty filter request ("clear filters"), **Then** the system reverts to the default unfiltered paginated list.

---

### User Story 2 - Create New Donation Campaign (Priority: P1)

As a Blood Center Staff user, I want to create a new blood donation campaign by providing basic info, venue/address, schedule, target blood groups, capacity/unit goals, and contact person so that donors can register for upcoming blood donation drives.

**Why this priority**: Required for blood centers to publish new donation drives and collect donor registrations.

**Independent Test**: Can be tested independently by issuing `POST /api/v1/campaigns` with valid campaign payload and verifying that a new campaign is saved with auto-assigned campaign code and initial status (`Upcoming` or `Registration Pending`).

**Acceptance Scenarios**:

1. **Given** valid campaign creation input with future campaign date and positive numbers for capacity and target units goal, **When** Staff submits the creation request, **Then** the system validates the input, auto-assigns an initial status (e.g., `Upcoming`), generates a unique campaign code (e.g., `ABC-2025-001`), saves the record, and returns the created campaign object (HTTP 201).
2. **Given** a campaign creation request with a past campaign date, **When** Staff submits the form, **Then** the system rejects the creation with a validation error detailing that campaign date cannot be in the past.
3. **Given** a campaign creation request with zero or negative capacity/units goal, **When** Staff submits the form, **Then** the system rejects the creation with a validation error indicating values must be positive.

---

### User Story 3 - View & Edit Campaign Details (Priority: P2)

As a Blood Center Staff user, I want to view comprehensive campaign details (including capacity progress and registration performance metrics) and update campaign fields when plans change, ensuring capacity cannot be lowered below already registered donors.

**Why this priority**: Essential for staff to inspect campaign performance and adjust drive details while safeguarding registered donor seats.

**Independent Test**: Can be tested independently by issuing `GET /api/v1/campaigns/:id` to check detailed metrics, `PUT /api/v1/campaigns/:id` to update fields, and testing the capacity reduction validation rule.

**Acceptance Scenarios**:

1. **Given** an existing campaign ID, **When** Staff requests details via `GET /api/v1/campaigns/:id`, **Then** the system returns general info, capacity progress (`registeredDonors / totalCapacity` and percentage), and registration performance (`% of target units goal reached`, registered donors count, remaining spots).
2. **Given** an existing campaign with registered donors, **When** Staff updates campaign fields via `PUT /api/v1/campaigns/:id` with valid data, **Then** the campaign is updated and saved.
3. **Given** an existing campaign with `N` registered donors, **When** Staff attempts to reduce participant capacity to less than `N`, **Then** the system rejects the update with HTTP 400 validation error: "Participant capacity cannot be reduced below the current number of registered donors".
4. **Given** an existing campaign ID, **When** requesting `GET /api/v1/campaigns/:id/registrations`, **Then** the system returns a list of appointments/registrations associated with that campaign.

---

### Edge Cases

- **Non-existent Campaign ID**: Requesting or editing a non-existent campaign ID returns HTTP 404 with standard error shape `{ code: 'NOT_FOUND', message: 'Campaign not found' }`.
- **Invalid Date Range Query**: Providing `endDate` before `startDate` in query parameters returns a HTTP 400 validation error.
- **Concurrent Registration/Update**: Updating campaign capacity concurrently with donor registration guarantees data integrity through atomic database operations or transaction checks.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an endpoint (`GET /api/v1/campaigns`) to retrieve a paginated, filterable, and sortable list of blood donation campaigns.
- **FR-002**: Campaign list responses MUST include campaign code, campaign name, venue name & full address, schedule (start and end date/time), target blood groups (multi-select array or "ALL TYPES"), capacity progress (registered/total with percentage), and status (`Upcoming`, `Active`, `Registration Pending`, `Completed`, `Cancelled`).
- **FR-003**: Campaign list endpoint MUST support filtering by location (venue/address search), date range (`startDate`, `endDate`), and status, as well as clearing filters to revert to default queries.
- **FR-004**: System MUST provide an endpoint (`POST /api/v1/campaigns`) to create a new donation campaign with basic info, venue/address, schedule, target blood groups, capacity, target units goal, contact person details, and internal remarks.
- **FR-005**: System MUST validate that campaign date/start time is not in the past, and participant capacity & target units goal are positive numbers (> 0).
- **FR-006**: On campaign creation, system MUST auto-assign a unique campaign code (e.g. `ABC-2025-001`) and an initial status (`Upcoming` or `Registration Pending`).
- **FR-007**: System MUST provide an endpoint (`GET /api/v1/campaigns/:id`) to retrieve full campaign details, including capacity progress metrics and registration performance metrics (% of target units goal reached, registered donors count, remaining spots).
- **FR-008**: System MUST provide an endpoint (`PUT /api/v1/campaigns/:id` or `PATCH /api/v1/campaigns/:id`) to update an existing campaign.
- **FR-009**: System MUST enforce a validation rule preventing updates that reduce participant capacity below the current count of registered donors.
- **FR-010**: System MUST expose a sub-resource endpoint (`GET /api/v1/campaigns/:id/registrations`) listing all registrations/appointments linked to the campaign.

### Key Entities *(include if feature involves data)*

- **Campaign**:
  - `_id`: ObjectId PK
  - `campaignCode`: string (unique, human-readable identifier, e.g. `ABC-2025-001`)
  - `name`: string (campaign title)
  - `description`: string (optional)
  - `venue`: string (venue name)
  - `fullAddress`: string (full physical address)
  - `location`: GeoJSON Point (coordinates `[longitude, latitude]` for geospatial map features)
  - `startDateTime`: Date (campaign date & start time)
  - `endDateTime`: Date (end date & time)
  - `targetBloodGroups`: array of strings (`"A+"`, `"A-"`, `"B+"`, `"B-"`, `"O+"`, `"O-"`, `"AB+"`, `"AB-"`, or `"ALL TYPES"`)
  - `capacity`: number (total max donors)
  - `registeredCount`: number (currently registered donors count, default 0)
  - `targetUnitsGoal`: number (target blood units goal)
  - `contactPerson`: `{ name: string, phone: string }`
  - `internalRemarks`: string (optional)
  - `status`: enum (`Upcoming`, `Active`, `Registration Pending`, `Completed`, `Cancelled`, `Draft`)
  - `createdAt` / `updatedAt`: Date

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Staff can create a new campaign in under 2 seconds API response time under standard load.
- **SC-002**: Campaign list queries with pagination and filters respond within 500ms for up to 10,000 campaign records.
- **SC-003**: 100% of invalid capacity reduction attempts (reducing total capacity below registered donor count) are blocked with clear validation error messages.
- **SC-004**: 100% of newly created campaigns automatically generate a unique campaign code and initial status without manual intervention.

## Assumptions

- Blood Center Staff and Administrator users have access to campaign management endpoints via authentication JWT tokens.
- Shared response error shapes (`{ code, message, details }`) and Zod validation middleware (`validateRequest`) present in the project are reused for consistency.
- Existing Appointment/Booking models connect to Campaign via `campaignId` ObjectId reference.
