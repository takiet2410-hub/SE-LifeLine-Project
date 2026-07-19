# API Contracts: Auth & Account Management

## Endpoints

### 1. Registration
- **POST** `/api/v1/users/register`
- **Request Body**: `{ fullName, dateOfBirth, idDocumentNumber, email, password }`
- **Response**: `201 Created` with success message.

### 1b. Verify Email
- **POST** `/api/v1/users/verify-email`
- **Request Body**: `{ token }`
- **Response**: `200 OK` with account activated success message.

### 2. Login
- **POST** `/api/v1/users/login`
- **Request Body**: `{ idDocumentNumber, password }`
- **Response**: `200 OK` with JWT `{ accessToken, user }`.

### 3. Logout
- **POST** `/api/v1/users/logout`
- **Request Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` (Token invalidated server-side).

### 4. Reset Password (Request OTP)
- **POST** `/api/v1/users/reset-password-request`
- **Request Body**: `{ email }`
- **Response**: `200 OK` (OTP sent).

### 5. Reset Password (Submit)
- **POST** `/api/v1/users/reset-password`
- **Request Body**: `{ email, otp, newPassword }`
- **Response**: `200 OK` (Password updated).

### 6. Update Profile
- **PATCH** `/api/v1/users/profile`
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ phoneNumber, address }` (Identity fields ignored if present).
- **Response**: `200 OK` with updated profile.
