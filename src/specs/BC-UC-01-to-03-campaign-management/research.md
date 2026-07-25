# Phase 0 Technical Research: Campaign Management Module

## Research Items & Decisions

### 1. Codebase Architecture & Layering Pattern
- **Decision**: Adopt the standard 4-tier module structure (`routes` -> `controller` -> `service` -> `model` + `schemas`) inside `src/backend-core/src/modules/campaign`.
- **Rationale**: Mirrors `booking` and `auth-account` modules in `backend-core`. Keeps routing, HTTP handling, business logic, validation, and database schemas decoupled.
- **Alternatives Considered**: Direct controller-to-model pattern (rejected to preserve testability and service-layer encapsulation).

### 2. Campaign Code Auto-Generation
- **Decision**: Auto-generate `campaignCode` during campaign creation if not explicitly provided, adhering to format `CMP-{YYYY}-{NNN}` (e.g., `CMP-2026-001`).
- **Rationale**: Provides a unique, readable business reference identifier for staff and donors without requiring manual code entry.
- **Alternatives Considered**: Random UUID (rejected in favor of human-readable code format).

### 3. Status Auto-Assignment
- **Decision**: Default status set to `'Upcoming'` upon campaign creation when `startDateTime` is in the future.
- **Rationale**: Aligns with database schema enum (`Draft`, `Upcoming`, `Registration Pending`, `Active`, `Full`, `Completed`, `Cancelled`) and prompt requirements.

### 4. Capacity Reduction Validation Guard
- **Decision**: In `CampaignService.updateCampaign`, compare the requested `capacity` against `campaign.registeredCount`. If `capacity < campaign.registeredCount`, throw error `CAPACITY_BELOW_REGISTERED` and return HTTP 400.
- **Rationale**: Strictly enforces the core business requirement preventing staff from over-allocating or invalidating existing confirmed donor registrations.

### 5. Calculated Progress & Performance Metrics
- **Decision**: Dynamically calculate `capacityProgress` (`registered`, `total`, `percentage`) and `registrationPerformance` (`targetUnitsGoal`, `registeredDonorsCount`, `remainingSpots`, `percentGoalReached`) in `getCampaignById` and `listCampaigns`.
- **Rationale**: Avoids redundant schema state storage while returning rich analytics to frontend clients for BC-UC-01 and BC-UC-03.

### 6. Shared Utilities & Middleware Integration
- **Decision**: Re-use existing `authenticateJWT` from `src/shared/auth.middleware.ts`, `validateRequest` from `src/shared/validate.middleware.ts`, and global `errorHandler` from `src/shared/error.middleware.ts`.
- **Rationale**: Satisfies constraint #3 (no parallel/duplicate utilities).
