# Data Model: Auth & Account Management

## User Entity (`users` collection)
- `_id`: ObjectId
- `idDocumentNumber`: String (Unique, Indexed)
- `email`: String (Unique, Indexed)
- `passwordHash`: String
- `accountStatus`: Enum (`PendingVerification`, `Active`, `Locked`)
- `failedLoginAttempts`: Number (Default 0)
- `lockUntil`: Date (Optional)
- `otp`: String (Optional, Hashed)
- `otpExpiry`: Date (Optional)
- `createdAt`: Date
- `updatedAt`: Date

## DonorProfile Entity (`donor_profiles` collection)
- `_id`: ObjectId
- `userId`: ObjectId (Ref `User`, Unique, Indexed)
- `fullName`: String (Read-only after creation)
- `dateOfBirth`: Date (Read-only after creation)
- `idDocumentNumber`: String (Read-only after creation)
- `phoneNumber`: String
- `address`: String (Optional)
- `bloodType`: Enum (Optional, Verified internally)
- `createdAt`: Date
- `updatedAt`: Date

## Validation Rules
- `idDocumentNumber` and `email` must be unique across the system.
- Passwords must be strongly hashed using `bcrypt` before storage.
- Identity-verified fields (`fullName`, `dateOfBirth`, `idDocumentNumber`) on `DonorProfile` cannot be updated by the user once verified via CCCD QR scan.
