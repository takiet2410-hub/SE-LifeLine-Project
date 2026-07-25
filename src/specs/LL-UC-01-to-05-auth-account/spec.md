# Feature Specification: Auth & Account Management

**Created**: 2026-07-19

**Status**: Draft

## Summary
The Auth & Account Management feature module securely manages user identities and profiles within the LifeLine platform. It handles CCCD QR-based registration with automatic data extraction, robust session management (login/logout), OTP-based password recovery, and secure profile management while ensuring that identity-verified fields remain read-only.

## User stories

### User Story 1 - Register via Citizen ID (Priority: P1)
As a new donor, I want to register an account by scanning my Citizen ID (CCCD) QR code, so that my personal details are accurately pre-filled and my identity is verified.
**Why this priority**: It is the mandatory gateway for all donors to enter the system and ensures data integrity.
**Independent Test**: Can be fully tested by successfully extracting QR data, validating the form, and creating a pending account that requires email verification.

### User Story 2 - Authenticate Session (Priority: P1)
As a registered user, I want to securely log in with my ID number and password and easily log out, so that I can access my dashboard and protect my account from unauthorized access.
**Why this priority**: Essential for session management and enabling all personalized features.
**Independent Test**: Can be fully tested by submitting valid credentials to receive a JWT session token, and invalidating it on logout.

### User Story 3 - Reset Password (Priority: P2)
As a user who forgot their password, I want to reset it using a time-limited OTP sent to my email, so that I can regain access to my account securely.
**Why this priority**: Critical for account recovery without manual admin intervention.
**Independent Test**: Can be tested by requesting an OTP, verifying the OTP, and successfully setting a new password.

### User Story 4 - Manage Profile (Priority: P2)
As an authenticated donor, I want to update my contact information (email, phone, address) and view my donation summary, so that I keep my communication details current without altering my core identity.
**Why this priority**: Important for long-term engagement and accurate emergency alert targeting.
**Independent Test**: Can be tested by modifying contact fields and confirming the database updates, while verifying that identity fields cannot be changed.

## Acceptance criteria
1. **Registration**: 
   - Given a valid CCCD QR scan, when the user initiates registration, then the system must correctly extract and pre-fill `fullName`, `dateOfBirth`, and `idDocumentNumber`.
   - Given a submitted registration form, when the ID document number or email is already in the system, then the system must reject the registration with a duplicate error.
   - Given a successful registration submission, when the account is created, then it must be in the `PendingVerification` state and a verification email must be dispatched.
   - Given a pending account, when a valid verification token is submitted to the verify-email endpoint, then the `accountStatus` must transition to `Active`.
2. **Login/Logout**:
   - Given valid credentials, when a user logs in, then the system must authenticate the user, generate a JWT token, and grant access to the dashboard.
   - Given consecutive failed login attempts, when the user exceeds the maximum threshold, then the account must be temporarily locked.
   - Given an active session, when a user logs out, then the JWT token must be invalidated and the session terminated on the server side.
3. **Password Reset**:
   - Given a password reset request, when an OTP is sent, then it must expire after a strictly enforced 10-minute time limit.
   - Given a valid OTP, when a new password is submitted, then it must be successfully hashed via bcrypt and updated.
4. **Profile Management**:
   - Given a profile update, when identity-verified fields are modified, then the system must reject the update for those fields.
   - Given a successful profile update, when contact information is submitted, then the `DonorProfile` collection must be updated accordingly.

## Functional requirements
- **FR-001**: (Deferred to Frontend Module) The React frontend MUST provide a camera and file-upload interface for CCCD QR code capture, sending the parsed string to the backend.
- **FR-002**: The Node.js backend MUST validate and extract data from the CCCD payload into a Zod schema containing `fullName`, `dateOfBirth`, and `idDocumentNumber`.
- **FR-003**: The system MUST store `User` records in the `users` collection with passwords hashed using `bcrypt`.
- **FR-004**: The system MUST create a corresponding `DonorProfile` in the `donor_profiles` collection linked via `userId` during registration.
- **FR-005**: The system MUST enforce state transitions for the `accountStatus` field (`PendingVerification` -> `Active`) via a dedicated verification endpoint.
- **FR-006**: The system MUST provide login and logout REST API endpoints, generating and invalidating JWT (access + refresh) sessions respectively.
- **FR-007**: The system MUST implement an OTP generation, dispatch (via email), and validation workflow for password resets.
- **FR-008**: The REST API MUST reject any update attempts to the `fullName`, `dateOfBirth`, and `idDocumentNumber` fields on the `DonorProfile` and `User` entities.

## Nonfunctional requirements
- **NFR-001 (Security)**: All endpoints MUST require HTTPS/TLS. Passwords and full CCCD numbers MUST NEVER be logged in plaintext.
- **NFR-002 (Security)**: JWT sessions MUST automatically expire after 30 minutes of inactivity.
- **NFR-003 (Security)**: The system MUST use `bcrypt` for all password hashing operations.
- **NFR-004 (Performance)**: The login response MUST be returned within 2 seconds.
- **NFR-005 (Performance)**: Verification and OTP emails MUST be dispatched within 60 seconds of the request.
- **NFR-006 (Architecture)**: The `auth-account` module MUST operate as an isolated Node.js/Express module using strict TypeScript (`strict: true`) and Zod schemas for validation.

## Clarifications

### Session 2026-07-19
- Q: When the CCCD QR scan fails or is incomplete, should the system allow manual entry of identity details or strictly enforce a successful scan? → A: Reject with an error message and require a successful CCCD scan
- Q: For brute-force login protection, how long should the account be temporarily locked after exceeding the maximum failed attempts? → A: 15 minutes
- Q: What is the strictly enforced time limit for the password reset OTP before it expires? → A: 10 minutes

## Edge cases
- What happens when the CCCD QR code payload is missing required fields or has an unsupported format? The system must reject the registration with an error message and strictly require a successful CCCD scan to proceed.
- How does the system handle brute-force login attempts? (Account lockout for 15 minutes after maximum failed attempts is enforced).
- What happens if the OTP expires (after 10 minutes) while the user is typing it in? (The validation will fail and the user must request a new OTP).
- How does the system handle a user attempting to register with a duplicate `idDocumentNumber` but a different email? (Registration is blocked; the ID document number is strictly unique).
- What happens if the email service fails during registration or password reset? (The system must handle the failure gracefully, displaying a delivery error and providing a "Resend" option without corrupting the account state).
