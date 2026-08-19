# Quickstart & Integration Testing Guide: Donor Registration & Screening

**Feature Branch**: `feature/BC-UC-04-to-05-donor-registration` | **Date**: 2026-07-25  
**Spec**: [spec.md](../spec.md) | **API Contract**: [contracts/registration-api-contract.md](./contracts/registration-api-contract.md)

---

## 1. Prerequisites & Setup

1. Start MongoDB Atlas local/container or connection instance.
2. Set environment variables in `backend-core/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/lifeline
   JWT_SECRET=your_jwt_secret_key
   ```
3. Run the development backend server:
   ```bash
   cd src/backend-core
   npm run dev
   ```

---

## 2. Test Execution Scenarios

### Scenario 1: Fetch Campaign Registration List with Pagination (BC-UC-04)
- **Request**:
  ```bash
  curl -X GET "http://localhost:5000/api/v1/campaigns/65f1a2b3c4d5e6f7a8b9c0a0/registrations?page=1&limit=10&status=CheckedIn" \
    -H "Authorization: Bearer <STAFF_JWT_TOKEN>"
  ```
- **Expected Outcome**: HTTP 200 OK containing `items` array, pagination object (`totalCount`, `currentPage`, `pageSize`, `totalPages`), and audit log written to DB.

### Scenario 2: Handle Empty Registration List
- **Request**:
  ```bash
  curl -X GET "http://localhost:5000/api/v1/campaigns/65f1a2b3c4d5e6f7a8b9c0a0/registrations?status=NonExistentStatus" \
    -H "Authorization: Bearer <STAFF_JWT_TOKEN>"
  ```
- **Expected Outcome**: HTTP 200 OK with `{ "items": [], "totalCount": 0, "currentPage": 1, "pageSize": 20, "totalPages": 0 }`.

### Scenario 3: Fetch Registration Details (BC-UC-05 Read)
- **Request**:
  ```bash
  curl -X GET "http://localhost:5000/api/v1/registrations/65f1a2b3c4d5e6f7a8b9c0d1" \
    -H "Authorization: Bearer <STAFF_JWT_TOKEN>"
  ```
- **Expected Outcome**: HTTP 200 OK with full donor details, vitals, screening history, and donation count.

### Scenario 4: Update Health Screening Vitals & Status (BC-UC-05 Write)
- **Request**:
  ```bash
  curl -X PUT "http://localhost:5000/api/v1/registrations/65f1a2b3c4d5e6f7a8b9c0d1/screening" \
    -H "Authorization: Bearer <STAFF_JWT_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{
      "vitals": {
        "bloodPressure": "120/80",
        "weight": 68.0,
        "bodyTemperature": 36.6,
        "hemoglobinLevel": 14.0
      },
      "screeningNotes": "Vitals normal. Cleared for donation.",
      "status": "Eligible for Donation"
    }'
  ```
- **Expected Outcome**: HTTP 200 OK with full updated registration payload. Verification in DB confirms atomic update across `ScreeningForm`, `Appointment`, `DigitalDonorRecord`, and `AuditLog`.

### Scenario 5: Reject Invalid Status Value (Validation Guard)
- **Request**:
  ```bash
  curl -X PUT "http://localhost:5000/api/v1/registrations/65f1a2b3c4d5e6f7a8b9c0d1/screening" \
    -H "Authorization: Bearer <STAFF_JWT_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{
      "vitals": { "bloodPressure": "120/80", "weight": 68.0, "bodyTemperature": 36.6, "hemoglobinLevel": 14.0 },
      "status": "APPROVED_INVALID_STATUS"
    }'
  ```
- **Expected Outcome**: HTTP 400 Bad Request with `code: "VALIDATION_ERROR"`. Zero database modifications.

---

## 3. Automated Test Command

Run Jest integration tests for the module:
```bash
cd src/backend-core
npm test -- src/modules/registration/__tests__/registration.test.ts
```
