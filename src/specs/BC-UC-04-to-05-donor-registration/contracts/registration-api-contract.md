# API Contract: Donor Registration & Health Screening Module (BC-UC-04, BC-UC-05)

**Feature Branch**: `feature/BC-UC-04-to-05-donor-registration` | **Date**: 2026-07-25  
**Spec**: [spec.md](../spec.md)

---

## Endpoint 1: View Campaign Donor Registration List (BC-UC-04)

- **Method**: `GET`
- **Path**: `/api/v1/campaigns/:campaignId/registrations`
- **Authorization**: Required (`Bearer <JWT>`, role must be `BloodCenterStaff` or `Administrator`)

### Request Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | integer | No | 1 | Page number (min: 1) |
| `limit` | integer | No | 20 | Items per page (min: 1, max: 100) |
| `status` | string | No | - | Filter by registration status |
| `bloodType` | string | No | - | Filter by donor blood type (`A+`, `O+`, etc.) |
| `startDate` | string | No | - | Filter registrations on/after ISO 8601 date |
| `endDate` | string | No | - | Filter registrations on/before ISO 8601 date |
| `sortBy` | string | No | `appointmentDate` | Sort field (`appointmentDate`, `createdAt`, `status`) |
| `sortOrder` | string | No | `asc` | Sort direction (`asc`, `desc`) |
| `search` | string | No | - | Keyword search (BC-UC-06 compatibility: donor name, CCCD, registration ID) |

### Response (HTTP 200 OK)
```json
{
  "items": [
    {
      "registrationId": "65f1a2b3c4d5e6f7a8b9c0d1",
      "campaignId": "65f1a2b3c4d5e6f7a8b9c0a0",
      "donor": {
        "donorId": "65f1a2b3c4d5e6f7a8b9c001",
        "fullName": "Nguyen Van A",
        "idDocumentNumber": "012345678901",
        "phoneNumber": "0901234567",
        "bloodType": "O+"
      },
      "appointmentDate": "2026-08-10T00:00:00.000Z",
      "timeSlot": "08:00 - 09:00",
      "status": "CheckedIn",
      "createdAt": "2026-08-01T10:30:00.000Z"
    }
  ],
  "totalCount": 45,
  "currentPage": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

### Empty Result Case (HTTP 200 OK)
```json
{
  "items": [],
  "totalCount": 0,
  "currentPage": 1,
  "pageSize": 20,
  "totalPages": 0
}
```

### Error Responses
- **HTTP 401 Unauthorized**: `{ "code": "UNAUTHORIZED", "message": "Authentication token missing or invalid" }`
- **HTTP 403 Forbidden**: `{ "code": "FORBIDDEN", "message": "Insufficient permissions to access donor registration data" }`
- **HTTP 404 Not Found**: `{ "code": "NOT_FOUND", "message": "Campaign not found" }`

---

## Endpoint 2: View Donor Registration Details (BC-UC-05 Read)

- **Method**: `GET`
- **Path**: `/api/v1/registrations/:registrationId`
- **Authorization**: Required (`Bearer <JWT>`, role must be `BloodCenterStaff` or `Administrator`)

### Response (HTTP 200 OK)
```json
{
  "registrationId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "campaignId": "65f1a2b3c4d5e6f7a8b9c0a0",
  "appointmentDate": "2026-08-10T00:00:00.000Z",
  "timeSlot": "08:00 - 09:00",
  "status": "CheckedIn",
  "donor": {
    "donorId": "65f1a2b3c4d5e6f7a8b9c001",
    "fullName": "Nguyen Van A",
    "dateOfBirth": "1995-05-15T00:00:00.000Z",
    "idDocumentNumber": "012345678901",
    "phoneNumber": "0901234567",
    "email": "nguyenvana@example.com",
    "bloodType": "O+",
    "permanentAddress": "123 Le Loi, Quan 1, TP.HCM",
    "lastDonationDate": "2025-11-20T00:00:00.000Z",
    "totalDonations": 3
  },
  "screening": {
    "screeningFormId": "65f1a2b3c4d5e6f7a8b9c0f9",
    "medicalHistory": { "hasChronicIllness": false },
    "currentHealthStatus": "Normal",
    "recentTravel": "None",
    "medicationHistory": "None",
    "vitals": {
      "bloodPressure": "120/80",
      "weight": 65.5,
      "bodyTemperature": 36.6,
      "hemoglobinLevel": 13.5
    },
    "screeningNotes": "Healthy and ready for donation.",
    "eligibilityFlag": "Eligible"
  },
  "createdAt": "2026-08-01T10:30:00.000Z",
  "updatedAt": "2026-08-10T08:15:00.000Z"
}
```

### Error Responses
- **HTTP 404 Not Found**: `{ "code": "NOT_FOUND", "message": "Donor registration record not found" }`

---

## Endpoint 3: Edit Donor Registration Screening & Status (BC-UC-05 Write)

- **Method**: `PUT`
- **Path**: `/api/v1/registrations/:registrationId/screening`
- **Authorization**: Required (`Bearer <JWT>`, role must be `BloodCenterStaff` or `Administrator`)

### Request Body
```json
{
  "vitals": {
    "bloodPressure": "120/80",
    "weight": 65.5,
    "bodyTemperature": 36.6,
    "hemoglobinLevel": 13.5
  },
  "screeningNotes": "Donor meets all pre-donation health criteria.",
  "status": "Eligible for Donation"
}
```

### Response (HTTP 200 OK)
Returns full updated registration record (same structure as `GET /api/v1/registrations/:registrationId`).

### Validation Error (HTTP 400 Bad Request)
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": [
    {
      "field": "status",
      "message": "Status must be one of: 'Eligible for Donation', 'Ineligible for Donation', 'Donation Completed'"
    }
  ]
}
```
