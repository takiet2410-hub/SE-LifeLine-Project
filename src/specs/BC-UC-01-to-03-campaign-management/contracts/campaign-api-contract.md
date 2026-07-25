# API Contract: Campaign Management Module (BC-UC-01, BC-UC-02, BC-UC-03)

## Base Path: `/api/v1/campaigns`

---

### 1. GET `/api/v1/campaigns` (BC-UC-01: View Campaign List)

**Authentication**: Optional / Public or Authenticated User

**Query Parameters**:
- `page`: (optional integer, default `1`)
- `limit`: (optional integer, default `10`)
- `location`: (optional string, searches venue, fullAddress, or name)
- `startDate`: (optional ISO date string, e.g. `2026-08-01`)
- `endDate`: (optional ISO date string, e.g. `2026-08-31`)
- `status`: (optional string, e.g. `Upcoming`, `Active`, `Registration Pending`, `Completed`, `Cancelled`)
- `sortBy`: (optional string, e.g. `startDateTime`, `name`, `createdAt`, default `startDateTime`)
- `sortOrder`: (optional string, `asc` | `desc`, default `asc`)

**Success Response (200 OK)**:
```json
{
  "data": [
    {
      "_id": "669fc123456789abcdef0001",
      "campaignCode": "CMP-2026-001",
      "name": "Central District Blood Drive",
      "description": "Annual summer drive",
      "venue": "District 1 Medical Center",
      "fullAddress": "123 Le Loi Street, District 1, HCMC",
      "startDateTime": "2026-08-10T08:00:00.000Z",
      "endDateTime": "2026-08-10T17:00:00.000Z",
      "targetBloodGroups": ["A+", "O-", "ALL TYPES"],
      "capacity": 200,
      "registeredCount": 45,
      "targetUnitsGoal": 150,
      "contactPerson": {
        "name": "Nguyen Van A",
        "phone": "0901234567"
      },
      "status": "Upcoming",
      "capacityProgress": {
        "registered": 45,
        "total": 200,
        "percentage": 23
      },
      "createdAt": "2026-07-23T10:00:00.000Z",
      "updatedAt": "2026-07-23T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 2. POST `/api/v1/campaigns` (BC-UC-02: Create Donation Campaign)

**Authentication**: Required (`Bearer <JWT>`)

**Request Body**:
```json
{
  "name": "Central District Blood Drive",
  "description": "Annual summer drive",
  "venue": "District 1 Medical Center",
  "fullAddress": "123 Le Loi Street, District 1, HCMC",
  "startDateTime": "2026-08-10T08:00:00.000Z",
  "endDateTime": "2026-08-10T17:00:00.000Z",
  "targetBloodGroups": ["A+", "O-"],
  "capacity": 200,
  "targetUnitsGoal": 150,
  "contactPerson": {
    "name": "Nguyen Van A",
    "phone": "0901234567"
  },
  "internalRemarks": "Priority drive"
}
```

**Success Response (201 Created)**:
```json
{
  "_id": "669fc123456789abcdef0001",
  "campaignCode": "CMP-2026-001",
  "name": "Central District Blood Drive",
  "description": "Annual summer drive",
  "venue": "District 1 Medical Center",
  "fullAddress": "123 Le Loi Street, District 1, HCMC",
  "startDateTime": "2026-08-10T08:00:00.000Z",
  "endDateTime": "2026-08-10T17:00:00.000Z",
  "targetBloodGroups": ["A+", "O-"],
  "capacity": 200,
  "registeredCount": 0,
  "targetUnitsGoal": 150,
  "contactPerson": {
    "name": "Nguyen Van A",
    "phone": "0901234567"
  },
  "internalRemarks": "Priority drive",
  "status": "Upcoming",
  "createdAt": "2026-07-23T10:00:00.000Z",
  "updatedAt": "2026-07-23T10:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request` (Validation Error e.g., Date in past, capacity <= 0)
- `401 Unauthorized`

---

### 3. GET `/api/v1/campaigns/:id` (BC-UC-03: View Campaign Details)

**Authentication**: Optional / Public or Authenticated

**Success Response (200 OK)**:
```json
{
  "_id": "669fc123456789abcdef0001",
  "campaignCode": "CMP-2026-001",
  "name": "Central District Blood Drive",
  "description": "Annual summer drive",
  "venue": "District 1 Medical Center",
  "fullAddress": "123 Le Loi Street, District 1, HCMC",
  "startDateTime": "2026-08-10T08:00:00.000Z",
  "endDateTime": "2026-08-10T17:00:00.000Z",
  "targetBloodGroups": ["A+", "O-"],
  "capacity": 200,
  "registeredCount": 45,
  "targetUnitsGoal": 150,
  "contactPerson": {
    "name": "Nguyen Van A",
    "phone": "0901234567"
  },
  "status": "Upcoming",
  "capacityProgress": {
    "registeredDonors": 45,
    "totalCapacity": 200,
    "percentage": 23
  },
  "registrationPerformance": {
    "targetUnitsGoal": 150,
    "registeredDonorsCount": 45,
    "remainingSpots": 155,
    "percentGoalReached": 30
  }
}
```

---

### 4. PUT `/api/v1/campaigns/:id` (BC-UC-03: Edit Campaign Details)

**Authentication**: Required (`Bearer <JWT>`)

**Request Body**:
```json
{
  "capacity": 250,
  "targetUnitsGoal": 200
}
```

**Success Response (200 OK)**: Updated campaign object.

**Error Responses**:
- `400 Bad Request` (Capacity reduced below registered donors count)
  ```json
  {
    "code": "VALIDATION_ERROR",
    "message": "Cannot reduce participant capacity below the current number of registered donors"
  }
  ```
- `404 Not Found`

---

### 5. GET `/api/v1/campaigns/:id/registrations` (Campaign Registrations Sub-resource)

**Authentication**: Required (`Bearer <JWT>`)

**Success Response (200 OK)**:
```json
[
  {
    "_id": "669fc999999999abcdef0099",
    "donorId": {
      "_id": "669fc888888888abcdef0088",
      "fullName": "Tran Van B",
      "bloodType": "A+",
      "phone": "0912345678",
      "email": "donor@example.com"
    },
    "appointmentDate": "2026-08-10T09:00:00.000Z",
    "timeSlot": "09:00 - 10:00",
    "status": "Scheduled"
  }
]
```
