# Research & Technical Decisions: Donor Registration & Health Screening Module (BC-UC-04, BC-UC-05)

**Feature Branch**: `feature/BC-UC-04-to-05-donor-registration` | **Date**: 2026-07-25  
**Spec**: [spec.md](../spec.md)

---

## 1. Technical Decisions & Rationale

### Decision 1: Additive Module Architecture (`src/backend-core/src/modules/registration`)
- **Choice**: Implement all new registration list and health screening endpoints within a dedicated, additive module directory `src/backend-core/src/modules/registration`.
- **Rationale**: Strict adherence to the ADD-ONLY constraint requires that existing modules (`auth-account`, `campaign`, `booking`) remain untouched. Placing new controllers, services, routes, schemas, and models in `src/modules/registration` ensures modular monolith separation without refactoring existing files.
- **Alternatives Considered**:
  - *Extending `src/modules/booking`*: Rejected because editing existing `booking.routes.ts` or `booking.service.ts` would violate the strict ADD-ONLY constraint.

---

### Decision 2: MongoDB Client Session Transactions for Screening Updates
- **Choice**: Use Mongoose/MongoDB Client Sessions (`mongoose.startSession()`, `session.withTransaction()`) for atomic multi-document writes across `ScreeningForm`, `Appointment` status update, `DigitalDonorRecord` upsert, and `AuditLog` creation in `PUT /api/v1/registrations/:registrationId/screening`.
- **Rationale**: Spec requirements explicitly state that updates must be atomic ("either all screening fields + status update succeed together, or nothing is saved").
- **Alternatives Considered**:
  - *Sequential non-transactional writes*: Rejected because network or server errors midway through updates would cause partial state corruption (e.g. screening updated but appointment status unchanged).

---

### Decision 3: Authorization & Role Verification Middleware
- **Choice**: Create an additive authorization middleware `requireStaffRole` in `src/shared/auth.middleware.ts` or `src/shared/role.middleware.ts` (or within the new module's middleware stack) that verifies `req.user.role === 'BloodCenterStaff' || req.user.role === 'Administrator'`.
- **Rationale**: Both BC-UC-04 and BC-UC-05 require strict access control. Donors and Hospital Staff must receive HTTP 403 Forbidden.
- **Alternatives Considered**:
  - *In-controller role checking*: Rejected because middleware separation keeps controllers clean and consistent across all endpoints.

---

### Decision 4: Read-Only Integration with `auth-account` Module
- **Choice**: Import existing `User` (`src/modules/auth-account/models/user.model.ts`) and `DonorProfile` (`src/modules/auth-account/models/donor-profile.model.ts`) models as read-only dependencies using `.populate()` or aggregation pipelines.
- **Rationale**: Reuses existing donor demographic fields (`fullName`, `idDocumentNumber`, `phoneNumber`, `email`, `bloodType`, `dateOfBirth`, `permanentAddress`, `lastDonationDate`, `totalDonations`) without modifying `auth-account` or duplicating data.

---

### Decision 5: Audit Log Model Location & Privacy Masking
- **Choice**: Create `AuditLog` schema (`audit_logs` collection) in `src/shared/models/audit-log.model.ts` (or `src/modules/registration/models/audit-log.model.ts`) storing `actorUserId` (ObjectId), `action`, `resourceType`, `resourceId`, `previousValue`, `newValue`, `timestamp`, and `ipAddress`.
- **Rationale**: Fulfills Constitution §2 and NFR compliance. Sensitive identifiers like CCCD numbers or passwords are never stored in raw text; ObjectId references are used instead.

---

### Decision 6: Clinical Threshold Handling & Open Questions
- **Choice**: Keep manual status selection (`Eligible for Donation`, `Ineligible for Donation`, `Donation Completed`) fully operational and decoupled from any future automated eligibility calculator.
- **Rationale**: The four clinical threshold numeric ranges (blood pressure, weight, temperature, hemoglobin) are marked as open questions in `spec.md`. Staff manual status selection satisfies all business flow requirements without inventing unconfirmed clinical rules.
