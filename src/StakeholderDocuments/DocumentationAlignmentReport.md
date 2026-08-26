# Documentation Alignment Report: Vision and Use-Case Specification

> Review date: 26 August 2026
> Reviewed branch: `dev`
> Baseline commit: `fc37aec`
> Previous documents: Vision 1.3 and Use-Case Specification 1.3 at `HEAD` before the documentation update
> Current documents: Vision 1.5 and Use-Case Specification 1.5
> Additional source reviewed: repository-root `UseCase_BloodCenter_Updated.md`

## 1. Purpose and Review Method

This report records the differences between the previous stakeholder documents and behavior implemented in the current source tree. A capability is described as implemented only when supported by relevant frontend behavior and/or backend routes, services, models, middleware, workers, or tests. A target SLA, operating policy, deployment configuration, or legal/security standard is not treated as implemented merely because an earlier document mentioned it.

The review covered the React SPA, Node.js core API, Python FastAPI AI service, MongoDB models and transactions, BullMQ workers, authentication/RBAC/feature-toggle middleware, and the code-level integrations for Brevo, Cloudinary, Firebase, and mapping providers.

## 2. Main Differences Between Version 1.3 and the Implemented System

| Area | Version 1.3 description | Implemented system | Version 1.4/1.5 adjustment and rationale |
| :--- | :--- | :--- | :--- |
| Login and sessions | Primarily described Donor login by Citizen ID and sometimes implied secure cookies and server-side session revocation. | Login accepts Citizen ID or email and requires selection of an assigned role. The 30-minute JWT contains the active portal role and the SPA stores it in local storage. Logout clears client state; no token blacklist/revocation service is implemented. | Documented active-role authentication, token storage, and the actual logout boundary to avoid unsupported security expectations. |
| Role lifecycle | Allowed direct creation of management accounts and custom roles. | Every account retains Donor as its base role and may hold at most one management role. The four system roles are fixed. | Removed custom-role operations and documented the Donor-first rule enforced by the current account service. |
| Organization assignment | Did not clearly require a Hospital or Blood Center when granting staff access. | HospitalStaff requires `hospitalId`; BloodCenterStaff requires `bloodCenterId`; the Admin UI exposes the corresponding organization selector. | Added organization selection and backend validation because it determines staff data scope. |
| Citizen ID data | Implied that administrators could edit all account data. | Full name, Citizen ID, and permanent address are locked in the edit flow, and the backend rejects changes to identity fields. | Marked identity-derived fields immutable. |
| Account deletion | Described immediate permanent deletion and invalidation of all sessions. | The system has soft deletion, restoration, and a separate privacy-purge workflow. Purge requires a suspended non-Administrator target, elevated confirmation, and a MongoDB transaction. There is no JWT revocation list. | Separated the three operations and their recoverability/security boundaries. |
| Appointment scheduling | Created a Confirmed appointment, E-Ticket, and attachment email immediately. | Booking creates a Pending appointment, screening form, and Pending digital donor record in a transaction. Blood Center confirmation later creates the E-Ticket/QR and attempts notification/email delivery. | Rewrote the flow and diagrams to match the approval lifecycle. |
| E-Ticket and QR | Claimed asymmetric signing, PDF/image formats, and automatic regeneration. | The payload follows `SIGNED-{ticketCode}` and is verified by database lookup. The implementation creates a QR image with Cloudinary/fallback handling; it has no asymmetric signature, PDF, or regeneration endpoint. | Removed unsupported cryptographic and format claims. |
| Appointment cancellation | Treated the 24-hour rule as an example and claimed a cancellation email. | The backend blocks cancellation within 24 hours, except for a 30-minute grace period after creation. It updates appointment/capacity/donor-record state and invalidates the ticket in a transaction. No cancellation email is sent by this flow. | Recorded the exact deadline and removed the unsupported email action. |
| SOS matching | Included an approval stage, additional criteria, and latency promises not present in code. | A Pending request is queued for evaluation. Center ranking uses compatible available volume and distance within 50 km. Donor ranking uses level, distance, and exact-match weighting; candidates must be geolocated, SOS-opted-in, Active, non-deleted, carry Donor, and fall inside the configured radius. | Documented the actual scoring, queue, and radius expansion; removed unverified SLA claims. |
| SOS recipients | Did not clearly separate donor, blood-center, and hospital audiences. | Donor appeals target Donor accounts; center alerts and center completion thanks target BloodCenterStaff. HospitalStaff-only accounts are not recipients of those two notification classes. | Added explicit audience rules to prevent cross-portal leakage. |
| SOS lifecycle | Mostly ended at creation and monitoring. | The system implements donor responses, inventory fulfillment, in-transit/received shipment state, direct donation recording, donor lookup, cancellation/reopening, expiration, and completion notifications. | Expanded the Hospital monitoring use case to cover implemented lifecycle endpoints. |
| Content and notification ownership | Assigned the relevant use cases only to Blood Center Staff. | Article routes are shared by BloodCenterStaff, HospitalStaff, and Administrator subject to content permissions. Each management user can access only their own notification records. | Expanded actors for BC-UC-08 through BC-UC-11 while retaining their IDs for traceability. |
| System configuration | Included provider credentials, backup schedules, moderation, and other settings without matching endpoints. | Eight keys are whitelisted: donation interval, minimum/maximum donor age, default campaign capacity, initial/maximum SOS radius, appointment reminder lead time, and scheduled-article auto-publication. | Limited the specification to the eight implemented values and their validation/audit behavior. |
| Feature toggles | Combined Gamification and Community and described a generic dependency engine. | Four flags exist: AI chatbot, SOS alerts, gamification badges, and news/content portal. UI, middleware, or background jobs check the relevant flag, and disabled-feature responses are distinct from RBAC denial. | Replaced the feature list and flow with the implemented keys and checks. |
| Non-functional requirements | Promised TLS 1.3, 99.5% uptime, backup/PITR, 10,000-user load, percentile response times, complete bilingual support, and WCAG compliance. | The repository provides bcrypt/JWT/RBAC, pagination, selected transactions, retries/backoff, diagnostics, responsive layouts, and partial internationalization, but contains no evidence for those certifications or guarantees. | Replaced unverified commitments with source-supported properties and identified deployment-dependent controls. |

## 3. Changes Made to Vision 1.4 and 1.5

- Updated Hospital Staff responsibilities to include SOS creation/lifecycle actions, shipment receipt, direct donation, content, and owned notifications.
- Replaced single-role assumptions with active-portal-role authentication.
- Changed the booking workflow to Pending, Blood Center confirmation, then E-Ticket/QR and delivery attempts.
- Described queued SOS evaluation, implemented candidate ranking, radius expansion, and separated recipient audiences.
- Described the digital donor record as being created with the Pending booking and updated throughout the operational lifecycle.
- Defined the Donor-first account lifecycle, four fixed roles, eight configuration keys, and four feature toggles.
- Replaced unsupported production, security, backup, performance, and compliance guarantees with properties evidenced in code.
- In 1.5, expanded the verified Blood Center scope and corrected campaign codes, inventory codes, batch behavior, threshold semantics, and status-transition rules.
- Added explicit implementation caveats where Blood Center registration/appointment endpoints do not yet enforce the intended role, permission, organization, or ownership checks.

## 4. Changes Made to Use-Case Specification 1.4 and 1.5

- Retained all 52 use-case IDs and all 47 prototype-image references.
- Updated LL-UC-02/03 for active-role JWT sessions, local storage, and client-only logout.
- Updated LL-UC-07 through LL-UC-10 for Pending approval, the cancellation deadline/grace period, ownership-scoped E-Tickets, and non-cryptographic QR images.
- Updated BC-UC-08 through BC-UC-11 for shared content actors, recipient ownership, and role-aware notification links.
- Expanded HS-UC-02 to cover the implemented SOS lifecycle.
- Rewrote SYS-UC-02 through SYS-UC-05 for actual ticket generation, donor-record timing, SOS ranking, and queued delivery.
- Rewrote AD-UC-02/03/05/06 for the account lifecycle, fixed-role matrix, eight configuration values, and four toggles.
- Removed exact response-time targets when the repository contains no matching load or performance evidence.
- In 1.5, revalidated BC-UC-01 through BC-UC-17 and qualified non-atomic batch approval/manual stock-in, best-effort clinical stock-in, incomplete inventory state restrictions, fixed low-stock thresholds, and missing authorization/organization enforcement.

## 5. Assessment of `UseCase_BloodCenter_Updated.md`

The teammate document contains a coherent set of BC-UC-01 through BC-UC-17, and every one of those IDs already exists in the main Use-Case Specification. Its useful UI and workflow detail was retained or merged, but the file cannot be accepted verbatim as an implementation description.

| Member-document claim | Source review result | Treatment in version 1.5 |
| :--- | :--- | :--- |
| Campaign creation, daily slots, drafts, filters, detail metrics, and ended/cancelled edit blocking | Implemented across campaign pages, schemas, routes, and service. | Retained and clarified. |
| Campaign code `CP-YYYYMMDD-XXXX` | Incorrect. The service generates `CMP-YYYY-NNNN`. | Corrected in Vision and BC-UC-01. |
| Full server-side overlap validation and Start Date locking after bookings | Overlap checks and related time checks are primarily client-side. The update service does not lock Start Date after bookings. | Qualified; not presented as a backend invariant. |
| Per-slot capacity can never be reduced below its booked count | The service rejects aggregate `capacity < registeredCount`, but regenerated daily slots are not consistently compared with their prior registered counts. | Replaced with the narrower implemented aggregate check. |
| Batch approval is one atomic operation | The frontend loops over individual confirm calls and reports success/failure counts. | Documented as partial-success client orchestration. |
| Four mandatory vitals before Eligible | Implemented for blood pressure, weight, body temperature, and hemoglobin. | Retained. |
| Biochemical Pass guarantees atomic stock-in | Pass triggers a stock-in attempt, but errors are caught and logged; completion may remain saved. | Changed to best-effort side effect and identified the consistency risk. |
| Manual, image-upload, and camera QR check-in | Implemented; image decoding uses `jsQR`, and the service validates ticket/campaign state. | Retained with the route-authorization caveat. |
| Content authoring and notification detail flows are Blood Center-only | Incorrect. Content is shared with HospitalStaff and Administrator according to permissions, and notifications are owner-scoped for each management portal. | Kept the stable BC IDs but expanded the actors and ownership rules. |
| Inventory list/search, seven-day near-expiry view, unit/volume statistics | Implemented. | Retained and clarified. |
| Blood bag code `BB-YYYYMMDD-XXXX` and atomic multi-row stock-in | Incorrect. Manual stock-in currently uses `BB-2026-NNNN`, random generation, a unique database index, and sequential saves without a transaction. | Corrected and partial persistence documented. |
| Strict FSM with Expired, Used, and Discarded all permanently locked | Partially incorrect. Used and Discarded are terminal; Expired may transition to Discarded. Other transitions are not governed by a complete FSM. | Replaced with the exact service rules. |
| Stock-out automatically enforces FEFO | The inventory query sorts by expiry and the UI assists selection, but the API updates the submitted IDs rather than choosing bags itself. | Described as FEFO-assisted, not backend-enforced. |
| Configurable safe-reserve thresholds | Not implemented. Statistics use fixed counts: Critical below 2 and Low Stock below 5 available bags. | Replaced with the fixed thresholds. |
| Blood Center registration and inventory operations are fully role/organization protected | Campaign and most inventory routes use role/permission middleware, but registration, QR, appointment confirm/reject, inventory status update, and organization scoping are inconsistent. | The intended actor remains visible, but the missing enforcement is explicitly documented as a security gap. |
| One-to-three-second performance guarantees | No matching benchmark or load-test evidence was found. | Excluded from the normative specification. |

The repository-root member file was reviewed as an input artifact and was not edited during the alignment work. Vision 1.5 and Use-Case Specification 1.5 are the consolidated, source-aligned documents; the source artifact itself is not included in this documentation commit because it is no longer present in the working tree at commit time.

## 6. Items Removed from the “Implemented” Scope

- Custom-role creation, rename, and deletion.
- Server-side JWT revocation/blacklisting and HTTP-only access-token cookies.
- Asymmetric QR signatures, PDF E-Tickets, and automatic ticket regeneration.
- Admin-page management of provider credentials, backup schedules, and content moderation.
- Uptime/load/latency guarantees without test evidence.
- Automated backup/PITR and recovery-time guarantees.
- Complete Vietnamese/English coverage, WCAG 2.1 AA certification, and legal-compliance certification.
- Atomic Blood Center batch approval and manual batch stock-in.
- A complete inventory finite-state machine and configurable safe-reserve thresholds.

These items may still be valid production requirements. They are excluded only from claims about the currently completed implementation.

## 7. Prototype Image Note

All 47 `UIPrototypePic/...` references in the Use-Case Specification were preserved. If an image is unavailable in the current checkout, the corresponding asset is missing at that relative path. Once the image package is pushed with the expected paths, Markdown can render it without documentation changes.

## 8. Remaining Implementation Risks Identified During the Review

- Registration list/detail/screening and QR check-in routes use authentication without consistent role, permission, organization, or ownership authorization.
- Appointment confirm/reject routes also use authentication only and do not pass the acting staff identity or organization into the service.
- Inventory status update has a role check but no explicit inventory-edit permission; several inventory queries include unassigned legacy bags, weakening strict tenant isolation.
- Clinical Pass catches stock-in/notification errors, so the registration may be Completed without its expected bag or message.
- Manual batch stock-in can partially save rows and uses collision-prone random codes without retry.
- Stock-out does not restrict updates to Available bags and records `previousStatus: Available` in history regardless of each bag's actual prior state.
- Campaign overlap checks rely partly on the frontend and campaign updates can regenerate slots without preserving or validating every prior slot booking count.

These are code risks, not documentation features. They should be addressed before treating the Blood Center module as production-ready.

## 9. Review Limitations

This was a source-level alignment review at the stated baseline, not a production-readiness certification. Brevo, Firebase, Cloudinary, mapping, and LLM integrations have code/configuration and diagnostics, but real delivery still depends on valid secrets, provider accounts, network access, and deployment settings. Documentation must be reviewed again after material code changes.

## 10. Validation Performed

- Confirmed 52 use-case definitions, 52 unique IDs, and no referenced ID without a matching definition.
- Confirmed that the same 47 unique `UIPrototypePic/...` references present in `HEAD` remain in the updated Use-Case Specification; no image reference was added or removed.
- Confirmed balanced Markdown code fences: 12 in the Use-Case Specification and 6 in Vision.
- Ran `git diff --check`; it reported no whitespace errors (only the repository's normal LF-to-CRLF conversion warning on Windows).
- Ran the campaign, registration, and booking Jest suites: 4 suites and 59 tests passed.
