# Donor Communication (LL-UC-11 to 16) - Implementation Plan

## Current State
- **Frontend**: Successfully completed! The `DonorNotificationPage`, `SOSAlertsPage`, and `NewsFeedPage` are fully integrated and functional.
- **Backend**: `Notification` and `Content (News Feed)` modules are fully implemented and connected.
- **Missing**: The `SOS Requests` backend module is missing the `Donor Response` API (`POST /api/sos-requests/:id/respond`), which is required for `SOS-UC-02`.

## Proposed Changes

### Backend SOS Module (`src/backend-core/src/modules/sos-request`)

#### [MODIFY] schemas/sos-request.schema.ts
- Add `RespondSOSSchema` for validating `{ response: 'accepted' | 'declined' }`.

#### [MODIFY] controllers/sos-request.controller.ts
- Add `respondToSOS` method to handle the incoming request from the Donor.

#### [MODIFY] services/sos-request.service.ts
- Add `recordDonorResponse(sosRequestId, donorId, response)` method.
- Update the `SOSEvaluationLog` or `SOSRequest` model to record the response, and ensure it correctly handles "Success" or "Ineligible" logic as required by the backend. (For simplicity in this phase, just acknowledge the response in the DB and return success).

#### [MODIFY] routes/sos-request.routes.ts
- Add `POST /:id/respond` route.

## User Review Required
No major architectural changes, just completing the missing endpoint for Donor SOS Response.

## Verification Plan
- Send a mock `POST /api/sos-requests/:id/respond` request to ensure it successfully records the donor's action.
